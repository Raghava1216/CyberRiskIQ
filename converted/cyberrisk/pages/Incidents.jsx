import React, { useState, useEffect } from "react";
import { Card, Row, Col, Form, InputGroup, Badge } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMagnifyingGlass,
  faClock,
  faUser,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import axios from "src/utils/AxiosInstance";
import * as util from "src/components/forms/reactformutils/elements/formutilfunctions";

import DeclareIncidentForm from "src/modules/cyberrisk/forms/DeclareIncidentForm";

// ===================== MOCK FALLBACK (remove once backend is live) =====================
// Copied verbatim from the original threat-dashboard mock data so the page renders
// before the real `/cyberrisk/incidents` endpoint exists. Delete this block and the
// fallback initial-state assignment once the endpoint returns data.
const MOCK_INCIDENTS = [
  { id: "1", title: "Ransomware Detection on Finance Workstation", type: "Ransomware", severity: "Critical", status: "Investigating", priority: "P1", assigned_to: "IR Team", reported_by: "EDR Alert", detected_at: "2026-05-13T02:15:00Z", tags: ["ransomware", "finance"], is_dora_reportable: true, dora_reported: false, financial_impact_estimate: 1200000, affected_users: 0, downtime_minutes: 180 },
  { id: "2", title: "Unauthorized Access to Customer Database", type: "Security Breach", severity: "High", status: "Contained", priority: "P1", assigned_to: "Alice Chen", reported_by: "SIEM Alert", detected_at: "2026-05-12T18:30:00Z", tags: ["unauthorized", "database"], is_dora_reportable: true, dora_reported: true, financial_impact_estimate: 480000, affected_users: 12500, downtime_minutes: 45 },
  { id: "3", title: "Phishing Email - Executive Impersonation", type: "Phishing", severity: "High", status: "Resolved", priority: "P2", assigned_to: "Bob Martinez", reported_by: "User Report", detected_at: "2026-05-12T10:45:00Z", resolved_at: "2026-05-12T14:30:00Z", tags: ["phishing", "bec"], is_dora_reportable: false, dora_reported: false, financial_impact_estimate: 0, affected_users: 1, downtime_minutes: 0 },
  { id: "4", title: "DDoS Attack on Trading API", type: "DDoS", severity: "High", status: "Contained", priority: "P2", assigned_to: "Network Team", reported_by: "WAF Logs", detected_at: "2026-05-11T09:20:00Z", tags: ["ddos", "api"], is_dora_reportable: true, dora_reported: true, financial_impact_estimate: 220000, affected_users: 0, downtime_minutes: 95 },
  { id: "5", title: "Data Leak via Misconfigured S3 Bucket", type: "Data Leak", severity: "Medium", status: "Resolved", priority: "P2", assigned_to: "Cloud Team", reported_by: "AWS GuardDuty", detected_at: "2026-05-10T14:00:00Z", resolved_at: "2026-05-11T11:00:00Z", tags: ["s3", "data-leak"], is_dora_reportable: false, dora_reported: false, financial_impact_estimate: 85000, affected_users: 340, downtime_minutes: 0 },
  { id: "6", title: "Suspicious Login Activity - Admin Account", type: "Security Breach", severity: "Medium", status: "Investigating", priority: "P2", assigned_to: "Carol Smith", reported_by: "UEBA Alert", detected_at: "2026-05-13T05:00:00Z", tags: ["login", "admin"], is_dora_reportable: false, dora_reported: false, financial_impact_estimate: 0, affected_users: 0, downtime_minutes: 0 },
];
// ======================================================================================

const TYPES = ["All", "Security Breach", "Data Leak", "Ransomware", "DDoS", "Phishing", "Insider Threat", "Malware", "Unauthorized Access", "System Outage", "Supply Chain Attack", "Social Engineering", "Physical Security"];
const STATUSES = ["All", "Open", "Investigating", "Contained", "Resolved", "Closed"];
const PRIORITIES = ["All", "P1", "P2", "P3", "P4"];

const sevVariant = (s) => ({ Critical: "danger", High: "warning", Medium: "info", Low: "secondary", Informational: "light", Open: "danger", Investigating: "warning", Contained: "primary", Resolved: "success", Closed: "secondary" }[s] || "secondary");

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function duration(start, end) {
  const ms = (end ? new Date(end) : new Date()).getTime() - new Date(start).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const prioStyle = (p) => {
  if (p === "P1") return { bg: "#fff5f5", color: "#d9534f", border: "#fecaca" };
  if (p === "P2") return { bg: "#fff7ed", color: "#fd7e14", border: "#fed7aa" };
  if (p === "P3") return { bg: "#fffbeb", color: "#f0ad4e", border: "#fde68a" };
  return { bg: "#f9fafb", color: "#98a2b3", border: "#e4e7ec" };
};

const Incidents = ({ year, currentUserInfo, refreshCharts, onNavigate }) => {
  const { t } = useTranslation("common");

  // Hybrid data — mock fallback as initial state, axios overrides on success.
  const [incidents, setIncidents] = useState(MOCK_INCIDENTS);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const privs = util.getCurrentUser().privileges?.split(",") || [];
  const canEdit = privs.includes("CR_INCIDENT");

  useEffect(() => {
    const logInId = currentUserInfo?.logInId;
    // HYBRID: real backend call — replaces the mock fallback above on success.
    axios
      .get(`/cyberrisk/incidents/${logInId}?year=${Number(year)}`)
      .then((res) => {
        if (Array.isArray(res?.data) && res.data.length) setIncidents(res.data);
      })
      .catch((err) => {
        console.warn("[cyberrisk] incidents: using mock fallback", err);
      });
  }, [year, currentUserInfo, refreshCharts]);

  const showToast = (msg, id) => { setToast({ msg, id }); setTimeout(() => setToast(null), 5000); };

  const handleDeclare = (incident) => {
    setIncidents((prev) => [incident, ...prev]);
    setModalOpen(false);
    showToast(`${t("Incident")} "${incident.title}" ${t("declared as")} ${incident.id}`, incident.id);
  };

  const filtered = incidents.filter((i) =>
    (i.title.toLowerCase().includes(search.toLowerCase()) ||
      (i.assigned_to || "").toLowerCase().includes(search.toLowerCase()) ||
      (i.reported_by || "").toLowerCase().includes(search.toLowerCase())) &&
    (type === "All" || i.type === type) &&
    (status === "All" || i.status === status) &&
    (priority === "All" || i.priority === priority)
  );

  const stats = {
    open: incidents.filter((i) => i.status === "Open" || i.status === "Investigating").length,
    p1: incidents.filter((i) => i.priority === "P1").length,
    contained: incidents.filter((i) => i.status === "Contained").length,
    resolved: incidents.filter((i) => i.status === "Resolved" || i.status === "Closed").length,
  };

  return (
    <div className="progrec-page p-4 p-lg-5">
      <DeclareIncidentForm show={modalOpen} onHide={() => setModalOpen(false)} onSaved={handleDeclare} />

      {toast && (
        <div className="pg-toast" style={{ background: "#fff5f5", borderColor: "#fecaca", color: "#d9534f" }}>
          <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: 14, color: "#d9534f" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>{t("Incident Declared")}</div>
            <div style={{ fontSize: "0.75rem", color: "#6c757d", marginTop: 2 }}>{toast.msg}</div>
          </div>
          <button onClick={() => setToast(null)} className="btn btn-link p-0" style={{ color: "#98a2b3" }}>
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 14 }} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: "#101828" }}>{t("Incident Response")}</h5>
          <span style={{ fontSize: "0.82rem", color: "#667085" }}>{incidents.length} {t("incidents tracked")}</span>
        </div>
        {canEdit && (
          <button onClick={() => setModalOpen(true)} className="btn btn-danger btn-sm d-flex align-items-center gap-2">
            <FontAwesomeIcon icon={faPlus} style={{ fontSize: 15 }} /> {t("Declare Incident")}
          </button>
        )}
      </div>

      {/* Stat cards */}
      <Row className="g-3 mb-4">
        {[
          { label: t("Active Incidents"), value: stats.open, accent: "#d9534f", cls: "stat-card-danger" },
          { label: t("P1 Critical"), value: stats.p1, accent: "#d9534f", cls: "stat-card-danger" },
          { label: t("Contained"), value: stats.contained, accent: "#3B82EC", cls: "stat-card-primary" },
          { label: t("Resolved"), value: stats.resolved, accent: "#4BBF73", cls: "stat-card-success" },
        ].map((s) => (
          <Col key={s.label} xs={6} md={3}>
            <Card className={`border shadow-sm h-100 ${s.cls}`} style={{ borderRadius: 10 }}>
              <Card.Body className="p-3">
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: s.accent, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                <div style={{ fontSize: "0.78rem", color: "#667085" }}>{s.label}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <InputGroup style={{ maxWidth: 300, flex: "1 1 200px" }}>
          <InputGroup.Text className="bg-white border-end-0"><FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 14, color: "#98a2b3" }} /></InputGroup.Text>
          <Form.Control value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Search incidents, assignees…")} style={{ fontSize: "0.82rem", borderLeft: 0 }} />
        </InputGroup>
        <Form.Select value={type} onChange={(e) => setType(e.target.value)} style={{ maxWidth: 180, fontSize: "0.82rem" }}>{TYPES.map((o) => <option key={o}>{o}</option>)}</Form.Select>
        <Form.Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 140, fontSize: "0.82rem" }}>{STATUSES.map((o) => <option key={o}>{o}</option>)}</Form.Select>
        <Form.Select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ maxWidth: 100, fontSize: "0.82rem" }}>{PRIORITIES.map((o) => <option key={o}>{o}</option>)}</Form.Select>
      </div>

      {/* Incident cards */}
      <div className="d-flex flex-column gap-3">
        {filtered.map((inc) => {
          const ps = prioStyle(inc.priority);
          const isNew = inc.id.startsWith("INC-") && inc.id.length > 6;
          const isP1Active = inc.priority === "P1" && (inc.status === "Open" || inc.status === "Investigating");
          return (
            <Card key={inc.id} className="shadow-sm border-0" style={{ borderRadius: 10, borderLeft: `3px solid ${isP1Active ? "#d9534f" : isNew ? "#3B82EC" : "#e4e7ec"}` }}>
              <Card.Body className="p-4">
                <div className="d-flex flex-column flex-sm-row align-items-sm-start gap-3">
                  <span className="flex-shrink-0 px-2 py-1 rounded fw-bold" style={{ fontSize: "0.75rem", fontFamily: "monospace", background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`, marginTop: 2 }}>
                    {inc.priority}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
                      <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "#101828" }}>{inc.title}</span>
                      {isNew && <span style={{ fontSize: "0.65rem", background: "#eff6ff", color: "#3B82EC", border: "1px solid #bfdbfe", borderRadius: 4, padding: "1px 6px" }}>{t("New")}</span>}
                    </div>
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      <Badge bg={sevVariant(inc.severity)}>{t(inc.severity)}</Badge>
                      <Badge bg={sevVariant(inc.status)}>{t(inc.status)}</Badge>
                      <span style={{ fontSize: "0.72rem", background: "#f4f7f9", border: "1px solid #e4e7ec", borderRadius: 4, padding: "2px 8px", color: "#667085" }}>{inc.type}</span>
                      {inc.is_dora_reportable && (
                        <span style={{ fontSize: "0.72rem", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 4, padding: "2px 8px", color: "#6f42c1" }}>DORA</span>
                      )}
                    </div>
                    <div className="d-flex flex-wrap gap-3" style={{ fontSize: "0.75rem", color: "#98a2b3" }}>
                      <span className="d-flex align-items-center gap-1"><FontAwesomeIcon icon={faClock} style={{ fontSize: 11 }} /> {t("Detected")} {timeAgo(inc.detected_at)}</span>
                      <span className="d-flex align-items-center gap-1"><FontAwesomeIcon icon={faUser} style={{ fontSize: 11 }} /> {inc.assigned_to}</span>
                      <span style={{ color: "#b0b8c4" }}>{t("via")} {inc.reported_by}</span>
                      {inc.resolved_at
                        ? <span style={{ color: "#4BBF73" }}>{t("Resolved in")} {duration(inc.detected_at, inc.resolved_at)}</span>
                        : <span style={{ color: "#f0ad4e" }}>{t("Open for")} {duration(inc.detected_at)}</span>
                      }
                    </div>
                  </div>

                  <div className="d-flex flex-column align-items-end gap-2 flex-shrink-0">
                    <span style={{ color: "#98a2b3", fontSize: "0.72rem", fontFamily: "monospace" }}>{inc.id}</span>
                    {inc.financial_impact_estimate > 0 && (
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#d9534f" }}>
                        ${(inc.financial_impact_estimate / 1000).toFixed(0)}K {t("impact")}
                      </span>
                    )}
                    <div className="d-flex flex-wrap gap-1 justify-content-end">
                      {(inc.tags || []).slice(0, 3).map((tg) => (
                        <span key={tg} style={{ fontSize: "0.65rem", background: "#f4f7f9", border: "1px solid #e4e7ec", borderRadius: 4, padding: "1px 5px", color: "#667085" }}>{tg}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="shadow-sm border-0 py-5 text-center" style={{ borderRadius: 10 }}>
            <div style={{ color: "#98a2b3" }}>{t("No incidents match the current filters.")}</div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Incidents;
