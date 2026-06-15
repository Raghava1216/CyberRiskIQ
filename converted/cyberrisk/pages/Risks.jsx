import React, { useState, useEffect } from "react";
import { Card, Row, Col, Form, InputGroup, Table } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faDownload,
  faMagnifyingGlass,
  faDollarSign,
  faArrowTrendUp,
  faShieldHalved,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import axios from "src/utils/AxiosInstance";
import * as util from "src/components/forms/reactformutils/elements/formutilfunctions";

import AddRiskForm from "src/modules/cyberrisk/forms/AddRiskForm";
import RiskMatrix from "src/modules/cyberrisk/charts/RiskMatrix";

// ===================== MOCK FALLBACK (remove once backend is live) =====================
// Copied from the original threat-dashboard mock data so the page renders before the real
// `/cyberrisk/risks` endpoint exists. Delete this block (and the fallback initial-state
// assignment below) once the endpoint returns data.
const MOCK_RISKS = [
  { id: "1", title: "Ransomware Attack on Core Banking Systems", category: "Technical", status: "Open", likelihood: 4, impact: 5, inherent_score: 20, residual_score: 12, owner: "Alice Chen", review_date: "2026-06-15", tags: ["ransomware", "banking"], fair: { tef_min: 0.5, tef_max: 3, tef_likely: 1.2, vulnerability: 72, lm_min: 800000, lm_max: 8000000, lm_likely: 3200000, ale: 3840000, ale_min: 400000, ale_max: 5760000, lef: 1.2 }, treatment: "Mitigate", treatment_cost: 480000, treatment_status: "In Progress", remediation_roi: 700, financial_impact: 3840000, framework_tags: ["DORA", "NIS2", "NIST CSF"], regulatory_reference: "DORA Art. 9 / NIS2 Art. 21" },
  { id: "2", title: "Third-Party Vendor Data Breach", category: "Operational", status: "In Treatment", likelihood: 3, impact: 5, inherent_score: 15, residual_score: 8, owner: "Bob Martinez", review_date: "2026-07-01", tags: ["vendor", "data"], fair: { tef_min: 0.3, tef_max: 2, tef_likely: 0.8, vulnerability: 65, lm_min: 500000, lm_max: 5000000, lm_likely: 1800000, ale: 1440000, ale_min: 150000, ale_max: 3250000, lef: 0.8 }, treatment: "Transfer", treatment_cost: 120000, treatment_status: "Completed", remediation_roi: 1100, financial_impact: 1440000, framework_tags: ["GDPR", "ISO 27001", "NIS2"], regulatory_reference: "GDPR Art. 28 / NIS2 Art. 21" },
  { id: "3", title: "Insider Threat - Privileged Access Abuse", category: "Operational", status: "Open", likelihood: 3, impact: 4, inherent_score: 12, residual_score: 6, owner: "Carol Smith", review_date: "2026-06-30", tags: ["insider", "access"], fair: { tef_min: 0.2, tef_max: 1.5, tef_likely: 0.6, vulnerability: 55, lm_min: 300000, lm_max: 3000000, lm_likely: 900000, ale: 540000, ale_min: 60000, ale_max: 1650000, lef: 0.6 }, treatment: "Mitigate", treatment_cost: 95000, treatment_status: "Not Started", remediation_roi: 468, financial_impact: 540000, framework_tags: ["ISO 27001", "NIST CSF"], regulatory_reference: "ISO 27001 A.9.4" },
  { id: "4", title: "DDoS Attack on Public Web Services", category: "Technical", status: "Open", likelihood: 4, impact: 3, inherent_score: 12, residual_score: 9, owner: "David Lee", review_date: "2026-05-30", tags: ["ddos", "web"], fair: { tef_min: 1, tef_max: 8, tef_likely: 3, vulnerability: 45, lm_min: 50000, lm_max: 800000, lm_likely: 220000, ale: 660000, ale_min: 150000, ale_max: 3600000, lef: 3 }, treatment: "Mitigate", treatment_cost: 75000, treatment_status: "Completed", remediation_roi: 780, financial_impact: 660000, framework_tags: ["DORA", "NIS2"], regulatory_reference: "DORA Art. 11" },
  { id: "5", title: "Phishing Campaign Targeting Finance Team", category: "Operational", status: "In Treatment", likelihood: 5, impact: 3, inherent_score: 15, residual_score: 6, owner: "Eva Wilson", review_date: "2026-06-10", tags: ["phishing", "finance"], fair: { tef_min: 2, tef_max: 15, tef_likely: 6, vulnerability: 38, lm_min: 20000, lm_max: 400000, lm_likely: 95000, ale: 570000, ale_min: 120000, ale_max: 6000000, lef: 6 }, treatment: "Mitigate", treatment_cost: 45000, treatment_status: "Completed", remediation_roi: 1167, financial_impact: 570000, framework_tags: ["NIST CSF", "ISO 27001"], regulatory_reference: "NIST CSF PR.AT" },
  { id: "6", title: "Unpatched Critical Vulnerabilities in ERP", category: "Technical", status: "Open", likelihood: 4, impact: 4, inherent_score: 16, residual_score: 10, owner: "Frank Zhang", review_date: "2026-06-05", tags: ["erp", "patch"], fair: { tef_min: 0.5, tef_max: 4, tef_likely: 1.5, vulnerability: 80, lm_min: 200000, lm_max: 2000000, lm_likely: 700000, ale: 1050000, ale_min: 100000, ale_max: 3200000, lef: 1.5 }, treatment: "Mitigate", treatment_cost: 55000, treatment_status: "In Progress", remediation_roi: 1809, financial_impact: 1050000, framework_tags: ["NIST CSF", "PCI DSS"], regulatory_reference: "PCI DSS Req. 6" },
  { id: "7", title: "GDPR Non-Compliance - EU Customer Data", category: "Compliance", status: "In Treatment", likelihood: 3, impact: 4, inherent_score: 12, residual_score: 4, owner: "Grace Kim", review_date: "2026-07-15", tags: ["gdpr", "compliance"], fair: { tef_min: 0.1, tef_max: 1, tef_likely: 0.4, vulnerability: 70, lm_min: 500000, lm_max: 20000000, lm_likely: 4000000, ale: 1600000, ale_min: 50000, ale_max: 14000000, lef: 0.4 }, treatment: "Mitigate", treatment_cost: 220000, treatment_status: "In Progress", remediation_roi: 627, financial_impact: 1600000, framework_tags: ["GDPR", "ISO 27001"], regulatory_reference: "GDPR Art. 83" },
  { id: "8", title: "Cloud Misconfiguration Exposing S3 Buckets", category: "Technical", status: "Closed", likelihood: 2, impact: 5, inherent_score: 10, residual_score: 2, owner: "Henry Park", review_date: "2026-08-01", tags: ["cloud", "s3"], fair: { tef_min: 0.2, tef_max: 2, tef_likely: 0.7, vulnerability: 90, lm_min: 100000, lm_max: 3000000, lm_likely: 800000, ale: 560000, ale_min: 20000, ale_max: 2700000, lef: 0.7 }, treatment: "Mitigate", treatment_cost: 18000, treatment_status: "Completed", remediation_roi: 3011, financial_impact: 560000, framework_tags: ["NIST CSF", "SOC 2"], regulatory_reference: "SOC 2 CC6.6" },
  { id: "9", title: "Business Continuity - Data Center Failure", category: "Strategic", status: "Accepted", likelihood: 2, impact: 5, inherent_score: 10, residual_score: 8, owner: "Iris Wang", review_date: "2026-09-01", tags: ["bcp", "dc"], fair: { tef_min: 0.05, tef_max: 0.5, tef_likely: 0.15, vulnerability: 60, lm_min: 1000000, lm_max: 10000000, lm_likely: 3500000, ale: 525000, ale_min: 50000, ale_max: 5000000, lef: 0.15 }, treatment: "Accept", treatment_cost: 0, treatment_status: "Completed", remediation_roi: 0, financial_impact: 525000, framework_tags: ["DORA", "ISO 22301"], regulatory_reference: "DORA Art. 11 / ISO 22301" },
  { id: "10", title: "API Security Gaps in Mobile Banking App", category: "Technical", status: "Open", likelihood: 3, impact: 4, inherent_score: 12, residual_score: 7, owner: "James Liu", review_date: "2026-06-20", tags: ["api", "mobile"], fair: { tef_min: 0.5, tef_max: 5, tef_likely: 2, vulnerability: 58, lm_min: 100000, lm_max: 2000000, lm_likely: 500000, ale: 1000000, ale_min: 50000, ale_max: 2900000, lef: 2 }, treatment: "Mitigate", treatment_cost: 85000, treatment_status: "Not Started", remediation_roi: 1076, financial_impact: 1000000, framework_tags: ["PCI DSS", "NIST CSF"], regulatory_reference: "PCI DSS Req. 6.4" },
];
// ======================================================================================

const CATEGORIES = ["All", "Strategic", "Operational", "Technical", "Compliance", "Financial", "Reputational"];
const STATUSES = ["All", "Open", "In Treatment", "Accepted", "Closed", "Transferred"];
const TREATMENTS = ["All", "Mitigate", "Accept", "Transfer", "Avoid"];
const FRAMEWORKS = ["All", "DORA", "NIS2", "NIST CSF", "ISO 27001", "GDPR", "PCI DSS", "SOC 2"];

const fmt$ = (n) =>
  n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

const treatmentBg = (tr) => {
  if (tr === "Mitigate") return { bg: "#eff6ff", color: "#3B82EC", border: "#bfdbfe" };
  if (tr === "Accept") return { bg: "#f9fafb", color: "#6c757d", border: "#e4e7ec" };
  if (tr === "Transfer") return { bg: "#f0fdf4", color: "#4BBF73", border: "#bbf7d0" };
  if (tr === "Avoid") return { bg: "#fff7ed", color: "#fd7e14", border: "#fed7aa" };
  return { bg: "#f9fafb", color: "#6c757d", border: "#e4e7ec" };
};

const statusBg = (s) => {
  if (s === "Open") return { bg: "#fff5f5", color: "#d9534f", border: "#fecaca" };
  if (s === "In Treatment") return { bg: "#fffbeb", color: "#f0ad4e", border: "#fde68a" };
  if (s === "Accepted") return { bg: "#f9fafb", color: "#6c757d", border: "#e4e7ec" };
  if (s === "Closed") return { bg: "#f0fdf4", color: "#4BBF73", border: "#bbf7d0" };
  return { bg: "#f9fafb", color: "#6c757d", border: "#e4e7ec" };
};

function InlineBadge({ text, style }) {
  return (
    <span style={{ display: "inline-block", fontSize: "0.72rem", padding: "2px 8px", borderRadius: 6, background: style.bg, color: style.color, border: `1px solid ${style.border}`, fontWeight: 500, whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}

function ScoreBar({ score, max = 25 }) {
  const pct = (score / max) * 100;
  const color = score >= 16 ? "#d9534f" : score >= 10 ? "#fd7e14" : score >= 6 ? "#f0ad4e" : "#4BBF73";
  return (
    <div className="d-flex align-items-center gap-2">
      <div style={{ flex: 1, height: 6, background: "#f0f0f0", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 999, background: color, width: `${pct}%` }} />
      </div>
      <span style={{ fontSize: "0.72rem", fontWeight: 700, color, width: 20, textAlign: "right" }}>{score}</span>
    </div>
  );
}

function FAIRDetailPanel({ risk, onClose, t }) {
  const tm = treatmentBg(risk.treatment);
  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(16,24,40,0.5)", zIndex: 1040 }} onClick={onClose} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, zIndex: 1050, width: "100%", maxWidth: 480, background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", overflowY: "auto", fontFamily: "Poppins,sans-serif" }}>
        <div className="d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: "1px solid #e4e7ec", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#101828" }}>{t("FAIR Risk Analysis")}</div>
            <div style={{ fontSize: "0.75rem", color: "#98a2b3", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 360 }}>{risk.title}</div>
          </div>
          <button className="btn p-1 border-0" onClick={onClose} style={{ color: "#667085" }}><FontAwesomeIcon icon={faXmark} style={{ fontSize: 18 }} /></button>
        </div>
        <div className="p-4">
          <Row className="g-2 mb-4">
            {[
              { l: t("ALE (Most Likely)"), v: fmt$(risk.fair.ale), c: "#d9534f", sub: t("Annualised Loss Expectancy") },
              { l: t("ALE Min"), v: fmt$(risk.fair.ale_min), c: "#f0ad4e", sub: t("Best case") },
              { l: t("ALE Max"), v: fmt$(risk.fair.ale_max), c: "#d9534f", sub: t("Worst case") },
              { l: t("Treatment Cost"), v: fmt$(risk.treatment_cost), c: "#3B82EC", sub: t("Investment to remediate") },
            ].map((s) => (
              <Col key={s.l} xs={6}>
                <div className="p-3 rounded" style={{ background: "#f9fafb", border: "1px solid #e4e7ec" }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: "0.75rem", color: "#344054", fontWeight: 500 }}>{s.l}</div>
                  <div style={{ fontSize: "0.68rem", color: "#98a2b3" }}>{s.sub}</div>
                </div>
              </Col>
            ))}
          </Row>

          {risk.treatment_cost > 0 && (
            <div className="p-3 rounded mb-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div style={{ color: "#4BBF73", fontWeight: 700, fontSize: "1.4rem" }}>{risk.remediation_roi}%</div>
                  <div style={{ color: "#667085", fontSize: "0.78rem" }}>{t("Remediation ROI")}</div>
                </div>
                <div className="text-end">
                  <div style={{ color: "#344054", fontWeight: 500 }}>{fmt$(risk.fair.ale - risk.treatment_cost)}</div>
                  <div style={{ color: "#98a2b3", fontSize: "0.72rem" }}>{t("Net risk reduction value")}</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ fontSize: "0.7rem", color: "#98a2b3", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{t("FAIR Model Inputs")}</div>
          {[
            { l: t("Threat Event Frequency (TEF)"), v: `${risk.fair.tef_min}–${risk.fair.tef_likely}–${risk.fair.tef_max} /yr` },
            { l: t("Vulnerability / Contact probability"), v: `${risk.fair.vulnerability}%` },
            { l: t("Loss Event Frequency (LEF)"), v: `${risk.fair.lef} /yr` },
            { l: t("Loss Magnitude — Min / Likely / Max"), v: `${fmt$(risk.fair.lm_min)} / ${fmt$(risk.fair.lm_likely)} / ${fmt$(risk.fair.lm_max)}` },
          ].map((row) => (
            <div key={row.l} className="d-flex align-items-center justify-content-between py-2" style={{ borderBottom: "1px solid #f4f7f9", fontSize: "0.78rem" }}>
              <span style={{ color: "#667085" }}>{row.l}</span>
              <span style={{ color: "#344054", fontFamily: "monospace", fontWeight: 500 }}>{row.v}</span>
            </div>
          ))}

          <div className="mt-4">
            <div style={{ fontSize: "0.7rem", color: "#98a2b3", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{t("GRC / Regulatory Linkage")}</div>
            <div className="d-flex flex-wrap gap-1 mb-2">
              {risk.framework_tags.map((f) => (
                <span key={f} style={{ fontSize: "0.72rem", padding: "3px 8px", background: "#f4f7f9", border: "1px solid #e4e7ec", borderRadius: 6, color: "#344054" }}>{f}</span>
              ))}
            </div>
            {risk.regulatory_reference && <div style={{ fontSize: "0.75rem", color: "#98a2b3" }}>{risk.regulatory_reference}</div>}
          </div>

          <div className="mt-4">
            <div style={{ fontSize: "0.7rem", color: "#98a2b3", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{t("Treatment Details")}</div>
            <Row className="g-2">
              <Col xs={6}>
                <div className="p-3 rounded" style={{ background: "#f9fafb", border: "1px solid #e4e7ec" }}>
                  <div style={{ fontSize: "0.72rem", color: "#98a2b3", marginBottom: 4 }}>{t("Strategy")}</div>
                  <InlineBadge text={risk.treatment} style={tm} />
                </div>
              </Col>
              <Col xs={6}>
                <div className="p-3 rounded" style={{ background: "#f9fafb", border: "1px solid #e4e7ec" }}>
                  <div style={{ fontSize: "0.72rem", color: "#98a2b3", marginBottom: 4 }}>{t("Treatment Status")}</div>
                  <span style={{ fontSize: "0.8rem", color: "#344054", fontWeight: 500 }}>{risk.treatment_status}</span>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </div>
    </>
  );
}

function exportToCSV(risks) {
  const headers = ["ID", "Title", "Category", "Status", "Treatment", "Inherent Score", "Residual Score", "ALE", "ALE Min", "ALE Max", "Treatment Cost", "ROI %", "Framework Tags", "Regulatory Ref", "Owner", "Review Date"];
  const rows = risks.map((r) => [r.id, `"${r.title.replace(/"/g, '""')}"`, r.category, r.status, r.treatment, r.inherent_score, r.residual_score, r.fair.ale, r.fair.ale_min, r.fair.ale_max, r.treatment_cost, r.remediation_roi, `"${r.framework_tags.join("; ")}"`, `"${r.regulatory_reference}"`, `"${r.owner}"`, r.review_date]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `risk-register-fair-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const Risks = ({ year, currentUserInfo, refreshCharts, onNavigate }) => {
  const { t } = useTranslation("common");
  const privs = util.getCurrentUser().privileges?.split(",") || [];
  const canEdit = privs.includes("CR_RISK");

  // Hybrid data — mock fallback as initial state, axios overrides on success.
  const [riskData, setRiskData] = useState(MOCK_RISKS);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [treatment, setTreatment] = useState("All");
  const [framework, setFramework] = useState("All");
  const [view, setView] = useState("list");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailRisk, setDetailRisk] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const logInId = currentUserInfo?.logInId;
    // HYBRID: real backend call — replaces the mock fallback above on success.
    axios
      .get(`/cyberrisk/risks/${logInId}?year=${Number(year)}`)
      .then((res) => {
        if (Array.isArray(res?.data) && res.data.length) setRiskData(res.data);
      })
      .catch((err) => {
        console.warn("[cyberrisk] risks: using mock fallback", err);
      });
  }, [year, currentUserInfo, refreshCharts]);

  const filtered = riskData.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.title.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q) || r.regulatory_reference?.toLowerCase().includes(q)) &&
      (category === "All" || r.category === category) &&
      (status === "All" || r.status === status) &&
      (treatment === "All" || r.treatment === treatment) &&
      (framework === "All" || r.framework_tags?.includes(framework))
    );
  });

  const totalALE = filtered.reduce((s, r) => s + r.fair.ale, 0);
  const totalTreatment = filtered.reduce((s, r) => s + r.treatment_cost, 0);
  const roiRisks = filtered.filter((r) => r.remediation_roi > 0);
  const avgROI = roiRisks.length > 0 ? Math.round(roiRisks.reduce((s, r) => s + r.remediation_roi, 0) / roiRisks.length) : 0;

  const handleAddRisk = (newRisk) => {
    const sc = newRisk.likelihood * newRisk.impact;
    const ale = sc * 80000;
    const row = {
      id: String(riskData.length + 1),
      title: newRisk.title,
      category: newRisk.category,
      status: newRisk.status === "Active" ? "Open" : "Accepted",
      likelihood: newRisk.likelihood,
      impact: newRisk.impact,
      inherent_score: sc,
      residual_score: Math.max(1, sc - 3),
      owner: newRisk.owners[0] ?? "Unassigned",
      review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      tags: newRisk.tags,
      fair: { tef_min: 0.5, tef_max: 3, tef_likely: 1, vulnerability: 60, lm_min: ale * 0.2, lm_max: ale * 3, lm_likely: ale, ale, ale_min: ale * 0.1, ale_max: ale * 2, lef: 1 },
      treatment: "Mitigate",
      treatment_cost: Math.round(ale * 0.1),
      treatment_status: "Not Started",
      remediation_roi: Math.round(((ale - ale * 0.1) / (ale * 0.1)) * 100),
      financial_impact: ale,
      framework_tags: [],
      regulatory_reference: "",
    };
    setRiskData((prev) => [row, ...prev]);
    setToast(`${t("Risk")} "${newRisk.title}" ${t("added to register")}`);
    setTimeout(() => setToast(null), 4000);
  };

  const kpis = [
    { l: t("Aggregate ALE"), v: fmt$(totalALE), sub: t("Annualised Loss Expectancy"), accent: "#d9534f", icon: faDollarSign, cls: "stat-card-danger" },
    { l: t("Treatment Budget"), v: fmt$(totalTreatment), sub: t("Total remediation cost"), accent: "#3B82EC", icon: faShieldHalved, cls: "stat-card-primary" },
    { l: t("Avg Remediation ROI"), v: `${avgROI}%`, sub: t("Return on risk investment"), accent: "#4BBF73", icon: faArrowTrendUp, cls: "stat-card-success" },
    { l: t("Open/In Treatment"), v: String(filtered.filter((r) => ["Open", "In Treatment"].includes(r.status)).length), sub: `${t("of")} ${filtered.length} ${t("filtered")}`, accent: "#f0ad4e", icon: faTriangleExclamation, cls: "stat-card-warning" },
  ];

  return (
    <div className="progrec-page p-4 p-lg-5">
      <AddRiskForm show={modalOpen} onHide={() => setModalOpen(false)} onSaved={handleAddRisk} />
      {detailRisk && <FAIRDetailPanel risk={detailRisk} onClose={() => setDetailRisk(null)} t={t} />}

      {toast && (
        <div className="pg-toast">
          <span className="live-dot" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: "#101828" }}>{t("Risk Register")}</h5>
          <span style={{ fontSize: "0.82rem", color: "#667085" }}>{riskData.length} {t("risks · FAIR financial model · GRC framework linkage")}</span>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2" onClick={() => exportToCSV(filtered)}>
            <FontAwesomeIcon icon={faDownload} style={{ fontSize: 14 }} /> {t("Export FAIR CSV")}
          </button>
          {canEdit && (
            <button className="btn btn-primary btn-sm d-flex align-items-center gap-2" onClick={() => setModalOpen(true)}>
              <FontAwesomeIcon icon={faPlus} style={{ fontSize: 14 }} /> {t("Add Risk")}
            </button>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <Row className="g-3 mb-4">
        {kpis.map((s) => (
          <Col key={s.l} xs={6} md={3}>
            <Card className={`shadow-sm border ${s.cls} h-100`} style={{ borderRadius: 10 }}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <FontAwesomeIcon icon={s.icon} style={{ fontSize: 14, color: s.accent }} />
                  <span style={{ fontSize: "1.2rem", fontWeight: 700, color: s.accent, fontVariantNumeric: "tabular-nums" }}>{s.v}</span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "#344054", fontWeight: 500 }}>{s.l}</div>
                <div style={{ fontSize: "0.7rem", color: "#98a2b3" }}>{s.sub}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <InputGroup style={{ maxWidth: 280, flex: "1 1 200px" }}>
          <InputGroup.Text className="bg-white border-end-0"><FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 13, color: "#98a2b3" }} /></InputGroup.Text>
          <Form.Control value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Search title, owner, regulation…")} style={{ fontSize: "0.82rem", borderLeft: 0 }} />
        </InputGroup>
        {[
          { val: category, set: setCategory, opts: CATEGORIES },
          { val: status, set: setStatus, opts: STATUSES },
          { val: treatment, set: setTreatment, opts: TREATMENTS },
          { val: framework, set: setFramework, opts: FRAMEWORKS },
        ].map(({ val, set, opts }, i) => (
          <Form.Select key={i} value={val} onChange={(e) => set(e.target.value)} style={{ maxWidth: 140, fontSize: "0.82rem" }}>
            {opts.map((o) => <option key={o} value={o}>{t(o)}</option>)}
          </Form.Select>
        ))}
        <div className="btn-group">
          {["list", "financial", "matrix"].map((v) => (
            <button key={v} onClick={() => setView(v)} className={`btn btn-sm ${view === v ? "btn-primary" : "btn-outline-secondary"}`} style={{ fontSize: "0.78rem", textTransform: "capitalize" }}>{t(v)}</button>
          ))}
        </div>
      </div>

      {/* Matrix view */}
      {view === "matrix" && (
        <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: 10 }}>
          <Card.Body className="p-4">
            <h6 className="fw-semibold mb-4" style={{ color: "#101828" }}>{t("Risk Heat Map")}</h6>
            <RiskMatrix risks={filtered} />
          </Card.Body>
        </Card>
      )}

      {/* Financial view */}
      {view === "financial" && (
        <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: 10, overflow: "hidden" }}>
          <Card.Header className="bg-white px-4 py-3 d-flex align-items-center gap-2" style={{ borderBottom: "1px solid #e4e7ec" }}>
            <FontAwesomeIcon icon={faDollarSign} style={{ fontSize: 15, color: "#3B82EC" }} />
            <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "#101828" }}>{t("Financial Risk View — FAIR Model")}</span>
          </Card.Header>
          <div className="table-responsive">
            <Table hover className="mb-0" style={{ fontSize: "0.82rem" }}>
              <thead style={{ background: "#f9fafb" }}>
                <tr>{["Risk", "ALE (Likely)", "ALE Range", "Treatment", "Treatment Cost", "ROI", "Frameworks", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 border-bottom fw-semibold" style={{ fontSize: "0.72rem", color: "#98a2b3", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{t(h)}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => setDetailRisk(r)}>
                    <td className="px-4 py-3" style={{ maxWidth: 200 }}>
                      <div style={{ color: "#344054", fontSize: "0.82rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                      <div style={{ color: "#98a2b3", fontSize: "0.72rem" }}>{r.category}</div>
                    </td>
                    <td className="px-4 py-3"><span style={{ color: "#d9534f", fontWeight: 600, fontFamily: "monospace" }}>{fmt$(r.fair.ale)}</span></td>
                    <td className="px-4 py-3"><span style={{ color: "#98a2b3", fontSize: "0.75rem", whiteSpace: "nowrap", fontFamily: "monospace" }}>{fmt$(r.fair.ale_min)} – {fmt$(r.fair.ale_max)}</span></td>
                    <td className="px-4 py-3"><InlineBadge text={r.treatment} style={treatmentBg(r.treatment)} /></td>
                    <td className="px-4 py-3"><span style={{ color: "#3B82EC", fontWeight: 600, fontFamily: "monospace", fontSize: "0.78rem" }}>{r.treatment_cost > 0 ? fmt$(r.treatment_cost) : "—"}</span></td>
                    <td className="px-4 py-3"><span style={{ fontWeight: 600, color: r.remediation_roi >= 500 ? "#4BBF73" : r.remediation_roi > 0 ? "#3B82EC" : "#98a2b3" }}>{r.remediation_roi > 0 ? `${r.remediation_roi}%` : "—"}</span></td>
                    <td className="px-4 py-3"><div className="d-flex gap-1 flex-wrap">{(r.framework_tags ?? []).slice(0, 2).map((f) => <span key={f} style={{ fontSize: "0.65rem", padding: "1px 5px", background: "#f4f7f9", border: "1px solid #e4e7ec", borderRadius: 4, color: "#667085" }}>{f}</span>)}</div></td>
                    <td className="px-4 py-3"><InlineBadge text={r.status} style={statusBg(r.status)} /></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          {filtered.length === 0 && <div className="py-5 text-center" style={{ color: "#98a2b3" }}>{t("No risks match filters.")}</div>}
        </Card>
      )}

      {/* List view */}
      {view === "list" && (
        <Card className="shadow-sm border-0" style={{ borderRadius: 10, overflow: "hidden" }}>
          <div className="table-responsive">
            <Table hover className="mb-0" style={{ fontSize: "0.82rem" }}>
              <thead style={{ background: "#f9fafb" }}>
                <tr>{["Risk", "Category", "Status", "Inherent", "Residual", "ALE", "Treatment", "Framework", "Owner"].map((h) => (
                  <th key={h} className="px-4 py-3 border-bottom fw-semibold" style={{ fontSize: "0.72rem", color: "#98a2b3", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{t(h)}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => setDetailRisk(r)}>
                    <td className="px-4 py-3" style={{ maxWidth: 220 }}>
                      <div style={{ color: "#344054", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                      <div className="d-flex gap-1 mt-1 flex-wrap">{r.tags.slice(0, 2).map((tg) => <span key={tg} style={{ fontSize: "0.65rem", padding: "1px 5px", background: "#f4f7f9", border: "1px solid #e4e7ec", borderRadius: 4, color: "#667085" }}>{tg}</span>)}</div>
                    </td>
                    <td className="px-4 py-3"><span style={{ color: "#667085", fontSize: "0.78rem" }}>{r.category}</span></td>
                    <td className="px-4 py-3"><InlineBadge text={r.status} style={statusBg(r.status)} /></td>
                    <td className="px-4 py-3" style={{ minWidth: 110 }}><ScoreBar score={r.inherent_score} /></td>
                    <td className="px-4 py-3" style={{ minWidth: 110 }}><ScoreBar score={r.residual_score} /></td>
                    <td className="px-4 py-3"><span style={{ color: "#d9534f", fontWeight: 600, fontFamily: "monospace", fontSize: "0.78rem" }}>{fmt$(r.fair.ale)}</span></td>
                    <td className="px-4 py-3"><InlineBadge text={r.treatment} style={treatmentBg(r.treatment)} /></td>
                    <td className="px-4 py-3"><div className="d-flex gap-1 flex-wrap">{(r.framework_tags ?? []).slice(0, 2).map((f) => <span key={f} style={{ fontSize: "0.65rem", padding: "1px 5px", background: "#f4f7f9", border: "1px solid #e4e7ec", borderRadius: 4, color: "#667085" }}>{f}</span>)}</div></td>
                    <td className="px-4 py-3"><span style={{ color: "#667085", fontSize: "0.78rem", whiteSpace: "nowrap" }}>{r.owner}</span></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          {filtered.length === 0 && <div className="py-5 text-center" style={{ color: "#98a2b3" }}>{t("No risks match the current filters.")}</div>}
        </Card>
      )}
    </div>
  );
};

export default Risks;
