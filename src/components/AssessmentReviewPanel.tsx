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
  { value: 'compliant',      label: 'Compliant',     color: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400', icon: <CheckCircle size={14} /> },
  { value: 'partial',        label: 'Partial',        color: 'border-amber-500/60 bg-amber-500/10 text-amber-400',       icon: <MinusCircle size={14} /> },
  { value: 'noncompliant',   label: 'Non-Compliant',  color: 'border-red-500/60 bg-red-500/10 text-red-400',             icon: <XCircle size={14} /> },
  { value: 'not_applicable', label: 'N/A',            color: 'border-slate-600 bg-slate-700/40 text-slate-400',          icon: <Ban size={14} /> },
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

// ── AI prompt ─────────────────────────────────────────────────────────────────

// ── AI prompt builder — exported so it can be tested independently ────────────

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

  return `You are a senior GRC auditor conducting a compliance assessment for ${framework}.

Control ID: ${controlId}
Title: "${title}"
Domain: ${domain}
Assessment question: ${assessmentQuestion}

Assess this control against a typical enterprise environment. Respond ONLY with valid JSON — no markdown, no explanation outside the object:

{
  "status": "compliant" | "partial" | "noncompliant",
  "score": <integer 0–100>,
  "risk_level": "none" | "low" | "medium" | "high" | "critical",
  "finding": "<2–3 sentence factual finding describing what was observed>",
  "remediation": "<2–3 sentence specific actionable remediation with tools or timeframes>",
  "due_date": "<ISO date 30–90 days from today if partial or noncompliant, else null>"
}

Scoring rules:
- 85–100 → compliant · 50–84 → partial · 0–49 → noncompliant
- risk_level: none or low for compliant; medium for partial; high or critical for noncompliant
- finding: realistic enterprise observation referencing specific evidence types
- remediation: concrete steps referencing specific tools or standards`;
}

/*function buildAIPrompt(
  framework: string,
  controlId: string,
  title: string,
  domain: string,
  guidance: string,
): string {
  return `You are a senior GRC auditor conducting a compliance assessment for ${framework}.

Control ID: ${controlId}
Title: "${title}"
Domain: ${domain}
Assessor guidance: ${guidance || 'No additional guidance provided.'}

Assess this control against a typical enterprise environment. Respond ONLY with valid JSON — no markdown, no explanation outside the object:

{
  "status": "compliant" | "partial" | "noncompliant",
  "score": <integer 0–100>,
  "risk_level": "none" | "low" | "medium" | "high" | "critical",
  "finding": "<2–3 sentence factual finding describing what was observed>",
  "remediation": "<2–3 sentence specific actionable remediation with tools/timeframes>",
  "due_date": "<ISO date 30–90 days from today if partial or noncompliant, else null>"
}

Scoring rules:
- 85–100 → compliant · 50–84 → partial · 0–49 → noncompliant
- risk_level: none/low for compliant; medium for partial; high/critical for noncompliant
- finding: realistic enterprise observation, reference specific evidence types
- remediation: concrete steps, reference specific tools or standards`;
}*/

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

  // Per-control form state
  const [status,   setStatus]   = useState<ControlResultStatus>('not_reviewed');
  const [score,    setScore]    = useState<string>('');
  const [evidence, setEvidence] = useState('');
  const [notes,    setNotes]    = useState('');

  // AI state keyed by result row id
  const [aiStates, setAiStates] = useState<Record<string, AIState>>({});

  // Bulk run state
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

  // Populate form when navigating between controls
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

    // Guard: control didn't join
    if (!ctrl) {
      setAiStates(prev => ({
        ...prev,
        [row.id]: {
          phase:       'error',
          error:       `Control data missing for result ${row.id}. Check fetchResults join.`,
          finding:     '',
          remediation: '',
          risk_level:  '',
        },
      }));
      return;
    }

    setAiStates(prev => ({
      ...prev,
      [row.id]: { phase: 'running', error: null, finding: '', remediation: '', risk_level: '' },
    }));

    try {
      const res = await fetch('/api/anthropic/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages:   [{
            role:    'user',
            content: buildAIPrompt(
				frameworkName,
				ctrl.control_id ?? ctrl.id,
				ctrl.title      ?? '—',
				ctrl.domain     ?? '—',
				ctrl.question   ?? null,
				ctrl.guidance   ?? ctrl.notes ?? null,
    		),
          }],
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
      }

      const data = await res.json();

      const textBlock = (data.content as { type: string; text?: string }[])
        ?.find(b => b.type === 'text');
      if (!textBlock?.text) throw new Error('No text block in API response');

      const parsed = JSON.parse(
        textBlock.text.replace(/```json|```/g, '').trim()
      ) as {
        status:      ControlResultStatus;
        score:       number;
        risk_level:  string;
        finding:     string;
        remediation: string;
        due_date:    string | null;
      };

      // Persist to Supabase
      await updateResult(row.id, {
        status:      parsed.status,
        score:       parsed.score,
        notes:       parsed.finding,
        evidence:    parsed.remediation,
        reviewed_by: assessedBy,
      });

      // Update local results
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

      // If this control is currently on screen, sync form fields
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
          phase:       'error',
          error:       (err as Error).message,
          finding:     '',
          remediation: '',
          risk_level:  '',
        },
      }));
    }
  }, [frameworkName, assessedBy, results]);

  // Evaluate current control only
  const evaluateCurrent = () => {
    const row = results[currentIdx];
    if (row) runAIForRow(row);
  };

  // ── AI: bulk run all controls ──────────────────────────────────────────────

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
                  {ctrl?.title ?? ctrl?.name ?? '—'}
                </h3>
                /*{(ctrl?.guidance ?? ctrl?.notes) && (
                  <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                    {ctrl?.guidance ?? ctrl?.notes}
                  </p>
                )}*/
				{/* Assessment question — shown to assessor during review */}
				{(ctrl?.question ?? ctrl?.guidance) && (
				  <div className="mt-3 pt-3 border-t border-slate-700/50">
					<p className="text-xs font-medium text-amber-400/80 mb-1">Assessment question</p>
					<p className="text-slate-400 text-xs leading-relaxed">
					  {ctrl?.question ?? ctrl?.guidance}
					</p>
				  </div>
				)}
              </div>

              {/* Debug panel — remove after join is confirmed working */}
              {import.meta.env.DEV && current && (
                <div className="bg-slate-950 border border-slate-600 rounded-lg p-3 text-xs font-mono text-slate-400 space-y-1">
                  <p className="text-slate-300 font-medium">Debug — current result row</p>
                  <p>result.id: <span className="text-cyan-400">{current.id}</span></p>
                  <p>result.control_id: <span className="text-cyan-400">{current.control_id}</span></p>
                  <p>result.control:{' '}
                    <span className={current.control ? 'text-emerald-400' : 'text-red-400'}>
                      {current.control
                        ? `✓ joined — ${current.control.title ?? current.control.name}`
                        : '✗ NULL — join failed'}
                    </span>
                  </p>
                  <p>aiState.phase: <span className="text-amber-400">{currentAI?.phase ?? 'no state'}</span></p>
                  {currentAI?.error && <p className="text-red-400">error: {currentAI.error}</p>}
                </div>
              )}

              {/* AI Evaluate this control button */}
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