import { useState, useRef, useCallback } from 'react';
import {
  X, Upload, FileText, CheckCircle2, AlertTriangle,
  ChevronRight, Loader2, Info, RotateCcw, Download,
} from 'lucide-react';
import type { NewAsset } from './AddAssetModal';

interface ImportAssetCSVModalProps {
  onClose: () => void;
  onImport: (assets: NewAsset[]) => void;
}

type Step = 'upload' | 'preview' | 'done';

const REQUIRED_HINT = 'name, type';
const ALL_FIELDS = 'name, type, criticality, category, ip_address, location, owner, business_unit, status, confidentiality, integrity, availability';

// ── CSV parser ─────────────────────────────────────────────────────────────

function parseCSV(text: string): NewAsset[] {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.');

  const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim().toLowerCase().replace(/\s+/g, '_'));

  const col = (candidates: string[]) => {
    for (const c of candidates) {
      const i = headers.findIndex((h) => h.includes(c));
      if (i !== -1) return i;
    }
    return -1;
  };

  const idx = {
    name:               col(['name', 'title', 'asset']),
    type:               col(['type']),
    criticality:        col(['criticality', 'critical', 'risk_level']),
    category:           col(['category', 'cat']),
    ip:                 col(['ip', 'address', 'cidr', 'host']),
    location:           col(['location', 'primary_loc', 'site']),
    secondary_location: col(['secondary']),
    owner:              col(['owner', 'assignee', 'responsible']),
    business_unit:      col(['business_unit', 'bu', 'department', 'team']),
    status:             col(['status', 'state']),
    confidentiality:    col(['confidentiality', 'conf']),
    integrity:          col(['integrity', 'integ']),
    availability:       col(['availability', 'avail']),
    description:        col(['description', 'desc', 'notes']),
  };

  if (idx.name === -1) throw new Error('Missing required column: "name" or "title".');
  if (idx.type === -1) throw new Error('Missing required column: "type".');

  const normCriticality = (v: string): string => {
    const map: Record<string, string> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
    return map[v.toLowerCase()] ?? 'Medium';
  };

  const normStatus = (v: string): 'Active' | 'Inactive' =>
    /inactive|disabled|false|0/i.test(v) ? 'Inactive' : 'Active';

  return lines.slice(1).map((line, i) => {
    const raw = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
    const get = (ci: number) => (ci >= 0 ? raw[ci] ?? '' : '');

    const name = get(idx.name);
    if (!name) throw new Error(`Row ${i + 2}: missing asset name.`);

    const type = get(idx.type) || 'Server';
    const criticality = normCriticality(get(idx.criticality));
    const category = get(idx.category) || (type === 'Cloud Service' ? 'Cloud' : type === 'IoT' ? 'OT' : 'IT');

    return {
      id: `import-asset-${Date.now()}-${i}`,
      name,
      description: get(idx.description),
      status: normStatus(get(idx.status)),
      hierarchy: 'Level 1',
      type,
      category,
      criticality,
      confidentiality: get(idx.confidentiality) || '',
      integrity: get(idx.integrity) || '',
      availability: get(idx.availability) || '',
      ip_address: get(idx.ip) || '—',
      location: get(idx.location) || '—',
      secondary_location: get(idx.secondary_location),
      owner: get(idx.owner) || 'Unassigned',
      business_unit: get(idx.business_unit) || 'Unassigned',
      risk_score: 0,
      vulnerability_count: 0,
      last_scanned_at: new Date().toISOString(),
      attachments: [],
    };
  });
}

// ── Download sample ────────────────────────────────────────────────────────

function downloadSample() {
  const a = document.createElement('a');
  a.href = '/samples/sample-assets.csv';
  a.download = 'sample-assets.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ── Criticality badge ──────────────────────────────────────────────────────

function CritBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    High:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
    Medium:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Low:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${map[level] ?? 'bg-slate-700 text-slate-400 border-slate-600'}`}>
      {level}
    </span>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────

export default function ImportAssetCSVModal({ onClose, onImport }: ImportAssetCSVModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<NewAsset[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (f: File) => {
    if (!f.name.endsWith('.csv')) {
      setParseError('Only .csv files are supported for asset import.');
      return;
    }
    setFile(f);
    setParsing(true);
    setParseError(null);
    try {
      const text = await f.text();
      const results = parseCSV(text);
      setParsed(results);
      setSelected(new Set(results.map((a) => a.id)));
      setStep('preview');
    } catch (err) {
      setParseError((err as Error).message);
    } finally {
      setParsing(false);
    }
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const toggleSelect = (id: string) =>
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleAll = () =>
    setSelected(selected.size === parsed.length ? new Set() : new Set(parsed.map((a) => a.id)));

  const handleImport = () => {
    onImport(parsed.filter((a) => selected.has(a.id)));
    setStep('done');
  };

  const stats = {
    critical: parsed.filter((a) => a.criticality === 'Critical').length,
    high:     parsed.filter((a) => a.criticality === 'High').length,
    medium:   parsed.filter((a) => a.criticality === 'Medium').length,
    low:      parsed.filter((a) => a.criticality === 'Low').length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
              <Upload size={15} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-slate-100 font-bold text-base">Import Assets via CSV</h2>
              <p className="text-slate-500 text-xs">Bulk-add assets from a comma-separated file</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800 bg-slate-800/40 text-xs">
          {(['upload', 'preview', 'done'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <ChevronRight size={12} className="text-slate-600" />}
              <span className={`font-medium capitalize ${
                step === s ? 'text-cyan-400' :
                (step === 'preview' && s === 'upload') || step === 'done' ? 'text-slate-500' : 'text-slate-600'
              }`}>
                {i + 1}. {s === 'upload' ? 'Upload CSV' : s === 'preview' ? 'Review & Select' : 'Done'}
              </span>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── Step 1: Upload ── */}
          {step === 'upload' && (
            <div className="p-6 space-y-5">

              {/* Column reference */}
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-2">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Expected CSV Columns</p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_FIELDS.split(', ').map((f) => (
                    <span key={f} className={`text-xs px-2 py-0.5 rounded font-mono ${REQUIRED_HINT.includes(f) ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'bg-slate-700/60 text-slate-400'}`}>
                      {f}{REQUIRED_HINT.includes(f) ? ' *' : ''}
                    </span>
                  ))}
                </div>
                <p className="text-slate-600 text-xs">* Required columns. All others are optional.</p>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                  dragOver ? 'border-cyan-500 bg-cyan-500/5' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'
                }`}
              >
                {parsing ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="text-cyan-400 animate-spin" />
                    <p className="text-slate-300 font-medium">Parsing {file?.name}…</p>
                  </div>
                ) : (
                  <>
                    <Upload size={32} className="text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-300 font-semibold mb-1">Drop your CSV file here</p>
                    <p className="text-slate-500 text-sm">or click to browse</p>
                    <p className="text-slate-600 text-xs mt-2">.csv files only</p>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
              </div>

              {parseError && (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm">
                  <AlertTriangle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-300 font-medium">Parse error</p>
                    <p className="text-red-400/80 text-xs mt-0.5">{parseError}</p>
                  </div>
                </div>
              )}

              {/* Sample download */}
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-slate-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-400 text-xs font-medium">Download sample CSV</p>
                    <p className="text-slate-600 text-xs mt-0.5">10 pre-filled asset records to test the import flow</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); downloadSample(); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-slate-100 text-xs font-medium transition-colors flex-shrink-0"
                >
                  <Download size={13} /> sample-assets.csv
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Preview ── */}
          {step === 'preview' && (
            <div className="p-6 space-y-4">
              {/* Summary */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
                  <FileText size={14} className="text-slate-400" />
                  <span className="text-slate-300 text-sm font-medium">{file?.name}</span>
                </div>
                <span className="text-slate-500 text-sm">{parsed.length} assets found</span>
                <div className="flex gap-2 ml-auto flex-wrap">
                  {stats.critical > 0 && <span className="text-xs font-semibold bg-red-500/15 text-red-400 px-2 py-0.5 rounded">{stats.critical} Critical</span>}
                  {stats.high > 0 && <span className="text-xs font-semibold bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded">{stats.high} High</span>}
                  {stats.medium > 0 && <span className="text-xs font-semibold bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded">{stats.medium} Medium</span>}
                  {stats.low > 0 && <span className="text-xs font-semibold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded">{stats.low} Low</span>}
                </div>
              </div>

              {/* Selection controls */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selected.size === parsed.length} onChange={toggleAll} className="accent-cyan-500" />
                  <span>{selected.size} of {parsed.length} selected for import</span>
                </label>
                <button
                  onClick={() => { setStep('upload'); setParsed([]); setFile(null); setParseError(null); }}
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <RotateCcw size={12} /> Change file
                </button>
              </div>

              {/* Table */}
              <div className="border border-slate-700/50 rounded-xl overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-slate-800 z-10">
                      <tr className="border-b border-slate-700">
                        <th className="px-3 py-2.5 w-8" />
                        <th className="px-3 py-2.5 text-left text-slate-500 uppercase tracking-wider font-semibold">Name</th>
                        <th className="px-3 py-2.5 text-left text-slate-500 uppercase tracking-wider font-semibold">Type</th>
                        <th className="px-3 py-2.5 text-left text-slate-500 uppercase tracking-wider font-semibold">Criticality</th>
                        <th className="px-3 py-2.5 text-left text-slate-500 uppercase tracking-wider font-semibold">IP / CIDR</th>
                        <th className="px-3 py-2.5 text-left text-slate-500 uppercase tracking-wider font-semibold">Owner</th>
                        <th className="px-3 py-2.5 text-left text-slate-500 uppercase tracking-wider font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {parsed.map((a) => (
                        <tr
                          key={a.id}
                          onClick={() => toggleSelect(a.id)}
                          className={`cursor-pointer transition-colors ${selected.has(a.id) ? 'bg-slate-800/30 hover:bg-slate-800/50' : 'opacity-40 hover:opacity-60'}`}
                        >
                          <td className="px-3 py-2.5">
                            <input
                              type="checkbox"
                              checked={selected.has(a.id)}
                              onChange={() => toggleSelect(a.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="accent-cyan-500"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="text-slate-200 font-medium truncate max-w-[160px]">{a.name}</p>
                            <p className="text-slate-500">{a.category}</p>
                          </td>
                          <td className="px-3 py-2.5 text-slate-400">{a.type}</td>
                          <td className="px-3 py-2.5"><CritBadge level={a.criticality} /></td>
                          <td className="px-3 py-2.5 text-slate-400 font-mono">{a.ip_address}</td>
                          <td className="px-3 py-2.5 text-slate-400">{a.owner}</td>
                          <td className="px-3 py-2.5">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                              a.status === 'Active'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : 'bg-slate-700/50 text-slate-500 border-slate-600/30'
                            }`}>
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Done ── */}
          {step === 'done' && (
            <div className="p-12 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-slate-100 font-bold text-lg">Import Complete</h3>
                <p className="text-slate-400 text-sm mt-1">
                  {selected.size} {selected.size === 1 ? 'asset' : 'assets'} added to the inventory
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={onClose} className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm transition-colors">
                  View Inventory
                </button>
                <button
                  onClick={() => { setStep('upload'); setParsed([]); setFile(null); setSelected(new Set()); }}
                  className="px-5 py-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200 text-sm transition-colors"
                >
                  Import Another
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'done' && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm font-medium transition-colors">
              Cancel
            </button>
            {step === 'preview' && (
              <button
                onClick={handleImport}
                disabled={selected.size === 0}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Upload size={15} />
                Import {selected.size} {selected.size === 1 ? 'Asset' : 'Assets'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
