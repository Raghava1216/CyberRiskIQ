import { Router, type IRouter } from "express";
import https, { type RequestOptions } from "node:https";

const router: IRouter = Router();

// ── Config (from env vars) ────────────────────────────────────────────────────

const WAZUH = {
  manager_host:       process.env.WAZUH_HOST              || "192.168.1.212",
  manager_port:       parseInt(process.env.WAZUH_PORT     || "55000", 10),
  username:           process.env.WAZUH_USERNAME           || "pramod",
  password:           process.env.WAZUH_PASSWORD           || "",
  indexer_host:       process.env.WAZUH_HOST              || "192.168.1.212",
  indexer_port:       parseInt(process.env.WAZUH_INDEXER_PORT || "9200", 10),
  indexer_user:       process.env.WAZUH_USERNAME           || "pramod",
  indexer_pass:       process.env.WAZUH_PASSWORD           || "",
  rejectUnauthorized: false as boolean,
};

// ── JWT cache ─────────────────────────────────────────────────────────────────

let _jwt: string | null = null;
let _jwtExp = 0;

// ── Response cache ────────────────────────────────────────────────────────────

const _cache: Record<string, { data: unknown; ts: number }> = {};
const TTL_SHORT = 60_000;
const TTL_MED   = 5 * 60_000;

// ── Low-level HTTPS helper ────────────────────────────────────────────────────

interface WazuhOpts extends RequestOptions {
  hostname: string;
  port:     number;
  path:     string;
  method:   string;
  rejectUnauthorized: boolean;
  headers:  Record<string, string | number>;
}

function doRequest(
  opts: WazuhOpts,
  body: unknown = null,
): Promise<{ status: number; body: unknown; raw: string }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    if (payload) opts.headers["Content-Length"] = Buffer.byteLength(payload);

    const req = https.request(opts, (res) => {
      let raw = "";
      res.on("data", (c: Buffer) => (raw += c.toString()));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode || 0, body: JSON.parse(raw), raw });
        } catch {
          resolve({ status: res.statusCode || 0, body: raw, raw });
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(15_000, () => {
      req.destroy();
      reject(new Error("Wazuh request timed out"));
    });
    if (payload) req.write(payload);
    req.end();
  });
}

// ── Manager JWT auth ──────────────────────────────────────────────────────────

async function getJWT(): Promise<string> {
  if (_jwt && Date.now() < _jwtExp) return _jwt;
  if (!WAZUH.password) throw new Error("WAZUH_PASSWORD env var is not set");

  const creds = Buffer.from(`${WAZUH.username}:${WAZUH.password}`).toString("base64");

  const authPaths = [
    { path: "/security/user/authenticate?raw=true", method: "POST" },
    { path: "/auth/login",                          method: "POST" },
    { path: "/api/v1/auth/login",                   method: "POST" },
  ];

  for (const { path, method } of authPaths) {
    try {
      const r = await doRequest({
        hostname: WAZUH.manager_host,
        port:     WAZUH.manager_port,
        path,
        method,
        rejectUnauthorized: WAZUH.rejectUnauthorized,
        headers: { Authorization: `Basic ${creds}`, "Content-Type": "application/json" },
      });

      if (r.status === 200 && typeof r.body === "string" && r.body.length > 20) {
        _jwt = r.body.trim();
        _jwtExp = Date.now() + 14 * 60_000;
        return _jwt;
      }
      const bodyObj = r.body as Record<string, unknown>;
      if (r.status === 200 && bodyObj?.data) {
        const tok = (bodyObj.data as Record<string, unknown>).token as string | undefined;
        if (tok) { _jwt = tok; _jwtExp = Date.now() + 14 * 60_000; return _jwt; }
      }
    } catch {
      // try next auth path
    }
  }

  throw new Error("Wazuh auth failed on all paths. Check WAZUH_PASSWORD env var.");
}

// ── Manager GET helper ────────────────────────────────────────────────────────

async function managerGet(path: string, ttl = TTL_MED): Promise<unknown> {
  const now = Date.now();
  const key = `m:${path}`;
  if (_cache[key] && now - _cache[key].ts < ttl) return _cache[key].data;

  const token = await getJWT();

  const makeReq = (tok: string) =>
    doRequest({
      hostname: WAZUH.manager_host,
      port:     WAZUH.manager_port,
      path,
      method:   "GET",
      rejectUnauthorized: WAZUH.rejectUnauthorized,
      headers: { Authorization: `Bearer ${tok}`, Accept: "application/json" },
    });

  let r = await makeReq(token);
  if (r.status === 401) { _jwt = null; r = await makeReq(await getJWT()); }

  if (r.status === 403) {
    return { data: { affected_items: [], total_affected_items: 0 }, _permissionDenied: true };
  }

  _cache[key] = { data: r.body, ts: now };
  return r.body;
}

// ── Indexer POST helper ───────────────────────────────────────────────────────

async function indexerSearch(
  index: string,
  query: unknown,
  size = 500,
  ttl = TTL_MED,
): Promise<unknown> {
  const now = Date.now();
  const key = `i:${index}:${JSON.stringify(query).slice(0, 80)}`;
  if (_cache[key] && now - _cache[key].ts < ttl) return _cache[key].data;

  const creds = Buffer.from(`${WAZUH.indexer_user}:${WAZUH.indexer_pass}`).toString("base64");
  const r = await doRequest(
    {
      hostname: WAZUH.indexer_host,
      port:     WAZUH.indexer_port,
      path:     `/${index}/_search`,
      method:   "POST",
      rejectUnauthorized: WAZUH.rejectUnauthorized,
      headers: {
        Authorization: `Basic ${creds}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
    {
      size,
      query,
      sort: [{ "vulnerability.score.base": { order: "desc", unmapped_type: "float" } }],
    },
  );

  _cache[key] = { data: r.body, ts: now };
  return r.body;
}

// ── Normalisers ───────────────────────────────────────────────────────────────

function normAgent(a: Record<string, unknown>) {
  const s  = a.status as string;
  const os = a.os as Record<string, string> | undefined;
  return {
    id:           a.id,
    name:         a.name,
    ip:           a.ip || a.registerIP || "—",
    os:           os ? `${os.platform || ""} ${os.version || ""}`.trim() : "Unknown",
    os_name:      os?.name || "",
    arch:         os?.arch || "",
    status:       s === "active" ? "Active" : "Inactive",
    wazuh_status: s,
    version:      a.version || "",
    last_seen:    a.lastKeepAlive || a.dateAdd || "",
    groups:       a.group || [],
    node:         a.node_name || "",
  };
}

function normAlert(a: Record<string, unknown>) {
  const rule  = (a.rule  as Record<string, unknown>) || {};
  const agent = (a.agent as Record<string, unknown>) || {};
  const mitre = (rule.mitre as Record<string, string[]>) || {};
  const lvl   = (rule.level as number) ?? 0;
  return {
    id:           (a.id as string) || `al-${Math.random().toString(36).slice(2)}`,
    rule_id:      (rule.id          as string) || "",
    rule_desc:    (rule.description as string) || "Unknown rule",
    rule_level:   lvl,
    rule_groups:  (rule.groups as string[]) || [],
    severity:     lvl >= 12 ? "Critical" : lvl >= 10 ? "High" : lvl >= 7 ? "Medium" : "Low",
    agent_id:     (agent.id   as string) || "",
    agent_name:   (agent.name as string) || "unknown",
    agent_ip:     (agent.ip   as string) || "",
    timestamp:    (a.timestamp as string) || new Date().toISOString(),
    location:     (a.location  as string) || "",
    decoder:      ((a.decoder as Record<string, unknown>)?.name as string) || "",
    mitre_id:     mitre.id?.[0]        || "",
    mitre_tactic: mitre.tactic?.[0]    || "",
    mitre_tech:   mitre.technique?.[0] || "",
    full_log:     ((a.full_log as string) || "").slice(0, 300),
  };
}

type NormAlert = ReturnType<typeof normAlert>;

function normVulnHit(hit: Record<string, unknown>) {
  const src  = (hit._source as Record<string, unknown>) || {};
  const v    = (src.vulnerability as Record<string, unknown>) || {};
  const ag   = (src.agent   as Record<string, unknown>) || {};
  const pk   = (src.package as Record<string, unknown>) || {};
  const sc   = v.score as Record<string, unknown> | undefined;
  const cvss = v.cvss  as Record<string, Record<string, Record<string, number>>> | undefined;

  const score = parseFloat(String(
    sc?.base ?? cvss?.cvss3?.base_score ?? cvss?.cvss2?.base_score ?? 0,
  ));
  const rawSev = (v.severity as string) || "";
  const normSev =
    rawSev.toLowerCase() === "critical" ? "Critical" :
    rawSev.toLowerCase() === "high"     ? "High"     :
    rawSev.toLowerCase() === "medium"   ? "Medium"   :
    score >= 9 ? "Critical" : score >= 7 ? "High" : score >= 4 ? "Medium" : "Low";

  const days = normSev === "Critical" ? 15 : normSev === "High" ? 30 : 60;
  const due  = new Date();
  due.setDate(due.getDate() + days);

  return {
    id:              `wazuh-${String(ag.id || "")}-${String(v.id || hit._id)}`,
    cve_id:          (v.id as string)  || "",
    title:           v.description ? (v.description as string).slice(0, 80) : ((v.id as string) || "Unknown"),
    description:     (v.description as string) || "",
    cvss_score:      score,
    severity:        normSev,
    status:          "Open",
    asset:           (ag.name    as string) || "",
    agent_id:        (ag.id      as string) || "",
    package_name:    (pk.name    as string) || "",
    package_version: (pk.version as string) || "",
    patch_available:    false,
    exploit_available:  (v.exploit as Record<string, boolean>)?.available === true,
    published_date:  (v.published as string) || new Date().toISOString().slice(0, 10),
    due_date:        due.toISOString().slice(0, 10),
    assigned_to:     "SecOps Team",
    source:          "Wazuh",
  };
}

// ── Helper: send success ──────────────────────────────────────────────────────

function ok(res: import("express").Response, data: Record<string, unknown>) {
  res.json({ success: true, ...data });
}

// ── typed helpers for accessing Wazuh API response shape ─────────────────────

function affectedItems(d: unknown): Record<string, unknown>[] {
  return ((d as Record<string, unknown>)?.data as Record<string, unknown>)
    ?.affected_items as Record<string, unknown>[] || [];
}

function totalAffectedItems(d: unknown): number {
  return ((d as Record<string, unknown>)?.data as Record<string, number>)
    ?.total_affected_items || 0;
}

// ── /wazuh/status ─────────────────────────────────────────────────────────────

router.get("/wazuh/status", async (req, res): Promise<void> => {
  try {
    const d = await managerGet("/agents?limit=1") as Record<string, unknown>;
    if (d?.error) throw new Error((d.message as string) || JSON.stringify(d));
    ok(res, { connected: true, manager: { hostname: WAZUH.manager_host, version: "" }, agents: {} });
  } catch (e) {
    ok(res, { connected: false, error: (e as Error).message });
  }
});

// ── /wazuh/stats ──────────────────────────────────────────────────────────────

router.get("/wazuh/stats", async (req, res): Promise<void> => {
  try {
    const [agentsRaw, alertsRaw] = await Promise.all([
      managerGet("/agents?limit=500&sort=-dateAdd").catch(() => null),
      managerGet("/alerts?limit=500&sort=-timestamp", TTL_SHORT).catch(() => null),
    ]);

    const allAgents = affectedItems(agentsRaw).filter((a) => a.id !== "000");
    const agentStats = { active: 0, disconnected: 0, never_connected: 0, pending: 0, total: allAgents.length };
    for (const a of allAgents) {
      if      (a.status === "active")          agentStats.active++;
      else if (a.status === "disconnected")    agentStats.disconnected++;
      else if (a.status === "never_connected") agentStats.never_connected++;
      else if (a.status === "pending")         agentStats.pending++;
    }

    const alertCount = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
    for (const a of affectedItems(alertsRaw)) {
      const l = ((a.rule as Record<string, number>)?.level) || 0;
      alertCount.total++;
      if      (l >= 12) alertCount.critical++;
      else if (l >= 10) alertCount.high++;
      else if (l >= 7)  alertCount.medium++;
      else              alertCount.low++;
    }

    ok(res, {
      data: {
        manager: { version: "", hostname: WAZUH.manager_host, type: "manager" },
        agents:  agentStats,
        alerts:  alertCount,
      },
    });
  } catch (e) {
    ok(res, { data: [], total: 0, error: (e as Error).message });
  }
});

// ── /wazuh/agents ─────────────────────────────────────────────────────────────

router.get("/wazuh/agents", async (req, res): Promise<void> => {
  try {
    const d = await managerGet("/agents?limit=500&sort=-dateAdd");
    const items = affectedItems(d).filter((a) => a.id !== "000");
    ok(res, { data: items.map(normAgent), total: items.length });
  } catch (e) {
    ok(res, { data: [], total: 0, error: (e as Error).message });
  }
});

// ── /wazuh/alerts ─────────────────────────────────────────────────────────────

router.get("/wazuh/alerts", async (req, res): Promise<void> => {
  const limit    = Math.min(500, parseInt(String(req.query.limit    || "200"), 10));
  const minLevel = parseInt(String(req.query.minLevel || "3"), 10);

  try {
    const d = await managerGet(
      `/alerts?limit=${limit}&sort=-timestamp&q=rule.level>=${minLevel}`,
      TTL_SHORT,
    );

    if ((d as Record<string, unknown>)?._permissionDenied) {
      ok(res, { data: [], total: 0, _note: "Permission denied — user needs events:read role" });
      return;
    }
    ok(res, { data: affectedItems(d).map(normAlert), total: totalAffectedItems(d) });
  } catch (e) {
    ok(res, { data: [], total: 0, error: (e as Error).message });
  }
});

// ── /wazuh/threats ────────────────────────────────────────────────────────────

router.get("/wazuh/threats", async (req, res): Promise<void> => {
  try {
    const d = await managerGet("/alerts?limit=500&sort=-timestamp&q=rule.level>=10", TTL_SHORT);

    if ((d as Record<string, unknown>)?._permissionDenied) {
      ok(res, { data: [], total: 0 });
      return;
    }

    const items = affectedItems(d).map(normAlert);

    interface ThreatEntry extends NormAlert {
      count:  number;
      agents: Set<string>;
    }

    const map: Record<string, ThreatEntry> = {};
    for (const a of items) {
      const k = String(a.rule_id || a.rule_desc);
      if (!map[k]) map[k] = { ...a, count: 0, agents: new Set<string>() };
      map[k].count++;
      map[k].agents.add(a.agent_name);
      if (a.severity === "Critical") map[k].severity = "Critical";
      else if (a.severity === "High" && map[k].severity !== "Critical") map[k].severity = "High";
    }

    const threats = Object.values(map).map((t) => ({
      id:           `wazuh-threat-${t.rule_id}`,
      title:        t.rule_desc,
      category:     t.mitre_tactic || t.rule_groups[0] || "Security Event",
      severity:     t.severity,
      status:       "Active",
      confidence:   Math.min(99, 50 + t.count * 5),
      source:       "Wazuh SIEM",
      ioc_value:    t.agent_ip || t.agent_name || "internal",
      first_seen:   t.timestamp,
      count:        t.count,
      rule_id:      t.rule_id,
      mitre_id:     t.mitre_id,
      mitre_tactic: t.mitre_tactic,
      mitre_tech:   t.mitre_tech,
      agents:       [...t.agents],
      tags:         [
        ...t.rule_groups.slice(0, 3),
        t.mitre_id ? `MITRE:${t.mitre_id}` : null,
      ].filter(Boolean),
      description: `Rule ${t.rule_id} fired ${t.count}× on: ${[...t.agents].join(", ")}`,
    })).sort((a, b) => b.count - a.count);

    ok(res, { data: threats, total: threats.length });
  } catch (e) {
    ok(res, { data: [], total: 0, error: (e as Error).message });
  }
});

// ── /wazuh/vulnerabilities ────────────────────────────────────────────────────

router.get("/wazuh/vulnerabilities", async (req, res): Promise<void> => {
  const sevFilter = String(req.query.severity || "");
  const agentId   = String(req.query.agent_id || "");
  const size      = Math.min(1000, parseInt(String(req.query.size || "200"), 10));

  try {
    const must: unknown[] = [];
    if (sevFilter) must.push({ match: { "vulnerability.severity": sevFilter } });
    if (agentId)   must.push({ match: { "agent.id": agentId } });

    const query = must.length > 0 ? { bool: { must } } : { match_all: {} };
    const r = await indexerSearch("wazuh-states-vulnerabilities-*", query, size);

    const hits  = ((r as Record<string, unknown>)?.hits as Record<string, unknown>)
      ?.hits as Record<string, unknown>[] || [];
    const total = (((r as Record<string, unknown>)?.hits as Record<string, unknown>)
      ?.total as Record<string, number>)?.value || hits.length;

    const vulns = hits.map(normVulnHit).filter((v) => v.cve_id);

    const stats = vulns.reduce<Record<string, number>>((acc, v) => {
      acc[v.severity] = (acc[v.severity] || 0) + 1;
      return acc;
    }, { Critical: 0, High: 0, Medium: 0, Low: 0 });

    ok(res, { data: vulns, total, stats });
  } catch (e) {
    ok(res, { data: [], total: 0, stats: {}, error: (e as Error).message });
  }
});

// ── /wazuh/mitre ──────────────────────────────────────────────────────────────

router.get("/wazuh/mitre", async (req, res): Promise<void> => {
  try {
    const d = await managerGet("/alerts?limit=1000&sort=-timestamp&q=rule.level>=3", TTL_MED);
    if ((d as Record<string, unknown>)?._permissionDenied) {
      ok(res, { data: [], total: 0 });
      return;
    }

    interface MitreEntry {
      id: string; tactic: string; technique: string;
      count: number; agents: Set<string>; severity: string;
    }

    const map: Record<string, MitreEntry> = {};
    for (const a of affectedItems(d)) {
      const rule  = (a.rule  as Record<string, unknown>) || {};
      const mitre = (rule.mitre as Record<string, string[]>) || {};
      const ids   = mitre.id        || [];
      const tacs  = mitre.tactic    || [];
      const tecs  = mitre.technique || [];

      ids.forEach((id, i) => {
        if (!map[id]) map[id] = { id, tactic: tacs[i] || "", technique: tecs[i] || id, count: 0, agents: new Set(), severity: "Low" };
        map[id].count++;
        map[id].agents.add(((a.agent as Record<string, string>)?.name) || "unknown");
        const l = (rule.level as number) || 0;
        if      (l >= 12)                                        map[id].severity = "Critical";
        else if (l >= 10 && map[id].severity !== "Critical")     map[id].severity = "High";
        else if (l >= 7  && !["Critical","High"].includes(map[id].severity)) map[id].severity = "Medium";
      });
    }

    const result = Object.values(map)
      .map((t) => ({ ...t, agents: [...t.agents] }))
      .sort((a, b) => b.count - a.count);

    ok(res, { data: result, total: result.length });
  } catch (e) {
    ok(res, { data: [], total: 0, error: (e as Error).message });
  }
});

// ── /wazuh/sca ───────────────────────────────────────────────────────────────

router.get("/wazuh/sca", async (req, res): Promise<void> => {
  try {
    const agD    = await managerGet("/agents?limit=50&q=status=active");
    const agents = affectedItems(agD).filter((a) => a.id !== "000").slice(0, 8);
    const results: unknown[] = [];

    await Promise.allSettled(
      agents.map(async (ag) => {
        try {
          const sd = await managerGet(`/sca/${String(ag.id)}`, 5 * 60_000);
          affectedItems(sd).forEach((s) =>
            results.push({
              agent_id:    ag.id,
              agent_name:  ag.name,
              policy_id:   s.policy_id,
              name:        s.name,
              description: s.description,
              pass:        s.pass    || 0,
              fail:        s.fail    || 0,
              invalid:     s.invalid || 0,
              total:       ((s.pass as number) || 0) + ((s.fail as number) || 0) + ((s.invalid as number) || 0),
              score:       s.score,
              end_scan:    s.end_scan,
            }),
          );
        } catch {
          // agent may not have SCA enabled
        }
      }),
    );

    ok(res, { data: results, total: results.length });
  } catch (e) {
    ok(res, { data: [], total: 0, error: (e as Error).message });
  }
});

export default router;
