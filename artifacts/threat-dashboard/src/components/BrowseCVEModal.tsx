import { useState, useEffect, useCallback } from 'react';
import {
  X, Search, Download, RefreshCw, AlertTriangle, CheckCircle2,
  ChevronDown, ExternalLink, Shield, Zap, Info, Filter,
  ChevronRight, Loader2,
} from 'lucide-react';

const CVE_LIBRARY_URL = '/api/cve-library';

export interface CVEEntry {
  cve_id:             string;
  title:              string;
  description:        string;
  cvss_score:         number;
  severity:           'Critical' | 'High' | 'Medium' | 'Low';
  cvss_vector:        string;
  asset:              string;
  category:           string;
  affected_products:  string[];
  patch_available:    boolean;
  exploit_available:  boolean;
  published_date:     string;
  references:         string[];
  status:             string;
  assigned_to:        string;
  due_date:           string;
}

interface BrowseCVEModalProps {
  onClose:   () => void;
  onImport:  (cves: CVEEntry[]) => void;
  existingCVEIds: Set<string>;
}

const SEVERITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];
const CATEGORIES = ['All', 'OS', 'Application', 'Network', 'Middleware'];

function cvssColor(score: number) {
  if (score >= 9)  return 'text-red-400';
  if (score >= 7)  return 'text-orange-400';
  if (score >= 4)  return 'text-amber-400';
  return 'text-emerald-400';
}

function cvssBarColor(score: number) {
  if (score >= 9)  return 'bg-red-500';
  if (score >= 7)  return 'bg-orange-500';
  if (score >= 4)  return 'bg-amber-500';
  return 'bg-emerald-500';
}

function severityBadge(s: string) {
  if (s === 'Critical') return 'bg-red-500/15 text-red-400 border-red-500/30';
  if (s === 'High')     return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
  if (s === 'Medium')   return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
}

function CVSSBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${cvssBarColor(score)}`} style={{ width: `${(score / 10) * 100}%` }} />
      </div>
      <span className={`text-sm font-bold tabular-nums w-8 ${cvssColor(score)}`}>{score.toFixed(1)}</span>
    </div>
  );
}

export default function BrowseCVEModal({ onClose, onImport, existingCVEIds }: BrowseCVEModalProps) {
  const [cves,        setCves]        = useState<CVEEntry[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [search,      setSearch]      = useState('');
  const [severity,    setSeverity]    = useState('All');
  const [category,    setCategory]    = useState('All');
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [expanded,    setExpanded]    = useState<string | null>(null);
  const [importDone,  setImportDone]  = useState(false);

  // ── Fetch CVEs from proxy ─────────────────────────────────────────────────

  const fetchCVEs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search && search.length > 1)      params.set('search',   search);
      if (severity && severity !== 'All')   params.set('severity', severity);

      const res = await fetch(`${CVE_LIBRARY_URL}?${params}`);
      if (!res.ok) throw new Error(`CVE service returned HTTP ${res.status}. Check that the API server is running.`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Failed to load CVE library');
      setCves(json.data ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [search, severity]);

  // Initial load
  useEffect(() => { fetchCVEs(); }, []);

  // Re-fetch when severity filter changes (server-side filter)
  useEffect(() => {
    if (!loading) fetchCVEs();
  }, [severity]);

  // ── Client-side filter for category and search ────────────────────────────

  const filtered = cves.filter(c => {
    const matchCat  = category === 'All' || c.category === category;
    const matchSearch = !search || search.length < 2 || (
      c.cve_id.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.affected_products.some(p => p.toLowerCase().includes(search.toLowerCase()))
    );
    return matchCat && matchSearch;
  });

  // ── Selection ─────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    if (existingCVEIds.has(id)) return; // already in app
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const selectable = filtered.filter(c => !existingCVEIds.has(c.cve_id));
    if (selected.size === selectable.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectable.map(c => c.cve_id)));
    }
  };

  const handleImport = () => {
    const toImport = filtered.filter(c => selected.has(c.cve_id));
    onImport(toImport);
    setImportDone(true);
    setTimeout(() => {
      setSelected(new Set());
      onClose();
    }, 1500);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = {
    critical: filtered.filter(c => c.severity === 'Critical').length,
    high:     filtered.filter(c => c.severity === 'High').length,
    exploit:  filtered.filter(c => c.exploit_available).length,
    existing: filtered.filter(c => existingCVEIds.has(c.cve_id)).length,
  };

  const selectableCount = filtered.filter(c => !existingCVEIds.has(c.cve_id)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/15 flex items-center justify-center">
              <Shield size={18} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-slate-100 font-bold text-base">CVE Library Browser</h2>
              <p className="text-slate-500 text-xs">Browse and import standard CVEs from the NVD · GitHub CVEProject</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-slate-800 bg-slate-800/30 flex-shrink-0">
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 flex-1 min-w-48">
            <Search size={15} className="text-slate-500 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchCVEs()}
              placeholder="Search CVE ID, product, keyword…"
              className="bg-transparent text-slate-300 text-sm outline-none flex-1 placeholder:text-slate-600"
            />
            {search && (
              <button onClick={() => { setSearch(''); fetchCVEs(); }} className="text-slate-600 hover:text-slate-400">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Severity filter */}
          <div className="relative">
            <select value={severity} onChange={e => setSeverity(e.target.value)}
              className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 pr-8 outline-none focus:border-cyan-500 cursor-pointer">
              {SEVERITIES.map(s => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-3 text-slate-500 pointer-events-none" />
          </div>

          {/* Category filter */}
          <div className="relative">
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 pr-8 outline-none focus:border-cyan-500 cursor-pointer">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-3 text-slate-500 pointer-events-none" />
          </div>

          <button onClick={fetchCVEs} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm transition-colors disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Summary stats */}
        {!loading && !error && filtered.length > 0 && (
          <div className="flex flex-wrap gap-3 px-6 py-3 border-b border-slate-800 flex-shrink-0">
            <div className="flex gap-3 text-xs flex-wrap">
              <span className="flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {stats.critical} Critical
              </span>
              <span className="flex items-center gap-1.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> {stats.high} High
              </span>
              <span className="flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-lg">
                <Zap size={11} /> {stats.exploit} With exploit
              </span>
              {stats.existing > 0 && (
                <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-lg">
                  <CheckCircle2 size={11} /> {stats.existing} already imported
                </span>
              )}
            </div>
            <div className="ml-auto flex items-center gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                <input type="checkbox"
                  checked={selected.size === selectableCount && selectableCount > 0}
                  onChange={toggleAll}
                  className="accent-cyan-500 w-3.5 h-3.5"
                />
                Select all ({selectableCount})
              </label>
              {selected.size > 0 && (
                <span className="text-cyan-400 font-medium">{selected.size} selected</span>
              )}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Loader2 size={28} className="animate-spin text-cyan-500" />
              <p className="text-slate-400 text-sm">Loading CVE library from GitHub CVEProject…</p>
              <p className="text-slate-600 text-xs">Fetching {25} CVEs, this may take a moment</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center h-48 gap-4 px-6 text-center">
              <AlertTriangle size={28} className="text-amber-400" />
              <div>
                <p className="text-amber-300 text-sm font-medium mb-1">Failed to load CVE library</p>
                <p className="text-slate-500 text-xs leading-relaxed">{error}</p>
                <p className="text-slate-600 text-xs mt-2">
                  Check that the API server is running.
                </p>
              </div>
              <button onClick={fetchCVEs}
                className="flex items-center gap-1.5 text-sm text-cyan-400 px-4 py-2 rounded-lg border border-cyan-500/30 hover:bg-cyan-500/10 transition-colors">
                <RefreshCw size={14} /> Try Again
              </button>
            </div>
          )}

          {/* Import success */}
          {importDone && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <CheckCircle2 size={28} className="text-emerald-400" />
              </div>
              <p className="text-slate-100 font-semibold">Import Complete</p>
              <p className="text-slate-400 text-sm">{selected.size} CVE{selected.size !== 1 ? 's' : ''} added to your vulnerability register</p>
            </div>
          )}

          {/* CVE list */}
          {!loading && !error && !importDone && filtered.length > 0 && (
            <div className="divide-y divide-slate-800/60">
              {filtered.map(cve => {
                const alreadyIn  = existingCVEIds.has(cve.cve_id);
                const isSelected = selected.has(cve.cve_id);
                const isExpanded = expanded === cve.cve_id;

                return (
                  <div key={cve.cve_id}
                    className={`transition-colors ${
                      alreadyIn   ? 'opacity-50 bg-slate-800/10' :
                      isSelected  ? 'bg-cyan-500/5' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Main row */}
                    <div className="flex items-center gap-3 px-6 py-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={alreadyIn}
                        onChange={() => toggleSelect(cve.cve_id)}
                        className="accent-cyan-500 w-4 h-4 flex-shrink-0 cursor-pointer disabled:cursor-not-allowed"
                      />

                      {/* CVE ID + title */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                            {cve.cve_id}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${severityBadge(cve.severity)}`}>
                            {cve.severity}
                          </span>
                          {cve.exploit_available && (
                            <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Zap size={10} /> Exploit
                            </span>
                          )}
                          {cve.patch_available && (
                            <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <CheckCircle2 size={10} /> Patch
                            </span>
                          )}
                          {alreadyIn && (
                            <span className="text-xs bg-slate-700/50 text-slate-400 border border-slate-600 px-1.5 py-0.5 rounded">
                              Already imported
                            </span>
                          )}
                          <span className="text-xs text-slate-600">{cve.category}</span>
                        </div>
                        <p className="text-slate-200 text-sm font-medium mt-0.5 truncate">{cve.title}</p>
                        <div className="flex gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
                          <span>Asset: <span className="text-slate-400 font-mono">{cve.asset}</span></span>
                          <span>Published: <span className="text-slate-400">{cve.published_date}</span></span>
                          <span>Due: <span className={`${new Date(cve.due_date) < new Date() ? 'text-red-400' : 'text-slate-400'}`}>{cve.due_date}</span></span>
                        </div>
                        {cve.affected_products.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {cve.affected_products.map((p, i) => (
                              <span key={i} className="text-xs bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-700/50">{p}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* CVSS score */}
                      <div className="flex-shrink-0 text-right hidden sm:block">
                        <CVSSBar score={cve.cvss_score} />
                      </div>

                      {/* Expand toggle */}
                      <button
                        onClick={() => setExpanded(isExpanded ? null : cve.cve_id)}
                        className="text-slate-600 hover:text-slate-300 p-1 transition-colors flex-shrink-0"
                      >
                        <ChevronRight size={16} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                    </div>

                    {/* Expanded description */}
                    {isExpanded && (
                      <div className="px-6 pb-4 ml-7 space-y-3">
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Info size={13} className="text-slate-500" />
                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Description</span>
                          </div>
                          <p className="text-slate-300 text-xs leading-relaxed">{cve.description}</p>
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs">
                          {cve.cvss_vector && (
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2">
                              <p className="text-slate-500 mb-0.5">CVSS Vector</p>
                              <p className="text-slate-300 font-mono text-xs">{cve.cvss_vector}</p>
                            </div>
                          )}
                          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2">
                            <p className="text-slate-500 mb-0.5">Suggested Asset</p>
                            <p className="text-slate-300 font-mono">{cve.asset}</p>
                          </div>
                          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2">
                            <p className="text-slate-500 mb-0.5">Remediation SLA</p>
                            <p className={`font-medium ${new Date(cve.due_date) < new Date() ? 'text-red-400' : 'text-slate-300'}`}>{cve.due_date}</p>
                          </div>
                        </div>

                        {cve.references.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {cve.references.map((ref, i) => (
                              <a key={i} href={ref} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 bg-slate-800/50 border border-slate-700/50 px-2 py-1 rounded-lg transition-colors">
                                <ExternalLink size={11} /> Reference {i + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && !importDone && filtered.length === 0 && cves.length > 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-sm">
              <Filter size={24} className="mb-2 text-slate-600" />
              No CVEs match the current filters
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl flex-shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info size={12} />
            Data sourced from GitHub CVEProject · NVD · Updated continuously
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm font-medium transition-colors">
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={selected.size === 0 || importDone}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={15} />
              Import {selected.size > 0 ? `${selected.size} CVE${selected.size !== 1 ? 's' : ''}` : 'Selected'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
