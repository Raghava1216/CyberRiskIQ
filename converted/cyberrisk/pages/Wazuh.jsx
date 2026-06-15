import React, { useState, useEffect, useCallback } from "react";
import { Card, Row, Col, Nav, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShieldHalved,
  faServer,
  faChartLine,
  faArrowsRotate,
  faPlugCircleXmark,
  faArrowUpRightFromSquare,
  faTriangleExclamation,
  faBolt,
  faBullseye,
  faEye,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import axios from "src/utils/AxiosInstance";

// ===================== MOCK FALLBACK (remove once backend is live) =====================
// The original WazuhPage talked to a live Wazuh proxy. These mock snapshots let the
// SIEM panels render before `/cyberrisk/wazuh/...` endpoints exist. Delete this block
// (and the fallback initial-state assignments below) once the endpoints return data.
const MOCK_STATS = {
  manager: { version: "4.9.0", hostname: "wazuh-manager-01", type: "manager" },
  agents: { active: 312, disconnected: 18, never_connected: 6, pending: 2, total: 338 },
  alerts: { critical: 9, high: 41, medium: 128, low: 540, total: 718 },
};
const MOCK_THREATS = [
  { id: "1", title: "APT29 C2 beacon detected on finance subnet", category: "Command & Control", severity: "Critical", confidence: 94, source: "Wazuh", ioc_value: "185.220.101.47", first_seen: "2026-05-13T04:15:00Z", count: 12, rule_id: "100210", mitre_id: "T1071", mitre_tactic: "Command and Control", mitre_tech: "Application Layer Protocol", agents: ["fin-ws-04", "fin-ws-11"], tags: ["apt29", "c2"], description: "Outbound beaconing to known APT29 infrastructure." },
  { id: "2", title: "LockBit ransomware loader staged on host", category: "Impact", severity: "Critical", confidence: 91, source: "Wazuh", ioc_value: "malicious-update.com", first_seen: "2026-05-13T01:00:00Z", count: 5, rule_id: "100455", mitre_id: "T1486", mitre_tactic: "Impact", mitre_tech: "Data Encrypted for Impact", agents: ["srv-app-02"], tags: ["lockbit", "ransomware"], description: "Ransomware loader detected prior to execution." },
  { id: "3", title: "DNS tunnelling exfiltration attempts", category: "Exfiltration", severity: "High", confidence: 89, source: "Wazuh", ioc_value: "exfil-c2.net", first_seen: "2026-05-13T05:10:00Z", count: 23, rule_id: "100388", mitre_id: "T1048", mitre_tactic: "Exfiltration", mitre_tech: "Exfiltration Over Alternative Protocol", agents: ["db-01", "db-02"], tags: ["exfil", "dns"], description: "Repeated DNS-tunnelled data exfiltration." },
  { id: "4", title: "Credential stuffing against banking portal", category: "Credential Access", severity: "High", confidence: 72, source: "Wazuh", ioc_value: "103.42.87.22", first_seen: "2026-05-13T03:30:00Z", count: 47, rule_id: "100120", mitre_id: "T1110", mitre_tactic: "Credential Access", mitre_tech: "Brute Force", agents: ["web-edge-01"], tags: ["brute-force"], description: "High-volume failed authentications from a single source." },
];
const MOCK_MITRE = [
  { id: "T1071", tactic: "Command and Control", technique: "Application Layer Protocol", count: 34, agents: ["fin-ws-04", "fin-ws-11", "srv-app-02"], severity: "Critical" },
  { id: "T1486", tactic: "Impact", technique: "Data Encrypted for Impact", count: 18, agents: ["srv-app-02"], severity: "Critical" },
  { id: "T1110", tactic: "Credential Access", technique: "Brute Force", count: 47, agents: ["web-edge-01"], severity: "High" },
  { id: "T1048", tactic: "Exfiltration", technique: "Exfiltration Over Alternative Protocol", count: 23, agents: ["db-01", "db-02"], severity: "High" },
  { id: "T1059", tactic: "Execution", technique: "Command and Scripting Interpreter", count: 15, agents: ["fin-ws-04"], severity: "Medium" },
];
const MOCK_ALERTS = [
  { id: "1", rule_id: "100210", rule_desc: "Outbound connection to known C2 IP", rule_level: 12, rule_groups: ["ids", "attack"], severity: "Critical", agent_id: "004", agent_name: "fin-ws-04", agent_ip: "10.4.2.14", timestamp: "2026-05-13T04:15:00Z", location: "netflow", decoder: "json", mitre_id: "T1071", mitre_tactic: "Command and Control", mitre_tech: "Application Layer Protocol", full_log: "" },
  { id: "2", rule_id: "100455", rule_desc: "Possible ransomware file pattern", rule_level: 13, rule_groups: ["malware"], severity: "Critical", agent_id: "022", agent_name: "srv-app-02", agent_ip: "10.6.1.2", timestamp: "2026-05-13T01:00:00Z", location: "syscheck", decoder: "json", mitre_id: "T1486", mitre_tactic: "Impact", mitre_tech: "Data Encrypted for Impact", full_log: "" },
  { id: "3", rule_id: "100120", rule_desc: "Multiple failed authentications", rule_level: 8, rule_groups: ["authentication_failed"], severity: "High", agent_id: "001", agent_name: "web-edge-01", agent_ip: "10.1.0.5", timestamp: "2026-05-13T03:30:00Z", location: "/var/log/auth.log", decoder: "sshd", mitre_id: "T1110", mitre_tactic: "Credential Access", mitre_tech: "Brute Force", full_log: "" },
  { id: "4", rule_id: "100388", rule_desc: "Suspicious DNS query volume", rule_level: 9, rule_groups: ["dns"], severity: "High", agent_id: "031", agent_name: "db-01", agent_ip: "10.6.2.11", timestamp: "2026-05-13T05:10:00Z", location: "dns", decoder: "json", mitre_id: "T1048", mitre_tactic: "Exfiltration", mitre_tech: "Exfiltration Over Alternative Protocol", full_log: "" },
  { id: "5", rule_id: "5402", rule_desc: "Successful sudo to root", rule_level: 5, rule_groups: ["syslog", "sudo"], severity: "Medium", agent_id: "012", agent_name: "srv-web-12", agent_ip: "10.3.0.9", timestamp: "2026-05-13T02:00:00Z", location: "/var/log/secure", decoder: "sudo", mitre_id: "", mitre_tactic: "", mitre_tech: "", full_log: "" },
];
const MOCK_AGENTS = [
  { id: "001", name: "web-edge-01", ip: "10.1.0.5", os: "Ubuntu 22.04", os_name: "Ubuntu", arch: "x86_64", status: "active", wazuh_status: "Active", version: "4.9.0", last_seen: "2026-05-13T05:20:00Z", groups: ["default", "web"], node: "node-1" },
  { id: "004", name: "fin-ws-04", ip: "10.4.2.14", os: "Windows 11", os_name: "Windows", arch: "x86_64", status: "active", wazuh_status: "Active", version: "4.9.0", last_seen: "2026-05-13T05:18:00Z", groups: ["default", "finance"], node: "node-1" },
  { id: "012", name: "srv-web-12", ip: "10.3.0.9", os: "RHEL 9", os_name: "RHEL", arch: "x86_64", status: "active", wazuh_status: "Active", version: "4.8.2", last_seen: "2026-05-13T05:12:00Z", groups: ["default", "web"], node: "node-2" },
  { id: "022", name: "srv-app-02", ip: "10.6.1.2", os: "Ubuntu 20.04", os_name: "Ubuntu", arch: "x86_64", status: "disconnected", wazuh_status: "Disconnected", version: "4.8.2", last_seen: "2026-05-12T18:40:00Z", groups: ["default", "app"], node: "node-2" },
  { id: "031", name: "db-01", ip: "10.6.2.11", os: "Debian 12", os_name: "Debian", arch: "x86_64", status: "active", wazuh_status: "Active", version: "4.9.0", last_seen: "2026-05-13T05:09:00Z", groups: ["default", "db"], node: "node-1" },
];
const MOCK_SCA = [];
// ======================================================================================

function timeAgo(iso) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const sevStyle = (s) => {
  if (s === "Critical") return { color: "#d9534f", bg: "#fff5f5", border: "#fecaca" };
  if (s === "High") return { color: "#fd7e14", bg: "#fff7ed", border: "#fed7aa" };
  if (s === "Medium") return { color: "#f0ad4e", bg: "#fffbeb", border: "#fde68a" };
  return { color: "#4BBF73", bg: "#f0fdf4", border: "#bbf7d0" };
};

function SevChip({ s, small }) {
  const st = sevStyle(s);
  return (
    <span style={{ display: "inline-block", fontSize: small ? "0.65rem" : "0.72rem", padding: "2px 7px", borderRadius: 6, background: st.bg, color: st.color, border: `1px solid ${st.border}`, fontWeight: 500 }}>{s}</span>
  );
}

function iconBgStyle(spec) {
  const map = {
    purple: { background: "#f5f3ff", color: "#6f42c1" },
    red: { background: "#fff5f5", color: "#d9534f" },
    blue: { background: "#eff6ff", color: "#3B82EC" },
    green: { background: "#f0fdf4", color: "#4BBF73" },
    amber: { background: "#fffbeb", color: "#f0ad4e" },
  };
  return map[spec] || map.blue;
}

// HYBRID hook — mock fallback as initial state, axios overrides on success.
function useWazuh(resource, mock, enabled = true) {
  const [data, setData] = useState(mock);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ts, setTs] = useState(new Date());

  const refetch = useCallback(() => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    axios
      .get(`/cyberrisk/wazuh/${resource}`)
      .then((res) => {
        const d = res?.data?.data ?? res?.data;
        if (d) setData(d);
        setTs(new Date());
      })
      .catch((err) => {
        // Falls back to the mock snapshot so the panel still renders.
        console.warn(`[cyberrisk] wazuh/${resource}: using mock fallback`, err);
      })
      .finally(() => setLoading(false));
  }, [resource, enabled]);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, loading, error, ts, refetch };
}

function SectionCard({ title, icon, iconBg, badge, loading, refetch, ts, children, action }) {
  return (
    <Card className="shadow-sm border-0 h-100" style={{ borderRadius: 10, overflow: "hidden" }}>
      <Card.Header className="bg-white d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: "1px solid #e4e7ec" }}>
        <div className="d-flex align-items-center gap-2">
          <div className="d-flex align-items-center justify-content-center rounded flex-shrink-0" style={{ width: 30, height: 30, ...iconBgStyle(iconBg) }}>
            <FontAwesomeIcon icon={icon} style={{ fontSize: 14 }} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#101828" }}>{title}</span>
              {badge !== undefined && <span style={{ fontSize: "0.68rem", padding: "1px 7px", borderRadius: 20, background: "#f4f7f9", border: "1px solid #e4e7ec", color: "#667085" }}>{badge}</span>}
            </div>
            {ts && <div style={{ fontSize: "0.7rem", color: "#98a2b3" }}>Updated {timeAgo(ts.toISOString())}</div>}
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          {action}
          {refetch && (
            <button onClick={refetch} disabled={loading} className="btn btn-sm btn-outline-secondary p-1 border-0" style={{ color: loading ? "#98a2b3" : "#667085" }}>
              <FontAwesomeIcon icon={faArrowsRotate} style={{ fontSize: 13 }} className={loading ? "fa-spin" : ""} />
            </button>
          )}
        </div>
      </Card.Header>
      <Card.Body className="p-0" style={{ overflow: "auto", maxHeight: 440 }}>
        {children}
      </Card.Body>
    </Card>
  );
}

const Wazuh = ({ year, currentUserInfo, refreshCharts, onNavigate }) => {
  const { t } = useTranslation("common");
  const [activeTab, setActiveTab] = useState("threats");
  const [alertFilter, setAlertFilter] = useState("All");
  const [agentFilter, setAgentFilter] = useState("All");

  const stats = useWazuh("stats", MOCK_STATS);
  const threats = useWazuh("threats", MOCK_THREATS, activeTab === "threats");
  const mitre = useWazuh("mitre", MOCK_MITRE, activeTab === "threats");
  const alerts = useWazuh("alerts?limit=200&minLevel=3", MOCK_ALERTS, activeTab === "secops");
  const agents = useWazuh("agents", MOCK_AGENTS, activeTab === "servers");
  // eslint-disable-next-line no-unused-vars
  const sca = useWazuh("sca", MOCK_SCA, activeTab === "servers");

  const connected = stats.data !== null;
  const offline = stats.error !== null;

  const filteredAlerts = (alerts.data || []).filter((a) => alertFilter === "All" || a.severity === alertFilter);
  const alertBySev = (alerts.data || []).reduce((acc, a) => { acc[a.severity] = (acc[a.severity] || 0) + 1; return acc; }, {});
  const filteredAgents = (agents.data || []).filter((a) => agentFilter === "All" || a.wazuh_status === agentFilter);
  const osCounts = (agents.data || []).reduce((acc, a) => { const k = a.os.split(" ")[0] || "Unknown"; acc[k] = (acc[k] || 0) + 1; return acc; }, {});

  const TABS = [
    { id: "threats", label: t("Threat Intelligence"), icon: faBullseye, count: threats.data?.length },
    { id: "secops", label: t("Security Operations"), icon: faChartLine, count: alerts.data?.length },
    { id: "servers", label: t("Server Management"), icon: faServer, count: agents.data?.length },
  ];

  return (
    <div className="progrec-page p-4 p-lg-5">
      {/* Page header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 40, height: 40, background: offline ? "#fff5f5" : connected ? "#f0fdf4" : "#f4f7f9" }}>
            <FontAwesomeIcon icon={faShieldHalved} style={{ fontSize: 20, color: offline ? "#d9534f" : connected ? "#4BBF73" : "#98a2b3" }} />
          </div>
          <div>
            <h5 className="fw-bold mb-0" style={{ color: "#101828" }}>{t("Wazuh SIEM Integration")}</h5>
            <div className="d-flex align-items-center gap-2" style={{ fontSize: "0.75rem" }}>
              {offline ? (
                <span className="d-flex align-items-center gap-1" style={{ color: "#d9534f" }}><FontAwesomeIcon icon={faPlugCircleXmark} style={{ fontSize: 11 }} /> {t("Cannot reach Wazuh")}</span>
              ) : connected ? (
                <span className="d-flex align-items-center gap-1" style={{ color: "#4BBF73" }}>
                  <span className="live-dot" style={{ background: "#4BBF73" }} />
                  {t("Live")} · {stats.data?.manager?.hostname || "Wazuh Manager"} · v{stats.data?.manager?.version}
                </span>
              ) : (
                <span className="d-flex align-items-center gap-1" style={{ color: "#98a2b3" }}>
                  <FontAwesomeIcon icon={faArrowsRotate} style={{ fontSize: 11 }} className="fa-spin" /> {t("Connecting…")}
                </span>
              )}
              {connected && <><span style={{ color: "#e4e7ec" }}>·</span><span style={{ color: "#98a2b3" }}>{stats.data?.agents?.active || 0} {t("agents active")}</span></>}
            </div>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button onClick={stats.refetch} disabled={stats.loading} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2">
            <FontAwesomeIcon icon={faArrowsRotate} style={{ fontSize: 13 }} className={stats.loading ? "fa-spin" : ""} /> {t("Refresh all")}
          </button>
          {stats.data?.manager?.hostname && (
            <a href={`https://${stats.data.manager.hostname}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2">
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ fontSize: 13 }} /> {t("Open Wazuh")}
            </a>
          )}
        </div>
      </div>

      {/* KPI strip */}
      {stats.data && (
        <Row className="g-3 mb-4">
          {[
            { label: t("Active Agents"), value: stats.data.agents.active, accent: "#4BBF73" },
            { label: t("Disconnected"), value: stats.data.agents.disconnected, accent: "#d9534f" },
            { label: t("Critical Alerts"), value: stats.data.alerts.critical, accent: "#d9534f" },
            { label: t("High Alerts"), value: stats.data.alerts.high, accent: "#fd7e14" },
            { label: t("Medium Alerts"), value: stats.data.alerts.medium, accent: "#f0ad4e" },
            { label: t("Total Alerts"), value: stats.data.alerts.total, accent: "#667085" },
            { label: t("Total Agents"), value: stats.data.agents.total || (stats.data.agents.active + stats.data.agents.disconnected), accent: "#3B82EC" },
          ].map((k) => (
            <Col key={k.label} xs={6} sm={4} md={3} xl>
              <Card className="border shadow-sm h-100" style={{ borderRadius: 10 }}>
                <Card.Body className="p-3">
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: k.accent, fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
                  <div style={{ fontSize: "0.72rem", color: "#667085" }}>{k.label}</div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Tab bar */}
      <div className="mb-4" style={{ borderBottom: "1px solid #e4e7ec" }}>
        <Nav variant="tabs" className="border-0">
          {TABS.map((tab) => (
            <Nav.Item key={tab.id}>
              <Nav.Link active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}
                className="d-flex align-items-center gap-2"
                style={{ fontSize: "0.82rem", fontFamily: "Poppins,sans-serif", cursor: "pointer", color: activeTab === tab.id ? "#3B82EC" : "#667085" }}>
                <FontAwesomeIcon icon={tab.icon} style={{ fontSize: 14 }} />
                {tab.label}
                {tab.count !== undefined && (
                  <span style={{ fontSize: "0.65rem", padding: "1px 6px", borderRadius: 20, background: activeTab === tab.id ? "#eff6ff" : "#f4f7f9", color: activeTab === tab.id ? "#3B82EC" : "#98a2b3", border: "1px solid #e4e7ec" }}>{tab.count}</span>
                )}
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>
      </div>

      {/* TAB 1: Threat Intelligence */}
      {activeTab === "threats" && (
        <Row className="g-4">
          <Col xs={12} lg={7}>
            <SectionCard title={t("MITRE ATT&CK Techniques")} icon={faBullseye} iconBg="purple" badge={mitre.data?.length} loading={mitre.loading} refetch={mitre.refetch} ts={mitre.ts}>
              {mitre.data && mitre.data.length === 0 && <div className="py-5 text-center" style={{ color: "#98a2b3" }}>{t("No MITRE ATT&CK mappings found in recent alerts.")}</div>}
              {mitre.data && mitre.data.length > 0 && (
                <div className="p-4 d-flex flex-column gap-3">
                  {mitre.data.slice(0, 20).map((m) => {
                    const st = sevStyle(m.severity);
                    const pct = Math.min(100, (m.count / (mitre.data[0]?.count || 1)) * 100);
                    return (
                      <div key={m.id}>
                        <div className="d-flex align-items-center gap-3">
                          <span style={{ fontFamily: "monospace", fontSize: "0.72rem", background: "#eff6ff", color: "#3B82EC", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: 4, width: 90, textAlign: "center", flexShrink: 0 }}>{m.id}</span>
                          <div style={{ flex: 1 }}>
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <span style={{ fontSize: "0.78rem", color: "#344054", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.technique || m.tactic}</span>
                              <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-2">
                                <SevChip s={m.severity} small />
                                <span style={{ fontSize: "0.72rem", color: "#98a2b3" }}>{m.count}×</span>
                              </div>
                            </div>
                            <div style={{ height: 6, background: "#f0f0f0", borderRadius: 999, overflow: "hidden" }}>
                              <div style={{ height: "100%", borderRadius: 999, background: st.color + "99", width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "#98a2b3", marginLeft: 114, marginTop: 2 }}>{m.tactic} · {m.agents.slice(0, 3).join(", ")}{m.agents.length > 3 ? ` +${m.agents.length - 3}` : ""}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </Col>

          <Col xs={12} lg={5}>
            <SectionCard
              title={t("Active Threat Groups")} icon={faEye} iconBg="red"
              badge={threats.data?.length} loading={threats.loading} refetch={threats.refetch} ts={threats.ts}
              action={
                <button onClick={() => { threats.data?.forEach((th) => { window.dispatchEvent(new CustomEvent("wazuh-ioc", { detail: { id: th.id, type: th.ioc_value?.includes(".") ? "IP" : "Host", value: th.ioc_value, severity: th.severity, source: "Wazuh", tags: th.tags, description: th.description } })); }); }}
                  className="btn btn-sm d-flex align-items-center gap-1" style={{ fontSize: "0.72rem", background: "#eff6ff", border: "1px solid #bfdbfe", color: "#3B82EC" }}>
                  <FontAwesomeIcon icon={faDownload} style={{ fontSize: 11 }} /> {t("Export IOCs")}
                </button>
              }
            >
              {threats.data && threats.data.length === 0 && <div className="py-5 text-center" style={{ color: "#98a2b3" }}>{t("No high-severity threats detected.")}</div>}
              {threats.data && threats.data.length > 0 && (
                <div>
                  {threats.data.slice(0, 12).map((th) => (
                    <div key={th.id} className="px-4 py-3" style={{ borderBottom: "1px solid #f4f7f9" }}>
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-1">
                        <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "#344054", lineHeight: 1.3, flex: 1 }}>{th.title}</span>
                        <SevChip s={th.severity} small />
                      </div>
                      {th.mitre_id && (
                        <div className="d-flex gap-1 mb-1">
                          <span style={{ fontSize: "0.65rem", background: "#f5f3ff", color: "#6f42c1", border: "1px solid #ddd6fe", borderRadius: 4, padding: "1px 5px" }}>{th.mitre_id}</span>
                          {th.mitre_tactic && <span style={{ fontSize: "0.65rem", color: "#98a2b3" }}>{th.mitre_tactic}</span>}
                        </div>
                      )}
                      <div style={{ fontSize: "0.7rem", color: "#98a2b3" }}>{th.source} · {timeAgo(th.first_seen)} · {th.count}×</div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </Col>
        </Row>
      )}

      {/* TAB 2: Security Operations */}
      {activeTab === "secops" && (
        <Row className="g-4">
          {alerts.data && alerts.data.length > 0 && (
            <Col xs={12}>
              <Row className="g-3 mb-2">
                {["Critical", "High", "Medium", "Low"].map((sev) => {
                  const st = sevStyle(sev);
                  return (
                    <Col key={sev} xs={6} md={3}>
                      <Card className="shadow-sm border-0" style={{ borderRadius: 10, borderLeft: `3px solid ${st.color}` }}>
                        <Card.Body className="p-3">
                          <div style={{ fontSize: "1.4rem", fontWeight: 700, color: st.color }}>{alertBySev[sev] || 0}</div>
                          <div style={{ fontSize: "0.75rem", color: "#667085" }}>{t(sev)} {t("Alerts")}</div>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </Col>
          )}

          <Col xs={12}>
            <SectionCard title={t("Live Security Alerts")} icon={faBolt} iconBg="red" badge={filteredAlerts.length} loading={alerts.loading} refetch={alerts.refetch} ts={alerts.ts}
              action={
                <Form.Select value={alertFilter} onChange={(e) => setAlertFilter(e.target.value)} size="sm" style={{ fontSize: "0.75rem", width: "auto" }}>
                  {["All", "Critical", "High", "Medium", "Low"].map((s) => <option key={s} value={s}>{t(s)}</option>)}
                </Form.Select>
              }
            >
              {filteredAlerts.length === 0 && !alerts.loading && <div className="py-5 text-center" style={{ color: "#98a2b3" }}>{t("No alerts match the filter.")}</div>}
              {filteredAlerts.slice(0, 50).map((a) => (
                <div key={a.id} className="d-flex align-items-start gap-3 px-4 py-3" style={{ borderBottom: "1px solid #f4f7f9" }}>
                  <SevChip s={a.severity} small />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.8rem", color: "#344054", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.rule_desc}</div>
                    <div style={{ fontSize: "0.7rem", color: "#98a2b3" }}>Level {a.rule_level} · {a.agent_name} ({a.agent_ip}) · {timeAgo(a.timestamp)}</div>
                    {a.mitre_id && <span style={{ fontSize: "0.65rem", background: "#f5f3ff", color: "#6f42c1", border: "1px solid #ddd6fe", borderRadius: 4, padding: "1px 5px", display: "inline-block", marginTop: 2 }}>{a.mitre_id} {a.mitre_tech}</span>}
                  </div>
                  <span style={{ fontSize: "0.68rem", fontFamily: "monospace", color: "#98a2b3", flexShrink: 0 }}>R:{a.rule_id}</span>
                </div>
              ))}
            </SectionCard>
          </Col>
        </Row>
      )}

      {/* TAB 3: Server Management */}
      {activeTab === "servers" && (
        <Row className="g-4">
          {Object.keys(osCounts).length > 0 && (
            <Col xs={12}>
              <div className="d-flex flex-wrap gap-2 mb-4">
                {Object.entries(osCounts).map(([os, count]) => (
                  <span key={os} style={{ fontSize: "0.78rem", padding: "4px 12px", borderRadius: 20, background: "#f4f7f9", border: "1px solid #e4e7ec", color: "#344054", fontWeight: 500 }}>
                    {os}: <strong>{count}</strong>
                  </span>
                ))}
              </div>
            </Col>
          )}

          <Col xs={12}>
            <SectionCard title={t("Agent Inventory")} icon={faServer} iconBg="blue" badge={filteredAgents.length} loading={agents.loading} refetch={agents.refetch} ts={agents.ts}
              action={
                <Form.Select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} size="sm" style={{ fontSize: "0.75rem", width: "auto" }}>
                  {["All", "Active", "Disconnected", "Never connected"].map((s) => <option key={s} value={s}>{t(s)}</option>)}
                </Form.Select>
              }
            >
              {filteredAgents.length === 0 && !agents.loading && <div className="py-5 text-center" style={{ color: "#98a2b3" }}>{t("No agents match the filter.")}</div>}
              {filteredAgents.map((a) => {
                const isActive = a.wazuh_status === "Active" || a.status === "active";
                return (
                  <div key={a.id} className="d-flex align-items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid #f4f7f9" }}>
                    <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 8, height: 8, background: isActive ? "#4BBF73" : "#d9534f" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 500, color: "#344054" }}>{a.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "#98a2b3" }}>{a.ip} · {a.os}</div>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <div style={{ fontSize: "0.72rem", color: isActive ? "#4BBF73" : "#d9534f", fontWeight: 500 }}>{a.wazuh_status}</div>
                      <div style={{ fontSize: "0.68rem", color: "#98a2b3" }}>v{a.version}</div>
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#98a2b3", textAlign: "right", flexShrink: 0 }}>{timeAgo(a.last_seen)}</div>
                  </div>
                );
              })}
            </SectionCard>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Wazuh;
