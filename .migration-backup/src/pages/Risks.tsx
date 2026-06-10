import { useState } from 'react';
import { Plus, Download, Search, ChevronDown, DollarSign, TrendingUp, Shield, AlertTriangle, Info, X } from 'lucide-react';
import { mockRisks } from '../lib/mockData';
import RiskMatrix from '../components/RiskMatrix';
import AddRiskModal, { type NewRisk } from '../components/AddRiskModal';
import type { Risk } from '../lib/types';

const CATEGORIES = ['All', 'Strategic', 'Operational', 'Technical', 'Compliance', 'Financial', 'Reputational'];
const STATUSES = ['All', 'Open', 'In Treatment', 'Accepted', 'Closed', 'Transferred'];
const TREATMENTS = ['All', 'Mitigate', 'Accept', 'Transfer', 'Avoid'];
const FRAMEWORKS = ['All', 'DORA', 'NIS2', 'NIST CSF', 'ISO 27001', 'GDPR', 'PCI DSS', 'SOC 2'];

const fmt$ = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K`
  : `$${n}`;

const treatmentColor = (t: string) => {
  if (t === 'Mitigate')  return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20';
  if (t === 'Accept')    return 'bg-slate-700/40 text-slate-400 border-slate-600';
  if (t === 'Transfer')  return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
  if (t === 'Avoid')     return 'bg-orange-500/15 text-orange-400 border-orange-500/20';
  return '';
};

const statusColor = (s: string) => {
  if (s === 'Open')         return 'bg-red-500/15 text-red-400 border-red-500/20';
  if (s === 'In Treatment') return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
  if (s === 'Accepted')     return 'bg-slate-700/40 text-slate-400 border-slate-600';
  if (s === 'Closed')       return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
  return 'bg-slate-700/40 text-slate-400 border-slate-600';
};

const treatmentStatusDot = (s: string) => {
  if (s === 'Completed')   return 'bg-emerald-500';
  if (s === 'In Progress') return 'bg-amber-500';
  return 'bg-slate-600';
};

function ScoreBar({ score, max = 25 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color = score >= 16 ? 'bg-red-500' : score >= 10 ? 'bg-orange-500' : score >= 6 ? 'bg-amber-500' : 'bg-emerald-500';
  const textColor = score >= 16 ? 'text-red-400' : score >= 10 ? 'text-orange-400' : score >= 6 ? 'text-amber-400' : 'text-emerald-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-bold w-5 text-right ${textColor}`}>{score}</span>
    </div>
  );
}

function FAIRDetailPanel({ risk, onClose }: { risk: Risk; onClose: () => void }) {
  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-lg bg-slate-900 border-l border-slate-700 flex flex-col h-full shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div>
            <h2 className="text-slate-100 font-bold text-sm">FAIR Risk Analysis</h2>
            <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{risk.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Financial summary */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: 'ALE (Most Likely)', v: fmt$(risk.fair.ale), c: 'text-red-400', sub: 'Annualised Loss Expectancy' },
              { l: 'ALE Min', v: fmt$(risk.fair.ale_min), c: 'text-amber-400', sub: 'Best case scenario' },
              { l: 'ALE Max', v: fmt$(risk.fair.ale_max), c: 'text-red-400', sub: 'Worst case scenario' },
              { l: 'Treatment Cost', v: fmt$(risk.treatment_cost), c: 'text-cyan-400', sub: 'Investment to remediate' },
            ].map(s => (
              <div key={s.l} className="bg-slate-800/60 rounded-lg p-3">
                <p className={`text-lg font-bold tabular-nums ${s.c}`}>{s.v}</p>
                <p className="text-slate-300 text-xs font-medium">{s.l}</p>
                <p className="text-slate-600 text-xs">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* ROI */}
          {risk.treatment_cost > 0 && (
            <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-400 font-bold text-2xl tabular-nums">{risk.remediation_roi}%</p>
                  <p className="text-slate-400 text-xs">Remediation ROI</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-300 text-sm font-medium">{fmt$(risk.fair.ale - risk.treatment_cost)}</p>
                  <p className="text-slate-500 text-xs">Net risk reduction value</p>
                </div>
              </div>
            </div>
          )}

          {/* FAIR inputs */}
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">FAIR Model Inputs</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400 text-xs">Threat Event Frequency (TEF)</span>
                <span className="text-slate-300 text-xs font-mono">{risk.fair.tef_min}–{risk.fair.tef_likely}–{risk.fair.tef_max} /yr</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400 text-xs">Vulnerability / Contact probability</span>
                <span className="text-slate-300 text-xs font-mono">{risk.fair.vulnerability}%</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400 text-xs">Loss Event Frequency (LEF)</span>
                <span className="text-slate-300 text-xs font-mono">{risk.fair.lef} /yr</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400 text-xs">Loss Magnitude — Min / Likely / Max</span>
                <span className="text-slate-300 text-xs font-mono">{fmt$(risk.fair.lm_min)} / {fmt$(risk.fair.lm_likely)} / {fmt$(risk.fair.lm_max)}</span>
              </div>
            </div>
          </div>

          {/* GRC linkage */}
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">GRC / Regulatory Linkage</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {risk.framework_tags.map(f => (
                <span key={f} className="text-xs px-2 py-1 bg-slate-700/60 text-slate-300 rounded-lg border border-slate-600/50 font-medium">{f}</span>
              ))}
            </div>
            {risk.regulatory_reference && (
              <p className="text-slate-500 text-xs">{risk.regulatory_reference}</p>
            )}
          </div>

          {/* Treatment */}
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Treatment Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/60 rounded-lg p-3">
                <p className="text-slate-500 text-xs mb-1">Strategy</p>
                <span className={`text-xs px-2 py-0.5 rounded border font-medium ${treatmentColor(risk.treatment)}`}>{risk.treatment}</span>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-3">
                <p className="text-slate-500 text-xs mb-1">Treatment Status</p>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${treatmentStatusDot(risk.treatment_status)}`} />
                  <span className="text-slate-300 text-xs">{risk.treatment_status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function exportToCSV(risks: Risk[]) {
  const headers = ['ID', 'Title', 'Category', 'Status', 'Treatment', 'Inherent Score', 'Residual Score', 'ALE', 'ALE Min', 'ALE Max', 'Treatment Cost', 'ROI %', 'Framework Tags', 'Regulatory Ref', 'Owner', 'Review Date'];
  const rows = risks.map(r => [
    r.id, `"${r.title.replace(/"/g, '""')}"`, r.category, r.status, r.treatment,
    r.inherent_score, r.residual_score, r.fair.ale, r.fair.ale_min, r.fair.ale_max,
    r.treatment_cost, r.remediation_roi,
    `"${r.framework_tags.join('; ')}"`, `"${r.regulatory_reference}"`,
    `"${r.owner}"`, r.review_date,
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `risk-register-fair-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Risks() {
  const [riskData, setRiskData] = useState<Risk[]>(mockRisks as Risk[]);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('All');
  const [status, setStatus]       = useState('All');
  const [treatment, setTreatment] = useState('All');
  const [framework, setFramework] = useState('All');
  const [view, setView]           = useState<'list' | 'matrix' | 'financial'>('list');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailRisk, setDetailRisk] = useState<Risk | null>(null);
  const [toast, setToast]         = useState<string | null>(null);

  const filtered = riskData.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = r.title.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q) || r.regulatory_reference?.toLowerCase().includes(q);
    const matchCat  = category === 'All' || r.category === category;
    const matchStat = status === 'All' || r.status === status;
    const matchTreat = treatment === 'All' || r.treatment === treatment;
    const matchFw = framework === 'All' || r.framework_tags?.includes(framework);
    return matchSearch && matchCat && matchStat && matchTreat && matchFw;
  });

  const totalALE = filtered.reduce((s, r) => s + r.fair.ale, 0);
  const totalTreatment = filtered.reduce((s, r) => s + r.treatment_cost, 0);
  const avgROI = filtered.filter(r => r.remediation_roi > 0).length > 0
    ? Math.round(filtered.filter(r => r.remediation_roi > 0).reduce((s, r) => s + r.remediation_roi, 0) / filtered.filter(r => r.remediation_roi > 0).length)
    : 0;

  const handleAddRisk = (newRisk: NewRisk) => {
    const score = newRisk.likelihood * newRisk.impact;
    const ale = score * 80_000;
    const row: Risk = {
      id: String(riskData.length + 1),
      title: newRisk.title,
      category: newRisk.category,
      status: newRisk.status === 'Active' ? 'Open' : 'Accepted',
      likelihood: newRisk.likelihood,
      impact: newRisk.impact,
      inherent_score: score,
      residual_score: Math.max(1, score - 3),
      owner: newRisk.owners[0] ?? 'Unassigned',
      review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      tags: newRisk.tags,
      fair: { tef_min: 0.5, tef_max: 3, tef_likely: 1, vulnerability: 60, lm_min: ale * 0.2, lm_max: ale * 3, lm_likely: ale, ale, ale_min: ale * 0.1, ale_max: ale * 2, lef: 1 },
      treatment: 'Mitigate',
      treatment_cost: Math.round(ale * 0.1),
      treatment_status: 'Not Started',
      remediation_roi: Math.round(((ale - ale * 0.1) / (ale * 0.1)) * 100),
      financial_impact: ale,
      framework_tags: [],
      regulatory_reference: '',
    };
    setRiskData(prev => [row, ...prev]);
    setToast(`Risk "${newRisk.title}" added to register`);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-screen-2xl relative">
      {modalOpen && <AddRiskModal onClose={() => setModalOpen(false)} onSubmit={handleAddRisk} />}
      {detailRisk && <FAIRDetailPanel risk={detailRisk} onClose={() => setDetailRisk(null)} />}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-3 rounded-xl shadow-xl backdrop-blur flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />{toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-slate-100 font-bold text-xl">Risk Register</h2>
          <p className="text-slate-500 text-sm">{riskData.length} risks · FAIR financial model · GRC framework linkage</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(filtered)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm transition-colors">
            <Download size={16} /> Export FAIR CSV
          </button>
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm transition-colors">
            <Plus size={16} /> Add Risk
          </button>
        </div>
      </div>

      {/* Financial KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: 'Aggregate ALE', v: fmt$(totalALE), sub: 'Annualised Loss Expectancy', c: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: DollarSign },
          { l: 'Treatment Budget', v: fmt$(totalTreatment), sub: 'Total remediation cost', c: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', icon: Shield },
          { l: 'Avg Remediation ROI', v: `${avgROI}%`, sub: 'Return on risk investment', c: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: TrendingUp },
          { l: 'Open/In Treatment', v: String(filtered.filter(r => ['Open', 'In Treatment'].includes(r.status)).length), sub: `of ${filtered.length} filtered risks`, c: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: AlertTriangle },
        ].map(s => (
          <div key={s.l} className={`rounded-xl border p-4 ${s.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={14} className={s.c} />
              <p className={`text-xl font-bold tabular-nums ${s.c}`}>{s.v}</p>
            </div>
            <p className="text-slate-300 text-xs font-medium">{s.l}</p>
            <p className="text-slate-600 text-xs">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search size={16} className="text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search title, owner, regulation..."
            className="bg-transparent text-slate-300 text-sm outline-none flex-1 placeholder:text-slate-600" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { val: category, set: setCategory, opts: CATEGORIES, ph: 'Category' },
            { val: status, set: setStatus, opts: STATUSES, ph: 'Status' },
            { val: treatment, set: setTreatment, opts: TREATMENTS, ph: 'Treatment' },
            { val: framework, set: setFramework, opts: FRAMEWORKS, ph: 'Framework' },
          ].map(({ val, set, opts, ph }) => (
            <div key={ph} className="relative">
              <select value={val} onChange={e => set(e.target.value)}
                className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 pr-8 outline-none focus:border-cyan-500 cursor-pointer">
                {opts.map(o => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-3 text-slate-500 pointer-events-none" />
            </div>
          ))}
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            {(['list', 'financial', 'matrix'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-2 text-sm transition-colors capitalize ${view === v ? 'bg-slate-700 text-slate-100' : 'bg-slate-800 text-slate-400 hover:text-slate-300'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Views */}
      {view === 'matrix' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-slate-100 font-semibold mb-6">Risk Heat Map</h3>
          <RiskMatrix risks={filtered} />
        </div>
      )}

      {view === 'financial' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/50 flex items-center gap-2">
            <DollarSign size={16} className="text-cyan-400" />
            <h3 className="text-slate-100 font-semibold text-sm">Financial Risk View — FAIR Model</h3>
            <Info size={14} className="text-slate-600" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Risk', 'ALE (Likely)', 'ALE Range', 'Treatment', 'Treatment Cost', 'ROI', 'Frameworks', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors cursor-pointer" onClick={() => setDetailRisk(r)}>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-slate-200 text-xs font-medium truncate">{r.title}</p>
                      <p className="text-slate-600 text-xs mt-0.5">{r.category}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-red-400 font-semibold tabular-nums text-sm">{fmt$(r.fair.ale)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-500 text-xs tabular-nums whitespace-nowrap">{fmt$(r.fair.ale_min)} – {fmt$(r.fair.ale_max)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded border ${treatmentColor(r.treatment)}`}>{r.treatment}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-cyan-400 font-semibold tabular-nums text-xs">{r.treatment_cost > 0 ? fmt$(r.treatment_cost) : '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold tabular-nums text-sm ${r.remediation_roi >= 500 ? 'text-emerald-400' : r.remediation_roi > 0 ? 'text-blue-400' : 'text-slate-500'}`}>
                        {r.remediation_roi > 0 ? `${r.remediation_roi}%` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {(r.framework_tags ?? []).slice(0, 2).map(f => (
                          <span key={f} className="text-xs px-1.5 py-px bg-slate-700/50 text-slate-400 rounded border border-slate-600/30">{f}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded border ${statusColor(r.status)}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="py-12 text-center text-slate-500">No risks match filters.</div>}
        </div>
      )}

      {view === 'list' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Risk', 'Category', 'Status', 'Inherent', 'Residual', 'ALE', 'Treatment', 'Framework', 'Owner'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors group cursor-pointer" onClick={() => setDetailRisk(r)}>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-slate-200 font-medium text-sm truncate">{r.title}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {r.tags.slice(0, 2).map(t => (
                          <span key={t} className="text-xs bg-slate-700/50 text-slate-500 px-1.5 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="text-slate-400 text-xs">{r.category}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded border ${statusColor(r.status)}`}>{r.status}</span></td>
                    <td className="px-4 py-3 w-28"><ScoreBar score={r.inherent_score} /></td>
                    <td className="px-4 py-3 w-28"><ScoreBar score={r.residual_score} /></td>
                    <td className="px-4 py-3">
                      <span className="text-red-400 font-semibold tabular-nums text-xs">{fmt$(r.fair.ale)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded border ${treatmentColor(r.treatment)}`}>{r.treatment}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${treatmentStatusDot(r.treatment_status)}`} title={r.treatment_status} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {(r.framework_tags ?? []).slice(0, 2).map(f => (
                          <span key={f} className="text-xs px-1.5 py-px bg-slate-700/50 text-slate-400 rounded border border-slate-600/30">{f}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="text-slate-400 text-xs whitespace-nowrap">{r.owner}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="py-12 text-center text-slate-500">No risks match the current filters.</div>}
        </div>
      )}
    </div>
  );
}
