import React, { useState, useEffect } from "react";
import { Card, Row, Col, Badge, Nav } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faShieldHalved,
  faDollarSign,
  faChartColumn,
  faArrowTrendUp,
  faCircleCheck,
  faArrowUpRightFromSquare,
  faArrowTrendDown,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import axios from "src/utils/AxiosInstance";

// ===================== MOCK FALLBACK (remove once backend is live) =====================
// Copied from the original threat-dashboard mock data so the page renders before the
// real `/cyberrisk/dashboard` endpoint exists. Delete this block (and the fallback
// initial-state assignments below) once the endpoint returns data.
const MOCK_ORG = {
  name: "Acme Financial Corp",
  industry: "Financial Services",
  size: "Enterprise",
  risk_appetite: "Low",
  overallRiskScore: 68,
  trend: -4,
};
const MOCK_KPIS = {
  totalRisks: 142,
  criticalRisks: 12,
  openIncidents: 7,
  criticalIncidents: 2,
  totalAssets: 384,
  vulnerableAssets: 47,
  complianceScore: 76,
  threatAlerts: 23,
  totalALE: 14200000,
  totalTreatmentBudget: 3850000,
  aggregateROI: 268,
  doraIncidents: 3,
  nis2ReadinessScore: 71,
  valueAtRisk_90: 8400000,
  valueAtRisk_95: 12100000,
};
const MOCK_RISKS = [
  { id: "1", title: "Ransomware Attack on Core Banking Systems", fair: { ale: 3840000 }, treatment_cost: 480000, remediation_roi: 700, framework_tags: ["DORA", "NIS2", "NIST CSF"] },
  { id: "2", title: "Third-Party Vendor Data Breach", fair: { ale: 1440000 }, treatment_cost: 120000, remediation_roi: 1100, framework_tags: ["GDPR", "ISO 27001", "NIS2"] },
  { id: "3", title: "Insider Threat - Privileged Access Abuse", fair: { ale: 540000 }, treatment_cost: 95000, remediation_roi: 468, framework_tags: ["ISO 27001", "NIST CSF"] },
  { id: "4", title: "DDoS Attack on Public Web Services", fair: { ale: 660000 }, treatment_cost: 75000, remediation_roi: 780, framework_tags: ["DORA", "NIS2"] },
  { id: "5", title: "Phishing Campaign Targeting Finance Team", fair: { ale: 570000 }, treatment_cost: 45000, remediation_roi: 1167, framework_tags: ["NIST CSF", "ISO 27001"] },
  { id: "6", title: "Unpatched Critical Vulnerabilities in ERP", fair: { ale: 1050000 }, treatment_cost: 55000, remediation_roi: 1809, framework_tags: ["NIST CSF", "PCI DSS"] },
  { id: "7", title: "GDPR Non-Compliance - EU Customer Data", fair: { ale: 1600000 }, treatment_cost: 220000, remediation_roi: 627, framework_tags: ["GDPR", "ISO 27001"] },
  { id: "8", title: "Cloud Misconfiguration Exposing S3 Buckets", fair: { ale: 560000 }, treatment_cost: 18000, remediation_roi: 3011, framework_tags: ["NIST CSF", "SOC 2"] },
  { id: "9", title: "Business Continuity - Data Center Failure", fair: { ale: 525000 }, treatment_cost: 0, remediation_roi: 0, framework_tags: ["DORA", "ISO 22301"] },
  { id: "10", title: "API Security Gaps in Mobile Banking App", fair: { ale: 1000000 }, treatment_cost: 85000, remediation_roi: 1076, framework_tags: ["PCI DSS", "NIST CSF"] },
];
const MOCK_INCIDENTS = [
  { id: "1", title: "Ransomware Detection on Finance Workstation", type: "Ransomware", priority: "P1", is_dora_reportable: true, dora_reported: false, financial_impact_estimate: 1200000 },
  { id: "2", title: "Unauthorized Access to Customer Database", type: "Security Breach", priority: "P1", is_dora_reportable: true, dora_reported: true, financial_impact_estimate: 480000 },
  { id: "3", title: "Phishing Email - Executive Impersonation", type: "Phishing", priority: "P2", is_dora_reportable: false, dora_reported: false, financial_impact_estimate: 0 },
  { id: "4", title: "DDoS Attack on Trading API", type: "DDoS", priority: "P2", is_dora_reportable: true, dora_reported: true, financial_impact_estimate: 220000 },
  { id: "5", title: "Data Leak via Misconfigured S3 Bucket", type: "Data Leak", priority: "P2", is_dora_reportable: false, dora_reported: false, financial_impact_estimate: 85000 },
];
const MOCK_COMPLIANCE_FRAMEWORKS = [
  { id: "1", name: "NIST CSF", score: 82 },
  { id: "2", name: "ISO 27001", score: 74 },
  { id: "3", name: "SOC 2 Type II", score: 88 },
  { id: "4", name: "PCI DSS", score: 71 },
  { id: "5", name: "GDPR", score: 79 },
  { id: "6", name: "HIPAA", score: 65 },
];
const MOCK_REGULATORY_METRICS = {
  dora: { readiness: 68, incidents_ytd: 3, incidents_reported: 2, incidents_pending: 1, rto_target_hours: 4, rto_actual_hours: 6.5, rpo_target_hours: 1, rpo_actual_hours: 2.2, third_party_ict_risks: 8 },
  nis2: { readiness: 71, governance_score: 78, technical_measures_score: 74, business_continuity_score: 65, incident_handling_score: 70, supply_chain_score: 58, cryptography_score: 82 },
};
const MOCK_MONTE_CARLO = {
  percentiles: [
    { pct: 50, value: 4100000 },
    { pct: 75, value: 6800000 },
    { pct: 90, value: 8400000 },
    { pct: 95, value: 12100000 },
    { pct: 99, value: 21500000 },
  ],
  simulations: 10000,
  mean_loss: 4350000,
  std_dev: 3200000,
};
const MOCK_TREATMENT_MIX = [
  { treatment: "Mitigate", count: 7, percentage: 70, budget: 3098000 },
  { treatment: "Transfer", count: 1, percentage: 10, budget: 120000 },
  { treatment: "Accept", count: 1, percentage: 10, budget: 0 },
  { treatment: "Avoid", count: 1, percentage: 10, budget: 632000 },
];
const MOCK_RISK_TREND = [
  { month: "Nov", critical: 22, high: 45, medium: 65, low: 38 },
  { month: "Dec", critical: 25, high: 50, medium: 68, low: 35 },
  { month: "Jan", critical: 28, high: 54, medium: 72, low: 28 },
  { month: "Feb", critical: 21, high: 44, medium: 63, low: 26 },
  { month: "Mar", critical: 17, high: 37, medium: 55, low: 24 },
  { month: "Apr", critical: 14, high: 31, medium: 49, low: 24 },
  { month: "May", critical: 12, high: 28, medium: 44, low: 22 },
];
// ======================================================================================

const fmt$ = (n) =>
  n >= 1000000
    ? `$${(n / 1000000).toFixed(1)}M`
    : n >= 1000
    ? `$${(n / 1000).toFixed(0)}K`
    : `$${n}`;

const BAR_AREA_H = 96;

function ScoreGauge({ score }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ * 0.75;
  const color = score <= 40 ? "#4BBF73" : score <= 65 ? "#f0ad4e" : "#d9534f";
  return (
    <div className="d-flex justify-content-center">
      <svg width={140} height={100} viewBox="0 0 140 100">
        <path d="M 16 90 A 54 54 0 0 1 124 90" fill="none" stroke="#e9ecef" strokeWidth="10" strokeLinecap="round" />
        <path
          d="M 16 90 A 54 54 0 0 1 124 90"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        <text x="70" y="82" textAnchor="middle" fill={color} fontSize="26" fontWeight="bold">{score}</text>
        <text x="70" y="97" textAnchor="middle" fill="#98a2b3" fontSize="10">/ 100</text>
      </svg>
    </div>
  );
}

function MiniBar({ month, critical, high, medium, low, maxVal }) {
  const total = critical + high + medium + low;
  const colH = maxVal > 0 ? (total / maxVal) * BAR_AREA_H : 0;
  const segH = (v) => (total > 0 ? Math.max(2, (v / total) * colH) : 0);
  const segs = [
    { v: low, c: "#3B82EC99", label: "low" },
    { v: medium, c: "#f0ad4e99", label: "medium" },
    { v: high, c: "#fd7e1499", label: "high" },
    { v: critical, c: "#d9534fcc", label: "critical" },
  ];
  return (
    <div className="d-flex flex-column align-items-center flex-fill" style={{ gap: 5, minWidth: 0 }}>
      <div style={{ height: BAR_AREA_H, width: "100%", display: "flex", alignItems: "flex-end" }}>
        <div style={{ width: "100%", display: "flex", flexDirection: "column-reverse", gap: 1 }}>
          {segs.filter((s) => s.v > 0).map((s) => (
            <div key={s.label} style={{ height: segH(s.v), background: s.c, borderRadius: 2, width: "100%" }} />
          ))}
        </div>
      </div>
      <span style={{ fontSize: "0.67rem", color: "var(--pg-text-muted, #667085)", lineHeight: 1 }}>{month}</span>
      <span style={{ fontSize: "0.65rem", color: "var(--pg-text-subtle, #98a2b3)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{total}</span>
    </div>
  );
}

function VaRBar({ monteCarlo }) {
  const { percentiles } = monteCarlo;
  const max = percentiles[percentiles.length - 1].value;
  return (
    <div className="d-flex flex-column gap-2">
      {percentiles.map((p) => (
        <div key={p.pct} className="d-flex align-items-center gap-2">
          <span style={{ fontSize: "0.72rem", color: "#98a2b3", width: 32, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{p.pct}%</span>
          <div style={{ flex: 1, height: 14, background: "#f0f0f0", borderRadius: 999, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                borderRadius: 999,
                width: `${(p.value / max) * 100}%`,
                background: p.pct >= 95 ? "#d9534f" : p.pct >= 90 ? "#fd7e14" : p.pct >= 75 ? "#f0ad4e" : "#3B82EC",
                transition: "width 0.7s ease",
              }}
            />
          </div>
          <span
            style={{
              fontSize: "0.72rem",
              fontFamily: "monospace",
              fontWeight: 600,
              width: 56,
              color: p.pct >= 95 ? "#d9534f" : p.pct >= 90 ? "#fd7e14" : p.pct >= 75 ? "#f0ad4e" : "#3B82EC",
            }}
          >
            {fmt$(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function TreatmentDonut({ treatmentMix }) {
  const colors = ["#3B82EC", "#f0ad4e", "#4BBF73", "#d9534f"];
  const total = treatmentMix.reduce((s, t) => s + t.count, 0);
  let cum = 0;
  const r = 36;
  const cx = 50;
  const cy = 50;
  const circ = 2 * Math.PI * r;
  return (
    <div className="d-flex align-items-center gap-4">
      <svg width={100} height={100} viewBox="0 0 100 100">
        {treatmentMix.map((tm, i) => {
          const frac = tm.count / total;
          const offset = circ * (1 - cum);
          const dash = circ * frac;
          cum += frac;
          return (
            <circle
              key={tm.treatment}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={colors[i]}
              strokeWidth="14"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="#101828" fontSize="16" fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#98a2b3" fontSize="8">risks</text>
      </svg>
      <div className="d-flex flex-column gap-2">
        {treatmentMix.map((tm, i) => (
          <div key={tm.treatment} className="d-flex align-items-center gap-2">
            <div className="rounded-circle flex-shrink-0" style={{ width: 10, height: 10, background: colors[i] }} />
            <span style={{ fontSize: "0.78rem", color: "#667085" }}>{tm.treatment}</span>
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#344054", marginLeft: "auto", paddingLeft: 8 }}>{tm.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadinessBar({ label, score, color }) {
  return (
    <div className="d-flex align-items-center gap-2">
      <span style={{ fontSize: "0.75rem", color: "#667085", width: 160, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: "#f0f0f0", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", background: color, borderRadius: 999, width: `${score}%`, transition: "width 0.8s ease" }} />
      </div>
      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#344054", width: 36, textAlign: "right" }}>{score}%</span>
    </div>
  );
}

const Dashboard = ({ year, currentUserInfo, refreshCharts, onNavigate }) => {
  const { t } = useTranslation("common");
  const [activeTab, setActiveTab] = useState("financial");

  // Hybrid data — mock fallback as initial state, axios overrides on success.
  const [org, setOrg] = useState(MOCK_ORG);
  const [kpis, setKpis] = useState(MOCK_KPIS);
  const [risks, setRisks] = useState(MOCK_RISKS);
  const [incidents, setIncidents] = useState(MOCK_INCIDENTS);
  const [frameworks, setFrameworks] = useState(MOCK_COMPLIANCE_FRAMEWORKS);
  const [regulatory, setRegulatory] = useState(MOCK_REGULATORY_METRICS);
  const [monteCarlo, setMonteCarlo] = useState(MOCK_MONTE_CARLO);
  const [treatmentMix, setTreatmentMix] = useState(MOCK_TREATMENT_MIX);
  const [riskTrend, setRiskTrend] = useState(MOCK_RISK_TREND);

  useEffect(() => {
    const logInId = currentUserInfo?.logInId;
    // HYBRID: real backend call — replaces the mock fallback above on success.
    axios
      .get(`/cyberrisk/dashboard/${logInId}?year=${Number(year)}`)
      .then((res) => {
        const d = res?.data || {};
        if (d.org) setOrg(d.org);
        if (d.kpis) setKpis(d.kpis);
        if (Array.isArray(d.risks) && d.risks.length) setRisks(d.risks);
        if (Array.isArray(d.incidents) && d.incidents.length) setIncidents(d.incidents);
        if (Array.isArray(d.complianceFrameworks) && d.complianceFrameworks.length) setFrameworks(d.complianceFrameworks);
        if (d.regulatoryMetrics) setRegulatory(d.regulatoryMetrics);
        if (d.monteCarloResults) setMonteCarlo(d.monteCarloResults);
        if (Array.isArray(d.treatmentMix) && d.treatmentMix.length) setTreatmentMix(d.treatmentMix);
        if (Array.isArray(d.riskTrend) && d.riskTrend.length) setRiskTrend(d.riskTrend);
      })
      .catch((err) => {
        // Falls back to the MOCK_* data so the page renders during validation.
        console.warn("[cyberrisk] dashboard: using mock fallback", err);
      });
  }, [year, currentUserInfo, refreshCharts]);

  const maxTrend = Math.max(...riskTrend.map((m) => m.critical + m.high + m.medium + m.low));
  const totalALE = risks.reduce((s, r) => s + r.fair.ale, 0);
  const totalTreatmentBudget = risks.reduce((s, r) => s + r.treatment_cost, 0);
  const roiRisks = risks.filter((r) => r.remediation_roi > 0);
  const avgROI = roiRisks.length ? roiRisks.reduce((s, r) => s + r.remediation_roi, 0) / roiRisks.length : 0;

  const doraIncidents = incidents.filter((i) => i.is_dora_reportable);
  const doraReported = doraIncidents.filter((i) => i.dora_reported).length;
  const totalFinancialImpact = incidents.reduce((s, i) => s + i.financial_impact_estimate, 0);
  const top5Risks = [...risks].sort((a, b) => b.fair.ale - a.fair.ale).slice(0, 5);

  const nav = (key) => onNavigate && onNavigate(key);

  const kpiCards = [
    { label: t("Aggregate ALE"), value: fmt$(totalALE), sub: t("Annualised Loss Exp."), icon: faDollarSign, accent: "#d9534f", to: "risks" },
    { label: t("VaR 95th Pct"), value: fmt$(kpis.valueAtRisk_95), sub: t("Monte Carlo"), icon: faArrowTrendUp, accent: "#fd7e14", to: "risks" },
    { label: t("Treatment Budget"), value: fmt$(totalTreatmentBudget), sub: t("Total invested"), icon: faShieldHalved, accent: "#3B82EC", to: "risks" },
    { label: t("DORA Incidents"), value: String(doraIncidents.length), sub: `${doraReported} ${t("reported")}`, icon: faTriangleExclamation, accent: "#f0ad4e", to: "incidents" },
    { label: t("NIS2 Readiness"), value: `${kpis.nis2ReadinessScore}%`, sub: t("Compliance posture"), icon: faCircleCheck, accent: "#4BBF73", to: "compliance" },
    { label: t("Avg Remediation ROI"), value: `${Math.round(avgROI)}%`, sub: t("Risk reduction return"), icon: faChartColumn, accent: "#6f42c1", to: "risks" },
  ];

  return (
    <div className="progrec-page p-4 p-lg-5">
      {/* Page header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: "#101828" }}>{org.name} — {t("Security Posture")}</h5>
          <span style={{ fontSize: "0.82rem", color: "#667085" }}>{org.industry} · {org.size} · {t("Risk Appetite")}: {org.risk_appetite}</span>
        </div>
        <div className="d-flex align-items-center gap-2 px-3 py-2 rounded" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: "0.78rem", color: "#16a34a" }}>
          <span className="live-dot" style={{ background: "#4BBF73" }} />
          {t("Live")} · {t("Updated")} {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* KPI strip */}
      <Row className="g-3 mb-4">
        {kpiCards.map((k) => (
          <Col key={k.label} xs={6} sm={4} xl={2}>
            <Card className="h-100 border-0 shadow-sm" style={{ cursor: "pointer", borderRadius: 10 }} onClick={() => nav(k.to)}>
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 32, height: 32, background: `${k.accent}18` }}>
                    <FontAwesomeIcon icon={k.icon} style={{ fontSize: 15, color: k.accent }} />
                  </div>
                  <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ fontSize: 13, color: "#98a2b3" }} />
                </div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: k.accent, fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
                <div style={{ fontSize: "0.75rem", color: "#344054", fontWeight: 500 }}>{k.label}</div>
                <div style={{ fontSize: "0.7rem", color: "#98a2b3" }}>{k.sub}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Row 2: Score + Trend + Treatment Mix */}
      <Row className="g-3 mb-4">
        <Col xs={12} lg={4}>
          <Card className="h-100 shadow-sm border-0" style={{ borderRadius: 10 }}>
            <Card.Body className="p-4">
              <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#101828" }}>{t("Overall Risk Score")}</div>
              <div style={{ fontSize: "0.75rem", color: "#98a2b3", marginBottom: 16 }}>{t("Composite inherent risk posture")}</div>
              <ScoreGauge score={org.overallRiskScore} />
              <div className="d-flex align-items-center justify-content-center gap-1 mt-1">
                <FontAwesomeIcon icon={faArrowTrendDown} style={{ fontSize: 14, color: "#4BBF73" }} />
                <span style={{ color: "#4BBF73", fontSize: "0.82rem", fontWeight: 600 }}>{Math.abs(org.trend)}% {t("vs last month")}</span>
              </div>
              <Row className="g-2 mt-3">
                {[
                  { l: t("Critical Risks"), v: kpis.criticalRisks, c: "#d9534f" },
                  { l: t("Open Risks"), v: kpis.totalRisks, c: "#fd7e14" },
                  { l: t("Compliance"), v: `${kpis.complianceScore}%`, c: "#4BBF73" },
                  { l: t("Threat Alerts"), v: kpis.threatAlerts, c: "#f0ad4e" },
                ].map((s) => (
                  <Col key={s.l} xs={6}>
                    <div className="text-center rounded p-2" style={{ background: "#f9fafb", border: "1px solid #e4e7ec" }}>
                      <div style={{ fontWeight: 700, fontSize: "1.1rem", color: s.c, fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
                      <div style={{ fontSize: "0.68rem", color: "#98a2b3" }}>{s.l}</div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={4}>
          <Card className="h-100 shadow-sm border-0" style={{ borderRadius: 10 }}>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#101828" }}>{t("Risk Trend (7-Month)")}</div>
                  <div style={{ fontSize: "0.75rem", color: "#98a2b3" }}>{t("Volume by severity level")}</div>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {[["#d9534fcc", "Crit"], ["#fd7e1499", "High"], ["#f0ad4e99", "Med"], ["#3B82EC99", "Low"]].map(([c, l]) => (
                    <span key={l} className="d-flex align-items-center gap-1" style={{ fontSize: "0.68rem", color: "#98a2b3" }}>
                      <span className="rounded-1 d-inline-block" style={{ width: 8, height: 8, background: c }} />{l}
                    </span>
                  ))}
                </div>
              </div>
              <div className="d-flex gap-2" style={{ height: BAR_AREA_H + 36 }}>
                {riskTrend.map((m) => <MiniBar key={m.month} {...m} maxVal={maxTrend} />)}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={4}>
          <Card className="h-100 shadow-sm border-0" style={{ borderRadius: 10 }}>
            <Card.Body className="p-4">
              <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#101828" }}>{t("Risk Treatment Mix")}</div>
              <div style={{ fontSize: "0.75rem", color: "#98a2b3", marginBottom: 16 }}>{t("How risks are being handled")}</div>
              <TreatmentDonut treatmentMix={treatmentMix} />
              <div className="d-flex gap-3 justify-content-center mt-4 pt-3" style={{ borderTop: "1px solid #e4e7ec", textAlign: "center" }}>
                <div>
                  <div style={{ color: "#3B82EC", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt$(totalTreatmentBudget)}</div>
                  <div style={{ fontSize: "0.7rem", color: "#98a2b3" }}>{t("Total Treatment Cost")}</div>
                </div>
                <div>
                  <div style={{ color: "#4BBF73", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{Math.round(avgROI)}%</div>
                  <div style={{ fontSize: "0.7rem", color: "#98a2b3" }}>{t("Avg Remediation ROI")}</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Row 3: Financial/Regulatory tabs + Top Risks */}
      <Row className="g-3 mb-4">
        <Col xs={12} xl={7}>
          <Card className="shadow-sm border-0 h-100" style={{ borderRadius: 10, overflow: "hidden" }}>
            <div style={{ borderBottom: "1px solid #e4e7ec" }}>
              <Nav variant="tabs" className="border-0 px-2 pt-2">
                {["financial", "regulatory"].map((tab) => (
                  <Nav.Item key={tab}>
                    <Nav.Link
                      active={activeTab === tab}
                      onClick={() => setActiveTab(tab)}
                      style={{ fontSize: "0.82rem", fontFamily: "Poppins,sans-serif", cursor: "pointer", color: activeTab === tab ? "#3B82EC" : "#667085" }}
                    >
                      {tab === "financial" ? t("Financial Risk (FAIR / VaR)") : t("DORA / NIS2 Readiness")}
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>
            </div>

            {activeTab === "financial" ? (
              <Card.Body className="p-4">
                <Row className="g-2 mb-4">
                  {[
                    { l: t("Aggregate ALE"), v: fmt$(totalALE), c: "#d9534f", sub: t("Expected annual loss") },
                    { l: t("VaR 90th Pct"), v: fmt$(kpis.valueAtRisk_90), c: "#fd7e14", sub: t("Monte Carlo") },
                    { l: t("VaR 95th Pct"), v: fmt$(kpis.valueAtRisk_95), c: "#d9534f", sub: t("Monte Carlo") },
                  ].map((s) => (
                    <Col key={s.l} xs={4}>
                      <div className="text-center p-3 rounded" style={{ background: "#f9fafb", border: "1px solid #e4e7ec" }}>
                        <div style={{ fontSize: "1.1rem", fontWeight: 700, color: s.c, fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
                        <div style={{ fontSize: "0.72rem", color: "#344054" }}>{s.l}</div>
                        <div style={{ fontSize: "0.68rem", color: "#98a2b3" }}>{s.sub}</div>
                      </div>
                    </Col>
                  ))}
                </Row>
                <div style={{ fontSize: "0.7rem", color: "#98a2b3", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                  {t("Value at Risk — Monte Carlo Percentiles")} ({monteCarlo.simulations.toLocaleString()} {t("simulations")})
                </div>
                <VaRBar monteCarlo={monteCarlo} />
                <div className="d-flex flex-wrap gap-3 mt-3 p-3 rounded" style={{ background: "#f9fafb", border: "1px solid #e4e7ec", fontSize: "0.78rem", color: "#98a2b3" }}>
                  <span>{t("Mean Loss")}: <strong style={{ color: "#344054" }}>{fmt$(monteCarlo.mean_loss)}</strong></span>
                  <span>{t("Std Dev")}: <strong style={{ color: "#344054" }}>{fmt$(monteCarlo.std_dev)}</strong></span>
                  <span>{t("Incident Impact")}: <strong style={{ color: "#d9534f" }}>{fmt$(totalFinancialImpact)}</strong></span>
                </div>
              </Card.Body>
            ) : (
              <Card.Body className="p-4">
                {/* DORA */}
                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#101828" }}>{t("DORA — Digital Operational Resilience Act")}</div>
                    <Badge bg={regulatory.dora.readiness >= 80 ? "success" : regulatory.dora.readiness >= 60 ? "warning" : "danger"} style={{ fontSize: "0.72rem" }}>
                      {regulatory.dora.readiness}% {t("Ready")}
                    </Badge>
                  </div>
                  <Row className="g-2 mb-3">
                    {[
                      { l: t("ICT Incidents YTD"), v: regulatory.dora.incidents_ytd, c: "#f0ad4e" },
                      { l: t("Reported"), v: regulatory.dora.incidents_reported, c: "#4BBF73" },
                      { l: t("Pending"), v: regulatory.dora.incidents_pending, c: "#d9534f" },
                      { l: t("3rd Party ICT"), v: regulatory.dora.third_party_ict_risks, c: "#fd7e14" },
                    ].map((s) => (
                      <Col key={s.l} xs={3}>
                        <div className="text-center p-2 rounded" style={{ background: "#f9fafb", border: "1px solid #e4e7ec" }}>
                          <div style={{ fontWeight: 700, color: s.c, fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
                          <div style={{ fontSize: "0.66rem", color: "#98a2b3", lineHeight: 1.2 }}>{s.l}</div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                  <Row className="g-2">
                    {[
                      { l: t("RTO: Target vs Actual"), target: `${regulatory.dora.rto_target_hours}h`, actual: `${regulatory.dora.rto_actual_hours}h`, ok: regulatory.dora.rto_actual_hours <= regulatory.dora.rto_target_hours },
                      { l: t("RPO: Target vs Actual"), target: `${regulatory.dora.rpo_target_hours}h`, actual: `${regulatory.dora.rpo_actual_hours}h`, ok: regulatory.dora.rpo_actual_hours <= regulatory.dora.rpo_target_hours },
                    ].map((s) => (
                      <Col key={s.l} xs={6}>
                        <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ background: s.ok ? "#f0fdf4" : "#fff5f5", border: `1px solid ${s.ok ? "#bbf7d0" : "#fecaca"}`, fontSize: "0.75rem" }}>
                          <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 12, color: s.ok ? "#4BBF73" : "#d9534f" }} />
                          <span style={{ color: "#667085" }}>{s.l}:</span>
                          <span style={{ color: "#344054", fontWeight: 500 }}>{s.target}</span>
                          <span style={{ color: "#98a2b3" }}>/</span>
                          <span style={{ color: s.ok ? "#4BBF73" : "#d9534f", fontWeight: 500 }}>{s.actual}</span>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>

                {/* NIS2 */}
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#101828" }}>{t("NIS2 — Network & Information Security Directive")}</div>
                    <Badge bg="warning" text="dark" style={{ fontSize: "0.72rem" }}>{regulatory.nis2.readiness}% {t("Ready")}</Badge>
                  </div>
                  <div className="d-flex flex-column gap-2">
                    {[
                      { l: t("Governance & Board Oversight"), s: regulatory.nis2.governance_score, c: "#3B82EC" },
                      { l: t("Technical Security Measures"), s: regulatory.nis2.technical_measures_score, c: "#6f42c1" },
                      { l: t("Business Continuity"), s: regulatory.nis2.business_continuity_score, c: "#f0ad4e" },
                      { l: t("Incident Handling"), s: regulatory.nis2.incident_handling_score, c: "#4BBF73" },
                      { l: t("Supply Chain Security"), s: regulatory.nis2.supply_chain_score, c: "#d9534f" },
                      { l: t("Cryptography & Encryption"), s: regulatory.nis2.cryptography_score, c: "#3B82EC" },
                    ].map((row) => <ReadinessBar key={row.l} label={row.l} score={row.s} color={row.c} />)}
                  </div>
                </div>
              </Card.Body>
            )}
          </Card>
        </Col>

        <Col xs={12} xl={5}>
          <Card className="shadow-sm border-0 h-100" style={{ borderRadius: 10, overflow: "hidden" }}>
            <Card.Header className="bg-white d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: "1px solid #e4e7ec" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#101828" }}>{t("Top Financial Risks")}</div>
                <div style={{ fontSize: "0.72rem", color: "#98a2b3" }}>{t("Ranked by ALE (FAIR model)")}</div>
              </div>
              <button className="btn btn-sm btn-outline-primary" style={{ fontSize: "0.75rem" }} onClick={() => nav("risks")}>{t("View all")}</button>
            </Card.Header>
            <div>
              {top5Risks.map((r, i) => (
                <div key={r.id} className="px-4 py-3 d-flex align-items-start gap-3" style={{ borderBottom: "1px solid #f4f7f9" }}>
                  <span className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 22, height: 22, background: "#f4f7f9", border: "1px solid #e4e7ec", color: "#667085", fontSize: "0.72rem", fontWeight: 700, marginTop: 2 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 500, color: "#344054", lineHeight: 1.3 }}>{r.title}</div>
                    <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                      <span style={{ color: "#d9534f", fontSize: "0.78rem", fontWeight: 600 }}>{fmt$(r.fair.ale)}</span>
                      <span style={{ color: "#98a2b3", fontSize: "0.72rem" }}>ALE</span>
                      <span style={{ color: "#4BBF73", fontSize: "0.72rem" }}>{r.remediation_roi}% ROI</span>
                    </div>
                    <div className="d-flex gap-1 mt-1 flex-wrap">
                      {r.framework_tags.slice(0, 3).map((f) => (
                        <span key={f} style={{ fontSize: "0.65rem", padding: "1px 6px", background: "#f4f7f9", border: "1px solid #e4e7ec", borderRadius: 4, color: "#667085" }}>{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Row 4: Compliance + Incidents */}
      <Row className="g-3">
        <Col xs={12} xl={6}>
          <Card className="shadow-sm border-0" style={{ borderRadius: 10 }}>
            <Card.Header className="bg-white d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: "1px solid #e4e7ec" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#101828" }}>{t("Framework Compliance")}</div>
                <div style={{ fontSize: "0.72rem", color: "#98a2b3" }}>{t("Active regulatory & security frameworks")}</div>
              </div>
              <button className="btn btn-sm btn-outline-primary" style={{ fontSize: "0.75rem" }} onClick={() => nav("compliance")}>{t("Manage")}</button>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="d-flex flex-column gap-2">
                {frameworks.map((fw) => (
                  <div key={fw.id} className="d-flex align-items-center gap-3">
                    <span style={{ width: 80, fontSize: "0.78rem", color: "#667085", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>{fw.name}</span>
                    <div style={{ flex: 1, height: 10, background: "#f0f0f0", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 999, width: `${fw.score}%`, background: fw.score >= 80 ? "#4BBF73" : fw.score >= 65 ? "#f0ad4e" : "#d9534f", transition: "width 0.8s ease" }} />
                    </div>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, width: 36, textAlign: "right", color: fw.score >= 80 ? "#4BBF73" : fw.score >= 65 ? "#f0ad4e" : "#d9534f" }}>{fw.score}%</span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} xl={6}>
          <Card className="shadow-sm border-0" style={{ borderRadius: 10 }}>
            <Card.Header className="bg-white d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: "1px solid #e4e7ec" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#101828" }}>{t("Recent Incidents")}</div>
                <div style={{ fontSize: "0.72rem", color: "#98a2b3" }}>{t("Financial impact & DORA reportability")}</div>
              </div>
              <button className="btn btn-sm btn-outline-primary" style={{ fontSize: "0.75rem" }} onClick={() => nav("incidents")}>{t("View all")}</button>
            </Card.Header>
            <div>
              {incidents.slice(0, 5).map((inc) => (
                <div key={inc.id} className="d-flex align-items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid #f4f7f9" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 500, color: "#344054", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inc.title}</div>
                    <div className="d-flex gap-2 mt-1">
                      <span style={{ fontSize: "0.7rem", color: "#98a2b3" }}>{inc.type}</span>
                      {inc.is_dora_reportable && <span style={{ fontSize: "0.7rem", color: "#6f42c1", background: "#f3e8ff", borderRadius: 4, padding: "1px 6px" }}>DORA</span>}
                    </div>
                  </div>
                  <div className="text-end flex-shrink-0">
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#d9534f" }}>{fmt$(inc.financial_impact_estimate)}</div>
                    <Badge bg={inc.priority === "P1" ? "danger" : inc.priority === "P2" ? "warning" : "secondary"} style={{ fontSize: "0.65rem" }}>{inc.priority}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
