import { useState } from 'react';
import { X, ChevronDown, Loader2, PlayCircle, Info, Shield, Lock, CreditCard, FileText, Heart, Globe } from 'lucide-react';
import type { ComplianceFramework, RunAssessmentForm } from '../lib/complianceTypes';

interface RunAssessmentModalProps {
  frameworks: ComplianceFramework[];
  preselectedId?: string;
  onClose: () => void;
  onStart: (form: RunAssessmentForm) => Promise<void>;
}

const ASSESSORS = [
  'Alice Chen', 'Bob Martinez', 'Carol Smith', 'David Lee', 'Eva Wilson',
  'Frank Zhang', 'Grace Kim', 'CISO Office', 'SecOps Team', 'Compliance Team',
  'External Auditor', 'GRC Analyst',
];

const categoryColors: Record<string, string> = {
  Security: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  Privacy:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  Industry: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  Regional: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

const fwIcon = (name: string) => {
  if (name.includes('NIST'))   return Shield;
  if (name.includes('ISO'))    return Lock;
  if (name.includes('PCI'))    return CreditCard;
  if (name.includes('GDPR'))   return Globe;
  if (name.includes('HIPAA'))  return Heart;
  return FileText;
};

const scoreColor = (s: number) =>
  s >= 80 ? 'text-emerald-400' : s >= 60 ? 'text-amber-400' : 'text-red-400';

export default function RunAssessmentModal({
  frameworks,
  preselectedId,
  onClose,
  onStart,
}: RunAssessmentModalProps) {
  const [selectedId, setSelectedId] = useState(preselectedId ?? '');
  const [assessedBy, setAssessedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selected = frameworks.find(f => f.id === selectedId);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedId)       e.framework = 'Select a framework to assess';
    if (!assessedBy.trim()) e.assessedBy = 'Assessor name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleStart = async () => {
    if (!validate()) return;
    setLoading(true);
    setError(null);
    try {
      await onStart({ framework_id: selectedId, assessed_by: assessedBy.trim(), notes: notes.trim() });
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
              <PlayCircle size={16} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-slate-100 font-bold text-base">Run Compliance Assessment</h2>
              <p className="text-slate-500 text-xs">Select a framework and walk through each control to score your posture</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* How it works banner */}
          <div className="flex items-start gap-3 bg-cyan-500/8 border border-cyan-500/20 rounded-xl px-4 py-3">
            <Info size={15} className="text-cyan-400 flex-shrink-0 mt-0.5" />
            <p className="text-slate-400 text-xs leading-relaxed">
              An assessment creates a snapshot of your compliance posture for one framework.
              After starting, a review panel opens where you mark each control as
              <span className="text-emerald-400 font-medium"> Compliant</span>,
              <span className="text-amber-400 font-medium"> Partial</span>, or
              <span className="text-red-400 font-medium"> Non-Compliant</span>,
              add evidence and notes, then complete to compute your score.
            </p>
          </div>

          {/* Framework selector */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-3">
              Select Framework <span className="text-red-400">*</span>
            </label>
            <div className="space-y-2">
              {frameworks.map(fw => {
                const Icon = fwIcon(fw.name);
                const active = selectedId === fw.id;
                return (
                  <button
                    key={fw.id}
                    type="button"
                    onClick={() => { setSelectedId(fw.id); setErrors(e => ({ ...e, framework: '' })); }}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-all ${
                      active
                        ? 'border-cyan-500/50 bg-cyan-500/8 ring-1 ring-cyan-500/30'
                        : 'border-slate-700/60 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/70'
                    }`}
                  >
                    {/* Radio dot */}
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      active ? 'border-cyan-500 bg-cyan-500' : 'border-slate-600'
                    }`}>
                      {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>

                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      active ? 'bg-cyan-500/20' : 'bg-slate-700/50'
                    }`}>
                      <Icon size={15} className={active ? 'text-cyan-400' : 'text-slate-500'} />
                    </div>

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold text-sm ${active ? 'text-slate-100' : 'text-slate-300'}`}>{fw.name}</span>
                        <span className="text-slate-600 text-xs">v{fw.version}</span>
                        <span className={`text-xs px-1.5 py-px rounded border ${categoryColors[fw.category] ?? ''}`}>{fw.category}</span>
                      </div>
                      <p className="text-slate-600 text-xs mt-0.5">{fw.controls_total} controls</p>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold tabular-nums ${scoreColor(fw.score)}`}>{fw.score}%</p>
                      <p className="text-slate-600 text-xs">last score</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.framework && <p className="text-red-400 text-xs mt-2">{errors.framework}</p>}
          </div>

          {/* Assessor + notes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
                Assessed By <span className="text-red-400">*</span>
              </label>
              <input
                value={assessedBy}
                onChange={e => { setAssessedBy(e.target.value); setErrors(er => ({ ...er, assessedBy: '' })); }}
                list="assessor-list"
                placeholder="e.g. Alice Chen"
                className={`w-full bg-slate-800 border rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500 transition-colors ${errors.assessedBy ? 'border-red-500' : 'border-slate-700'}`}
              />
              <datalist id="assessor-list">
                {ASSESSORS.map(a => <option key={a} value={a} />)}
              </datalist>
              {errors.assessedBy && <p className="text-red-400 text-xs mt-1">{errors.assessedBy}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Notes (optional)</label>
              <input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Annual audit Q2 2026"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Selected framework summary */}
          {selected && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-slate-300 text-sm font-medium">{selected.name} — {selected.controls_total} controls to review</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Current: {selected.controls_compliant} compliant · {selected.controls_partial} partial · {selected.controls_noncompliant} non-compliant
                </p>
              </div>
              <div className={`text-2xl font-bold tabular-nums ${scoreColor(selected.score)}`}>{selected.score}%</div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <PlayCircle size={15} />}
            {loading ? 'Starting…' : 'Start Assessment'}
          </button>
        </div>
      </div>
    </div>
  );
}
