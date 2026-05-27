import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, XCircle, MinusCircle, PlayCircle, ClipboardList,
  RefreshCw, ChevronRight, Calendar, User, Clock, AlertTriangle,
} from 'lucide-react';
import type { ComplianceFramework, ComplianceAssessment } from '../lib/complianceTypes';
import type { RunAssessmentForm } from '../lib/complianceTypes';
import { generateComplianceReport } from '../lib/certificateExport';
import {
  fetchFrameworks, fetchAssessments, fetchControls, createAssessment,fetchResults,
} from '../lib/complianceData';
import RunAssessmentModal from '../components/RunAssessmentModal';
import AssessmentReviewPanel from '../components/AssessmentReviewPanel';
import CertificateRegistry from '../components/CertificateRegistry';

// ── Sub-components ──────────────────────────────────────────────────────────

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f97316' : '#ef4444';
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth="7" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize="14" fontWeight="bold">
        {score}%
      </text>
    </svg>
  );
}

function ControlBar({ compliant, partial, noncompliant }: { compliant: number; partial: number; noncompliant: number }) {
  const total = compliant + partial + noncompliant;
  if (total === 0) return <div className="h-2 bg-slate-700/50 rounded-full" />;
  return (
    <div className="flex rounded-full overflow-hidden h-2 gap-px">
      {compliant > 0    && <div className="bg-emerald-500 transition-all" style={{ width: `${(compliant / total) * 100}%` }} />}
      {partial > 0      && <div className="bg-amber-500 transition-all"   style={{ width: `${(partial / total) * 100}%` }} />}
      {noncompliant > 0 && <div className="bg-red-500 transition-all"     style={{ width: `${(noncompliant / total) * 100}%` }} />}
    </div>
  );
}

const categoryColors: Record<string, string> = {
  Security: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  Privacy:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  Industry: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  Regional: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtTime(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function statusBadge(s: string) {
  if (s === 'completed')  return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
  if (s === 'in_progress') return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
  return 'bg-slate-700/40 text-slate-500 border-slate-600';
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function Compliance() {
  const [frameworks, setFrameworks]       = useState<ComplianceFramework[]>([]);
  const [loadingFw, setLoadingFw]         = useState(true);
  const [fwError, setFwError]             = useState<string | null>(null);

  const [selectedFwId, setSelectedFwId]   = useState<string | null>(null);
  const [assessments, setAssessments]     = useState<ComplianceAssessment[]>([]);
  const [loadingAss, setLoadingAss]       = useState(false);

  const [runModalOpen, setRunModalOpen]   = useState(false);
  const [preselectedId, setPreselectedId] = useState<string | undefined>(undefined);

  const [activeAssessment, setActiveAssessment] = useState<{
    id: string; frameworkName: string; assessedBy: string;
  } | null>(null);

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const loadFrameworks = useCallback(async () => {
    setLoadingFw(true);
    setFwError(null);
    try {
      const data = await fetchFrameworks();
      setFrameworks(data);
    } catch (e) {
      setFwError((e as Error).message);
    } finally {
      setLoadingFw(false);
    }
  }, []);

  useEffect(() => { loadFrameworks(); }, [loadFrameworks]);

  const loadAssessments = useCallback(async (fwId: string) => {
    setLoadingAss(true);
    try {
      const data = await fetchAssessments(fwId);
      setAssessments(data);
    } catch {
      setAssessments([]);
    } finally {
      setLoadingAss(false);
    }
  }, []);

  const handleFrameworkClick = (fw: ComplianceFramework) => {
    if (selectedFwId === fw.id) {
      setSelectedFwId(null);
      setAssessments([]);
    } else {
      setSelectedFwId(fw.id);
      loadAssessments(fw.id);
    }
  };

  const handleRunAssessment = (preId?: string) => {
    setPreselectedId(preId);
    setRunModalOpen(true);
  };

  const handleStartAssessment = async (form: RunAssessmentForm) => {
    const controls = await fetchControls(form.framework_id);
    const assessmentId = await createAssessment(form, controls);
    const fw = frameworks.find(f => f.id === form.framework_id);
    setRunModalOpen(false);
    setActiveAssessment({
      id: assessmentId,
      frameworkName: fw?.name ?? 'Unknown Framework',
      assessedBy: form.assessed_by,
    });
  };

  /*const handleAssessmentComplete = async (score: number) => {
    setActiveAssessment(null);
    showToast(`Assessment completed! Overall score: ${score}%`);
    await loadFrameworks();
    if (selectedFwId) loadAssessments(selectedFwId);
  };*/
  
  const handleAssessmentComplete = async (score: number) => {
    setActiveAssessment(null);
    showToast(`Assessment completed! Overall score: ${score}%`);
    await loadFrameworks();
    if (selectedFwId) loadAssessments(selectedFwId);
  };

  const selectedFw = frameworks.find(f => f.id === selectedFwId);
  const avgScore   = frameworks.length > 0
    ? Math.round(frameworks.reduce((s, f) => s + f.score, 0) / frameworks.length)
    : 0;
  const totalControls   = frameworks.reduce((s, f) => s + f.controls_total, 0);
  const totalCompliant  = frameworks.reduce((s, f) => s + f.controls_compliant, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-screen-2xl">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium transition-all ${
          toast.ok
            ? 'bg-emerald-900/90 border-emerald-500/30 text-emerald-300'
            : 'bg-red-900/90 border-red-500/30 text-red-300'
        }`}>
          {toast.ok ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-slate-100 font-bold text-xl">Compliance Management</h2>
          <p className="text-slate-500 text-sm">
            {frameworks.length} frameworks · {totalControls} controls · Average {avgScore}% compliant
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadFrameworks}
            disabled={loadingFw}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loadingFw ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => handleRunAssessment()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm transition-colors"
          >
            <PlayCircle size={15} />
            Run Assessment
          </button>
        </div>
      </div>

      {/* Error banner */}
      {fwError && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          <AlertTriangle size={16} className="flex-shrink-0" />
          {fwError}
        </div>
      )}

      {/* Summary cards */}
      {!loadingFw && frameworks.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Avg Compliance',     value: `${avgScore}%`,                      color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
            { label: 'Controls Compliant', value: `${totalCompliant}/${totalControls}`, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Frameworks Active',  value: String(frameworks.length),            color: 'text-slate-300',   bg: 'bg-slate-500/10 border-slate-500/20' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-slate-400 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {loadingFw && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-5 animate-pulse h-40" />
          ))}
        </div>
      )}

      {/* Framework cards */}
      {!loadingFw && frameworks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {frameworks.map(fw => {
            const active = selectedFwId === fw.id;
            return (
              <div
                key={fw.id}
                className={`bg-slate-800/50 border rounded-xl overflow-hidden transition-all ${
                  active ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <button
                  className="w-full text-left p-5"
                  onClick={() => handleFrameworkClick(fw)}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <ScoreRing score={fw.score} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-slate-100 font-semibold">{fw.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded border ${categoryColors[fw.category] ?? ''}`}>{fw.category}</span>
                      </div>
                      <p className="text-slate-500 text-xs">v{fw.version} · {fw.controls_total} controls</p>
                      <ChevronRight size={14} className={`text-slate-600 mt-1 transition-transform ${active ? 'rotate-90 text-cyan-400' : ''}`} />
                    </div>
                  </div>
                  <ControlBar compliant={fw.controls_compliant} partial={fw.controls_partial} noncompliant={fw.controls_noncompliant} />
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="flex items-center gap-1 text-emerald-400"><CheckCircle size={12} /> {fw.controls_compliant}</span>
                    <span className="flex items-center gap-1 text-amber-400"><MinusCircle size={12} /> {fw.controls_partial}</span>
                    <span className="flex items-center gap-1 text-red-400"><XCircle size={12} /> {fw.controls_noncompliant}</span>
                  </div>
                </button>

                {/* Run assessment shortcut */}
                <div className="px-5 pb-4 pt-0">
                  <button
                    onClick={() => handleRunAssessment(fw.id)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/8 text-cyan-400 hover:bg-cyan-500/15 text-xs font-medium transition-colors"
                  >
                    <PlayCircle size={12} /> Run Assessment
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assessment history panel */}
      {selectedFwId && selectedFw && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-slate-400" />
              <h3 className="text-slate-100 font-semibold">{selectedFw.name} — Assessment History</h3>
            </div>
            <button
              onClick={() => handleRunAssessment(selectedFwId)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-xs transition-colors"
            >
              <PlayCircle size={12} /> New Assessment
            </button>
          </div>

          {loadingAss ? (
            <div className="px-5 py-8 text-center">
              <RefreshCw size={20} className="animate-spin text-cyan-500 mx-auto" />
            </div>
          ) : assessments.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <ClipboardList size={32} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No assessments yet for {selectedFw.name}</p>
              <p className="text-slate-600 text-xs mt-1">Run your first assessment to track compliance posture over time</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {assessments.map(a => (
                <div key={a.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusBadge(a.status)}`}>
                        {a.status === 'in_progress' ? 'In Progress' : a.status === 'completed' ? 'Completed' : 'Cancelled'}
                      </span>
                      {a.notes && <span className="text-slate-500 text-xs truncate max-w-xs">{a.notes}</span>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1"><User size={11} /> {a.assessed_by}</span>
                      <span className="flex items-center gap-1"><Calendar size={11} /> {fmtDate(a.started_at)}</span>
                      {a.completed_at && (
                        <span className="flex items-center gap-1"><Clock size={11} /> Completed {fmtTime(a.completed_at)}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {a.overall_score != null ? (
                      <div>
                        <p className={`text-lg font-bold tabular-nums ${
                          a.overall_score >= 80 ? 'text-emerald-400' :
                          a.overall_score >= 60 ? 'text-amber-400' : 'text-red-400'
                        }`}>{a.overall_score}%</p>
                        <p className="text-slate-600 text-xs">overall</p>
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs">pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals & panels */}
      {runModalOpen && (
        <RunAssessmentModal
          frameworks={frameworks}
          preselectedId={preselectedId}
          onClose={() => setRunModalOpen(false)}
          onStart={handleStartAssessment}
        />
      )}

      {activeAssessment && (
        <AssessmentReviewPanel
          assessmentId={activeAssessment.id}
          frameworkName={activeAssessment.frameworkName}
          assessedBy={activeAssessment.assessedBy}
          onClose={() => setActiveAssessment(null)}
          onComplete={handleAssessmentComplete}
        />
      )}
    </div>
  );
}
