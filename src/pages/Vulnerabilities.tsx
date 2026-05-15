import { useState } from 'react';
import { Plus, Search, ChevronDown, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';
import { mockVulnerabilities } from '../lib/mockData';
import SeverityBadge from '../components/SeverityBadge';
import ImportScanModal, { type ParsedVuln } from '../components/ImportScanModal';

const SEVERITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['All', 'Open', 'In Progress', 'Remediated', 'Accepted', 'False Positive'];

type VulnRow = (typeof mockVulnerabilities)[number] | ParsedVuln;

function CVSSBar({ score }: { score: number }) {
  const color = score >= 9 ? 'bg-red-500' : score >= 7 ? 'bg-orange-500' : score >= 4 ? 'bg-amber-500' : 'bg-emerald-500';
  const textColor = score >= 9 ? 'text-red-400' : score >= 7 ? 'text-orange-400' : score >= 4 ? 'text-amber-400' : 'text-emerald-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(score / 10) * 100}%` }} />
      </div>
      <span className={`text-sm font-bold tabular-nums w-8 ${textColor}`}>{score.toFixed(1)}</span>
    </div>
  );
}

export default function Vulnerabilities() {
  const [vulns, setVulns] = useState<VulnRow[]>(mockVulnerabilities);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('All');
  const [status, setStatus] = useState('All');
  const [importOpen, setImportOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = vulns.filter((v) => {
    const matchSearch =
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.cve_id.toLowerCase().includes(search.toLowerCase()) ||
      v.asset.toLowerCase().includes(search.toLowerCase());
    const matchSev = severity === 'All' || v.severity === severity;
    const matchStatus = status === 'All' || v.status === status;
    return matchSearch && matchSev && matchStatus;
  });

  const stats = {
    critical: vulns.filter((v) => v.severity === 'Critical').length,
    high: vulns.filter((v) => v.severity === 'High').length,
    withExploit: vulns.filter((v) => v.exploit_available).length,
    withPatch: vulns.filter((v) => v.patch_available).length,
  };

  const handleImport = (newVulns: ParsedVuln[]) => {
    setVulns((prev) => [...newVulns, ...prev]);
    setToast(`${newVulns.length} ${newVulns.length === 1 ? 'vulnerability' : 'vulnerabilities'} imported successfully`);
    setTimeout(() => setToast(null), 5000);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-screen-2xl relative">
      {importOpen && (
        <ImportScanModal onClose={() => setImportOpen(false)} onImport={handleImport} />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-3 rounded-xl shadow-xl backdrop-blur animate-slide-in-right">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
          {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-slate-100 font-bold text-xl">Vulnerability Management</h2>
          <p className="text-slate-500 text-sm">{vulns.length} vulnerabilities tracked</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm transition-colors"
          >
            <Plus size={16} /> Import Scan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Critical CVEs',     value: stats.critical,    color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
          { label: 'High CVEs',         value: stats.high,        color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20' },
          { label: 'Exploit Available', value: stats.withExploit, color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20', icon: Zap },
          { label: 'Patch Available',   value: stats.withPatch,   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 flex-1">
          <Search size={16} className="text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search CVE ID, title, asset..."
            className="bg-transparent text-slate-300 text-sm outline-none flex-1 placeholder:text-slate-600"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 pr-8 outline-none focus:border-cyan-500 cursor-pointer"
            >
              {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-3 text-slate-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 pr-8 outline-none focus:border-cyan-500 cursor-pointer"
            >
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-3 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['CVE / Title', 'CVSS Score', 'Severity', 'Status', 'Asset', 'Flags', 'Due Date', 'Assignee'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filtered.map((vuln) => (
                <tr key={vuln.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="px-4 py-3">
                    <p className="text-slate-200 font-medium text-sm">{vuln.title}</p>
                    <p className="text-slate-500 text-xs font-mono mt-0.5">{vuln.cve_id}</p>
                  </td>
                  <td className="px-4 py-3 min-w-[120px]">
                    <CVSSBar score={vuln.cvss_score} />
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge level={vuln.severity} />
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge level={vuln.status} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-400 text-xs font-mono">{vuln.asset}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {vuln.exploit_available && (
                        <span className="inline-flex items-center gap-1 text-xs bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded">
                          <Zap size={10} /> Exploit
                        </span>
                      )}
                      {vuln.patch_available && (
                        <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded">
                          <AlertTriangle size={10} /> Patch
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs whitespace-nowrap ${
                      new Date(vuln.due_date) < new Date() && vuln.status !== 'Remediated'
                        ? 'text-red-400 font-semibold'
                        : 'text-slate-500'
                    }`}>
                      {vuln.due_date}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-400 text-xs whitespace-nowrap">{vuln.assigned_to}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-500">No vulnerabilities match the current filters.</div>
        )}
      </div>
    </div>
  );
}
