import { useState } from 'react';
import {
  Plus, Search, ChevronDown, Server, Cloud, Cpu, Monitor, Upload,
  CheckCircle2, AlertTriangle, ShieldCheck, Tag, DollarSign,
} from 'lucide-react';
import { mockAssets } from '../lib/mockData';
import type { Asset } from '../lib/types';
import AddAssetModal, { type NewAsset } from '../components/AddAssetModal';
import ImportAssetCSVModal from '../components/ImportAssetCSVModal';

const CATEGORIES    = ['All', 'IT', 'OT', 'Cloud', 'Mobile'];
const CRITICALITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];
const CLASSES       = ['All', 'Primary', 'Supporting', 'External'];
const REG_SCOPE     = ['All', 'DORA', 'NIS2', 'GDPR', 'PCI DSS', 'SOC 2', 'ISO 27001', 'MiFID II'];

const typeIcon = (type: string) => {
  if (type === 'Cloud' || type === 'Application' || type === 'Cloud Service') return Cloud;
  if (type === 'IoT') return Cpu;
  if (type === 'Workstation') return Monitor;
  return Server;
};

const critColor = (c: string) => {
  if (c === 'Critical') return { text: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: 'bg-red-500/15 text-red-400' };
  if (c === 'High')     return { text: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', icon: 'bg-orange-500/15 text-orange-400' };
  if (c === 'Medium')   return { text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: 'bg-amber-500/15 text-amber-400' };
  return { text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: 'bg-slate-700 text-slate-400' };
};

const dataClassColor = (d: string) => {
  if (d === 'Restricted')    return 'bg-red-500/15 text-red-400 border-red-500/20';
  if (d === 'Confidential')  return 'bg-orange-500/15 text-orange-400 border-orange-500/20';
  if (d === 'Internal')      return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
  return 'bg-slate-700/40 text-slate-400 border-slate-600';
};

const assetClassColor = (c: string) => {
  if (c === 'Primary')    return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20';
  if (c === 'Supporting') return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
  return 'bg-slate-700/40 text-slate-400 border-slate-600';
};

const fmt$ = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(0)}M`
  : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K`
  : `$${n}`;

function RiskScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-red-500' : score >= 60 ? 'bg-orange-500' : score >= 40 ? 'bg-amber-500' : 'bg-emerald-500';
  const textColor = score >= 80 ? 'text-red-400' : score >= 60 ? 'text-orange-400' : score >= 40 ? 'text-amber-400' : 'text-emerald-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold tabular-nums w-6 ${textColor}`}>{score}</span>
    </div>
  );
}

function timeAgo(iso: string) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Assets() {
  const [assets, setAssets]         = useState<Asset[]>(mockAssets as Asset[]);
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState('All');
  const [criticality, setCriticality] = useState('All');
  const [assetClass, setAssetClass] = useState('All');
  const [regScope, setRegScope]     = useState('All');
  const [view, setView]             = useState<'grid' | 'table'>('grid');
  const [addOpen, setAddOpen]       = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [toast, setToast]           = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 5000); };

  const handleAddAsset = (asset: NewAsset) => {
    const full: Asset = {
      ...(asset as unknown as Asset),
      asset_class: 'Supporting',
      open_cve_count: 0,
      regulatory_scope: [],
      data_classification: 'Internal',
      business_function: '',
      annual_value: 0,
    };
    setAssets(prev => [full, ...prev]);
    setAddOpen(false);
    showToast(`Asset "${asset.name}" added`);
  };

  const handleImportAssets = (newAssets: NewAsset[]) => {
    const fullAssets: Asset[] = newAssets.map(a => ({
      ...(a as unknown as Asset),
      asset_class: 'Supporting' as const,
      open_cve_count: 0,
      regulatory_scope: [],
      data_classification: 'Internal' as const,
      business_function: '',
      annual_value: 0,
    }));
    setAssets(prev => [...fullAssets, ...prev]);
    showToast(`${newAssets.length} asset(s) imported`);
  };

  const filtered = assets.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = a.name.toLowerCase().includes(q) || a.owner.toLowerCase().includes(q) || a.ip_address.includes(q);
    const matchCat   = category === 'All' || a.category === category;
    const matchCrit  = criticality === 'All' || a.criticality === criticality;
    const matchClass = assetClass === 'All' || (a as Asset).asset_class === assetClass;
    const matchReg   = regScope === 'All' || ((a as Asset).regulatory_scope ?? []).includes(regScope);
    return matchSearch && matchCat && matchCrit && matchClass && matchReg;
  });

  const stats = {
    total:     assets.length,
    critical:  assets.filter(a => a.criticality === 'Critical').length,
    highRisk:  assets.filter(a => a.risk_score >= 70).length,
    openCVEs:  assets.reduce((s, a) => s + ((a as Asset).open_cve_count ?? 0), 0),
    totalValue: assets.reduce((s, a) => s + ((a as Asset).annual_value ?? 0), 0),
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-screen-2xl relative">
      {addOpen    && <AddAssetModal onClose={() => setAddOpen(false)} onSubmit={handleAddAsset} />}
      {importOpen && <ImportAssetCSVModal onClose={() => setImportOpen(false)} onImport={handleImportAssets} />}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-3 rounded-xl shadow-xl backdrop-blur">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />{toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-slate-100 font-bold text-xl">Asset Inventory</h2>
          <p className="text-slate-500 text-sm">{assets.length} assets · Regulatory scope · CVE tracking · Business value</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm transition-colors">
            <Upload size={15} /> Import CSV
          </button>
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm transition-colors">
            <Plus size={16} /> Add Asset
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { l: 'Total Assets',    v: stats.total,           c: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',   icon: Server },
          { l: 'Critical Assets', v: stats.critical,        c: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',     icon: AlertTriangle },
          { l: 'High Risk',       v: stats.highRisk,        c: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20', icon: ShieldCheck },
          { l: 'Open CVEs',       v: stats.openCVEs,        c: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20', icon: Tag },
          { l: 'Total Asset Value', v: fmt$(stats.totalValue), c: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: DollarSign },
        ].map(s => (
          <div key={s.l} className={`rounded-xl border p-4 ${s.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={14} className={s.c} />
              <p className={`text-xl font-bold tabular-nums ${s.c}`}>{s.v}</p>
            </div>
            <p className="text-slate-400 text-xs">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search size={16} className="text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search assets, IPs, owners..."
            className="bg-transparent text-slate-300 text-sm outline-none flex-1 placeholder:text-slate-600" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { val: category, set: setCategory, opts: CATEGORIES, ph: 'Category' },
            { val: criticality, set: setCriticality, opts: CRITICALITIES, ph: 'Criticality' },
            { val: assetClass, set: setAssetClass, opts: CLASSES, ph: 'Class' },
            { val: regScope, set: setRegScope, opts: REG_SCOPE, ph: 'Regulation' },
          ].map(({ val, set, opts }) => (
            <div key={opts[0]} className="relative">
              <select value={val} onChange={e => set(e.target.value)}
                className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 pr-8 outline-none focus:border-cyan-500 cursor-pointer">
                {opts.map(o => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-3 text-slate-500 pointer-events-none" />
            </div>
          ))}
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            {(['grid', 'table'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-2 text-sm transition-colors capitalize ${view === v ? 'bg-slate-700 text-slate-100' : 'bg-slate-800 text-slate-400 hover:text-slate-300'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid view */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(asset => {
            const a = asset as Asset;
            const Icon = typeIcon(asset.type);
            const cc = critColor(asset.criticality);
            return (
              <div key={asset.id} className={`bg-slate-800/50 border rounded-xl p-5 hover:border-slate-600 transition-all cursor-pointer ${
                asset.criticality === 'Critical' ? 'border-red-500/20' : 'border-slate-700/50'
              }`}>
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${cc.icon}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-slate-100 font-semibold text-sm truncate">{asset.name}</h3>
                    <p className="text-slate-500 text-xs">{asset.type} · {asset.location}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cc.bg} ${cc.text}`}>{asset.criticality}</span>
                    {a.asset_class && <span className={`text-xs px-1.5 py-px rounded border ${assetClassColor(a.asset_class)}`}>{a.asset_class}</span>}
                  </div>
                </div>

                {/* Risk score */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Risk Score</span>
                    <span className="text-slate-500">{asset.owner}</span>
                  </div>
                  <RiskScoreBar score={asset.risk_score} />
                </div>

                {/* CVE + data classification */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {a.open_cve_count > 0 && (
                    <span className="text-xs bg-red-500/15 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-medium">
                      {a.open_cve_count} open CVE{a.open_cve_count !== 1 ? 's' : ''}
                    </span>
                  )}
                  {asset.vulnerability_count > 0 && (
                    <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded border border-orange-500/20">
                      {asset.vulnerability_count} vulns
                    </span>
                  )}
                  {a.data_classification && (
                    <span className={`text-xs px-2 py-0.5 rounded border ${dataClassColor(a.data_classification)}`}>{a.data_classification}</span>
                  )}
                </div>

                {/* Regulatory scope */}
                {(a.regulatory_scope ?? []).length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-3">
                    {(a.regulatory_scope ?? []).map(r => (
                      <span key={r} className="text-xs px-1.5 py-px bg-slate-700/60 text-slate-400 rounded border border-slate-600/40">{r}</span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-700/40">
                  <span className="text-slate-500 font-mono">{asset.ip_address}</span>
                  <div className="flex items-center gap-2">
                    {a.annual_value > 0 && <span className="text-emerald-400 font-medium">{fmt$(a.annual_value)}</span>}
                    <span className="text-slate-600">Scanned {timeAgo(asset.last_scanned_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700/50">
              No assets match current filters.
            </div>
          )}
        </div>
      )}

      {/* Table view */}
      {view === 'table' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Asset', 'Type / Class', 'Criticality', 'Risk', 'Open CVEs', 'Data Class', 'Regulatory Scope', 'Annual Value', 'Last Scanned'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filtered.map(asset => {
                  const a = asset as Asset;
                  const cc = critColor(asset.criticality);
                  return (
                    <tr key={asset.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-slate-200 font-medium text-sm">{asset.name}</p>
                        <p className="text-slate-500 text-xs">{asset.owner} · {asset.location}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-400 text-xs">{asset.type}</p>
                        {a.asset_class && <span className={`text-xs px-1.5 py-px rounded border ${assetClassColor(a.asset_class)}`}>{a.asset_class}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cc.bg} ${cc.text}`}>{asset.criticality}</span>
                      </td>
                      <td className="px-4 py-3 w-28">
                        <RiskScoreBar score={asset.risk_score} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={a.open_cve_count > 0 ? 'text-red-400 font-semibold' : 'text-slate-600'}>{a.open_cve_count ?? 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        {a.data_classification && (
                          <span className={`text-xs px-2 py-0.5 rounded border ${dataClassColor(a.data_classification)}`}>{a.data_classification}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {(a.regulatory_scope ?? []).map(r => (
                            <span key={r} className="text-xs px-1.5 py-px bg-slate-700/50 text-slate-400 rounded border border-slate-600/30">{r}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-emerald-400 text-xs font-medium tabular-nums">{a.annual_value ? fmt$(a.annual_value) : '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-500 text-xs whitespace-nowrap">{timeAgo(asset.last_scanned_at)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="py-12 text-center text-slate-500">No assets match current filters.</div>}
        </div>
      )}
    </div>
  );
}
