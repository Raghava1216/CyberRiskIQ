import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, CheckCircle, MinusCircle, XCircle, Ban, ChevronLeft, ChevronRight,
  Loader2, FileText, ClipboardCheck, AlertTriangle, Sparkles,
  BarChart2, Calendar, ShieldCheck, Database, ChevronDown, ChevronUp,
  Play,
} from 'lucide-react';
import type { AssessmentResult, ComplianceControl, ControlResultStatus } from '../lib/complianceTypes';
import { fetchResults, updateResult, completeAssessment } from '../lib/complianceData';
import {
  calculateCCMScore, fetchCCMData, fetchAllCCMData, saveCCMData, seedMockCCMData,
  type CCMControlData, type CCMScore, type TestResult, type EvidenceStatus, type MonitoringFreq,
} from '../lib/ccmEngine';

// ── Props ─────────────────────────────────────────────────────────────────────

interface AssessmentReviewPanelProps {
  assessmentId:  string;
  frameworkName: string;
  frameworkId:   string;
  assessedBy:    string;
  onClose:       () => void;
  onComplete:    (score: number) => void;
}

type AIPhase   = 'idle' | 'running' | 'done' | 'error';
type CCMPhase  = 'idle' | 'loading' | 'done' | 'error';

interface AIState {
  phase: AIPhase; error: string | null; finding: string; remediation: string; risk_level: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: ControlResultStatus; label: string; color: string; icon: React.ReactNode }[] = [
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
};

const TEST_RESULT_OPTS: { value: TestResult; label: string; color: string }[] = [
  { value: 'pass',       label: 'Pass',       color: 'text-emerald-400' },
  { value: 'partial',    label: 'Partial',    color: 'text-amber-400'   },
  { value: 'fail',       label: 'Fail',       color: 'text-red-400'     },
  { value: 'not_tested', label: 'Not Tested', color: 'text-slate-400'   },
];

const EVIDENCE_OPTS: { value: EvidenceStatus; label: string; color: string }[] = [
  { value: 'collected', label: 'Collected', color: 'text-emerald-400' },
  { value: 'partial',   label: 'Partial',   color: 'text-amber-400'   },
  { value: 'expired',   label: 'Expired',   color: 'text-orange-400'  },
  { value: 'missing',   label: 'Missing',   color: 'text-red-400'     },
];

const FREQ_OPTS: { value: MonitoringFreq; label: string }[] = [
  { value: 'continuous', label: 'Continuous' },
  { value: 'daily',      label: 'Daily'      },
  { value: 'weekly',     label: 'Weekly'     },
  { value: 'monthly',    label: 'Monthly'    },
  { value: 'quarterly',  label: 'Quarterly'  },
  { value: 'annual',     label: 'Annual'     },
  { value: 'ad_hoc',     label: 'Ad-hoc'     },
];

function statusBadge(s: ControlResultStatus) {
  if (s === 'compliant')      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
  if (s === 'partial')        return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
  if (s === 'noncompliant')   return 'bg-red-500/15 text-red-400 border-red-500/20';
  if (s === 'not_applicable') return 'bg-slate-700/40 text-slate-500 border-slate-600';
  return 'bg-slate-700/20 text-slate-600 border-slate-700';
}

function scoreBar(score: number) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold tabular-nums w-8 text-right text-slate-300">{score}</span>
    </div>
  );
}

// ── Groq AI helper ────────────────────────────────────────────────────────────

async function callGroq(prompt: string): Promise<{
  status: ControlResultStatus; score: number;
  finding: string; remediation: string; risk_level: string;
}> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 600,
      messages: [
        {
          role: 'system',
          content: 'You are a senior GRC auditor. Respond only in valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
  const data = await response.json();
  const raw  = data.choices?.[0]?.message?.content ?? '';
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const parsed  = JSON.parse(cleaned);
  return {
    status:      parsed.status      ?? 'partial',
    score:       parsed.score       ?? 50,
    finding:     parsed.finding     ?? '',
    remediation: parsed.remediation ?? '',
    risk_level:  parsed.risk_level  ?? 'medium',
  };
}

export function buildAIPrompt(
  framework: string, controlId: string, title: string,
  domain: string, question: string | null, guidance: string | null,
): string {
  const q = question?.trim() ?? guidance?.trim() ?? 'Is this control fully implemented and operating effectively?';
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

// ── Component ─────────────────────────────────────────────────────────────────

export default function AssessmentReviewPanel({
  assessmentId, frameworkName, frameworkId, assessedBy, onClose, onComplete,
}: AssessmentReviewPanelProps) {

  const [results,      setResults]      = useState<AssessmentResult[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [currentIdx,   setCurrentIdx]   = useState(0);
  const [status,       setStatus]       = useState<ControlResultStatus>('not_reviewed' as any);
  const [score,        setScore]        = useState('');
  const [evidence,     setEvidence]     = useState('');
  const [notes,        setNotes]        = useState('');
  const [saving,       setSaving]       = useState(false);

  // AI state
  const [aiStates,     setAiStates]     = useState<Record<string, AIState>>({});
  const [bulkAIRunning,setBulkAIRunning]= useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkTotal,    setBulkTotal]    = useState(0);
  const abortRef = useRef(false);

  // CCM state
  const [ccmData,      setCCMData]      = useState<Record<string, CCMControlData>>({});
  const [ccmScores,    setCCMScores]    = useState<Record<string, CCMScore>>({});
  const [ccmPhase,     setCCMPhase]     = useState<CCMPhase>('idle');
  const [ccmExpanded,  setCCMExpanded]  = useState(false);
  const [ccmEdit,      setCCMEdit]      = useState<Partial<CCMControlData>>({});
  const [bulkCCMRunning, setBulkCCMRunning] = useState(false);
  const [bulkCCMProgress, setBulkCCMProgress] = useState(0);

  const total      = results.length;
  const current    = results[currentIdx];
  const ctrl       = current?.control as ComplianceControl | undefined;
  const currentAI  = current ? aiStates[current.id] : undefined;
  const currentCCM = current ? ccmScores[ctrl?.control_id ?? ''] : undefined;
  const currentCCMData = current ? ccmData[ctrl?.control_id ?? ''] : undefined;

  // ── Load results ─────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    fetchResults(assessmentId)
      .then(async rows => {
        setResults(rows);
        // Seed mock CCM data and load it
        const controlIds = rows.map(r => (r.control as any)?.control_id ?? r.id);
        seedMockCCMData(controlIds, frameworkId);
        const allCCM = await fetchAllCCMData(controlIds, frameworkId);
        setCCMData(allCCM);
        // Pre-calculate all CCM scores
        const scores: Record<string, CCMScore> = {};
        controlIds.forEach(id => {
          const d = allCCM[id];
          scores[id] = d
            ? calculateCCMScore(d)
            : { score: 0, status: 'not_applicable' as any, test_component: 0, evidence_component: 0, monitoring_component: 0, recency_penalty: 0, breakdown: 'No CCM data', data_source: 'none' };
        });
        setCCMScores(scores);
      })
      .finally(() => setLoading(false));
  }, [assessmentId, frameworkId]);

  // Sync form when row changes
  useEffect(() => {
    const r = results[currentIdx];
    if (!r) return;
    setStatus(r.status ?? 'not_reviewed' as any);
    setScore(r.score != null ? String(r.score) : '');
    setEvidence(r.evidence ?? '');
    setNotes(r.notes ?? '');
    // Pre-fill CCM edit form from stored data
    const cid = (r.control as any)?.control_id ?? '';
    const d = ccmData[cid];
    if (d) setCCMEdit(d);
    else setCCMEdit({ test_result: 'not_tested', evidence_status: 'missing', monitoring_freq: 'ad_hoc' });
  }, [currentIdx, results, ccmData]);

  // ── CCM: score single control ─────────────────────────────────────────────

  const runCCMForRow = useCallback(async (row: AssessmentResult) => {
    const cid = (row.control as any)?.control_id ?? row.id;
    setCCMPhase('loading');
    try {
      const data = ccmData[cid] ?? {
        control_id:      cid,
        framework_id:    frameworkId,
        test_result:     (ccmEdit.test_result     ?? 'not_tested') as TestResult,
        evidence_status: (ccmEdit.evidence_status ?? 'missing')    as EvidenceStatus,
        monitoring_freq: (ccmEdit.monitoring_freq  ?? 'ad_hoc')    as MonitoringFreq,
        last_tested_date: ccmEdit.last_tested_date ?? null,
      };

      const ccmResult = calculateCCMScore(data);

      // Apply to assessment result
      await updateResult(row.id, {
        status:      ccmResult.status,
        score:       ccmResult.score,
        notes:       ccmResult.breakdown,
        reviewed_by: assessedBy,
      });

      setResults(prev => prev.map(r =>
        r.id === row.id
          ? { ...r, status: ccmResult.status, score: ccmResult.score, notes: ccmResult.breakdown }
          : r
      ));
      setCCMScores(prev => ({ ...prev, [cid]: ccmResult }));

      // Update form
      if (results[currentIdx]?.id === row.id) {
        setStatus(ccmResult.status);
        setScore(String(ccmResult.score));
        setNotes(ccmResult.breakdown);
      }

      setCCMPhase('done');
    } catch (e) {
      setCCMPhase('error');
    }
  }, [ccmData, ccmEdit, frameworkId, assessedBy, results, currentIdx]);

  const evaluateCCMCurrent = () => { if (current) runCCMForRow(current); };

  // ── CCM: bulk run ────────────────────────────────────────────────────────

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

  // ── CCM data save ─────────────────────────────────────────────────────────

  const saveCCMEdit = async () => {
    const cid = (current?.control as any)?.control_id ?? '';
    if (!cid) return;
    const updated: CCMControlData = {
      ...(ccmData[cid] ?? {}),
      control_id:      cid,
      framework_id:    frameworkId,
      test_result:     (ccmEdit.test_result     ?? 'not_tested') as TestResult,
      evidence_status: (ccmEdit.evidence_status ?? 'missing')    as EvidenceStatus,
      monitoring_freq: (ccmEdit.monitoring_freq  ?? 'ad_hoc')    as MonitoringFreq,
      last_tested_date: ccmEdit.last_tested_date ?? null,
      tested_by:       ccmEdit.tested_by ?? assessedBy,
      notes:           ccmEdit.notes ?? '',
    };
    await saveCCMData(updated);
    setCCMData(prev => ({ ...prev, [cid]: updated }));
    const newScore = calculateCCMScore(updated);
    setCCMScores(prev => ({ ...prev, [cid]: newScore }));
  };

  // ── AI: single + bulk ────────────────────────────────────────────────────

  const runAIForRow = useCallback(async (row: AssessmentResult) => {
    const ctrl = row.control as ComplianceControl | undefined;
    if (!ctrl) return;
    setAiStates(prev => ({ ...prev, [row.id]: { phase: 'running', error: null, finding: '', remediation: '', risk_level: '' } }));
    try {
      const prompt = buildAIPrompt(frameworkName, ctrl.control_id ?? ctrl.id, ctrl.title ?? '—', ctrl.domain ?? '—', ctrl.question ?? null, ctrl.guidance ?? ctrl.notes ?? null);
      const parsed = await callGroq(prompt);
      await updateResult(row.id, { status: parsed.status, score: parsed.score, notes: parsed.finding, evidence: parsed.remediation, reviewed_by: assessedBy });
      setResults(prev => prev.map(r => r.id === row.id ? { ...r, status: parsed.status, score: parsed.score, notes: parsed.finding, evidence: parsed.remediation } : r));
      setAiStates(prev => ({ ...prev, [row.id]: { phase: 'done', error: null, finding: parsed.finding, remediation: parsed.remediation, risk_level: parsed.risk_level } }));
      setCurrentIdx(idx => {
        if (results[idx]?.id === row.id) { setStatus(parsed.status); setScore(String(parsed.score)); setNotes(parsed.finding); setEvidence(parsed.remediation); }
        return idx;
      });
    } catch (err) {
      setAiStates(prev => ({ ...prev, [row.id]: { phase: 'error', error: (err as Error).message, finding: '', remediation: '', risk_level: '' } }));
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
      if (i < results.length - 1 && !abortRef.current) await new Promise(r => setTimeout(r, 2000));
    }
    setBulkAIRunning(false);
  }, [bulkAIRunning, results, runAIForRow]);

  // ── Save + navigate ──────────────────────────────────────────────────────

  const saveCurrentAndMove = async (direction: 'next' | 'prev' | 'stay') => {
    if (!current) return;
    setSaving(true);
    try {
      const sc = score !== '' ? parseInt(score, 10) : null;
      await updateResult(current.id, { status, score: sc, evidence, notes, reviewed_by: assessedBy });
      setResults(prev => prev.map(r => r.id === current.id ? { ...r, status, score: sc, evidence, notes } : r));
      if (direction === 'next' && currentIdx < total - 1) setCurrentIdx(i => i + 1);
      else if (direction === 'prev' && currentIdx > 0) setCurrentIdx(i => i - 1);
    } finally { setSaving(false); }
  };

  const handleComplete = async () => {
    await saveCurrentAndMove('stay');
    await completeAssessment(assessmentId);
    const reviewed = results.filter(r => r.status && r.status !== 'not_reviewed');
    const avg = reviewed.length
      ? Math.round(reviewed.reduce((s, r) => s + (r.score ?? (r.status === 'compliant' ? 100 : r.status === 'partial' ? 50 : 0)), 0) / reviewed.length)
      : 0;
    onComplete(avg);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const reviewedCount = results.filter(r => r.status && r.status !== ('not_reviewed' as any)).length;
  const pct = total > 0 ? Math.round((reviewedCount / total) * 100) : 0;

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-slate-900 border-l border-slate-700/60 flex flex-col z-40 shadow-2xl">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0">
        <div>
          <p className="text-slate-400 text-xs">{frameworkName} — Assessment</p>
          <p className="text-slate-500 text-xs">Reviewing controls · {assessedBy}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Progress */}
      <div className="px-5 py-3 border-b border-slate-800 flex-shrink-0 space-y-2">
        <div className="flex justify-between text-xs text-slate-500">
          <span>{reviewedCount}/{total} reviewed</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-500 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>

        {/* Progress dots */}
        {total > 0 && total <= 20 && (
          <div className="flex gap-0.5 h-2">
            {results.map((r, i) => (
              <div key={r.id} onClick={() => setCurrentIdx(i)} title={`${(r.control as any)?.control_id}: ${r.status}`}
                className={`flex-1 rounded-sm cursor-pointer transition-colors ${
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

        {/* Bulk action buttons */}
        <div className="flex items-center gap-2 pt-1 flex-wrap">

          {/* CCM Bulk — PRIMARY */}
          {!bulkCCMRunning ? (
            <button onClick={runBulkCCM} disabled={loading || results.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 text-xs font-medium transition-colors disabled:opacity-40">
              <BarChart2 size={12} />
              CCM Score All ({results.length})
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${Math.round((bulkCCMProgress / results.length) * 100)}%` }} />
              </div>
              <span className="text-xs text-cyan-400 tabular-nums">{bulkCCMProgress}/{results.length}</span>
              <button onClick={() => { abortRef.current = true; }} className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded border border-slate-700 hover:bg-slate-800">Stop</button>
            </div>
          )}

          {/* AI Bulk — SECONDARY */}
          {!bulkAIRunning ? (
            <button onClick={runBulkAI} disabled={loading || results.length === 0 || bulkCCMRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/25 text-purple-400 hover:bg-purple-500/20 text-xs font-medium transition-colors disabled:opacity-40">
              <Sparkles size={12} />
              AI Evaluate All
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${Math.round((bulkProgress / bulkTotal) * 100)}%` }} />
              </div>
              <span className="text-xs text-purple-400 tabular-nums">{bulkProgress}/{bulkTotal}</span>
              <button onClick={() => { abortRef.current = true; }} className="text-xs text-slate-500 hover:text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">Stop</button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-[10px] text-slate-600">
          <span className="flex items-center gap-1"><BarChart2 size={8} className="text-cyan-500" /> CCM: test result · evidence · monitoring frequency</span>
          <span className="flex items-center gap-1"><Sparkles size={8} className="text-purple-400" /> AI: Groq Llama 3.3 70B</span>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-cyan-500" />
        </div>
      ) : !current ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">No controls found</div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}
                  className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 transition-colors">
                  <ChevronLeft size={15} />
                </button>
                <span className="text-slate-500 text-xs tabular-nums">{currentIdx + 1} / {total}</span>
                <button onClick={() => setCurrentIdx(i => Math.min(total - 1, i + 1))} disabled={currentIdx === total - 1}
                  className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 transition-colors">
                  <ChevronRight size={15} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                {current.status !== ('not_reviewed' as any) && (
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
                <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">{ctrl?.domain ?? '—'}</span>
              </div>
              <h3 className="text-slate-100 font-semibold text-sm leading-snug">{ctrl?.title ?? '—'}</h3>
              {(ctrl?.question ?? ctrl?.guidance) && (
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <p className="text-xs font-medium text-amber-400/80 mb-1">Assessment question</p>
                  <p className="text-slate-400 text-xs leading-relaxed">{ctrl?.question ?? ctrl?.guidance}</p>
                </div>
              )}
            </div>

            {/* ── CCM SCORE PANEL — PRIMARY ─────────────────────────────── */}
            <div className="bg-slate-800/40 border border-cyan-500/20 rounded-xl overflow-hidden">

              {/* CCM header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <BarChart2 size={14} className="text-cyan-400" />
                  <span className="text-sm font-semibold text-slate-200">CCM Score</span>
                  {currentCCM?.data_source === 'ccm' && (
                    <span className="text-[10px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                      {currentCCM.score}/100
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={evaluateCCMCurrent} disabled={ccmPhase === 'loading'}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 text-xs font-medium transition-colors disabled:opacity-40">
                    {ccmPhase === 'loading'
                      ? <><Loader2 size={11} className="animate-spin" /> Scoring…</>
                      : <><BarChart2 size={11} /> Apply CCM Score</>
                    }
                  </button>
                  <button onClick={() => setCCMExpanded(e => !e)}
                    className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
                    {ccmExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* CCM score bar */}
              {currentCCM?.data_source === 'ccm' && (
                <div className="px-4 py-3 space-y-2">
                  {scoreBar(currentCCM.score)}
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    {[
                      { label: 'Test Result', val: currentCCM.test_component, icon: <ShieldCheck size={9} /> },
                      { label: 'Evidence',    val: currentCCM.evidence_component, icon: <FileText size={9} /> },
                      { label: 'Monitoring',  val: currentCCM.monitoring_component, icon: <Database size={9} /> },
                    ].map(c => (
                      <div key={c.label} className="bg-slate-900/50 rounded-lg p-2">
                        <div className="flex items-center gap-1 text-slate-500 mb-1">{c.icon}{c.label}</div>
                        <div className={`font-bold ${c.val >= 80 ? 'text-emerald-400' : c.val >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{c.val}</div>
                      </div>
                    ))}
                  </div>
                  {currentCCM.recency_penalty > 0 && (
                    <p className="text-[10px] text-orange-400/70 flex items-center gap-1">
                      <AlertTriangle size={9} /> Recency penalty: -{currentCCM.recency_penalty} pts
                    </p>
                  )}
                </div>
              )}

              {currentCCM?.data_source === 'none' && (
                <p className="px-4 py-3 text-xs text-slate-500">No CCM data yet — fill in the form below and click Apply CCM Score</p>
              )}

              {/* CCM edit form */}
              {ccmExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-700/40 pt-3">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">CCM Data Input</p>

                  {/* Test Result */}
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block">Test Result <span className="text-cyan-400">(50% weight)</span></label>
                    <div className="flex gap-1.5 flex-wrap">
                      {TEST_RESULT_OPTS.map(o => (
                        <button key={o.value} onClick={() => setCCMEdit(e => ({ ...e, test_result: o.value }))}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                            ccmEdit.test_result === o.value
                              ? `${o.color} bg-slate-700/60 border-slate-500`
                              : 'text-slate-500 border-slate-700 hover:border-slate-500'
                          }`}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Evidence */}
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block">Evidence Status <span className="text-cyan-400">(30% weight)</span></label>
                    <div className="flex gap-1.5 flex-wrap">
                      {EVIDENCE_OPTS.map(o => (
                        <button key={o.value} onClick={() => setCCMEdit(e => ({ ...e, evidence_status: o.value }))}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                            ccmEdit.evidence_status === o.value
                              ? `${o.color} bg-slate-700/60 border-slate-500`
                              : 'text-slate-500 border-slate-700 hover:border-slate-500'
                          }`}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Monitoring frequency */}
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block">Monitoring Frequency <span className="text-cyan-400">(20% weight)</span></label>
                    <div className="flex gap-1.5 flex-wrap">
                      {FREQ_OPTS.map(o => (
                        <button key={o.value} onClick={() => setCCMEdit(e => ({ ...e, monitoring_freq: o.value }))}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                            ccmEdit.monitoring_freq === o.value
                              ? 'text-cyan-400 bg-slate-700/60 border-cyan-500/40'
                              : 'text-slate-500 border-slate-700 hover:border-slate-500'
                          }`}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Last tested date */}
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Calendar size={9} /> Last Tested Date
                    </label>
                    <input type="date" value={ccmEdit.last_tested_date ?? ''}
                      onChange={e => setCCMEdit(prev => ({ ...prev, last_tested_date: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <button onClick={saveCCMEdit}
                    className="w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition-colors">
                    Save CCM Data
                  </button>
                </div>
              )}
            </div>

            {/* ── AI PANEL — SECONDARY ──────────────────────────────────── */}
            <div className="bg-slate-800/30 border border-purple-500/15 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={13} className="text-purple-400" />
                  <span className="text-xs font-medium text-slate-300">AI Suggestion</span>
                  <span className="text-[10px] text-slate-600">· supplementary only</span>
                </div>
                <button onClick={evaluateAICurrent} disabled={currentAI?.phase === 'running' || bulkAIRunning || bulkCCMRunning}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 text-xs font-medium transition-colors disabled:opacity-40">
                  {currentAI?.phase === 'running'
                    ? <><Loader2 size={11} className="animate-spin" /> Running…</>
                    : <><Sparkles size={11} /> AI Evaluate</>
                  }
                </button>
              </div>

              {currentAI?.phase === 'done' && (
                <div className="px-4 pb-4 space-y-2">
                  {currentAI.finding && (
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-[10px] text-purple-400 font-medium uppercase tracking-wider mb-1">AI Finding</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{currentAI.finding}</p>
                    </div>
                  )}
                  {currentAI.remediation && (
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-[10px] text-amber-400 font-medium uppercase tracking-wider mb-1">AI Recommendation</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{currentAI.remediation}</p>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-600 flex items-center gap-1">
                    <Sparkles size={8} /> Groq · Llama 3.3 70B · For reference only — CCM score takes precedence
                  </p>
                </div>
              )}
              {currentAI?.phase === 'error' && (
                <p className="px-4 pb-3 text-xs text-red-400 flex items-center gap-1">
                  <AlertTriangle size={10} /> {currentAI.error}
                </p>
              )}
              {(!currentAI || currentAI.phase === 'idle') && (
                <p className="px-4 pb-3 text-[10px] text-slate-600">Click AI Evaluate for a supplementary suggestion — use CCM Score as the primary source</p>
              )}
            </div>

            {/* ── ASSESSMENT STATUS ─────────────────────────────────────── */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assessment Status</p>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setStatus(opt.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      status === opt.value ? opt.color : 'border-slate-700/60 text-slate-500 hover:border-slate-600 hover:text-slate-400'
                    }`}>
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Evidence */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardCheck size={11} /> Evidence
              </label>
              <textarea value={evidence} onChange={e => setEvidence(e.target.value)} rows={2}
                placeholder="Links, document names, or artifact descriptions…"
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2.5 text-sm text-slate-300 placeholder:text-slate-600 outline-none focus:border-cyan-500/60 transition-colors resize-none"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={11} /> Notes
              </label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Observations, remediation actions, follow-up items…"
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2.5 text-sm text-slate-300 placeholder:text-slate-600 outline-none focus:border-cyan-500/60 transition-colors resize-none"
              />
            </div>

          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-slate-800 flex-shrink-0 space-y-2">
            <div className="flex gap-2">
              <button onClick={() => saveCurrentAndMove('prev')} disabled={currentIdx === 0 || saving}
                className="px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 text-sm disabled:opacity-30 transition-colors">
                ← Prev
              </button>
              <button onClick={() => saveCurrentAndMove('stay')} disabled={saving}
                className="flex-1 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors">
                {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Skip'}
              </button>
              <button onClick={() => saveCurrentAndMove('next')} disabled={currentIdx === total - 1 || saving}
                className="px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 text-sm disabled:opacity-30 transition-colors">
                → Save & Next
              </button>
            </div>
            <button onClick={handleComplete} disabled={saving}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm transition-colors disabled:opacity-40">
              ✓ Complete ({total - reviewedCount} remaining)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
