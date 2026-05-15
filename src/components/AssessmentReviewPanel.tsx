import { useState, useEffect, useCallback } from 'react';
import {
  X, CheckCircle, MinusCircle, XCircle, Ban, ChevronLeft, ChevronRight,
  Loader2, Flag, FileText, ClipboardCheck, AlertTriangle,
} from 'lucide-react';
import type { AssessmentResult, ComplianceControl, ControlResultStatus } from '../lib/complianceTypes';
import { fetchResults, updateResult, completeAssessment } from '../lib/complianceData';

interface AssessmentReviewPanelProps {
  assessmentId: string;
  frameworkName: string;
  assessedBy: string;
  onClose: () => void;
  onComplete: (score: number) => void;
}

const STATUS_OPTIONS: { value: ControlResultStatus; label: string; color: string; icon: React.ReactNode }[] = [
  { value: 'compliant',      label: 'Compliant',      color: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400', icon: <CheckCircle size={14} /> },
  { value: 'partial',        label: 'Partial',        color: 'border-amber-500/60 bg-amber-500/10 text-amber-400',       icon: <MinusCircle size={14} /> },
  { value: 'noncompliant',   label: 'Non-Compliant',  color: 'border-red-500/60 bg-red-500/10 text-red-400',             icon: <XCircle size={14} /> },
  { value: 'not_applicable', label: 'N/A',            color: 'border-slate-600 bg-slate-700/40 text-slate-400',          icon: <Ban size={14} /> },
];

const defaultScoreForStatus = (s: ControlResultStatus) =>
  s === 'compliant' ? 100 : s === 'partial' ? 50 : s === 'noncompliant' ? 0 : null;

function statusBadge(s: ControlResultStatus) {
  if (s === 'compliant')      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
  if (s === 'partial')        return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
  if (s === 'noncompliant')   return 'bg-red-500/15 text-red-400 border-red-500/20';
  if (s === 'not_applicable') return 'bg-slate-700/40 text-slate-500 border-slate-600';
  return 'bg-slate-700/20 text-slate-600 border-slate-700';
}

export default function AssessmentReviewPanel({
  assessmentId,
  frameworkName,
  assessedBy,
  onClose,
  onComplete,
}: AssessmentReviewPanelProps) {
  const [results, setResults]       = useState<AssessmentResult[]>([]);
  const [loading, setLoading]       = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [saving, setSaving]         = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Per-control edit state
  const [status,     setStatus]     = useState<ControlResultStatus>('not_reviewed');
  const [score,      setScore]      = useState<string>('');
  const [evidence,   setEvidence]   = useState('');
  const [notes,      setNotes]      = useState('');

  const loadResults = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchResults(assessmentId);
      // Sort so we always go in control sort_order
      rows.sort((a, b) => {
        const ao = a.control?.sort_order ?? 0;
        const bo = b.control?.sort_order ?? 0;
        return ao - bo;
      });
      setResults(rows);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => { loadResults(); }, [loadResults]);

  // Populate form when current changes
  useEffect(() => {
    const r = results[currentIdx];
    if (!r) return;
    setStatus(r.status);
    setScore(r.score != null ? String(r.score) : '');
    setEvidence(r.evidence ?? '');
    setNotes(r.notes ?? '');
  }, [currentIdx, results]);

  const current = results[currentIdx];
  const ctrl: ComplianceControl | undefined = current?.control;

  const reviewed = results.filter(r => r.status !== 'not_reviewed').length;
  const total    = results.length;
  const pct      = total > 0 ? Math.round((reviewed / total) * 100) : 0;
  const allDone  = reviewed === total && total > 0;

  const handleStatusClick = (s: ControlResultStatus) => {
    setStatus(s);
    const def = defaultScoreForStatus(s);
    setScore(def != null ? String(def) : '');
  };

  const saveCurrentAndMove = async (direction: 'next' | 'prev' | 'stay') => {
    if (!current) return;
    setSaving(true);
    setError(null);
    try {
      await updateResult(current.id, {
        status,
        score: score !== '' ? Number(score) : null,
        evidence: evidence.trim(),
        notes:    notes.trim(),
        reviewed_by: assessedBy,
      });
      // Mutate local copy
      setResults(prev => prev.map(r =>
        r.id === current.id
          ? { ...r, status, score: score !== '' ? Number(score) : null, evidence, notes, reviewed_by: assessedBy }
          : r
      ));
      if (direction === 'next' && currentIdx < total - 1) setCurrentIdx(i => i + 1);
      if (direction === 'prev' && currentIdx > 0)         setCurrentIdx(i => i - 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    // Save current first
    if (current && status !== 'not_reviewed') {
      await saveCurrentAndMove('stay');
    }
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

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
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
        <div className="px-5 py-3 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5 text-xs">
            <span className="text-slate-400">{reviewed} of {total} reviewed</span>
            <span className="text-slate-400 font-medium tabular-nums">{pct}%</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          {/* Mini status strip */}
          {results.length > 0 && (
            <div className="flex gap-px mt-2 rounded overflow-hidden h-1">
              {results.map((r, i) => (
                <div
                  key={r.id}
                  onClick={() => setCurrentIdx(i)}
                  className={`flex-1 cursor-pointer transition-colors ${
                    r.status === 'compliant'      ? 'bg-emerald-500' :
                    r.status === 'partial'        ? 'bg-amber-500' :
                    r.status === 'noncompliant'   ? 'bg-red-500' :
                    r.status === 'not_applicable' ? 'bg-slate-600' :
                    i === currentIdx              ? 'bg-cyan-500/50' : 'bg-slate-700'
                  }`}
                  title={`${r.control?.control_id ?? ''}: ${r.status}`}
                />
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-cyan-500" />
          </div>
        ) : !current ? (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">No controls found</div>
        ) : (
          <>
            {/* Control info */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Navigation + index */}
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
                {current.status !== 'not_reviewed' && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusBadge(current.status)}`}>
                    {STATUS_OPTIONS.find(o => o.value === current.status)?.label ?? current.status}
                  </span>
                )}
              </div>

              {/* Control header */}
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="font-mono text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    {ctrl?.control_id ?? '—'}
                  </span>
                  <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">{ctrl?.domain ?? '—'}</span>
                </div>
                <h3 className="text-slate-100 font-semibold text-sm leading-snug">{ctrl?.title ?? '—'}</h3>
                {ctrl?.guidance && (
                  <p className="text-slate-500 text-xs mt-2 leading-relaxed">{ctrl.guidance}</p>
                )}
              </div>

              {/* Status selector */}
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">Assessment Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleStatusClick(opt.value)}
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

              {/* Score (only when not N/A) */}
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

            {/* Footer actions */}
            <div className="flex-shrink-0 border-t border-slate-800 px-5 py-4 bg-slate-900/80 space-y-3">
              {/* Prev / Skip / Save+Next row */}
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
                  className="px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={() => saveCurrentAndMove('next')}
                  disabled={saving || status === 'not_reviewed'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                  {currentIdx < total - 1 ? 'Save & Next' : 'Save'}
                </button>
              </div>

              {/* Complete */}
              <button
                onClick={handleComplete}
                disabled={!allDone || completing || saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {completing ? <Loader2 size={15} className="animate-spin" /> : <ClipboardCheck size={15} />}
                {completing ? 'Completing…' : allDone ? 'Complete Assessment' : `Complete (${total - reviewed} remaining)`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
