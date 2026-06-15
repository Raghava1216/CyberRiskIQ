import React, { useState, useEffect } from "react";
import { Card, Row, Col, Nav, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShieldHalved,
  faFloppyDisk,
  faArrowsRotate,
  faCircleCheck,
  faTriangleExclamation,
  faEye,
  faEyeSlash,
  faArrowUpRightFromSquare,
  faServer,
  faChartLine,
  faBolt,
  faDatabase,
  faLock,
  faGlobe,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import axios from "src/utils/AxiosInstance";
import * as util from "src/components/forms/reactformutils/elements/formutilfunctions";

// ===================== MOCK FALLBACK (remove once backend is live) =====================
// Connection preferences default. The real, non-secret config is loaded from
// `/cyberrisk/settings/wazuh` and saved back via POST; credentials are never stored
// in the browser (the API server reads them from environment variables). Delete the
// fallback handling once the endpoints are live.
const DEFAULT_CONFIG = { host: "", port: "443", username: "", password: "", enabled: false };
// ======================================================================================

function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ position: "relative", width: 40, height: 22, borderRadius: 11, background: on ? "#3B82EC" : "#d0d5dd", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: on ? 20 : 3, width: 16, height: 16, background: "#fff", borderRadius: "50%", boxShadow: "0 1px 3px rgba(0,0,0,.2)", transition: "left 0.2s" }} />
    </div>
  );
}

const Settings = ({ year, currentUserInfo, refreshCharts, onNavigate }) => {
  const { t } = useTranslation("common");
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [showPass, setShowPass] = useState(false);
  const [conn, setConn] = useState({ state: "idle", message: "" });
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("wazuh");

  const privs = util.getCurrentUser().privileges?.split(",") || [];
  const canEdit = privs.includes("CR_SETTINGS") || privs.includes("CR_WAZUH");

  const set = (key, val) => setConfig((c) => ({ ...c, [key]: val }));

  useEffect(() => {
    const logInId = currentUserInfo?.logInId;
    // HYBRID: load non-secret connection preferences; falls back to defaults on failure.
    axios
      .get(`/cyberrisk/settings/wazuh/${logInId}`)
      .then((res) => {
        if (res?.data && typeof res.data === "object") {
          const stored = { ...res.data };
          // Credentials are never read into the browser — drop any returned secrets.
          delete stored.username;
          delete stored.password;
          setConfig((c) => ({ ...c, ...stored }));
        }
      })
      .catch((err) => {
        console.warn("[cyberrisk] settings: using default config fallback", err);
      });
  }, [currentUserInfo, refreshCharts]);

  const handleSave = async () => {
    const logInId = currentUserInfo?.logInId;
    // Never persist credentials in the browser; only non-secret connection preferences.
    const safe = { host: config.host, port: config.port, enabled: config.enabled };
    try {
      await axios.post(`/cyberrisk/settings/wazuh/${logInId}`, safe);
    } catch (err) {
      console.warn("[cyberrisk] settings save: backend unavailable (mock fallback)", err);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const testConnection = async () => {
    const logInId = currentUserInfo?.logInId;
    setConn({ state: "testing", message: t("Testing connection to the Wazuh API…") });
    try {
      const res = await axios.get(`/cyberrisk/wazuh/stats/${logInId}`);
      const data = res?.data;
      if (!data || data.success === false || data.error || !data.data) {
        setConn({ state: "error", message: data?.error || t("Could not reach the Wazuh API") });
        return;
      }
      setConn({
        state: "success",
        message: t("Connected successfully"),
        manager: data.data?.manager?.hostname || config.host,
        agents: data.data?.agents?.active || 0,
        version: data.data?.manager?.version || "",
      });
    } catch (err) {
      setConn({ state: "error", message: t("Cannot reach the Wazuh API service.") });
    }
  };

  const TABS = [
    { id: "wazuh", label: t("Wazuh SIEM"), icon: faShieldHalved },
    { id: "general", label: t("General"), icon: faDatabase },
    { id: "notifications", label: t("Notifications"), icon: faChartLine },
  ];

  return (
    <div className="progrec-page p-4 p-lg-5">
      <div style={{ maxWidth: 800 }}>

        {/* Header */}
        <div className="mb-4">
          <h5 className="fw-bold mb-0" style={{ color: "#101828" }}>{t("Platform Settings")}</h5>
          <span style={{ fontSize: "0.82rem", color: "#667085" }}>{t("Configure integrations, connections and platform preferences")}</span>
        </div>

        {/* Tab nav */}
        <div className="mb-4" style={{ borderBottom: "1px solid #e4e7ec" }}>
          <Nav variant="tabs" className="border-0">
            {TABS.map((tab) => (
              <Nav.Item key={tab.id}>
                <Nav.Link active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}
                  className="d-flex align-items-center gap-2"
                  style={{ fontSize: "0.82rem", fontFamily: "Poppins,sans-serif", cursor: "pointer", color: activeTab === tab.id ? "#3B82EC" : "#667085" }}>
                  <FontAwesomeIcon icon={tab.icon} style={{ fontSize: 14 }} /> {tab.label}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </div>

        {/* Wazuh Tab */}
        {activeTab === "wazuh" && (
          <div className="d-flex flex-column gap-4">

            {/* Info banner */}
            <div className="d-flex align-items-start gap-3 p-3 rounded" style={{ background: "#eff6ff", border: "1px solid #bfdbfe", fontSize: "0.78rem", color: "#344054", lineHeight: 1.7 }}>
              <FontAwesomeIcon icon={faCircleInfo} style={{ fontSize: 14, color: "#3B82EC", flexShrink: 0, marginTop: 2 }} />
              <div>
                <p className="mb-1">{t("CyberRiskIQ connects to Wazuh through the API server, which handles authentication and JWT token caching.")}</p>
                <p className="mb-1">{t("Credentials are read from environment variables on the server — they are never stored in the browser.")}</p>
                <p className="mb-0" style={{ color: "#667085" }}>{t("To configure: set")} <code style={{ background: "#fff", padding: "1px 5px", borderRadius: 4, color: "#3B82EC" }}>WAZUH_HOST</code>, <code style={{ background: "#fff", padding: "1px 5px", borderRadius: 4, color: "#3B82EC" }}>WAZUH_USERNAME</code> {t("and")} <code style={{ background: "#fff", padding: "1px 5px", borderRadius: 4, color: "#3B82EC" }}>WAZUH_PASSWORD</code>{t(", then restart the API server.")}</p>
              </div>
            </div>

            {/* Connection config */}
            <Card className="shadow-sm border-0" style={{ borderRadius: 10, overflow: "hidden" }}>
              <Card.Header className="bg-white d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: "1px solid #e4e7ec" }}>
                <div className="d-flex align-items-center gap-2">
                  <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 32, height: 32, background: "#eff6ff" }}>
                    <FontAwesomeIcon icon={faShieldHalved} style={{ fontSize: 15, color: "#3B82EC" }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#101828" }}>{t("Wazuh API Connection")}</div>
                    <div style={{ fontSize: "0.72rem", color: "#98a2b3" }}>{t("API on port 443")}</div>
                  </div>
                </div>
                <label className="d-flex align-items-center gap-2" style={{ cursor: "pointer", fontSize: "0.78rem", color: "#667085" }}>
                  {t("Enable Integration")}
                  <Toggle on={config.enabled} onChange={(v) => set("enabled", v)} />
                </label>
              </Card.Header>
              <Card.Body className="p-4">

                {/* Host + Port */}
                <Row className="g-3 mb-3">
                  <Col xs={8}>
                    <Form.Label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#667085", textTransform: "uppercase", letterSpacing: "0.04em" }} className="d-flex align-items-center gap-1 mb-1">
                      <FontAwesomeIcon icon={faGlobe} style={{ fontSize: 11 }} /> {t("Wazuh Host / IP")}
                    </Form.Label>
                    <Form.Control value={config.host} onChange={(e) => set("host", e.target.value)} placeholder="wazuh.example.com" style={{ fontSize: "0.82rem", fontFamily: "monospace" }} />
                  </Col>
                  <Col xs={4}>
                    <Form.Label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#667085", textTransform: "uppercase", letterSpacing: "0.04em" }} className="mb-1">{t("Port")}</Form.Label>
                    <Form.Control value={config.port} onChange={(e) => set("port", e.target.value)} placeholder="443" style={{ fontSize: "0.82rem", fontFamily: "monospace" }} />
                  </Col>
                </Row>

                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#98a2b3", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>{t("Manager API (port 443)")}</div>
                <Row className="g-3 mb-4">
                  <Col xs={6}>
                    <Form.Label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#667085", textTransform: "uppercase", letterSpacing: "0.04em" }} className="d-flex align-items-center gap-1 mb-1"><FontAwesomeIcon icon={faLock} style={{ fontSize: 11 }} /> {t("API Username")}</Form.Label>
                    <Form.Control value={config.username} onChange={(e) => set("username", e.target.value)} placeholder="wazuh" style={{ fontSize: "0.82rem" }} />
                  </Col>
                  <Col xs={6}>
                    <Form.Label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#667085", textTransform: "uppercase", letterSpacing: "0.04em" }} className="d-flex align-items-center gap-1 mb-1"><FontAwesomeIcon icon={faLock} style={{ fontSize: 11 }} /> {t("API Password")}</Form.Label>
                    <div style={{ position: "relative" }}>
                      <Form.Control type={showPass ? "text" : "password"} value={config.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" style={{ fontSize: "0.82rem", paddingRight: 36 }} />
                      <button onClick={() => setShowPass((s) => !s)} type="button" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", cursor: "pointer", padding: 0, color: "#98a2b3" }}>
                        <FontAwesomeIcon icon={showPass ? faEyeSlash : faEye} style={{ fontSize: 14 }} />
                      </button>
                    </div>
                  </Col>
                </Row>

                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#98a2b3", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>{t("Indexer API (port 9200) — Vulnerabilities")}</div>
                <Row className="g-3 mb-4">
                  <Col xs={6}>
                    <Form.Label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#667085", textTransform: "uppercase", letterSpacing: "0.04em" }} className="d-flex align-items-center gap-1 mb-1"><FontAwesomeIcon icon={faDatabase} style={{ fontSize: 11 }} /> {t("Indexer Username")}</Form.Label>
                    <Form.Control defaultValue="admin" placeholder="admin" style={{ fontSize: "0.82rem" }} />
                  </Col>
                  <Col xs={6}>
                    <Form.Label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#667085", textTransform: "uppercase", letterSpacing: "0.04em" }} className="d-flex align-items-center gap-1 mb-1"><FontAwesomeIcon icon={faLock} style={{ fontSize: 11 }} /> {t("Indexer Password")}</Form.Label>
                    <Form.Control type="password" placeholder="••••••••" style={{ fontSize: "0.82rem" }} />
                  </Col>
                </Row>

                <div className="mb-4 p-3 rounded" style={{ background: "#eff6ff", border: "1px solid #bfdbfe", fontSize: "0.75rem", color: "#344054" }}>
                  <strong style={{ color: "#3B82EC" }}>{t("Wazuh 4.8+:")}</strong> {t("Vulnerabilities moved from the Manager API to the Wazuh Indexer (OpenSearch at port 9200). The indexer uses separate admin credentials.")}
                </div>
                <div className="p-3 rounded mb-4" style={{ background: "#fffbeb", border: "1px solid #fde68a", fontSize: "0.75rem", color: "#667085" }}>
                  <strong style={{ color: "#f0ad4e" }}>{t("After any change:")}</strong> {t("Update the")} <code style={{ background: "#f4f7f9", padding: "1px 5px", borderRadius: 4, color: "#3B82EC" }}>WAZUH_*</code> {t("environment variables and restart the API server.")}
                </div>

                {/* Action buttons */}
                {canEdit && (
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <button onClick={testConnection} type="button" disabled={conn.state === "testing"} className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2">
                      <FontAwesomeIcon icon={faArrowsRotate} className={conn.state === "testing" ? "spin" : ""} style={{ fontSize: 13 }} />
                      {conn.state === "testing" ? t("Testing…") : t("Test Connection")}
                    </button>
                    <button onClick={handleSave} type="button" className="btn btn-primary btn-sm d-flex align-items-center gap-2">
                      <FontAwesomeIcon icon={saved ? faCircleCheck : faFloppyDisk} style={{ fontSize: 13 }} />
                      {saved ? t("Saved!") : t("Save Settings")}
                    </button>
                    {config.host && (
                      <a href={`https://${config.host}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2">
                        <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ fontSize: 13 }} /> {t("Open Wazuh")}
                      </a>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Connection result */}
            {conn.state !== "idle" && (
              <div className="d-flex align-items-start gap-3 p-4 rounded" style={{
                background: conn.state === "success" ? "#f0fdf4" : conn.state === "error" ? "#fff5f5" : "#f9fafb",
                border: `1px solid ${conn.state === "success" ? "#bbf7d0" : conn.state === "error" ? "#fecaca" : "#e4e7ec"}`,
                fontSize: "0.82rem",
              }}>
                {conn.state === "testing" && <FontAwesomeIcon icon={faArrowsRotate} className="spin" style={{ fontSize: 16, color: "#98a2b3" }} />}
                {conn.state === "success" && <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 16, color: "#4BBF73" }} />}
                {conn.state === "error" && <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: 16, color: "#d9534f" }} />}
                <div>
                  <div style={{ fontWeight: 600, color: conn.state === "success" ? "#4BBF73" : conn.state === "error" ? "#d9534f" : "#667085", marginBottom: 4 }}>
                    {conn.state === "success" ? t("Wazuh Connected") : conn.state === "error" ? t("Connection Failed") : t("Testing…")}
                  </div>
                  <div style={{ color: "#667085", fontSize: "0.78rem" }}>{conn.message}</div>
                  {conn.state === "success" && (
                    <div className="d-flex gap-3 mt-2" style={{ fontSize: "0.75rem", color: "#98a2b3" }}>
                      {conn.manager && <span className="d-flex align-items-center gap-1"><FontAwesomeIcon icon={faServer} style={{ fontSize: 11 }} />{conn.manager}</span>}
                      {conn.version && <span>v{conn.version}</span>}
                      {conn.agents !== undefined && <span style={{ color: "#4BBF73" }}>{conn.agents} {t("active agents")}</span>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Data integration map */}
            <Card className="shadow-sm border-0" style={{ borderRadius: 10 }}>
              <Card.Body className="p-4">
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#101828", marginBottom: 16 }}>{t("Data Integration Map")}</div>
                <div className="row g-2">
                  {[
                    { wazuh: t("Security Alerts (level ≥ 10)"), app: t("Threat Intelligence"), icon: faChartLine, color: "#d9534f", status: "auto" },
                    { wazuh: t("Monitored Agents"), app: t("Asset Inventory"), icon: faServer, color: "#3B82EC", status: "auto" },
                    { wazuh: t("Vulnerability Module"), app: t("Vulnerability Register"), icon: faBolt, color: "#fd7e14", status: "manual" },
                    { wazuh: t("MITRE ATT&CK Mappings"), app: t("Threat Intelligence"), icon: faShieldHalved, color: "#6f42c1", status: "auto" },
                    { wazuh: t("SCA Policies"), app: t("Compliance"), icon: faCircleCheck, color: "#4BBF73", status: "coming" },
                    { wazuh: t("Manager Stats"), app: t("Dashboard KPIs"), icon: faChartLine, color: "#3B82EC", status: "auto" },
                  ].map((item) => (
                    <div key={item.wazuh} className="col-12 col-md-6">
                      <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ background: "#f9fafb", border: "1px solid #e4e7ec" }}>
                        <FontAwesomeIcon icon={item.icon} style={{ fontSize: 13, color: item.color }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "0.78rem", fontWeight: 500, color: "#344054", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.wazuh}</div>
                          <div style={{ fontSize: "0.68rem", color: "#98a2b3" }}>→ {item.app}</div>
                        </div>
                        <span style={{ fontSize: "0.68rem", padding: "1px 7px", borderRadius: 20, fontWeight: 500, background: item.status === "auto" ? "#f0fdf4" : item.status === "manual" ? "#fffbeb" : "#f9fafb", color: item.status === "auto" ? "#4BBF73" : item.status === "manual" ? "#f0ad4e" : "#98a2b3", border: `1px solid ${item.status === "auto" ? "#bbf7d0" : item.status === "manual" ? "#fde68a" : "#e4e7ec"}` }}>
                          {item.status === "auto" ? t("Live") : item.status === "manual" ? t("On-demand") : t("Soon")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

            {/* Setup guide */}
            <Card className="shadow-sm border-0" style={{ borderRadius: 10 }}>
              <Card.Body className="p-4">
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#101828", marginBottom: 14 }}>{t("Quick Setup Guide")}</div>
                <ol className="ps-0 mb-0" style={{ listStyle: "none" }}>
                  {[
                    t("Set WAZUH_HOST, WAZUH_USERNAME and WAZUH_PASSWORD on the API server (manager API, JWT auth)"),
                    t("Optionally set WAZUH_INDEXER_USERNAME / WAZUH_INDEXER_PASSWORD for the indexer (port 9200 — vulnerabilities)"),
                    t("For self-signed internal certificates only, set WAZUH_REJECT_UNAUTHORIZED=false"),
                    t("Restart the API server so the new environment variables take effect"),
                    t('Click "Test Connection" above — it will confirm manager API connectivity'),
                    t("Navigate to Wazuh SIEM in the sidebar — all three tabs load simultaneously"),
                  ].map((text, i) => (
                    <li key={i} className="d-flex align-items-start gap-3 mb-2">
                      <span className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 20, height: 20, background: "#eff6ff", color: "#3B82EC", fontSize: "0.68rem", fontWeight: 700, marginTop: 1 }}>{i + 1}</span>
                      <span style={{ fontSize: "0.78rem", color: "#667085", lineHeight: 1.6 }}>{text}</span>
                    </li>
                  ))}
                </ol>
              </Card.Body>
            </Card>
          </div>
        )}

        {/* General Tab */}
        {activeTab === "general" && (
          <div className="d-flex flex-column gap-4">
            <Card className="shadow-sm border-0" style={{ borderRadius: 10 }}>
              <Card.Body className="p-4 d-flex flex-column gap-3">
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#101828", marginBottom: 4 }}>{t("Platform Preferences")}</div>
                {[
                  { label: t("Organisation Name"), key: "org", val: "Acme Financial Corp" },
                  { label: t("Default Risk Appetite"), key: "appetite", val: "Low" },
                  { label: t("Reporting Currency"), key: "currency", val: "USD" },
                ].map((f) => (
                  <div key={f.key}>
                    <Form.Label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#667085", textTransform: "uppercase", letterSpacing: "0.04em" }} className="mb-1">{f.label}</Form.Label>
                    <Form.Control defaultValue={f.val} style={{ fontSize: "0.82rem" }} />
                  </div>
                ))}
              </Card.Body>
            </Card>
            {canEdit && (
              <div className="d-flex justify-content-end">
                <button type="button" onClick={handleSave} className="btn btn-primary btn-sm d-flex align-items-center gap-2"><FontAwesomeIcon icon={faFloppyDisk} style={{ fontSize: 13 }} /> {t("Save")}</button>
              </div>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="d-flex flex-column gap-4">
            <Card className="shadow-sm border-0" style={{ borderRadius: 10 }}>
              <Card.Body className="p-4 d-flex flex-column gap-3">
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#101828", marginBottom: 4 }}>{t("Alert Thresholds")}</div>
                {[
                  { label: t("Notify on Critical risks"), on: true },
                  { label: t("Notify on new DORA incidents"), on: true },
                  { label: t("Notify on Wazuh critical alerts"), on: true },
                  { label: t("Notify on compliance gaps"), on: false },
                  { label: t("Daily digest email"), on: false },
                ].map((n, i) => (
                  <div key={i} className="d-flex align-items-center justify-content-between py-1" style={{ borderBottom: i < 4 ? "1px solid #f4f7f9" : "none" }}>
                    <span style={{ fontSize: "0.85rem", color: "#344054" }}>{n.label}</span>
                    <Toggle on={n.on} onChange={() => {}} />
                  </div>
                ))}
              </Card.Body>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
