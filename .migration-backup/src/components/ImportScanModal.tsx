import { useState, useRef, useCallback } from 'react';
import {
  X, Upload, FileText, FileJson, Table2, CheckCircle2,
  AlertTriangle, ChevronRight, Loader2, Info, RotateCcw,
} from 'lucide-react';

export interface ParsedVuln {
  id: string;
  cve_id: string;
  title: string;
  cvss_score: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: string;
  asset: string;
  patch_available: boolean;
  exploit_available: boolean;
  published_date: string;
  due_date: string;
  assigned_to: string;
}

interface ImportScanModalProps {
  onClose: () => void;
  onImport: (vulns: ParsedVuln[]) => void;
}

type Step = 'upload' | 'preview' | 'done';

const SCANNER_TYPES = [
  { id: 'nessus', label: 'Nessus', ext: '.nessus / .xml', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { id: 'qualys', label: 'Qualys', ext: '.xml', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  { id: 'csv', label: 'Generic CSV', ext: '.csv', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { id: 'json', label: 'JSON / OpenVAS', ext: '.json', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
];

function cvssToSeverity(score: number): 'Critical' | 'High' | 'Medium' | 'Low' {
  if (score >= 9) return 'Critical';
  if (score >= 7) return 'High';
  if (score >= 4) return 'Medium';
  return 'Low';
}

function dueDateFromSeverity(sev: string): string {
  const days = sev === 'Critical' ? 15 : sev === 'High' ? 30 : sev === 'Medium' ? 60 : 90;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── Parsers ────────────────────────────────────────────────────────────────

function parseCSV(text: string): ParsedVuln[] {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

  const rawHeaders = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim().toLowerCase());

  const find = (candidates: string[]) => {
    for (const c of candidates) {
      const i = rawHeaders.findIndex((h) => h.includes(c));
      if (i !== -1) return i;
    }
    return -1;
  };

  const col = {
    cve: find(['cve']),
    title: find(['title', 'name', 'vulnerability', 'vuln']),
    cvss: find(['cvss', 'score']),
    severity: find(['severity', 'risk']),
    asset: find(['asset', 'host', 'ip', 'target']),
    patch: find(['patch']),
    exploit: find(['exploit']),
    date: find(['publish', 'date', 'found']),
    assignee: find(['assign', 'owner', 'team']),
    status: find(['status', 'state']),
  };

  return lines.slice(1).map((line, i) => {
    const cells = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
    const cvss = parseFloat(cells[col.cvss] ?? '0') || 5.0;
    const sev = (cells[col.severity] ?? '') as string;
    const normSev: ParsedVuln['severity'] =
      ['critical', 'high', 'medium', 'low'].includes(sev.toLowerCase())
        ? (sev.charAt(0).toUpperCase() + sev.slice(1).toLowerCase()) as ParsedVuln['severity']
        : cvssToSeverity(cvss);

    return {
      id: `import-csv-${Date.now()}-${i}`,
      cve_id: cells[col.cve] || `IMPORT-${i + 1}`,
      title: cells[col.title] || `Imported Vulnerability ${i + 1}`,
      cvss_score: Math.min(10, Math.max(0, cvss)),
      severity: normSev,
      status: cells[col.status] || 'Open',
      asset: cells[col.asset] || 'Unknown',
      patch_available: /true|yes|1/i.test(cells[col.patch] ?? ''),
      exploit_available: /true|yes|1/i.test(cells[col.exploit] ?? ''),
      published_date: cells[col.date] || new Date().toISOString().slice(0, 10),
      due_date: dueDateFromSeverity(normSev),
      assigned_to: cells[col.assignee] || 'Unassigned',
    };
  });
}

function parseJSON(text: string): ParsedVuln[] {
  const data = JSON.parse(text);
  const arr = Array.isArray(data) ? data : (data.vulnerabilities ?? data.results ?? data.findings ?? [data]);
  if (!Array.isArray(arr) || arr.length === 0) throw new Error('No vulnerability records found in JSON');

  return arr.map((item: Record<string, unknown>, i: number) => {
    const cvss = parseFloat(String(item.cvss_score ?? item.cvss ?? item.score ?? item.base_score ?? 5)) || 5;
    const sev = String(item.severity ?? item.risk ?? '');
    const normSev: ParsedVuln['severity'] =
      ['Critical', 'High', 'Medium', 'Low'].includes(sev)
        ? sev as ParsedVuln['severity']
        : cvssToSeverity(cvss);
    return {
      id: `import-json-${Date.now()}-${i}`,
      cve_id: String(item.cve_id ?? item.cve ?? item.id ?? `IMPORT-${i + 1}`),
      title: String(item.title ?? item.name ?? item.vulnerability ?? `Imported Vulnerability ${i + 1}`),
      cvss_score: Math.min(10, Math.max(0, cvss)),
      severity: normSev,
      status: String(item.status ?? item.state ?? 'Open'),
      asset: String(item.asset ?? item.host ?? item.target ?? item.ip ?? 'Unknown'),
      patch_available: Boolean(item.patch_available ?? item.patch ?? false),
      exploit_available: Boolean(item.exploit_available ?? item.exploit ?? false),
      published_date: String(item.published_date ?? item.date ?? new Date().toISOString().slice(0, 10)),
      due_date: dueDateFromSeverity(normSev),
      assigned_to: String(item.assigned_to ?? item.assignee ?? item.owner ?? 'Unassigned'),
    };
  });
}

function parseNessusXML(text: string): ParsedVuln[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/xml');
  const items = Array.from(doc.querySelectorAll('ReportItem'));
  if (items.length === 0) throw new Error('No ReportItem elements found — is this a valid Nessus file?');

  return items.map((item, i) => {
    const cvss = parseFloat(item.getAttribute('cvss3_base_score') ?? item.getAttribute('cvss_base_score') ?? '0') || 0;
    const risk = (item.getAttribute('severity') ?? '0');
    const numSev = parseInt(risk);
    const normSev: ParsedVuln['severity'] =
      numSev >= 4 ? 'Critical' : numSev === 3 ? 'High' : numSev === 2 ? 'Medium' : 'Low';
    const cve = item.querySelector('cve')?.textContent ?? '';
    const host = item.closest('ReportHost')?.getAttribute('name') ?? 'Unknown';

    return {
      id: `import-nessus-${Date.now()}-${i}`,
      cve_id: cve || `NESSUS-${item.getAttribute('pluginID') ?? i}`,
      title: item.getAttribute('pluginName') ?? `Nessus Finding ${i + 1}`,
      cvss_score: cvss || (numSev * 2.5),
      severity: normSev,
      status: 'Open',
      asset: host,
      patch_available: (item.querySelector('solution')?.textContent ?? '').length > 5,
      exploit_available: item.querySelector('exploit_available')?.textContent === 'true',
      published_date: item.querySelector('vuln_publication_date')?.textContent ?? new Date().toISOString().slice(0, 10),
      due_date: dueDateFromSeverity(normSev),
      assigned_to: 'Unassigned',
    };
  });
}

function parseQualysXML(text: string): ParsedVuln[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/xml');
  const vulns = Array.from(doc.querySelectorAll('VULN, Vuln, DETECTION'));
  if (vulns.length === 0) throw new Error('No VULN/DETECTION elements found — is this a valid Qualys file?');

  return vulns.map((v, i) => {
    const cvss = parseFloat(v.querySelector('CVSS_FINAL, CVSS3_FINAL, CVSSv3_base')?.textContent ?? '0') || 0;
    const sev = parseInt(v.querySelector('SEVERITY')?.textContent ?? '0');
    const normSev: ParsedVuln['severity'] =
      sev >= 4 ? 'Critical' : sev === 3 ? 'High' : sev === 2 ? 'Medium' : 'Low';
    const cve = v.querySelector('CVE_ID_LIST CVE_ID ID, CVE')?.textContent ?? '';

    return {
      id: `import-qualys-${Date.now()}-${i}`,
      cve_id: cve || `QID-${v.querySelector('QID')?.textContent ?? i}`,
      title: v.querySelector('TITLE, Title')?.textContent ?? `Qualys Finding ${i + 1}`,
      cvss_score: cvss || sev * 2,
      severity: normSev,
      status: v.querySelector('STATUS')?.textContent ?? 'Open',
      asset: v.querySelector('IP, HOST')?.textContent ?? 'Unknown',
      patch_available: (v.querySelector('SOLUTION')?.textContent ?? '').length > 5,
      exploit_available: v.querySelector('EXPLOITABILITY')?.textContent === 'Yes',
      published_date: v.querySelector('PUBLISHED_DATETIME')?.textContent?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      due_date: dueDateFromSeverity(normSev),
      assigned_to: 'Unassigned',
    };
  });
}

function detectAndParse(filename: string, content: string): ParsedVuln[] {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'json') return parseJSON(content);
  if (ext === 'csv') return parseCSV(content);
  if (ext === 'nessus' || (ext === 'xml' && content.includes('<NessusClientData'))) return parseNessusXML(content);
  if (ext === 'xml' && content.includes('<ASSET_DATA_REPORT')) return parseQualysXML(content);
  if (ext === 'xml') {
    // Try Nessus first, then Qualys
    try { return parseNessusXML(content); } catch { /* fall through */ }
    return parseQualysXML(content);
  }
  throw new Error(`Unsupported file format: .${ext}. Use .nessus, .xml, .csv, or .json`);
}

// ── Sample file downloader ─────────────────────────────────────────────────

function downloadSample(filename: string) {
  const a = document.createElement('a');
  a.href = `/samples/${filename}`;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ── Severity badge ─────────────────────────────────────────────────────────

function SevBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    High: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${map[level] ?? 'bg-slate-700 text-slate-400 border-slate-600'}`}>
      {level}
    </span>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────

export default function ImportScanModal({ onClose, onImport }: ImportScanModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedVuln[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (f: File) => {
    setFile(f);
    setParsing(true);
    setParseError(null);
    try {
      const text = await f.text();
      const results = detectAndParse(f.name, text);
      setParsed(results);
      setSelected(new Set(results.map((v) => v.id)));
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

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const toggleSelect = (id: string) =>
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleAll = () =>
    setSelected(selected.size === parsed.length ? new Set() : new Set(parsed.map((v) => v.id)));

  const handleImport = () => {
    onImport(parsed.filter((v) => selected.has(v.id)));
    setStep('done');
  };

  const stats = {
    critical: parsed.filter((v) => v.severity === 'Critical').length,
    high: parsed.filter((v) => v.severity === 'High').length,
    medium: parsed.filter((v) => v.severity === 'Medium').length,
    low: parsed.filter((v) => v.severity === 'Low').length,
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
              <h2 className="text-slate-100 font-bold text-base">Import Scan Results</h2>
              <p className="text-slate-500 text-xs">Nessus · Qualys · CSV · JSON / OpenVAS</p>
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
              <span className={`font-medium capitalize ${step === s ? 'text-cyan-400' : step === 'done' || (step === 'preview' && s === 'upload') ? 'text-slate-500' : 'text-slate-600'}`}>
                {i + 1}. {s === 'upload' ? 'Upload File' : s === 'preview' ? 'Review & Select' : 'Done'}
              </span>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── Step 1: Upload ── */}
          {step === 'upload' && (
            <div className="p-6 space-y-5">
              {/* Supported formats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SCANNER_TYPES.map((s) => (
                  <div key={s.id} className={`rounded-xl border p-3 text-center ${s.bg}`}>
                    <p className={`text-sm font-bold ${s.color}`}>{s.label}</p>
                    <p className="text-slate-600 text-xs mt-0.5">{s.ext}</p>
                  </div>
                ))}
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-cyan-500 bg-cyan-500/5'
                    : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'
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
                    <p className="text-slate-300 font-semibold mb-1">Drop your scan file here</p>
                    <p className="text-slate-500 text-sm">or click to browse</p>
                    <p className="text-slate-600 text-xs mt-2">.nessus · .xml · .csv · .json</p>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept=".nessus,.xml,.csv,.json" className="hidden" onChange={handleFileInput} />
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

              {/* Sample file downloads */}
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                <p className="text-slate-400 text-xs font-medium mb-3 flex items-center gap-1.5">
                  <Info size={13} className="text-slate-500" />
                  No scanner file? Download a sample to test the import:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { label: 'sample-scan.csv', file: 'sample-scan.csv', desc: '10 vulns · Generic CSV', tag: 'Recommended', color: 'border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/15', textColor: 'text-emerald-400', tagColor: 'bg-emerald-500 text-slate-900' },
                    { label: 'sample-scan.nessus', file: 'sample-scan.nessus', desc: '7 vulns · 3 hosts', tag: 'Nessus', color: 'border-blue-500/30 bg-blue-500/8 hover:bg-blue-500/15', textColor: 'text-blue-400', tagColor: 'bg-blue-500/20 text-blue-300' },
                    { label: 'sample-scan-qualys.xml', file: 'sample-scan-qualys.xml', desc: '7 vulns · 3 hosts', tag: 'Qualys', color: 'border-orange-500/30 bg-orange-500/8 hover:bg-orange-500/15', textColor: 'text-orange-400', tagColor: 'bg-orange-500/20 text-orange-300' },
                  ].map((s) => (
                    <button
                      key={s.file}
                      onClick={(e) => { e.stopPropagation(); downloadSample(s.file); }}
                      className={`flex flex-col items-start gap-1.5 px-3 py-2.5 rounded-lg border text-left transition-colors ${s.color}`}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className={`text-xs font-semibold ${s.textColor} flex items-center gap-1`}>
                          <FileText size={11} />
                          {s.label}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.tagColor}`}>{s.tag}</span>
                      </div>
                      <span className="text-slate-600 text-[10px]">{s.desc}</span>
                    </button>
                  ))}
                </div>
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
                  <span className="text-slate-300 text-sm font-medium truncate max-w-[180px]">{file?.name}</span>
                </div>
                <span className="text-slate-500 text-sm">{parsed.length} vulnerabilities found</span>
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
                  <input
                    type="checkbox"
                    checked={selected.size === parsed.length}
                    onChange={toggleAll}
                    className="accent-cyan-500"
                  />
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
                        <th className="px-3 py-2.5 text-left text-slate-500 uppercase tracking-wider font-semibold">CVE / Title</th>
                        <th className="px-3 py-2.5 text-left text-slate-500 uppercase tracking-wider font-semibold">CVSS</th>
                        <th className="px-3 py-2.5 text-left text-slate-500 uppercase tracking-wider font-semibold">Severity</th>
                        <th className="px-3 py-2.5 text-left text-slate-500 uppercase tracking-wider font-semibold">Asset</th>
                        <th className="px-3 py-2.5 text-left text-slate-500 uppercase tracking-wider font-semibold">Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {parsed.map((v) => (
                        <tr
                          key={v.id}
                          className={`transition-colors cursor-pointer ${selected.has(v.id) ? 'bg-slate-800/30' : 'opacity-40'}`}
                          onClick={() => toggleSelect(v.id)}
                        >
                          <td className="px-3 py-2.5">
                            <input
                              type="checkbox"
                              checked={selected.has(v.id)}
                              onChange={() => toggleSelect(v.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="accent-cyan-500"
                            />
                          </td>
                          <td className="px-3 py-2.5 max-w-[200px]">
                            <p className="text-slate-200 font-medium truncate">{v.title}</p>
                            <p className="text-slate-500 font-mono">{v.cve_id}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`font-bold tabular-nums ${
                              v.cvss_score >= 9 ? 'text-red-400' :
                              v.cvss_score >= 7 ? 'text-orange-400' :
                              v.cvss_score >= 4 ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {v.cvss_score.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-3 py-2.5"><SevBadge level={v.severity} /></td>
                          <td className="px-3 py-2.5 text-slate-400 font-mono">{v.asset}</td>
                          <td className="px-3 py-2.5 text-slate-500">{v.due_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-xs text-slate-600">
                Due dates are auto-calculated: Critical=15d, High=30d, Medium=60d, Low=90d from today.
                All imported entries default to <span className="text-slate-500">Open</span> status and assigned to the current user.
              </p>
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
                  {selected.size} {selected.size === 1 ? 'vulnerability' : 'vulnerabilities'} added to the register
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={onClose} className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm transition-colors">
                  View Register
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

        {/* Footer actions */}
        {step !== 'done' && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl">
            <div className="flex gap-2">
              {step === 'preview' && (
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  {file?.name.endsWith('.csv') ? <Table2 size={13} /> : <FileJson size={13} />}
                  {file?.name}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              {step === 'preview' && (
                <button
                  onClick={handleImport}
                  disabled={selected.size === 0}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Upload size={15} />
                  Import {selected.size} {selected.size === 1 ? 'Vulnerability' : 'Vulnerabilities'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
