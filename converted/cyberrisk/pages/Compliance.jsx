import React, { useState, useEffect, useCallback } from "react";
import { Card, Row, Col, Badge } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleXmark,
  faCircleMinus,
  faArrowsRotate,
  faChevronRight,
  faCalendar,
  faUser,
  faClock,
  faTriangleExclamation,
  faCirclePlay,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import axios from "src/utils/AxiosInstance";

import RunAssessmentForm from "src/modules/cyberrisk/forms/RunAssessmentForm";
import AssessmentReviewPanel from "src/modules/cyberrisk/forms/AssessmentReviewPanel";

// ===================== MOCK FALLBACK (remove once backend is live) =====================
// Copied from the original threat-dashboard compliance data so the page renders before the
// real `/cyberrisk/compliance` endpoint exists. Delete this block (and the fallback
// initial-state assignments below) once the endpoint returns data.
const MOCK_FRAMEWORKS = [
  { id: "fw-nist-csf", name: "NIST CSF 2.0", version: "2.0", category: "Security", score: 82, controls_total: 106, controls_compliant: 78, controls_partial: 19, controls_noncompliant: 9 },
  { id: "fw-iso-27001", name: "ISO 27001", version: "2022", category: "Security", score: 74, controls_total: 93, controls_compliant: 61, controls_partial: 20, controls_noncompliant: 12 },
  { id: "fw-soc2", name: "SOC 2 Type II", version: "2017 TSC", category: "Industry", score: 88, controls_total: 64, controls_compliant: 55, controls_partial: 7, controls_noncompliant: 2 },
  { id: "fw-pci-dss", name: "PCI DSS", version: "4.0", category: "Industry", score: 71, controls_total: 78, controls_compliant: 50, controls_partial: 18, controls_noncompliant: 10 },
  { id: "fw-gdpr", name: "GDPR", version: "2016/679", category: "Privacy", score: 79, controls_total: 47, controls_compliant: 34, controls_partial: 9, controls_noncompliant: 4 },
  { id: "fw-hipaa", name: "HIPAA Security Rule", version: "2013", category: "Regional", score: 65, controls_total: 54, controls_compliant: 32, controls_partial: 14, controls_noncompliant: 8 },
];

const MOCK_ASSESSMENTS = {
  "fw-nist-csf": [
    { id: "as-nist-1", framework_id: "fw-nist-csf", status: "completed", overall_score: 82, assessed_by: "Alice Chen", started_at: "2026-03-01T09:00:00Z", completed_at: "2026-03-03T16:30:00Z", notes: "Annual audit Q1 2026" },
    { id: "as-nist-2", framework_id: "fw-nist-csf", status: "completed", overall_score: 77, assessed_by: "CISO Office", started_at: "2025-09-12T09:00:00Z", completed_at: "2025-09-14T11:00:00Z", notes: "Semi-annual review" },
    { id: "as-nist-3", framework_id: "fw-nist-csf", status: "in_progress", overall_score: null, assessed_by: "GRC Analyst", started_at: "2026-05-20T14:00:00Z", completed_at: null, notes: null },
  ],
  "fw-iso-27001": [
    { id: "as-iso-1", framework_id: "fw-iso-27001", status: "completed", overall_score: 74, assessed_by: "Bob Martinez", started_at: "2026-02-10T09:00:00Z", completed_at: "2026-02-12T15:00:00Z", notes: "ISO recertification prep" },
    { id: "as-iso-2", framework_id: "fw-iso-27001", status: "completed", overall_score: 69, assessed_by: "External Auditor", started_at: "2025-08-05T09:00:00Z", completed_at: "2025-08-07T17:00:00Z", notes: null },
  ],
  "fw-soc2": [
    { id: "as-soc2-1", framework_id: "fw-soc2", status: "completed", overall_score: 88, assessed_by: "Compliance Team", started_at: "2026-04-01T09:00:00Z", completed_at: "2026-04-02T12:00:00Z", notes: "Type II window close" },
  ],
  "fw-pci-dss": [
    { id: "as-pci-1", framework_id: "fw-pci-dss", status: "completed", overall_score: 71, assessed_by: "SecOps Team", started_at: "2026-01-15T09:00:00Z", completed_at: "2026-01-18T16:00:00Z", notes: "PCI DSS 4.0 gap analysis" },
    { id: "as-pci-2", framework_id: "fw-pci-dss", status: "cancelled", overall_score: null, assessed_by: "GRC Analyst", started_at: "2025-11-01T09:00:00Z", completed_at: null, notes: "Superseded by 4.0 scope" },
  ],
  "fw-gdpr": [
    { id: "as-gdpr-1", framework_id: "fw-gdpr", status: "completed", overall_score: 79, assessed_by: "Grace Kim", started_at: "2026-03-20T09:00:00Z", completed_at: "2026-03-21T14:00:00Z", notes: "DPIA refresh" },
  ],
  "fw-hipaa": [],
};
// ======================================================================================

// ===================== CCM ENGINE (ported from lib/ccmEngine.ts) =====================
// Continuous Control Monitoring scoring + localStorage persistence, inlined as plain
// helpers because the staging module only has pages/forms/reports/charts folders.
const ccmStorageKey = (controlId, frameworkId) => `ccm_${frameworkId}_${controlId}`;

async function fetchCCMData(controlId, frameworkId) {
  const raw = localStorage.getItem(ccmStorageKey(controlId, frameworkId));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

async function fetchAllCCMData(controlIds, frameworkId) {
  const result = {};
  for (const id of controlIds) {
    const d = await fetchCCMData(id, frameworkId);
    if (d) result[id] = d;
  }
  return result;
}

async function saveCCMData(data) {
  localStorage.setItem(ccmStorageKey(data.control_id, data.framework_id), JSON.stringify(data));
}

const MOCK_TEST_RESULTS = ["pass", "partial", "fail", "not_tested"];
const MOCK_EVIDENCE_STATUSES = ["collected", "partial", "expired", "missing"];
const MOCK_FREQS = ["continuous", "daily", "weekly", "monthly", "quarterly"];
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

function seedMockCCMData(controlIds, frameworkId) {
  for (const id of controlIds) {
    const key = ccmStorageKey(id, frameworkId);
    if (localStorage.getItem(key)) continue;
    const data = {
      control_id: id,
      framework_id: frameworkId,
      test_result: randomItem(MOCK_TEST_RESULTS),
      evidence_status: randomItem(MOCK_EVIDENCE_STATUSES),
      monitoring_freq: randomItem(MOCK_FREQS),
      last_tested_date: Math.random() > 0.3 ? daysAgo(Math.floor(Math.random() * 365)) : null,
      tested_by: "System",
      notes: "",
    };
    localStorage.setItem(key, JSON.stringify(data));
  }
}

const TEST_SCORES = { pass: 100, partial: 55, fail: 0, not_tested: 30 };
const EVIDENCE_SCORES = { collected: 100, partial: 60, expired: 20, missing: 0 };
const FREQ_SCORES = { continuous: 100, daily: 90, weekly: 80, monthly: 70, quarterly: 55, annual: 35, ad_hoc: 20 };

function recencyPenalty(lastTestedDate) {
  if (!lastTestedDate) return 20;
  const days = (Date.now() - new Date(lastTestedDate).getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 30) return 0;
  if (days <= 90) return 5;
  if (days <= 180) return 10;
  if (days <= 365) return 15;
  return 20;
}

function calculateCCMScore(data) {
  const test_component = TEST_SCORES[data.test_result] ?? 30;
  const evidence_component = EVIDENCE_SCORES[data.evidence_status] ?? 0;
  const monitoring_component = FREQ_SCORES[data.monitoring_freq] ?? 20;
  const recency = recencyPenalty(data.last_tested_date);
  const raw = test_component * 0.4 + evidence_component * 0.35 + monitoring_component * 0.25;
  const score = Math.max(0, Math.min(100, Math.round(raw - recency)));
  let status;
  if (score >= 80) status = "compliant";
  else if (score >= 45) status = "partial";
  else if (data.test_result === "not_tested" && data.evidence_status === "missing") status = "not_applicable";
  else status = "noncompliant";
  const breakdown =
    `Test: ${test_component} · Evidence: ${evidence_component} · Monitoring: ${monitoring_component}` +
    (recency > 0 ? ` · Recency penalty: -${recency}` : "") +
    ` → Score: ${score}`;
  return { score, status, test_component, evidence_component, monitoring_component, recency_penalty: recency, breakdown, data_source: "ccm" };
}
// ====================================================================================

// Inline severity-variant helper (instead of importing a shared SeverityBadge).
const sevVariant = (s) =>
  ({ Critical: "danger", High: "warning", Medium: "info", Low: "secondary", Informational: "light" }[s] || "secondary");

function ScoreRing({ score, size = 72 }) {
  const r = size / 2 - 7;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? "#4BBF73" : score >= 60 ? "#f0ad4e" : "#d9534f";
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e9ecef" strokeWidth="6" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize="13"
        fontWeight="bold"
        fontFamily="Poppins,sans-serif"
      >
        {score}%
      </text>
    </svg>
  );
}

function ControlBar({ compliant, partial, noncompliant }) {
  const total = compliant + partial + noncompliant;
  if (total === 0) return <div style={{ height: 6, background: "#e9ecef", borderRadius: 999 }} />;
  return (
    <div style={{ display: "flex", borderRadius: 999, overflow: "hidden", height: 6, gap: 1 }}>
      {compliant > 0 && <div style={{ background: "#4BBF73", width: `${(compliant / total) * 100}%`, transition: "width 0.8s" }} />}
      {partial > 0 && <div style={{ background: "#f0ad4e", width: `${(partial / total) * 100}%`, transition: "width 0.8s" }} />}
      {noncompliant > 0 && <div style={{ background: "#d9534f", width: `${(noncompliant / total) * 100}%`, transition: "width 0.8s" }} />}
    </div>
  );
}

const categoryStyle = (cat) => {
  if (cat === "Security") return { bg: "#eff6ff", color: "#3B82EC", border: "#bfdbfe" };
  if (cat === "Privacy") return { bg: "#f0fdf4", color: "#4BBF73", border: "#bbf7d0" };
  if (cat === "Industry") return { bg: "#fffbeb", color: "#f0ad4e", border: "#fde68a" };
  return { bg: "#f9fafb", color: "#6c757d", border: "#e4e7ec" };
};

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  );
}

function statusChipStyle(s) {
  if (s === "completed") return { bg: "#f0fdf4", color: "#4BBF73", border: "#bbf7d0" };
  if (s === "in_progress") return { bg: "#fffbeb", color: "#f0ad4e", border: "#fde68a" };
  return { bg: "#f9fafb", color: "#98a2b3", border: "#e4e7ec" };
}

const Compliance = ({ year, currentUserInfo, refreshCharts, onNavigate }) => {
  const { t } = useTranslation("common");

  // Hybrid data — mock fallback as initial state, axios overrides on success.
  const [frameworks, setFrameworks] = useState(MOCK_FRAMEWORKS);
  const [loadingFw, setLoadingFw] = useState(false);
  const [fwError, setFwError] = useState(null);
  const [selectedFwId, setSelectedFwId] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loadingAss, setLoadingAss] = useState(false);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [preselectedId, setPreselectedId] = useState(undefined);
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const loadFrameworks = useCallback(() => {
    const logInId = currentUserInfo?.logInId;
    setLoadingFw(true);
    setFwError(null);
    // HYBRID: real backend call — replaces the mock fallback above on success.
    axios
      .get(`/cyberrisk/compliance/${logInId}?year=${Number(year)}`)
      .then((res) => {
        const d = res?.data || {};
        if (Array.isArray(d.frameworks) && d.frameworks.length) setFrameworks(d.frameworks);
        else if (Array.isArray(d) && d.length) setFrameworks(d);
      })
      .catch((err) => {
        // Falls back to MOCK_FRAMEWORKS so the page renders during validation.
        console.warn("[cyberrisk] compliance: using mock fallback", err);
      })
      .finally(() => setLoadingFw(false));
  }, [year, currentUserInfo]);

  useEffect(() => {
    loadFrameworks();
  }, [loadFrameworks, refreshCharts]);

  const loadAssessments = useCallback(
    (fwId) => {
      const logInId = currentUserInfo?.logInId;
      setLoadingAss(true);
      axios
        .get(`/cyberrisk/compliance/${logInId}/assessments/${fwId}?year=${Number(year)}`)
        .then((res) => {
          if (Array.isArray(res?.data) && res.data.length) setAssessments(res.data);
          else setAssessments(MOCK_ASSESSMENTS[fwId] || []);
        })
        .catch((err) => {
          console.warn("[cyberrisk] compliance: using mock fallback", err);
          setAssessments(MOCK_ASSESSMENTS[fwId] || []);
        })
        .finally(() => setLoadingAss(false));
    },
    [year, currentUserInfo],
  );

  const handleFrameworkClick = (fw) => {
    if (selectedFwId === fw.id) {
      setSelectedFwId(null);
      setAssessments([]);
    } else {
      setSelectedFwId(fw.id);
      loadAssessments(fw.id);
    }
  };

  const handleRunAssessment = (preId) => {
    setPreselectedId(preId);
    setRunModalOpen(true);
  };

  const handleStartAssessment = async (form) => {
    let assessmentId = `local-${Date.now()}`;
    try {
      const res = await axios.post(`/cyberrisk/compliance/assessments`, form);
      if (res?.data?.id) assessmentId = res.data.id;
    } catch (err) {
      console.warn("[cyberrisk] compliance: using mock fallback", err);
    }
    const fw = frameworks.find((f) => f.id === form.framework_id);
    setRunModalOpen(false);
    setActiveAssessment({
      id: assessmentId,
      frameworkName: fw?.name ?? t("Unknown"),
      frameworkId: form.framework_id,
      assessedBy: form.assessed_by,
    });
  };

  const handleAssessmentComplete = async (score) => {
    setActiveAssessment(null);
    showToast(`${t("Assessment completed! Overall score")}: ${score}%`);
    loadFrameworks();
    if (selectedFwId) loadAssessments(selectedFwId);
  };

  const selectedFw = frameworks.find((f) => f.id === selectedFwId);
  const avgScore = frameworks.length > 0 ? Math.round(frameworks.reduce((s, f) => s + f.score, 0) / frameworks.length) : 0;
  const totalControls = frameworks.reduce((s, f) => s + f.controls_total, 0);
  const totalCompliant = frameworks.reduce((s, f) => s + f.controls_compliant, 0);

  return (
    <div className="progrec-page p-4 p-lg-5">
      {toast && (
        <div className={`pg-toast ${toast.ok ? "" : "pg-toast-warning"}`}>
          {toast.ok ? (
            <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 14 }} />
          ) : (
            <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: 14 }} />
          )}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: "#101828" }}>{t("Compliance Management")}</h5>
          <span style={{ fontSize: "0.82rem", color: "#667085" }}>
            {frameworks.length} {t("frameworks")} · {totalControls} {t("controls")} · {t("Average")} {avgScore}% {t("compliant")}
          </span>
        </div>
        <div className="d-flex gap-2">
          <button onClick={loadFrameworks} disabled={loadingFw} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2">
            <FontAwesomeIcon icon={faArrowsRotate} style={{ fontSize: 14 }} className={loadingFw ? "spin" : ""} /> {t("Refresh")}
          </button>
          <button onClick={() => handleRunAssessment()} className="btn btn-sm btn-primary d-flex align-items-center gap-2">
            <FontAwesomeIcon icon={faCirclePlay} style={{ fontSize: 14 }} /> {t("Run Assessment")}
          </button>
        </div>
      </div>

      {/* Error */}
      {fwError && (
        <div className="d-flex align-items-center gap-2 mb-4 p-3 rounded" style={{ background: "#fff5f5", border: "1px solid #fecaca", color: "#d9534f", fontSize: "0.82rem" }}>
          <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: 15 }} /> {fwError}
        </div>
      )}

      {/* Summary KPIs */}
      {!loadingFw && frameworks.length > 0 && (
        <Row className="g-3 mb-4">
          {[
            { label: t("Avg Compliance"), value: `${avgScore}%`, accent: "#3B82EC", cls: "stat-card-primary" },
            { label: t("Controls Compliant"), value: `${totalCompliant}/${totalControls}`, accent: "#4BBF73", cls: "stat-card-success" },
            { label: t("Frameworks Active"), value: String(frameworks.length), accent: "#667085", cls: "" },
          ].map((s) => (
            <Col key={s.label} xs={4}>
              <Card className={`border shadow-sm h-100 ${s.cls}`} style={{ borderRadius: 10 }}>
                <Card.Body className="p-3">
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: s.accent, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                  <div style={{ fontSize: "0.78rem", color: "#667085" }}>{s.label}</div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Loading skeleton */}
      {loadingFw && (
        <Row className="g-3 mb-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Col key={i} xs={12} md={6} xl={4}>
              <div className="rounded p-4" style={{ background: "#f9fafb", border: "1px solid #e4e7ec", height: 140 }} />
            </Col>
          ))}
        </Row>
      )}

      {/* Framework cards */}
      {!loadingFw && frameworks.length > 0 && (
        <Row className="g-3 mb-4">
          {frameworks.map((fw) => {
            const active = selectedFwId === fw.id;
            const cs = categoryStyle(fw.category);
            return (
              <Col key={fw.id} xs={12} md={6} xl={4}>
                <Card
                  className="h-100 shadow-sm"
                  style={{
                    borderRadius: 10,
                    border: active ? "2px solid #3B82EC" : "1px solid #e4e7ec",
                    background: active ? "#f8faff" : "#fff",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <button className="border-0 bg-transparent w-100 text-start p-4" onClick={() => handleFrameworkClick(fw)}>
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <ScoreRing score={fw.score} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                          <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "#101828" }}>{fw.name}</span>
                          <span style={{ fontSize: "0.68rem", padding: "2px 7px", borderRadius: 6, background: cs.bg, color: cs.color, border: `1px solid ${cs.border}` }}>{t(fw.category)}</span>
                        </div>
                        <span style={{ fontSize: "0.72rem", color: "#98a2b3" }}>v{fw.version} · {fw.controls_total} {t("controls")}</span>
                        <FontAwesomeIcon
                          icon={faChevronRight}
                          style={{ fontSize: 13, color: active ? "#3B82EC" : "#98a2b3", display: "block", marginTop: 4, transform: active ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}
                        />
                      </div>
                    </div>
                    <ControlBar compliant={fw.controls_compliant} partial={fw.controls_partial} noncompliant={fw.controls_noncompliant} />
                    <div className="d-flex justify-content-between mt-2" style={{ fontSize: "0.72rem" }}>
                      <span className="d-flex align-items-center gap-1" style={{ color: "#4BBF73" }}><FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 11 }} /> {fw.controls_compliant}</span>
                      <span className="d-flex align-items-center gap-1" style={{ color: "#f0ad4e" }}><FontAwesomeIcon icon={faCircleMinus} style={{ fontSize: 11 }} /> {fw.controls_partial}</span>
                      <span className="d-flex align-items-center gap-1" style={{ color: "#d9534f" }}><FontAwesomeIcon icon={faCircleXmark} style={{ fontSize: 11 }} /> {fw.controls_noncompliant}</span>
                    </div>
                  </button>
                  <div className="px-4 pb-4">
                    <button onClick={() => handleRunAssessment(fw.id)} className="btn btn-sm btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2" style={{ fontSize: "0.75rem" }}>
                      <FontAwesomeIcon icon={faCirclePlay} style={{ fontSize: 12 }} /> {t("Run Assessment")}
                    </button>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Assessment history */}
      {selectedFwId && selectedFw && (
        <Card className="shadow-sm border-0" style={{ borderRadius: 10, overflow: "hidden" }}>
          <Card.Header className="bg-white d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: "1px solid #e4e7ec" }}>
            <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#101828" }}>{selectedFw.name} — {t("Assessment History")}</div>
            <button onClick={() => handleRunAssessment(selectedFwId)} className="btn btn-sm btn-primary d-flex align-items-center gap-2">
              <FontAwesomeIcon icon={faCirclePlay} style={{ fontSize: 12 }} /> {t("New Assessment")}
            </button>
          </Card.Header>

          {loadingAss ? (
            <div className="py-5 text-center"><FontAwesomeIcon icon={faArrowsRotate} style={{ fontSize: 20, color: "#3B82EC" }} className="spin" /></div>
          ) : assessments.length === 0 ? (
            <div className="py-5 text-center">
              <div style={{ color: "#98a2b3", fontSize: "0.88rem", fontWeight: 500 }}>{t("No assessments yet for")} {selectedFw.name}</div>
              <div style={{ color: "#b0b8c4", fontSize: "0.78rem", marginTop: 4 }}>{t("Run your first assessment to track posture over time")}</div>
            </div>
          ) : (
            <div>
              {assessments.map((a) => {
                const scs = statusChipStyle(a.status);
                return (
                  <div key={a.id} className="d-flex align-items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid #f4f7f9" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                        <span style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: 20, background: scs.bg, color: scs.color, border: `1px solid ${scs.border}`, fontWeight: 500 }}>
                          {a.status === "in_progress" ? t("In Progress") : a.status === "completed" ? t("Completed") : t("Cancelled")}
                        </span>
                        {a.notes && <span style={{ color: "#667085", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280 }}>{a.notes}</span>}
                      </div>
                      <div className="d-flex align-items-center flex-wrap gap-3" style={{ fontSize: "0.75rem", color: "#98a2b3" }}>
                        <span className="d-flex align-items-center gap-1"><FontAwesomeIcon icon={faUser} style={{ fontSize: 11 }} /> {a.assessed_by}</span>
                        <span className="d-flex align-items-center gap-1"><FontAwesomeIcon icon={faCalendar} style={{ fontSize: 11 }} /> {fmtDate(a.started_at)}</span>
                        {a.completed_at && <span className="d-flex align-items-center gap-1"><FontAwesomeIcon icon={faClock} style={{ fontSize: 11 }} /> {fmtTime(a.completed_at)}</span>}
                      </div>
                    </div>
                    <div className="text-end flex-shrink-0">
                      {a.overall_score != null ? (
                        <div>
                          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: a.overall_score >= 80 ? "#4BBF73" : a.overall_score >= 60 ? "#f0ad4e" : "#d9534f", fontVariantNumeric: "tabular-nums" }}>{a.overall_score}%</div>
                          <div style={{ fontSize: "0.68rem", color: "#98a2b3" }}>{t("overall")}</div>
                        </div>
                      ) : (
                        <span style={{ color: "#98a2b3", fontSize: "0.78rem" }}>{t("pending")}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      <RunAssessmentForm
        show={runModalOpen}
        onHide={() => setRunModalOpen(false)}
        frameworks={frameworks}
        preselectedId={preselectedId}
        onStart={handleStartAssessment}
      />

      {activeAssessment && (
        <AssessmentReviewPanel
          assessmentId={activeAssessment.id}
          frameworkName={activeAssessment.frameworkName}
          frameworkId={activeAssessment.frameworkId}
          assessedBy={activeAssessment.assessedBy}
          onClose={() => setActiveAssessment(null)}
          onComplete={handleAssessmentComplete}
        />
      )}
    </div>
  );
};

export default Compliance;
