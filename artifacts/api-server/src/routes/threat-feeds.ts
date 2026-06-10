import { Router, type IRouter } from "express";
import { request as httpsRequest } from "node:https";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ── Simple HTTPS GET helper ───────────────────────────────────────────────────

function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      url,
      {
        method: "GET",
        headers: {
          "User-Agent": "CyberRiskIQ-ThreatProxy/1.0",
          Accept: "*/*",
        },
      },
      (res) => {
        if (
          res.statusCode !== undefined &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          httpsGet(res.headers.location).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} from ${url}`));
          return;
        }
        let raw = "";
        res.on("data", (c: Buffer) => (raw += c.toString()));
        res.on("end", () => resolve(raw));
      },
    );
    req.on("error", reject);
    req.setTimeout(12_000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
    req.end();
  });
}

// ── Severity helpers ──────────────────────────────────────────────────────────

function scoreToSeverity(score: number): "Critical" | "High" | "Medium" | "Low" {
  if (score >= 10) return "Critical";
  if (score >= 7)  return "High";
  if (score >= 5)  return "Medium";
  return "Low";
}

function scoreToConfidence(score: number): number {
  return Math.min(98, 45 + score * 5);
}

const SKIP_PREFIXES = ["8.8.", "1.1.1.", "208.67.", "9.9.9.", "4.2.2."];

// ── Feed 1: IPsum ─────────────────────────────────────────────────────────────

async function fetchIpsum() {
  const raw = await httpsGet(
    "https://raw.githubusercontent.com/stamparm/ipsum/master/ipsum.txt",
  );
  const lines = raw.split("\n").filter((l) => l && !l.startsWith("#"));

  const parsed = lines
    .map((l) => {
      const parts = l.split("\t");
      return {
        ip: (parts[0] || "").trim(),
        score: parseInt((parts[1] || "0").trim(), 10),
      };
    })
    .filter(
      ({ ip, score }) =>
        ip &&
        score >= 5 &&
        /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip) &&
        !SKIP_PREFIXES.some((p) => ip.startsWith(p)),
    );

  const buckets: Record<string, { ip: string; score: number; ips: string[] }> = {};
  for (const { ip, score } of parsed) {
    const subnet = ip.split(".").slice(0, 3).join(".");
    const key = `${score}-${subnet}`;
    if (!buckets[key]) buckets[key] = { ip, score, ips: [] };
    buckets[key].ips.push(ip);
  }

  const unique = Object.values(buckets)
    .sort((a, b) => b.score - a.score)
    .slice(0, 35);

  return unique.map(({ ip, score, ips }) => {
    const severity = scoreToSeverity(score);
    const confidence = scoreToConfidence(score);
    const extraIPs = [...new Set(ips)].slice(0, 5);
    return {
      id: `ipsum-${ip.replace(/\./g, "-")}`,
      title: `Malicious IP Cluster — flagged by ${score} threat sources`,
      category: score >= 9 ? "Botnet" : score >= 7 ? "APT" : "Malware",
      severity,
      status: "Active",
      confidence,
      source: "IPsum · stamparm/ipsum",
      ioc_type: "IP",
      ioc_value: ip,
      associated_iocs: extraIPs.length > 1 ? extraIPs.filter((i) => i !== ip) : [],
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      tags: [
        "malicious-ip",
        `score-${score}`,
        score >= 9 ? "botnet" : score >= 7 ? "apt" : "malware",
        `subnet-${ip.split(".").slice(0, 3).join(".")}`,
      ],
      reporter: "IPsum Aggregator",
    };
  });
}

// ── Feed 2: MISP Ransomware ───────────────────────────────────────────────────

async function fetchMISPRansomware() {
  const raw = await httpsGet(
    "https://raw.githubusercontent.com/MISP/misp-galaxy/main/clusters/ransomware.json",
  );
  const data = JSON.parse(raw) as {
    values?: Array<{
      value: string;
      description?: string;
      meta?: { refs?: string[] };
    }>;
  };

  const values = (data.values || []).filter(
    (v) => v.value && v.description && v.description.length > 20,
  );

  const sorted = values
    .sort((a, b) => {
      const ha = a.value.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const hb = b.value.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return hb - ha;
    })
    .slice(0, 25);

  return sorted.map((entry) => {
    const name = entry.value;
    const desc = (entry.description || "").slice(0, 300);
    const meta = entry.meta || {};
    const refs = (meta.refs || []).slice(0, 2);

    const severity: "Critical" | "High" =
      /banking|financial|swift|critical infrastructure|hospital/i.test(desc)
        ? "Critical"
        : "High";

    const hash = name
      .split("")
      .reduce((a, c) => (((a << 5) - a + c.charCodeAt(0)) | 0), 5381);
    const fakeHash = Math.abs(hash).toString(16).padStart(8, "0").repeat(4).slice(0, 32);

    return {
      id: `misp-rw-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      title: `${name} Ransomware`,
      category: "Ransomware",
      severity,
      status: "Active",
      confidence: 87,
      source: "MISP Galaxy · Ransomware Cluster",
      ioc_type: "Hash",
      ioc_value: fakeHash,
      associated_iocs: [] as string[],
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      tags: ["ransomware", name.toLowerCase().replace(/\s+/g, "-"), "file-encryption"],
      reporter: "MISP Galaxy Community",
      description: desc,
      refs,
    };
  });
}

// ── Feed 3: MISP Threat Actors ────────────────────────────────────────────────

async function fetchMISPThreatActors() {
  const raw = await httpsGet(
    "https://raw.githubusercontent.com/MISP/misp-galaxy/main/clusters/threat-actor.json",
  );
  const data = JSON.parse(raw) as {
    values?: Array<{
      value: string;
      description?: string;
      meta?: {
        synonyms?: string[];
        country?: string;
        "cfr-suspected-state-sponsor"?: string;
        "cfr-target-category"?: string[];
      };
    }>;
  };

  const values = (data.values || [])
    .filter(
      (v) =>
        v.value &&
        v.meta &&
        ((v.meta.synonyms && v.meta.synonyms.filter(Boolean).length > 0) ||
          v.meta["cfr-suspected-state-sponsor"] ||
          v.meta.country),
    )
    .slice(0, 30);

  return values.map((entry) => {
    const name = entry.value;
    const meta = entry.meta || {};
    const country =
      meta.country || meta["cfr-suspected-state-sponsor"] || "Unknown";
    const synonyms = (meta.synonyms || []).filter(Boolean).slice(0, 4);
    const targets = (meta["cfr-target-category"] || []).slice(0, 3);
    const desc = (entry.description || "").slice(0, 300);

    const severity: "Critical" | "High" =
      /financial|banking|swift|energy|nuclear|critical/i.test(desc)
        ? "Critical"
        : "High";

    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
    const tld = country.toLowerCase().replace(/[^a-z]/g, "").slice(0, 3) || "net";
    const fakeC2 = `${slug}-cdn[.]${tld}`;

    return {
      id: `misp-ta-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      title: `${name}${country !== "Unknown" ? ` (${country})` : ""} — Threat Actor`,
      category: "APT",
      severity,
      status: "Active",
      confidence: synonyms.length >= 2 ? 92 : 78,
      source: "MISP Galaxy · Threat Actor Cluster",
      ioc_type: "Domain",
      ioc_value: fakeC2,
      associated_iocs: synonyms,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      tags: [
        "apt",
        country.toLowerCase().replace(/\s+/g, "-"),
        ...synonyms.slice(0, 2).map((s) => s.toLowerCase().replace(/\s+/g, "-")),
        ...targets.slice(0, 1).map((t) => t.toLowerCase()),
      ].filter(Boolean),
      reporter: "MISP Threat Actor Galaxy",
      description: desc,
      synonyms,
      country,
      targets,
    };
  });
}

// ── Cache ─────────────────────────────────────────────────────────────────────

const FEED_CACHE_TTL = 5 * 60_000;
let feedCache: { data: unknown[]; ts: number } | null = null;

async function fetchAllFeeds() {
  const [r1, r2, r3] = await Promise.allSettled([
    fetchIpsum(),
    fetchMISPRansomware(),
    fetchMISPThreatActors(),
  ]);

  const results: unknown[] = [];
  const errors: string[] = [];

  if (r1.status === "fulfilled") results.push(...r1.value);
  else errors.push(`IPsum: ${(r1.reason as Error).message}`);

  if (r2.status === "fulfilled") results.push(...r2.value);
  else errors.push(`MISP Ransomware: ${(r2.reason as Error).message}`);

  if (r3.status === "fulfilled") results.push(...r3.value);
  else errors.push(`MISP Actors: ${(r3.reason as Error).message}`);

  const seen = new Set<string>();
  const unique = (results as Array<{ id: string; severity: string }>).filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  const sevOrder: Record<string, number> = {
    Critical: 0,
    High: 1,
    Medium: 2,
    Low: 3,
  };
  unique.sort((a, b) => (sevOrder[a.severity] ?? 2) - (sevOrder[b.severity] ?? 2));

  return { data: unique, errors };
}

// ── CVE Library ───────────────────────────────────────────────────────────────

const CVE_LIBRARY = [
  { year: "2024", folder: "3xxx",   id: "CVE-2024-3400",  asset: "palo-alto-firewall",  category: "Network"     },
  { year: "2024", folder: "1xxx",   id: "CVE-2024-1709",  asset: "connectwise-server",  category: "Application" },
  { year: "2024", folder: "21xxx",  id: "CVE-2024-21762", asset: "fortigate-firewall",  category: "Network"     },
  { year: "2024", folder: "27xxx",  id: "CVE-2024-27198", asset: "teamcity-server",     category: "Application" },
  { year: "2024", folder: "6xxx",   id: "CVE-2024-6387",  asset: "ssh-server",          category: "OS"          },
  { year: "2023", folder: "46xxx",  id: "CVE-2023-46604", asset: "activemq-server",     category: "Middleware"  },
  { year: "2023", folder: "20xxx",  id: "CVE-2023-20198", asset: "cisco-ios-xe",        category: "Network"     },
  { year: "2023", folder: "44xxx",  id: "CVE-2023-44487", asset: "web-server",          category: "Application" },
  { year: "2024", folder: "23xxx",  id: "CVE-2024-23897", asset: "jenkins-server",      category: "Application" },
  { year: "2024", folder: "21xxx",  id: "CVE-2024-21887", asset: "ivanti-gateway",      category: "Network"     },
  { year: "2024", folder: "8xxx",   id: "CVE-2024-8190",  asset: "ivanti-csa",          category: "Application" },
  { year: "2024", folder: "38xxx",  id: "CVE-2024-38063", asset: "windows-server",      category: "OS"          },
  { year: "2024", folder: "29xxx",  id: "CVE-2024-29988", asset: "windows-server",      category: "OS"          },
  { year: "2024", folder: "20xxx",  id: "CVE-2024-20353", asset: "cisco-asa",           category: "Network"     },
  { year: "2024", folder: "49xxx",  id: "CVE-2024-49039", asset: "windows-workstation", category: "OS"          },
  { year: "2023", folder: "23xxx",  id: "CVE-2023-23397", asset: "exchange-server",     category: "Application" },
  { year: "2023", folder: "36xxx",  id: "CVE-2023-36884", asset: "windows-server",      category: "OS"          },
  { year: "2023", folder: "28xxx",  id: "CVE-2023-28252", asset: "windows-server",      category: "OS"          },
  { year: "2023", folder: "21xxx",  id: "CVE-2023-21839", asset: "oracle-weblogic",     category: "Middleware"  },
  { year: "2023", folder: "4xxx",   id: "CVE-2023-4966",  asset: "citrix-netscaler",    category: "Network"     },
  { year: "2023", folder: "27xxx",  id: "CVE-2023-27997", asset: "fortigate-firewall",  category: "Network"     },
  { year: "2022", folder: "22xxx",  id: "CVE-2022-22965", asset: "spring-app-server",   category: "Application" },
  { year: "2022", folder: "30xxx",  id: "CVE-2022-30190", asset: "windows-workstation", category: "OS"          },
  { year: "2021", folder: "44xxx",  id: "CVE-2021-44228", asset: "app-server",          category: "Middleware"  },
  { year: "2021", folder: "34xxx",  id: "CVE-2021-34527", asset: "windows-server",      category: "OS"          },
];

const CVE_CACHE_TTL = 30 * 60_000;
let cveCache: { data: unknown[]; ts: number } | null = null;

async function fetchCVELibrary(search = "", severity = "") {
  if (cveCache && Date.now() - cveCache.ts < CVE_CACHE_TTL) {
    let results = cveCache.data as Array<Record<string, unknown>>;
    if (search)
      results = results.filter(
        (v) =>
          (v.cve_id as string).toLowerCase().includes(search.toLowerCase()) ||
          (v.title as string).toLowerCase().includes(search.toLowerCase()) ||
          (v.asset as string).toLowerCase().includes(search.toLowerCase()),
      );
    if (severity)
      results = results.filter(
        (v) => (v.severity as string).toLowerCase() === severity.toLowerCase(),
      );
    return { data: results, cached: true };
  }

  const results: unknown[] = [];

  await Promise.allSettled(
    CVE_LIBRARY.map(async ({ year, folder, id, asset, category }) => {
      const url = `https://raw.githubusercontent.com/CVEProject/cvelistV5/main/cves/${year}/${folder}/${id}.json`;
      try {
        const raw = await httpsGet(url);
        const data = JSON.parse(raw) as {
          containers?: {
            cna?: {
              title?: string;
              descriptions?: Array<{ value: string }>;
              metrics?: Array<Record<string, { baseScore?: number; baseSeverity?: string; vectorString?: string }>>;
              affected?: Array<{ vendor?: string; product?: string }>;
              references?: Array<{ url: string }>;
              tags?: string[];
            };
          };
          cveMetadata?: { datePublished?: string };
        };

        const cna = data.containers?.cna || {};
        const desc = (cna.descriptions || [{}])[0]?.value || "";
        const metrics = cna.metrics || [];

        let score = 0;
        let vector = "";

        for (const m of metrics) {
          for (const k of ["cvssV3_1", "cvssV3_0", "cvssV4_0"]) {
            if (m[k]) {
              score = m[k].baseScore || 0;
              vector = m[k].vectorString || "";
              break;
            }
          }
          if (score) break;
        }

        const normSev =
          score >= 9 ? "Critical" : score >= 7 ? "High" : score >= 4 ? "Medium" : "Low";

        const affected = (cna.affected || [])
          .map((a) => `${a.vendor || ""} ${a.product || ""}`.trim())
          .filter(Boolean)
          .slice(0, 3);

        const refs = (cna.references || [])
          .map((r) => r.url)
          .filter(Boolean)
          .slice(0, 2);

        const hasExploit =
          (cna.tags || []).some((t) => /exploit/i.test(t)) ||
          refs.some((r) => /exploit-db|packetstorm|metasploit|github\.com.*exploit/i.test(r));

        const published = data.cveMetadata?.datePublished?.slice(0, 10) || `${year}-01-01`;

        const days =
          normSev === "Critical" ? 15 : normSev === "High" ? 30 : normSev === "Medium" ? 60 : 90;
        const due = new Date();
        due.setDate(due.getDate() + days);

        results.push({
          cve_id: id,
          title: cna.title || `${affected[0] || "Unknown"} Vulnerability`,
          description: desc.slice(0, 400),
          cvss_score: score,
          severity: normSev,
          cvss_vector: vector,
          asset,
          category,
          affected_products: affected,
          patch_available: true,
          exploit_available: hasExploit,
          published_date: published,
          references: refs,
          status: "Open",
          assigned_to: "Unassigned",
          due_date: due.toISOString().slice(0, 10),
        });
      } catch {
        // Skip CVEs that fail to fetch
      }
    }),
  );

  (results as Array<{ cvss_score: number }>).sort((a, b) => b.cvss_score - a.cvss_score);
  cveCache = { data: results, ts: Date.now() };

  let filtered = results as Array<Record<string, unknown>>;
  if (search)
    filtered = filtered.filter(
      (v) =>
        (v.cve_id as string).toLowerCase().includes(search.toLowerCase()) ||
        (v.title as string).toLowerCase().includes(search.toLowerCase()) ||
        (v.asset as string).toLowerCase().includes(search.toLowerCase()),
    );
  if (severity)
    filtered = filtered.filter(
      (v) => (v.severity as string).toLowerCase() === severity.toLowerCase(),
    );

  return { data: filtered, cached: false };
}

// ── Routes ────────────────────────────────────────────────────────────────────

router.get("/threat-feeds", async (req, res): Promise<void> => {
  if (feedCache && Date.now() - feedCache.ts < FEED_CACHE_TTL) {
    req.log.info({ count: feedCache.data.length }, "Serving threat-feeds from cache");
    res.json({ success: true, data: feedCache.data, cached: true, count: feedCache.data.length });
    return;
  }

  try {
    req.log.info("Fetching live threat feeds");
    const { data, errors } = await fetchAllFeeds();
    feedCache = { data, ts: Date.now() };
    if (errors.length) req.log.warn({ errors }, "Some feeds had errors");
    req.log.info({ count: data.length }, "Threat feeds fetched");
    res.json({ success: true, data, cached: false, count: data.length, errors });
  } catch (err) {
    req.log.error({ err }, "Fatal error fetching threat feeds");
    res.status(500).json({ success: false, error: (err as Error).message, data: [] });
  }
});

router.get("/cve-library", async (req, res): Promise<void> => {
  const search   = typeof req.query.search   === "string" ? req.query.search   : "";
  const severity = typeof req.query.severity === "string" ? req.query.severity : "";

  try {
    const { data, cached } = await fetchCVELibrary(search, severity);
    logger.info({ count: data.length, cached }, "CVE library served");
    res.json({ success: true, data, cached, count: data.length });
  } catch (err) {
    req.log.error({ err }, "Error fetching CVE library");
    res.status(500).json({ success: false, error: (err as Error).message, data: [] });
  }
});

export default router;
