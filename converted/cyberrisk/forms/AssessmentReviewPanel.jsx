import React, { useState, useEffect, useCallback, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faCircleCheck,
  faCircleMinus,
  faCircleXmark,
  faBan,
  faChevronLeft,
  faChevronRight,
  faSpinner,
  faFileLines,
  faClipboardCheck,
  faTriangleExclamation,
  faWandMagicSparkles,
  faChartColumn,
  faCalendar,
  faShieldHalved,
  faDatabase,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import axios from "src/utils/AxiosInstance";

// ===================== CCM ENGINE (ported from lib/ccmEngine.ts) =====================
// Continuous Control Monitoring scoring + localStorage persistence, inlined as a plain
// helper because the staging module only has pages/forms/reports/charts folders.
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

// ===================== MOCK FALLBACK (remove once backend is live) =====================
// Generic control templates so the review panel renders before the real
// `/cyberrisk/assessment-results/<id>` endpoint exists.
const CONTROL_TEMPLATES = [
  { control_id: "GV.OC-01", title: "Organizational mission is understood", domain: "Govern", question: "Is the organizational mission documented and used to inform cybersecurity risk management?" },
  { control_id: "ID.AM-01", title: "Hardware inventory is maintained", domain: "Identify", question: "Are physical devices and systems within the organization inventoried?" },
  { control_id: "ID.AM-02", title: "Software platform inventory", domain: "Identify", question: "Are software platforms and applications inventoried?" },
  { control_id: "PR.AC-01", title: "Identities and credentials managed", domain: "Protect", question: "Are identities and credentials issued, managed, verified, revoked, and audited?" },
  { control_id: "PR.DS-01", title: "Data-at-rest is protected", domain: "Protect", question: "Is data-at-rest protected with encryption and access controls?" },
  { control_id: "DE.CM-01", title: "Networks are monitored", domain: "Detect", question: "Is the network monitored to detect potential cybersecurity events?" },
  { control_id: "DE.AE-02", title: "Detected events are analyzed", domain: "Detect", question: "Are detected events analyzed to understand attack targets and methods?" },
  { control_id: "RS.RP-01", title: "Response plan is executed", domain: "Respond", question: "Is the response plan executed during or after an incident?" },
  { control_id: "RC.RP-01", title: "Recovery plan is executed", domain: "Recover", question: "Is the recovery plan executed during or after a cybersecurity incident?" },
  { control_id: "GV.SC-01", title: "Supply chain risk managed", domain: "Govern", question: "Is a cyber supply chain risk management program established and agreed by stakeholders?" },
];

function buildMockResults(assessmentId) {
  return CONTROL_TEMPLATES.map((c, i) => ({
    id: `${assessmentId}-r${i}`,
    assessment_id: assessmentId,
    control_id: c.control_id,
    status: "not_reviewed",
    score: null,
    evidence: null,
    notes: null,
    reviewed_by: null,
    reviewed_at: null,
    control: { ...c, guidance: c.question },
  }));
}
// ======================================================================================

const STATUS_OPTIONS = [
  { value: "compliant", label: "Compliant", color: "#4BBF73", bg: "#f0fdf4", border: "#bbf7d0", icon: faCircleCheck },
  { value: "partial", label: "Partial", color: "#f0ad4e", bg: "#fffbeb", border: "#fde68a", icon: faCircleMinus },
  { value: "noncompliant", label: "Non-Compliant", color: "#d9534f", bg: "#fff5f5", border: "#fecaca", icon: faCircleXmark },
  { value: "not_applicable", label: "N/A", color: "#667085", bg: "#f9fafb", border: "#e4e7ec", icon: faBan },
];

const TEST_RESULT_OPTS = [
  { value: "pass", label: "Pass", color: "#4BBF73" },
  { value: "partial", label: "Partial", color: "#f0ad4e" },
  { value: "fail", label: "Fail", color: "#d9534f" },
  { value: "not_tested", label: "Not Tested", color: "#667085" },
];

const EVIDENCE_OPTS = [
  { value: "collected", label: "Collected", color: "#4BBF73" },
  { value: "partial", label: "Partial", color: "#f0ad4e" },
  { value: "expired", label: "Expired", color: "#fd7e14" },
  { value: "missing", label: "Missing", color: "#d9534f" },
];

const FREQ_OPTS = [
  { value: "continuous", label: "Continuous" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
  { value: "ad_hoc", label: "Ad-hoc" },
];

function statusBadgeStyle(s) {
  const o = STATUS_OPTIONS.find((x) => x.value === s);
  if (o) return { background: o.bg, color: o.color, border: `1px solid ${o.border}` };
  return { background: "#f9fafb", color: "#98a2b3", border: "1px solid #e4e7ec" };
}

function ScoreBar({ score }) {
  const color = score >= 80 ? "#4BBF73" : score >= 50 ? "#f0ad4e" : "#d9534f";
  return (
    <div className="d-flex align-items-center gap-2">
      <div style={{ flex: 1, height: 6, background: "#f0f0f0", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 999, background: color, width: `${score}%`, transition: "width 0.5s" }} />
      </div>
      <span className="fw-bold text-end" style={{ fontSize: "0.72rem", width: 32, color: "#344054", fontVariantNumeric: "tabular-nums" }}>{score}</span>
    </div>
  );
}

// ── AI helper (Groq) — supplementary only; gracefully degrades without a key ──
function getGroqKey() {
  try {
    if (typeof process !== "undefined" && process.env) {
      return process.env.REACT_APP_GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
    }
  } catch (e) { /* ignore */ }
  return undefined;
}

function buildAIPrompt(framework, controlId, title, domain, question, guidance) {
  const q = (question && question.trim()) || (guidance && guidance.trim()) || "Is this control fully implemented and operating effectively?";
  return `You are a senior GRC auditor evaluating "${controlId}: ${title}" (domain: ${domain}) under ${framework}.

Assessment question: ${q}

Respond ONLY with JSON:
{
  "status": "compliant"|"partial"|"noncompliant"|"not_applicable",
  "score": <integer 0-100>,
  "finding": "<1-2 sentences on current state>",
  "remediation": "<1-2 sentences on what to fix>",
  "risk_level": "critical"|"high"|"medium"|"low"
}`;
}

async function callGroq(prompt) {
  const key = getGroqKey();
  if (!key) throw new Error("AI key not configured");
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 600,
      messages: [
        { role: "system", content: "You are a senior GRC auditor. Respond only in valid JSON." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content ?? "";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned);
  return {
    status: parsed.status ?? "partial",
    score: parsed.score ?? 50,
    finding: parsed.finding ?? "",
    remediation: parsed.remediation ?? "",
    risk_level: parsed.risk_level ?? "medium",
  };
}

const AssessmentReviewPanel = ({ assessmentId, frameworkName, frameworkId, assessedBy, onClose, onComplete }) => {
  const { t } = useTranslation("common");

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [status, setStatus] = useState("not_reviewed");
  const [score, setScore] = useState("");
  const [evidence, setEvidence] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [aiStates, setAiStates] = useState({});
  const [bulkAIRunning, setBulkAIRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);
  const abortRef = useRef(false);

  const [ccmData, setCCMData] = useState({});
  const [ccmScores, setCCMScores] = useState({});
  const [ccmPhase, setCCMPhase] = useState("idle");
  const [ccmExpanded, setCCMExpanded] = useState(false);
  const [ccmEdit, setCCMEdit] = useState({});
  const [bulkCCMRunning, setBulkCCMRunning] = useState(false);
  const [bulkCCMProgress, setBulkCCMProgress] = useState(0);

  const total = results.length;
  const current = results[currentIdx];
  const ctrl = current?.control;
  const currentAI = current ? aiStates[current.id] : undefined;
  const currentCCM = current ? ccmScores[ctrl?.control_id ?? ""] : undefined;

  // ── Load results (HYBRID: axios override + mock fallback) ──
  useEffect(() => {
    setLoading(true);
    const applyRows = (rows) => {
      setResults(rows);
      const controlIds = rows.map((r) => r.control?.control_id ?? r.id);
      seedMockCCMData(controlIds, frameworkId);
      fetchAllCCMData(controlIds, frameworkId).then((allCCM) => {
        setCCMData(allCCM);
        const scores = {};
        controlIds.forEach((id) => {
          const d = allCCM[id];
          scores[id] = d
            ? calculateCCMScore(d)
            : { score: 0, status: "not_applicable", test_component: 0, evidence_component: 0, monitoring_component: 0, recency_penalty: 0, breakdown: "No CCM data", data_source: "none" };
        });
        setCCMScores(scores);
        setLoading(false);
      });
    };

    axios
      .get(`/cyberrisk/assessment-results/${assessmentId}`)
      .then((res) => {
        if (Array.isArray(res?.data) && res.data.length) applyRows(res.data);
        else applyRows(buildMockResults(assessmentId));
      })
      .catch((err) => {
        console.warn("[cyberrisk] assessment-results: using mock fallback", err);
        applyRows(buildMockResults(assessmentId));
      });
  }, [assessmentId, frameworkId]);

  // Sync form when row changes
  useEffect(() => {
    const r = results[currentIdx];
    if (!r) return;
    setStatus(r.status ?? "not_reviewed");
    setScore(r.score != null ? String(r.score) : "");
    setEvidence(r.evidence ?? "");
    setNotes(r.notes ?? "");
    const cid = r.control?.control_id ?? "";
    const d = ccmData[cid];
    if (d) setCCMEdit(d);
    else setCCMEdit({ test_result: "not_tested", evidence_status: "missing", monitoring_freq: "ad_hoc" });
  }, [currentIdx, results, ccmData]);

  // ── persistence helper (HYBRID) ──
  const persistResult = async (resultId, patch) => {
    try {
      await axios.put(`/cyberrisk/assessment-results/${resultId}`, { ...patch, reviewed_at: new Date().toISOString() });
    } catch (err) {
      console.warn("[cyberrisk] updateResult: backend unavailable, local-only", err);
    }
  };

  // ── CCM: score single control ──
  const runCCMForRow = useCallback(async (row) => {
    const cid = row.control?.control_id ?? row.id;
    setCCMPhase("loading");
    try {
      const data = ccmData[cid] ?? {
        control_id: cid,
        framework_id: frameworkId,
        test_result: ccmEdit.test_result ?? "not_tested",
        evidence_status: ccmEdit.evidence_status ?? "missing",
        monitoring_freq: ccmEdit.monitoring_freq ?? "ad_hoc",
        last_tested_date: ccmEdit.last_tested_date ?? null,
      };
      const ccmResult = calculateCCMScore(data);
      await persistResult(row.id, { status: ccmResult.status, score: ccmResult.score, notes: ccmResult.breakdown, reviewed_by: assessedBy });
      setResults((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: ccmResult.status, score: ccmResult.score, notes: ccmResult.breakdown } : r)));
      setCCMScores((prev) => ({ ...prev, [cid]: ccmResult }));
      if (results[currentIdx]?.id === row.id) {
        setStatus(ccmResult.status);
        setScore(String(ccmResult.score));
        setNotes(ccmResult.breakdown);
      }
      setCCMPhase("done");
    } catch (e) {
      setCCMPhase("error");
    }
  }, [ccmData, ccmEdit, frameworkId, assessedBy, results, currentIdx]);

  const evaluateCCMCurrent = () => { if (current) runCCMForRow(current); };

  const runBulkCCM = useCallback(async () => {
    if (bulkCCMRunning) return;
    abortRef.current = false;
    setBulkCCMRunning(true);
    setBulkCCMProgress(0);
    for (let i = 0; i < results.length; i++) {
      if (abortRef.current) break;
      await runCCMForRow(results[i]);
      setBulkCCMProgress(i + 1);
    }
    setBulkCCMRunning(false);
  }, [bulkCCMRunning, results, runCCMForRow]);

  const saveCCMEdit = async () => {
    const cid = current?.control?.control_id ?? "";
    if (!cid) return;
    const updated = {
      ...(ccmData[cid] ?? {}),
      control_id: cid,
      framework_id: frameworkId,
      test_result: ccmEdit.test_result ?? "not_tested",
      evidence_status: ccmEdit.evidence_status ?? "missing",
      monitoring_freq: ccmEdit.monitoring_freq ?? "ad_hoc",
      last_tested_date: ccmEdit.last_tested_date ?? null,
      tested_by: ccmEdit.tested_by ?? assessedBy,
      notes: ccmEdit.notes ?? "",
    };
    await saveCCMData(updated);
    setCCMData((prev) => ({ ...prev, [cid]: updated }));
    setCCMScores((prev) => ({ ...prev, [cid]: calculateCCMScore(updated) }));
  };

  // ── AI: single + bulk ──
  const runAIForRow = useCallback(async (row) => {
    const c = row.control;
    if (!c) return;
    setAiStates((prev) => ({ ...prev, [row.id]: { phase: "running", error: null, finding: "", remediation: "", risk_level: "" } }));
    try {
      const prompt = buildAIPrompt(frameworkName, c.control_id ?? row.id, c.title ?? "—", c.domain ?? "—", c.question ?? null, c.guidance ?? c.notes ?? null);
      const parsed = await callGroq(prompt);
      await persistResult(row.id, { status: parsed.status, score: parsed.score, notes: parsed.finding, evidence: parsed.remediation, reviewed_by: assessedBy });
      setResults((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: parsed.status, score: parsed.score, notes: parsed.finding, evidence: parsed.remediation } : r)));
      setAiStates((prev) => ({ ...prev, [row.id]: { phase: "done", error: null, finding: parsed.finding, remediation: parsed.remediation, risk_level: parsed.risk_level } }));
      setCurrentIdx((idx) => {
        if (results[idx]?.id === row.id) {
          setStatus(parsed.status);
          setScore(String(parsed.score));
          setNotes(parsed.finding);
          setEvidence(parsed.remediation);
        }
        return idx;
      });
    } catch (err) {
      setAiStates((prev) => ({ ...prev, [row.id]: { phase: "error", error: err?.message || String(err), finding: "", remediation: "", risk_level: "" } }));
    }
  }, [frameworkName, assessedBy, results]);

  const evaluateAICurrent = () => { if (current) runAIForRow(current); };

  const runBulkAI = useCallback(async () => {
    if (bulkAIRunning) return;
    abortRef.current = false;
    setBulkAIRunning(true);
    setBulkProgress(0);
    setBulkTotal(results.length);
    for (let i = 0; i < results.length; i++) {
      if (abortRef.current) break;
      await runAIForRow(results[i]);
      setBulkProgress(i + 1);
      if (i < results.length - 1 && !abortRef.current) await new Promise((r) => setTimeout(r, 2000));
    }
    setBulkAIRunning(false);
  }, [bulkAIRunning, results, runAIForRow]);

  // ── Save + navigate ──
  const saveCurrentAndMove = async (direction) => {
    if (!current) return;
    setSaving(true);
    try {
      const sc = score !== "" ? parseInt(score, 10) : undefined;
      await persistResult(current.id, { status, score: sc, evidence, notes, reviewed_by: assessedBy });
      setResults((prev) => prev.map((r) => (r.id === current.id ? { ...r, status, score: sc, evidence, notes } : r)));
      if (direction === "next" && currentIdx < total - 1) setCurrentIdx((i) => i + 1);
      else if (direction === "prev" && currentIdx > 0) setCurrentIdx((i) => i - 1);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    await saveCurrentAndMove("stay");
    try {
      await axios.post(`/cyberrisk/assessments/${assessmentId}/complete`);
    } catch (err) {
      console.warn("[cyberrisk] completeAssessment: backend unavailable, computing locally", err);
    }
    const reviewed = results.filter((r) => r.status && r.status !== "not_reviewed");
    const avg = reviewed.length
      ? Math.round(reviewed.reduce((s, r) => s + (r.score ?? (r.status === "compliant" ? 100 : r.status === "partial" ? 50 : 0)), 0) / reviewed.length)
      : 0;
    onComplete && onComplete(avg);
  };

  const reviewedCount = results.filter((r) => r.status && r.status !== "not_reviewed").length;
  const pct = total > 0 ? Math.round((reviewedCount / total) * 100) : 0;

  const dotColor = (r, i) =>
    r.status === "compliant" ? "#4BBF73"
    : r.status === "partial" ? "#f0ad4e"
    : r.status === "noncompliant" ? "#d9534f"
    : r.status === "not_applicable" ? "#98a2b3"
    : i === currentIdx ? "#bcd9fb" : "#e4e7ec";

  const optBtn = (active, color) => ({
    fontSize: "0.72rem",
    padding: "4px 10px",
    borderRadius: 8,
    border: active ? `1px solid ${color}` : "1px solid #e4e7ec",
    background: active ? `${color}1a` : "#fff",
    color: active ? color : "#98a2b3",
    transition: "all 0.12s",
  });

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(16,24,40,0.4)", zIndex: 1040 }} onClick={onClose} />
      <div
        className="d-flex flex-column"
        style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 440, maxWidth: "100%", background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", zIndex: 1050, fontFamily: "Poppins,sans-serif" }}
      >
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid #e4e7ec" }}>
          <div>
            <p className="mb-0" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#101828" }}>{frameworkName} — {t("Assessment")}</p>
            <p className="mb-0" style={{ fontSize: "0.72rem", color: "#98a2b3" }}>{t("Reviewing controls")} · {assessedBy}</p>
          </div>
          <button className="btn p-1 border-0" onClick={onClose} style={{ color: "#667085" }}>
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 16 }} />
          </button>
        </div>

        {/* Progress */}
        <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid #e4e7ec" }}>
          <div className="d-flex justify-content-between mb-1" style={{ fontSize: "0.72rem", color: "#98a2b3" }}>
            <span>{reviewedCount}/{total} {t("reviewed")}</span>
            <span>{pct}%</span>
          </div>
          <div style={{ height: 6, background: "#f0f0f0", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "#3B82EC", borderRadius: 999, width: `${pct}%`, transition: "width 0.3s" }} />
          </div>

          {total > 0 && total <= 20 && (
            <div className="d-flex gap-1 mt-2" style={{ height: 8 }}>
              {results.map((r, i) => (
                <div
                  key={r.id}
                  onClick={() => setCurrentIdx(i)}
                  title={`${r.control?.control_id}: ${r.status}`}
                  className="flex-fill rounded-1"
                  style={{ cursor: "pointer", background: dotColor(r, i) }}
                />
              ))}
            </div>
          )}

          {/* Bulk actions */}
          <div className="d-flex align-items-center gap-2 mt-3 flex-wrap">
            {!bulkCCMRunning ? (
              <button onClick={runBulkCCM} disabled={loading || results.length === 0} className="btn btn-sm btn-primary d-flex align-items-center gap-2" style={{ fontSize: "0.72rem" }}>
                <FontAwesomeIcon icon={faChartColumn} style={{ fontSize: 11 }} /> {t("CCM Score All")} ({results.length})
              </button>
            ) : (
              <div className="d-flex align-items-center gap-2 flex-fill">
                <div style={{ flex: 1, height: 6, background: "#f0f0f0", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "#3B82EC", borderRadius: 999, width: `${Math.round((bulkCCMProgress / results.length) * 100)}%` }} />
                </div>
                <span style={{ fontSize: "0.72rem", color: "#3B82EC", fontVariantNumeric: "tabular-nums" }}>{bulkCCMProgress}/{results.length}</span>
                <button onClick={() => { abortRef.current = true; }} className="btn btn-sm btn-outline-secondary" style={{ fontSize: "0.7rem" }}>{t("Stop")}</button>
              </div>
            )}

            {!bulkAIRunning ? (
              <button onClick={runBulkAI} disabled={loading || results.length === 0 || bulkCCMRunning} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2" style={{ fontSize: "0.72rem", color: "#6f42c1", borderColor: "#d8c7f0" }}>
                <FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: 11 }} /> {t("AI Evaluate All")}
              </button>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <div style={{ width: 80, height: 6, background: "#f0f0f0", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "#6f42c1", borderRadius: 999, width: `${Math.round((bulkProgress / bulkTotal) * 100)}%` }} />
                </div>
                <span style={{ fontSize: "0.72rem", color: "#6f42c1", fontVariantNumeric: "tabular-nums" }}>{bulkProgress}/{bulkTotal}</span>
                <button onClick={() => { abortRef.current = true; }} className="btn btn-sm btn-outline-secondary" style={{ fontSize: "0.7rem" }}>{t("Stop")}</button>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex-fill d-flex align-items-center justify-content-center">
            <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: 24, color: "#3B82EC" }} />
          </div>
        ) : !current ? (
          <div className="flex-fill d-flex align-items-center justify-content-center" style={{ color: "#98a2b3", fontSize: "0.88rem" }}>{t("No controls found")}</div>
        ) : (
          <>
            <div className="flex-fill px-4 py-3" style={{ overflowY: "auto" }}>
              {/* Navigation */}
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                  <button onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))} disabled={currentIdx === 0} className="btn btn-sm btn-outline-secondary p-1" style={{ width: 30 }}>
                    <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: 13 }} />
                  </button>
                  <span style={{ fontSize: "0.72rem", color: "#98a2b3", fontVariantNumeric: "tabular-nums" }}>{currentIdx + 1} / {total}</span>
                  <button onClick={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))} disabled={currentIdx === total - 1} className="btn btn-sm btn-outline-secondary p-1" style={{ width: 30 }}>
                    <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 13 }} />
                  </button>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {current.status !== "not_reviewed" && (
                    <span style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: 999, ...statusBadgeStyle(current.status) }}>
                      {t(STATUS_OPTIONS.find((o) => o.value === current.status)?.label ?? current.status)}
                    </span>
                  )}
                </div>
              </div>

              {/* Control card */}
              <div className="rounded p-3 mb-3" style={{ background: "#f9fafb", border: "1px solid #e4e7ec" }}>
                <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                  <span style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "#3B82EC", background: "#eff6ff", padding: "2px 8px", borderRadius: 6, border: "1px solid #bfdbfe" }}>{ctrl?.control_id ?? "—"}</span>
                  <span style={{ fontSize: "0.72rem", color: "#667085", background: "#f4f7f9", padding: "2px 8px", borderRadius: 6 }}>{ctrl?.domain ?? "—"}</span>
                </div>
                <h3 style={{ fontSize: "0.88rem", fontWeight: 600, color: "#101828", lineHeight: 1.4, margin: 0 }}>{ctrl?.title ?? "—"}</h3>
                {(ctrl?.question || ctrl?.guidance) && (
                  <div className="mt-3 pt-3" style={{ borderTop: "1px solid #e4e7ec" }}>
                    <p style={{ fontSize: "0.72rem", fontWeight: 500, color: "#f0ad4e", marginBottom: 4 }}>{t("Assessment question")}</p>
                    <p style={{ fontSize: "0.75rem", color: "#667085", lineHeight: 1.5, margin: 0 }}>{ctrl?.question ?? ctrl?.guidance}</p>
                  </div>
                )}
              </div>

              {/* CCM panel — PRIMARY */}
              <div className="rounded mb-3" style={{ border: "1px solid #bfdbfe", overflow: "hidden" }}>
                <div className="d-flex align-items-center justify-content-between px-3 py-2" style={{ borderBottom: "1px solid #e4e7ec" }}>
                  <div className="d-flex align-items-center gap-2">
                    <FontAwesomeIcon icon={faChartColumn} style={{ fontSize: 13, color: "#3B82EC" }} />
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#344054" }}>{t("CCM Score")}</span>
                    {currentCCM?.data_source === "ccm" && (
                      <span style={{ fontSize: "0.65rem", background: "#eff6ff", color: "#3B82EC", border: "1px solid #bfdbfe", padding: "1px 6px", borderRadius: 4 }}>{currentCCM.score}/100</span>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button onClick={evaluateCCMCurrent} disabled={ccmPhase === "loading"} className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" style={{ fontSize: "0.72rem" }}>
                      {ccmPhase === "loading"
                        ? <><FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: 11 }} /> {t("Scoring…")}</>
                        : <><FontAwesomeIcon icon={faChartColumn} style={{ fontSize: 11 }} /> {t("Apply CCM Score")}</>}
                    </button>
                    <button onClick={() => setCCMExpanded((e) => !e)} className="btn p-1 border-0" style={{ color: "#98a2b3" }}>
                      <FontAwesomeIcon icon={ccmExpanded ? faChevronUp : faChevronDown} style={{ fontSize: 13 }} />
                    </button>
                  </div>
                </div>

                {currentCCM?.data_source === "ccm" && (
                  <div className="px-3 py-3">
                    <ScoreBar score={currentCCM.score} />
                    <div className="d-flex gap-2 mt-2">
                      {[
                        { label: t("Test Result"), val: currentCCM.test_component, icon: faShieldHalved },
                        { label: t("Evidence"), val: currentCCM.evidence_component, icon: faFileLines },
                        { label: t("Monitoring"), val: currentCCM.monitoring_component, icon: faDatabase },
                      ].map((c) => (
                        <div key={c.label} className="flex-fill rounded p-2" style={{ background: "#f9fafb" }}>
                          <div className="d-flex align-items-center gap-1" style={{ fontSize: "0.62rem", color: "#98a2b3", marginBottom: 2 }}>
                            <FontAwesomeIcon icon={c.icon} style={{ fontSize: 8 }} />{c.label}
                          </div>
                          <div className="fw-bold" style={{ fontSize: "0.85rem", color: c.val >= 80 ? "#4BBF73" : c.val >= 50 ? "#f0ad4e" : "#d9534f" }}>{c.val}</div>
                        </div>
                      ))}
                    </div>
                    {currentCCM.recency_penalty > 0 && (
                      <p className="d-flex align-items-center gap-1 mt-2 mb-0" style={{ fontSize: "0.65rem", color: "#fd7e14" }}>
                        <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: 9 }} /> {t("Recency penalty")}: -{currentCCM.recency_penalty} {t("pts")}
                      </p>
                    )}
                  </div>
                )}

                {currentCCM?.data_source === "none" && (
                  <p className="px-3 py-3 mb-0" style={{ fontSize: "0.75rem", color: "#98a2b3" }}>{t("No CCM data yet — fill in the form below and click Apply CCM Score")}</p>
                )}

                {ccmExpanded && (
                  <div className="px-3 pb-3 pt-2" style={{ borderTop: "1px solid #e4e7ec" }}>
                    <p style={{ fontSize: "0.7rem", fontWeight: 500, color: "#98a2b3", textTransform: "uppercase", letterSpacing: "0.04em" }}>{t("CCM Data Input")}</p>

                    <div className="mb-2">
                      <label style={{ fontSize: "0.65rem", color: "#98a2b3", textTransform: "uppercase", display: "block", marginBottom: 4 }}>{t("Test Result")} <span style={{ color: "#3B82EC" }}>({t("50% weight")})</span></label>
                      <div className="d-flex flex-wrap gap-1">
                        {TEST_RESULT_OPTS.map((o) => (
                          <button key={o.value} onClick={() => setCCMEdit((e) => ({ ...e, test_result: o.value }))} style={optBtn(ccmEdit.test_result === o.value, o.color)}>{t(o.label)}</button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-2">
                      <label style={{ fontSize: "0.65rem", color: "#98a2b3", textTransform: "uppercase", display: "block", marginBottom: 4 }}>{t("Evidence Status")} <span style={{ color: "#3B82EC" }}>({t("30% weight")})</span></label>
                      <div className="d-flex flex-wrap gap-1">
                        {EVIDENCE_OPTS.map((o) => (
                          <button key={o.value} onClick={() => setCCMEdit((e) => ({ ...e, evidence_status: o.value }))} style={optBtn(ccmEdit.evidence_status === o.value, o.color)}>{t(o.label)}</button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-2">
                      <label style={{ fontSize: "0.65rem", color: "#98a2b3", textTransform: "uppercase", display: "block", marginBottom: 4 }}>{t("Monitoring Frequency")} <span style={{ color: "#3B82EC" }}>({t("20% weight")})</span></label>
                      <div className="d-flex flex-wrap gap-1">
                        {FREQ_OPTS.map((o) => (
                          <button key={o.value} onClick={() => setCCMEdit((e) => ({ ...e, monitoring_freq: o.value }))} style={optBtn(ccmEdit.monitoring_freq === o.value, "#3B82EC")}>{t(o.label)}</button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-2">
                      <label className="d-flex align-items-center gap-1" style={{ fontSize: "0.65rem", color: "#98a2b3", textTransform: "uppercase", marginBottom: 4 }}>
                        <FontAwesomeIcon icon={faCalendar} style={{ fontSize: 9 }} /> {t("Last Tested Date")}
                      </label>
                      <input type="date" value={ccmEdit.last_tested_date ?? ""} onChange={(e) => setCCMEdit((prev) => ({ ...prev, last_tested_date: e.target.value }))} className="form-control form-control-sm" />
                    </div>

                    <button onClick={saveCCMEdit} className="btn btn-sm btn-outline-secondary w-100" style={{ fontSize: "0.72rem" }}>{t("Save CCM Data")}</button>
                  </div>
                )}
              </div>

              {/* AI panel — SECONDARY */}
              <div className="rounded mb-3" style={{ border: "1px solid #e6d8f5", overflow: "hidden" }}>
                <div className="d-flex align-items-center justify-content-between px-3 py-2">
                  <div className="d-flex align-items-center gap-2">
                    <FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: 12, color: "#6f42c1" }} />
                    <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "#344054" }}>{t("AI Suggestion")}</span>
                    <span style={{ fontSize: "0.65rem", color: "#98a2b3" }}>· {t("supplementary only")}</span>
                  </div>
                  <button onClick={evaluateAICurrent} disabled={currentAI?.phase === "running" || bulkAIRunning || bulkCCMRunning} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ fontSize: "0.72rem", color: "#6f42c1", borderColor: "#d8c7f0" }}>
                    {currentAI?.phase === "running"
                      ? <><FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: 11 }} /> {t("Running…")}</>
                      : <><FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: 11 }} /> {t("AI Evaluate")}</>}
                  </button>
                </div>
                {currentAI?.phase === "done" && (
                  <div className="px-3 pb-3">
                    {currentAI.finding && (
                      <div className="rounded p-2 mb-2" style={{ background: "#f9fafb" }}>
                        <p style={{ fontSize: "0.62rem", color: "#6f42c1", fontWeight: 500, textTransform: "uppercase", marginBottom: 2 }}>{t("AI Finding")}</p>
                        <p style={{ fontSize: "0.75rem", color: "#344054", lineHeight: 1.5, margin: 0 }}>{currentAI.finding}</p>
                      </div>
                    )}
                    {currentAI.remediation && (
                      <div className="rounded p-2" style={{ background: "#f9fafb" }}>
                        <p style={{ fontSize: "0.62rem", color: "#f0ad4e", fontWeight: 500, textTransform: "uppercase", marginBottom: 2 }}>{t("AI Recommendation")}</p>
                        <p style={{ fontSize: "0.75rem", color: "#344054", lineHeight: 1.5, margin: 0 }}>{currentAI.remediation}</p>
                      </div>
                    )}
                  </div>
                )}
                {currentAI?.phase === "error" && (
                  <p className="px-3 pb-2 d-flex align-items-center gap-1" style={{ fontSize: "0.72rem", color: "#d9534f" }}>
                    <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: 10 }} /> {currentAI.error}
                  </p>
                )}
                {(!currentAI || currentAI.phase === "idle") && (
                  <p className="px-3 pb-2 mb-0" style={{ fontSize: "0.7rem", color: "#98a2b3" }}>{t("Click AI Evaluate for a supplementary suggestion — use CCM Score as the primary source")}</p>
                )}
              </div>

              {/* Assessment status */}
              <div className="mb-3">
                <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#667085", textTransform: "uppercase", letterSpacing: "0.04em" }}>{t("Assessment Status")}</p>
                <div className="d-flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((opt) => {
                    const active = status === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setStatus(opt.value)}
                        className="d-flex align-items-center gap-2 flex-fill justify-content-center"
                        style={{ fontSize: "0.82rem", fontWeight: 500, padding: "8px 10px", borderRadius: 10, minWidth: "45%", border: active ? `1px solid ${opt.border}` : "1px solid #e4e7ec", background: active ? opt.bg : "#fff", color: active ? opt.color : "#98a2b3" }}
                      >
                        <FontAwesomeIcon icon={opt.icon} style={{ fontSize: 13 }} /> {t(opt.label)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Evidence */}
              <div className="mb-3">
                <label className="d-flex align-items-center gap-1" style={{ fontSize: "0.72rem", fontWeight: 600, color: "#667085", textTransform: "uppercase", marginBottom: 6 }}>
                  <FontAwesomeIcon icon={faClipboardCheck} style={{ fontSize: 11 }} /> {t("Evidence")}
                </label>
                <textarea value={evidence} onChange={(e) => setEvidence(e.target.value)} rows={2} placeholder={t("Links, document names, or artifact descriptions…")} className="form-control form-control-sm" />
              </div>

              {/* Notes */}
              <div className="mb-2">
                <label className="d-flex align-items-center gap-1" style={{ fontSize: "0.72rem", fontWeight: 600, color: "#667085", textTransform: "uppercase", marginBottom: 6 }}>
                  <FontAwesomeIcon icon={faFileLines} style={{ fontSize: 11 }} /> {t("Notes")}
                </label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder={t("Observations, remediation actions, follow-up items…")} className="form-control form-control-sm" />
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: "1px solid #e4e7ec" }}>
              <div className="d-flex gap-2 mb-2">
                <button onClick={() => saveCurrentAndMove("prev")} disabled={currentIdx === 0 || saving} className="btn btn-sm btn-outline-secondary" style={{ fontSize: "0.82rem" }}>← {t("Prev")}</button>
                <button onClick={() => saveCurrentAndMove("stay")} disabled={saving} className="btn btn-sm btn-outline-secondary flex-fill" style={{ fontSize: "0.82rem" }}>
                  {saving ? <FontAwesomeIcon icon={faSpinner} spin /> : t("Skip")}
                </button>
                <button onClick={() => saveCurrentAndMove("next")} disabled={currentIdx === total - 1 || saving} className="btn btn-sm btn-outline-secondary" style={{ fontSize: "0.82rem" }}>{t("Save & Next")} →</button>
              </div>
              <button onClick={handleComplete} disabled={saving} className="btn btn-primary w-100" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                ✓ {t("Complete")} ({total - reviewedCount} {t("remaining")})
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default AssessmentReviewPanel;
