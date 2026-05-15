import { useState } from 'react';
import {
  Plus, Search, ChevronDown, Download, Upload,
  Globe, Hash, Link2, Mail, FileCode, HardDrive, Key, CheckCircle2, Fingerprint,
} from 'lucide-react';
import { mockIOCs } from '../lib/mockData';
import type { IOC } from '../lib/types';
import AddIOCModal from '../components/AddIOCModal';
import ImportIOCCSVModal from '../components/ImportIOCCSVModal';

const TYPES = ['All', 'IP', 'Domain', 'URL', 'Hash', 'Email', 'File', 'Registry', 'Certificate'];
const SEVERITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['All', 'Active', 'Inactive', 'Under Review', 'Whitelisted'];

const typeIcon = (type: string) => {
  switch (type) {
    case 'IP':          return Globe;
    case 'Domain':      return Globe;
    case 'URL':         return Link2;
    case 'Hash':        return Hash;
    case 'Email':       return Mail;
    case 'File':        return FileCode;
    case 'Registry':    return HardDrive;
    case 'Certificate': return Key;
    default:            return Fingerprint;
  }
};

const typeColor = (type: string) => {
  switch (type) {
    case 'IP':          return 'text-blue-400 bg-blue-500/10';
    case 'Domain':      return 'text-cyan-400 bg-cyan-500/10';
    case 'URL':         return 'text-violet-400 bg-violet-500/10';
    case 'Hash':        return 'text-amber-400 bg-amber-500/10';
    case 'Email':       return 'text-pink-400 bg-pink-500/10';
    case 'File':        return 'text-orange-400 bg-orange-500/10';
    case 'Registry':    return 'text-slate-400 bg-slate-600/20';
    case 'Certificate': return 'text-teal-400 bg-teal-500/10';
    default:            return 'text-slate-400 bg-slate-700/30';
  }
};

const sevColor = (s: string) => {
  switch (s) {
    case 'Critical': return 'bg-red-500/15 text-red-400 border-red-500/30';
    case 'High':     return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    case 'Medium':   return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'Low':      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    default:         return 'bg-slate-700 text-slate-400 border-slate-600';
  }
};

const statusColor = (s: string) => {
  switch (s) {
    case 'Active':       return 'bg-red-500/15 text-red-400 border-red-500/30';
    case 'Under Review': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'Inactive':     return 'bg-slate-700/50 text-slate-500 border-slate-600/40';
    case 'Whitelisted':  return 'bg-emerald-500/15 text-slate-400 border-emerald-500/20';
    default:             return 'bg-slate-700 text-slate-400 border-slate-600';
  }
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const text  = value >= 80 ? 'text-emerald-400' : value >= 50 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-xs font-bold tabular-nums ${text}`}>{value}%</span>
    </div>
  );
}

function exportToCSV(iocs: IOC[]) {
  const headers = ['ID', 'Value', 'Type', 'Severity', 'Status', 'Confidence', 'Source', 'Threat Actor', 'Tags', 'First Seen', 'Last Seen', 'Expiry Date', 'Related Incident', 'Description'];
  const rows = iocs.map((i) => [
    i.id,
    `"${i.value.replace(/"/g, '""')}"`,
    i.type,
    i.severity,
    i.status,
    i.confidence,
    `"${i.source}"`,
    `"${i.threat_actor}"`,
    `"${i.tags.join('; ')}"`,
    i.first_seen,
    i.last_seen,
    i.expiry_date,
    i.related_incident,
    `"${i.description.replace(/"/g, '""')}"`,
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ioc-register-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function IOCPage() {
  const [iocs, setIOCs] = useState<IOC[]>(mockIOCs as IOC[]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sevFilter, setSevFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleAdd = (ioc: IOC) => {
    setIOCs((prev) => [ioc, ...prev]);
    setAddOpen(false);
    showToast(`IOC "${ioc.value}" added successfully`);
  };

  const handleImport = (newIOCs: IOC[]) => {
    setIOCs((prev) => [...newIOCs, ...prev]);
    showToast(`${newIOCs.length} ${newIOCs.length === 1 ? 'IOC' : 'IOCs'} imported successfully`);
  };

  const filtered = iocs.filter((i) => {
    const matchSearch =
      i.value.toLowerCase().includes(search.toLowerCase()) ||
      i.source.toLowerCase().includes(search.toLowerCase()) ||
      i.threat_actor.toLowerCase().includes(search.toLowerCase()) ||
      i.tags.some((t) => t.includes(search.toLowerCase()));
    const matchType   = typeFilter === 'All' || i.type === typeFilter;
    const matchSev    = sevFilter === 'All' || i.severity === sevFilter;
    const matchStatus = statusFilter === 'All' || i.status === statusFilter;
    return matchSearch && matchType && matchSev && matchStatus;
  });

  const stats = {
    total:    iocs.length,
    critical: iocs.filter((i) => i.severity === 'Critical').length,
    active:   iocs.filter((i) => i.status === 'Active').length,
    review:   iocs.filter((i) => i.status === 'Under Review').length,
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-screen-2xl relative">
      {addOpen    && <AddIOCModal       onClose={() => setAddOpen(false)}    onSubmit={handleAdd}    />}
      {importOpen && <ImportIOCCSVModal onClose={() => setImportOpen(false)} onImport={handleImport} />}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-3 rounded-xl shadow-xl backdrop-blur">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-slate-100 font-bold text-xl">IOC Register</h2>
          <p className="text-slate-500 text-sm">{iocs.length} indicators tracked · Last updated today</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportToCSV(filtered)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm transition-colors"
          >
            <Download size={15} /> Export {filtered.length !== iocs.length ? `(${filtered.length})` : ''}
          </button>
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm transition-colors"
          >
            <Upload size={15} /> Import CSV
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm transition-colors"
          >
            <Plus size={16} /> Add IOC
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total IOCs',      value: stats.total,    color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Critical',        value: stats.critical, color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
          { label: 'Active',          value: stats.active,   color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20' },
          { label: 'Under Review',    value: stats.review,   color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {/* IOC type distribution */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {(['IP', 'Domain', 'URL', 'Hash', 'Email', 'File', 'Registry', 'Certificate'] as IOC['type'][]).map((t) => {
          const count = iocs.filter((i) => i.type === t).length;
          const Icon = typeIcon(t);
          const colors = typeColor(t);
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? 'All' : t)}
              className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border transition-all text-center ${
                typeFilter === t
                  ? `${colors} border-current/30 ring-1 ring-current`
                  : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600 text-slate-400 hover:text-slate-300'
              }`}
            >
              <Icon size={16} />
              <span className="text-xs font-semibold">{t}</span>
              <span className="text-xs tabular-nums font-bold">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 flex-1">
          <Search size={16} className="text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by value, source, actor, or tag..."
            className="bg-transparent text-slate-300 text-sm outline-none flex-1 placeholder:text-slate-600"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: sevFilter, set: setSevFilter, options: SEVERITIES, placeholder: 'Severity' },
            { value: statusFilter, set: setStatusFilter, options: STATUSES, placeholder: 'Status' },
          ].map(({ value, set, options, placeholder }) => (
            <div key={placeholder} className="relative">
              <select
                value={value}
                onChange={(e) => set(e.target.value)}
                className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 pr-8 outline-none focus:border-cyan-500 cursor-pointer"
              >
                {options.map((o) => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-3 text-slate-500 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Indicator', 'Type', 'Severity', 'Confidence', 'Source', 'Threat Actor', 'Status', 'Last Seen', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filtered.map((ioc) => {
                const Icon = typeIcon(ioc.type);
                const tc = typeColor(ioc.type);
                return (
                  <tr key={ioc.id} className="hover:bg-slate-800/40 transition-colors group">

                    {/* Value */}
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${tc}`}>
                          <Icon size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-slate-200 font-mono text-xs truncate max-w-[200px]">{ioc.value}</p>
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {ioc.tags.slice(0, 2).map((t) => (
                              <span key={t} className="text-[10px] bg-slate-700/50 text-slate-500 px-1.5 py-0.5 rounded">{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${tc}`}>{ioc.type}</span>
                    </td>

                    {/* Severity */}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${sevColor(ioc.severity)}`}>{ioc.severity}</span>
                    </td>

                    {/* Confidence */}
                    <td className="px-4 py-3 min-w-[110px]">
                      <ConfidenceBar value={ioc.confidence} />
                    </td>

                    {/* Source */}
                    <td className="px-4 py-3">
                      <span className="text-slate-400 text-xs whitespace-nowrap">{ioc.source}</span>
                    </td>

                    {/* Threat Actor */}
                    <td className="px-4 py-3">
                      <span className="text-slate-400 text-xs whitespace-nowrap">{ioc.threat_actor}</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded border whitespace-nowrap ${statusColor(ioc.status)}`}>
                        {ioc.status}
                      </span>
                    </td>

                    {/* Last Seen */}
                    <td className="px-4 py-3">
                      <span className="text-slate-500 text-xs whitespace-nowrap">{timeAgo(ioc.last_seen)}</span>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3">
                      <button className="text-slate-600 hover:text-cyan-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        View →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-500">No IOCs match the current filters.</div>
        )}
      </div>
    </div>
  );
}
