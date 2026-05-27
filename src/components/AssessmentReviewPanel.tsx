import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, CheckCircle, MinusCircle, XCircle, Ban, ChevronLeft, ChevronRight,
  Loader2, Flag, FileText, ClipboardCheck, AlertTriangle, Sparkles,
  Play, SkipForward,
} from 'lucide-react';
import type { AssessmentResult, ComplianceControl, ControlResultStatus } from '../lib/complianceTypes';
import { fetchResults, updateResult, completeAssessment } from '../lib/complianceData';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AssessmentReviewPanelProps {
  assessmentId:  string;
  frameworkName: string;
  assessedBy:    string;
  onClose:       () => void;
  onComplete:    (score: number) => void;
}

type AIPhase = 'idle' | 'running' | 'done' | 'error';

interface AIState {
  phase:       AIPhase;
  error:       string | null;
  finding:     string;
  remediation: string;
  risk_level:  string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: {
  value: ControlResultStatus; label: string; color: string; icon: React.ReactNode;
}[] = [
  { value: 'compliant',      label: 'Compliant',    color: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400', icon: <CheckCircle size={14} /> },
  { value: 'partial',        label: 'Partial',       color: 'border-amber-500/60 bg-amber-500/10 text-amber-400',       icon: <MinusCircle size={14} /> },
  { value: 'noncompliant',   label: 'Non-Compliant', color: 'border-red-500/60 bg-red-500/10 text-red-400',             icon: <XCircle size={14} /> },
  { value: 'not_applicable', label: 'N/A',           color: 'border-slate-600 bg-slate-700/40 text-slate-400',          icon: <Ban size={14} /> },
];

const RISK_PILL: Record<string, string> = {
  critical: 'bg-red-900/40 text-red-300 border-red-500/30',
  high:     'bg-orange-900/40 text-orange-300 border-orange-500/30',
  medium:   'bg-amber-900/40 text-amber-300 border-amber-500/30',
  low:      'bg-blue-900/40 text-blue-300 border-blue-500/30',
  none:     'bg-emerald-900/40 text-emerald-300 border-emerald-500/30',
};

const defaultScoreForStatus = (s: ControlResultStatus): number | null =>
  s === 'compliant' ? 100 : s === 'partial' ? 50 : s === 'noncompliant' ? 0 : null;

function statusBadge(s: ControlResultStatus) {
  if (s === 'compliant')      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
  if (s === 'partial')        return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
  if (s === 'noncompliant')   return 'bg-red-500/15 text-red-400 border-red-500/20';
  if (s === 'not_applicable') return 'bg-slate-700/40 text-slate-500 border-slate-600';
  return 'bg-slate-700/20 text-slate-600 border-slate-700';
}

// ── AI prompt builder — real market-based evaluation ─────────────────────────

export function buildAIPrompt(
  framework: string,
  controlId: string,
  title: string,
  domain: string,
  question: string | null,
  guidance: string | null,
): string {
  const assessmentQuestion = question?.trim()
    || guidance?.trim()
    || 'Is this control fully implemented, documented, and operating effectively?';

  return `You are a senior GRC auditor with 15+ years of experience conducting ${framework} compliance assessments for financial services enterprises.

You are evaluating control "${controlId}: ${title}" in domain "${domain}".

Assessment question: ${assessmentQuestion}

## Your task
Evaluate this control based on REAL-WORLD industry data and current market maturity levels for ${framework} compliance in enterprise financial services organizations. Base your assessment on:
- How this specific control type typically performs across the industry
- Known gaps and challenges organizations face with this control
- Current threat landscape relevance
- Regulatory enforcement history for this control area
- Typical implementation maturity in 2024–2025

## Scoring guidance (use the FULL range — do not cluster)
- 90–100: Fully implemented, tested, documented, with evidence. Rare — only for foundational controls most orgs nail.
- 75–89: Largely compliant with minor gaps. Common for well-understood controls.
- 50–74: Partially implemented — policy exists but gaps in execution, testing, or coverage.
- 25–49: Significant gaps — exists on paper but inadequate implementation.
- 5–24: Non-existent or severely deficient. Common for emerging/complex controls.

## N/A guidance
Mark as not_applicable ONLY if this control genuinely does not apply to a typical financial services enterprise (e.g. a healthcare-specific control in a banking assessment). Most controls DO apply — use not_applicable sparingly.

## Status mapping
- compliant: score 80–100
- partial: score 35–79
- noncompliant: score 5–34
- not_applicable: only if truly irrelevant

Respond ONLY with a single valid JSON object — no markdown fences, no explanation, no text outside the JSON:

{
  "status": "compliant" | "partial" | "noncompliant" | "not_applicable",
  "score": <integer 5–100, reflecting genuine market maturity — NOT 70 by default>,
  "risk_level": "none" | "low" | "medium" | "high" | "critical",
  "finding": "<2–3 sentences grounded in real-world observations specific to ${title} — mention actual evidence types, tools, or gaps typically seen>",
  "remediation": "<2–3 sentences of specific, actionable steps for ${title} — name actual tools, standards, or timeframes>",
  "due_date": "<ISO 8601 date 30–90 days from today proportional to severity, or null if compliant>"
}

Critical rules:
- Score must reflect THIS control's real-world maturity, not a default value
- finding and remediation must be specific to "${title}", not boilerplate
- risk_level must align with score: none/low for compliant, medium for partial, high/critical for noncompliant
- Vary scores meaningfully: some controls score 92, others 18, others 61 — based on reality
- Do NOT output scores like 67, 68, 70, 72 repeatedly — each control has its own realistic score`;
}

// ── Groq API call ─────────────────────────────────────────────────────────────

async function callGroq(prompt: string): Promise<{
  status: ControlResultStatus;
  score: number;
  risk_level: string;
  finding: string;
  remediation: string;
  due_date: string | null;
}> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error('VITE_GROQ_API_KEY is not set in your .env file');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a senior GRC auditor. You always respond with a single valid JSON object only — no markdown, no preamble, no explanation outside the JSON. Your assessments are grounded in real-world industry data and vary meaningfully per control.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq API ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error('Empty response from Groq');

  // Strip markdown fences if model adds them despite instructions
  const clean = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(clean);
  } catch {
    // Try to extract JSON object from response if there's surrounding text
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Could not parse JSON from Groq response');
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AssessmentReviewPanel({
  assessmentId, frameworkName, assessedBy, onClose, onComplete,
}: AssessmentReviewPanelProps) {
  const [results,    setResults]    = useState<AssessmentResult[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [saving,     setSaving]     = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const [status,   setStatus]   = useState<ControlResultStatus>('not_reviewed');
  const [score,    setScore]    = useState<string>('');
  const [evidence, setEvidence] = useState('');
  const [notes,    setNotes]    = useState('');

  const [aiStates, setAiStates] = useState<Record<string, AIState>>({});

  const [bulkRunning,  setBulkRunning]  = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkTotal,    setBulkTotal]    = useState(0);
  const abortRef = useRef(false);

  // ── Load ───────────────────────────────────────────────────────────────────

  const loadResults = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchResults(assessmentId);
      rows.sort((a, b) => (a.control?.sort_order ?? 0) - (b.control?.sort_order ?? 0));
      setResults(rows);
      const init: Record<string, AIState> = {};
      rows.forEach(r => {
        init[r.id] = {
          phase:       'idle',
          error:       null,
          finding:     r.notes    ?? '',
          remediation: r.evidence ?? '',
          risk_level:  '',
        };
      });
      setAiStates(init);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => { loadResults(); }, [loadResults]);

  useEffect(() => {
    const r = results[currentIdx];
    if (!r) return;
    setStatus(r.status);
    setScore(r.score != null ? String(r.score) : '');
    setEvidence(r.evidence ?? '');
    setNotes(r.notes ?? '');
  }, [currentIdx, results]);

  // ── AI: single control ─────────────────────────────────────────────────────

  const runAIForRow = useCallback(async (row: AssessmentResult): Promise<void> => {
    const ctrl = row.control;

    if (!ctrl) {
      setAiStates(prev => ({
        ...prev,
        [row.id]: {
          phase: 'error',
          error: `Control data missing for result ${row.id}.`,
          finding: '', remediation: '', risk_level: '',
        },
      }));
      return;
    }

    setAiStates(prev => ({
      ...prev,
      [row.id]: { phase: 'running', error: null, finding: '', remediation: '', risk_level: '' },
    }));

    try {
      const prompt = buildAIPrompt(
        frameworkName,
        ctrl.control_id ?? ctrl.id,
        ctrl.title      ?? '—',
        ctrl.domain     ?? '—',
        ctrl.question   ?? null,
        ctrl.guidance   ?? ctrl.notes ?? null,
      );

      const parsed = await callGroq(prompt);

      await updateResult(row.id, {
        status:      parsed.status,
        score:       parsed.score,
        notes:       parsed.finding,
        evidence:    parsed.remediation,
        reviewed_by: assessedBy,
      });

      setResults(prev => prev.map(r =>
        r.id === row.id
          ? { ...r, status: parsed.status, score: parsed.score, notes: parsed.finding, evidence: parsed.remediation }
          : r
      ));

      setAiStates(prev => ({
        ...prev,
        [row.id]: {
          phase:       'done',
          error:       null,
          finding:     parsed.finding,
          remediation: parsed.remediation,
          risk_level:  parsed.risk_level,
        },
      }));

      setCurrentIdx(idx => {
        if (results[idx]?.id === row.id) {
          setStatus(parsed.status);
          setScore(String(parsed.score));
          setNotes(parsed.finding);
          setEvidence(parsed.remediation);
        }
        return idx;
      });

    } catch (err) {
      setAiStates(prev => ({
        ...prev,
        [row.id]: {
          phase: 'error',
          error: (err as Error).message,
          finding: '', remediation: '', risk_level: '',
        },
      }));
    }
  }, [frameworkName, assessedBy, results]);

  const evaluateCurrent = () => {
    const row = results[currentIdx];
    if (row) runAIForRow(row);
  };

  // ── AI: bulk run with delay ────────────────────────────────────────────────

  const runBulkAI = useCallback(async () => {
    if (bulkRunning) return;
    abortRef.current = false;
    setBulkRunning(true);
    setBulkProgress(0);
    setBulkTotal(results.length);

    for (let i = 0; i < results.length; i++) {
      if (abortRef.current) break;
      await runAIForRow(results[i]);
      setBulkProgress(i + 1);
      // 2s delay between calls to stay within Groq rate limits
      if (i < results.length - 1 && !abortRef.current) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    setBulkRunning(false);
  }, [bulkRunning, results, runAIForRow]);

  const stopBulk = () => { abortRef.current = true; };

  // ── Manual save ────────────────────────────────────────────────────────────

  const saveCurrentAndMove = async (direction: 'next' | 'prev' | 'stay') => {
    const current = results[currentIdx];
    if (!current) return;
    setSaving(true);
    setError(null);
    try {
      await updateResult(current.id, {
        status,
        score:       score !== '' ? Number(score) : null,
        evidence:    evidence.trim(),
        notes:       notes.trim(),
        reviewed_by: assessedBy,
      });
      setResults(prev => prev.map(r =>
        r.id === current.id
          ? { ...r, status, score: score !== '' ? Number(score) : null, evidence, notes, reviewed_by: assessedBy }
          : r
      ));
      if (direction === 'next' && currentIdx < results.length - 1) setCurrentIdx(i => i + 1);
      if (direction === 'prev' && currentIdx > 0)                  setCurrentIdx(i => i - 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // ── Complete ───────────────────────────────────────────────────────────────

  const handleComplete = async () => {
    const current = results[currentIdx];
    if (current && status !== 'not_reviewed') await saveCurrentAndMove('stay');
    setCompleting(true);
    setError(null);
    try {
      const finalScore = await completeAssessment(assessmentId);
      onComplete(finalScore);
    } catch (e) {
      setError((e as Error).message);
      setCompleting(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const current  = results[currentIdx];
  const ctrl: ComplianceControl | undefined = current?.control;
  const reviewed = results.filter(r => r.status !== 'not_reviewed').length;
  const total    = results.length;
  const pct      = total > 0 ? Math.round((reviewed / total) * 100) : 0;
  const allDone  = reviewed === total && total > 0;

  const currentAI   = current ? (aiStates[current.id] ?? null) : null;
  const aiDoneCount = Object.values(aiStates).filter(s => s.phase === 'done').length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative ml-auto w-full max-w-xl bg-slate-900 border-l border-slate-700 flex flex-col h-full shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
              <ClipboardCheck size={15} className="text-cyan-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-slate-100 font-bold text-sm truncate">{frameworkName} — Assessment</h2>
              <p className="text-slate-500 text-xs">Reviewing controls · {assessedBy}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Progress */}
        <div className="px-5 py-3 border-b border-slate-800 flex-shrink-0 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">{reviewed}/{total} reviewed</span>
            <div className="flex items-center gap-3">
              {aiDoneCount > 0 && (
                <span className="text-purple-400 flex items-center gap-1">
                  <Sparkles size={10} /> {aiDoneCount} AI-evaluated
                </span>
              )}
              <span className="text-slate-400 font-medium tabular-nums">{pct}%</span>
            </div>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Mini status strip */}
          {results.length > 0 && (
            <div className="flex gap-px mt-1 rounded overflow-hidden h-1">
              {results.map((r, i) => (
                <div
                  key={r.id}
                  onClick={() => setCurrentIdx(i)}
                  title={`${r.control?.control_id ?? ''}: ${r.status}`}
                  className={`flex-1 cursor-pointer transition-colors ${
                    r.status === 'compliant'      ? 'bg-emerald-500' :
                    r.status === 'partial'        ? 'bg-amber-500'   :
                    r.status === 'noncompliant'   ? 'bg-red-500'     :
                    r.status === 'not_applicable' ? 'bg-slate-600'   :
                    i === currentIdx              ? 'bg-cyan-500/50' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Bulk AI bar */}
          <div className="flex items-center gap-2 pt-1">
            {!bulkRunning ? (
              <button
                onClick={runBulkAI}
                disabled={loading || results.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles size={12} />
                AI Evaluate All ({results.length} controls)
              </button>
            ) : (
              <>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-300"
                    style={{ width: bulkTotal > 0 ? `${Math.round((bulkProgress / bulkTotal) * 100)}%` : '0%' }}
                  />
                </div>
                <span className="text-xs text-purple-400 tabular-nums flex-shrink-0">
                  {bulkProgress}/{bulkTotal}
                </span>
                <button
                  onClick={stopBulk}
                  className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded border border-slate-700 hover:bg-slate-800 transition-colors"
                >
                  Stop
                </button>
              </>
            )}
          </div>

          <p className="text-slate-600 text-xs flex items-center gap-1">
            <Sparkles size={9} /> Powered by Groq · Llama 3.3 70B · Market-based evaluation
          </p>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-cyan-500" />
          </div>
        ) : !current ? (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
            No controls found
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                    disabled={currentIdx === 0}
                    className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span className="text-slate-500 text-xs tabular-nums">{currentIdx + 1} / {total}</span>
                  <button
                    onClick={() => setCurrentIdx(i => Math.min(total - 1, i + 1))}
                    disabled={currentIdx === total - 1}
                    className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {current.status !== 'not_reviewed' && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusBadge(current.status)}`}>
                      {STATUS_OPTIONS.find(o => o.value === current.status)?.label ?? current.status}
                    </span>
                  )}
                  {currentAI?.risk_level && (
                    <span className={`text-xs px-2 py-0.5 rounded border ${RISK_PILL[currentAI.risk_level] ?? ''}`}>
                      {currentAI.risk_level}
                    </span>
                  )}
                </div>
              </div>

              {/* Control card */}
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="font-mono text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    {ctrl?.control_id ?? '—'}
                  </span>
                  <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">
                    {ctrl?.domain ?? '—'}
                  </span>
                </div>
                <h3 className="text-slate-100 font-semibold text-sm leading-snug">
                  {ctrl?.title ?? '—'}
                </h3>
                {(ctrl?.question ?? ctrl?.guidance) && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <p className="text-xs font-medium text-amber-400/80 mb-1">Assessment question</p>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      {ctrl?.question ?? ctrl?.guidance}
                    </p>
                  </div>
                )}
              </div>

              {/* AI Evaluate button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={evaluateCurrent}
                  disabled={currentAI?.phase === 'running' || bulkRunning}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {currentAI?.phase === 'running'
                    ? <><Loader2 size={12} className="animate-spin" /> Evaluating…</>
                    : <><Sparkles size={12} /> AI Evaluate this control</>
                  }
                </button>
                {currentAI?.phase === 'done' && (
                  <span className="text-xs text-purple-400 flex items-center gap-1">
                    <Sparkles size={10} /> AI result applied · edit below to override
                  </span>
                )}
                {currentAI?.phase === 'error' && (
                  <span className="text-xs text-red-400 flex items-center gap-1">
                    <AlertTriangle size={10} /> {currentAI.error}
                  </span>
                )}
              </div>

              {/* AI finding + remediation cards */}
              {currentAI?.phase === 'done' && (currentAI.finding || currentAI.remediation) && (
                <div className="space-y-2">
                  {currentAI.finding && (
                    <div className="bg-slate-800/40 border border-purple-500/20 rounded-xl px-4 py-3">
                      <p className="text-xs font-medium text-purple-400 mb-1 flex items-center gap-1">
                        <Sparkles size={10} /> AI Finding
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed">{currentAI.finding}</p>
                    </div>
                  )}
                  {currentAI.remediation && (
                    <div className="bg-slate-800/40 border border-cyan-500/20 rounded-xl px-4 py-3">
                      <p className="text-xs font-medium text-cyan-400 mb-1">Recommended remediation</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{currentAI.remediation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Status selector */}
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                  Assessment Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setStatus(opt.value);
                        const def = defaultScoreForStatus(opt.value);
                        setScore(def != null ? String(def) : '');
                      }}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        status === opt.value
                          ? opt.color + ' ring-1 ring-inset ring-current'
                          : 'border-slate-700 bg-slate-800/40 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Score */}
              {status !== 'not_applicable' && status !== 'not_reviewed' && (
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
                    Score (0–100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={score}
                    onChange={e => setScore(e.target.value)}
                    placeholder="e.g. 75"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              )}

              {/* Evidence */}
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileText size={12} /> Evidence
                  {currentAI?.phase === 'done' && (
                    <span className="text-purple-400 font-normal normal-case tracking-normal">(AI pre-filled)</span>
                  )}
                </label>
                <textarea
                  value={evidence}
                  onChange={e => setEvidence(e.target.value)}
                  rows={2}
                  placeholder="Links, document names, or artifact descriptions…"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500 transition-colors resize-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Flag size={12} /> Notes
                  {currentAI?.phase === 'done' && (
                    <span className="text-purple-400 font-normal normal-case tracking-normal">(AI pre-filled)</span>
                  )}
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Observations, remediation actions, follow-up items…"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500 transition-colors resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-red-400 text-sm">
                  <AlertTriangle size={14} className="flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-slate-800 px-5 py-4 bg-slate-900/80 space-y-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => saveCurrentAndMove('prev')}
                  disabled={saving || currentIdx === 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  onClick={() => setCurrentIdx(i => Math.min(total - 1, i + 1))}
                  disabled={currentIdx === total - 1}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <SkipForward size={14} /> Skip
                </button>
                <button
                  onClick={() => saveCurrentAndMove('next')}
                  disabled={saving || status === 'not_reviewed'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {saving
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Play size={14} />
                  }
                  {currentIdx < total - 1 ? 'Save & Next' : 'Save'}
                </button>
              </div>

              <button
                onClick={handleComplete}
                disabled={!allDone || completing || saving || bulkRunning}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {completing
                  ? <Loader2 size={15} className="animate-spin" />
                  : <ClipboardCheck size={15} />
                }
                {completing
                  ? 'Completing…'
                  : allDone
                  ? 'Complete Assessment'
                  : `Complete (${total - reviewed} remaining)`
                }
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
