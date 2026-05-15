import { useState, useRef } from 'react';
import { X, ChevronDown, ChevronUp, Info, Upload, FileText, XCircle } from 'lucide-react';
import type { IOC } from '../lib/types';

export type NewIOC = Omit<IOC, 'id'>;

interface AddIOCModalProps {
  onClose: () => void;
  onSubmit: (ioc: IOC) => void;
}

const IOC_TYPES: IOC['type'][] = ['IP', 'Domain', 'URL', 'Hash', 'Email', 'File', 'Registry', 'Certificate'];
const SEVERITIES: IOC['severity'][] = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES: IOC['status'][] = ['Active', 'Inactive', 'Under Review', 'Whitelisted'];
const SOURCES = ['CISA Advisory', 'FBI Flash Alert', 'Internal SIEM', 'Threat Intel Feed', 'VirusTotal', 'NDR Platform', 'EDR Alert', 'WAF Logs', 'Open Source Intel', 'User Report', 'Vendor Advisory', 'ISAC', 'Manual Entry'];
const THREAT_ACTORS = ['APT29 (Cozy Bear)', 'LockBit Group', 'Lazarus Group', 'FIN7', 'Scattered Spider', 'BlackCat/ALPHV', 'Cl0p', 'Unknown'];

function Label({ children, required, tooltip }: { children: React.ReactNode; required?: boolean; tooltip?: string }) {
  return (
    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
      {children}
      {required && <span className="text-red-400">*</span>}
      {tooltip && (
        <span className="relative group cursor-help">
          <Info size={13} className="text-slate-500 hover:text-slate-400 transition-colors" />
          <span className="absolute left-5 top-0 z-50 hidden group-hover:block bg-slate-800 border border-slate-700 text-slate-400 text-xs rounded-lg px-2.5 py-1.5 w-52 shadow-xl">
            {tooltip}
          </span>
        </span>
      )}
    </label>
  );
}

function SelectField({ value, onChange, placeholder, options }: {
  value: string; onChange: (v: string) => void; placeholder: string; options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full appearance-none rounded-lg border px-3 py-2.5 pr-9 text-sm outline-none transition-colors bg-slate-800 focus:border-cyan-500 ${
          value ? 'border-slate-700 text-slate-200' : 'border-slate-700 text-slate-500'
        }`}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
    </div>
  );
}

function Section({ title, open, onToggle, children }: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-700/60 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-5 py-3.5 bg-slate-800/60 hover:bg-slate-800 transition-colors text-left"
      >
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        <span className="text-slate-200 font-semibold text-sm">{title}</span>
      </button>
      {open && <div className="px-5 py-5 bg-slate-900/40 space-y-4">{children}</div>}
    </div>
  );
}

export default function AddIOCModal({ onClose, onSubmit }: AddIOCModalProps) {
  const [sections, setSections] = useState({ general: true, classification: true, context: true, additional: true });
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tagInput, setTagInput] = useState('');

  const [form, setForm] = useState<{
    value: string;
    type: string;
    severity: string;
    status: string;
    confidence: number;
    source: string;
    threat_actor: string;
    tags: string[];
    description: string;
    first_seen: string;
    last_seen: string;
    expiry_date: string;
    related_incident: string;
  }>({
    value: '',
    type: '',
    severity: '',
    status: 'Active',
    confidence: 70,
    source: '',
    threat_actor: 'Unknown',
    tags: [],
    description: '',
    first_seen: new Date().toISOString().slice(0, 16),
    last_seen: new Date().toISOString().slice(0, 16),
    expiry_date: '',
    related_incident: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggle = (s: keyof typeof sections) =>
    setSections((prev) => ({ ...prev, [s]: !prev[s] }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !form.tags.includes(t)) {
      set('tags', [...form.tags, t]);
    }
    setTagInput('');
  };

  const removeTag = (t: string) => set('tags', form.tags.filter((x) => x !== t));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.value.trim()) e.value = 'IOC value is required';
    if (!form.type) e.type = 'Type is required';
    if (!form.severity) e.severity = 'Severity is required';
    if (!form.source.trim()) e.source = 'Source is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      id: `ioc-${Date.now()}`,
      value: form.value.trim(),
      type: form.type as IOC['type'],
      severity: form.severity as IOC['severity'],
      status: form.status as IOC['status'],
      confidence: form.confidence,
      source: form.source,
      threat_actor: form.threat_actor,
      tags: form.tags,
      description: form.description,
      first_seen: form.first_seen ? new Date(form.first_seen).toISOString() : new Date().toISOString(),
      last_seen: form.last_seen ? new Date(form.last_seen).toISOString() : new Date().toISOString(),
      expiry_date: form.expiry_date,
      related_incident: form.related_incident,
    });
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const descLen = form.description.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-slate-100 font-bold text-base">Add Indicator of Compromise</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">

            {/* ── General ── */}
            <Section title="General" open={sections.general} onToggle={() => toggle('general')}>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-x-8 gap-y-4">

                {/* Left */}
                <div className="space-y-4">
                  {/* IOC Value */}
                  <div>
                    <Label required tooltip="The raw indicator value (IP address, domain, hash, URL, etc.)">IOC Value</Label>
                    <input
                      value={form.value}
                      onChange={(e) => set('value', e.target.value)}
                      placeholder="e.g. 185.220.101.47 or malicious[.]com"
                      className={`w-full bg-slate-800 border rounded-lg px-3 py-2.5 text-sm font-mono text-slate-200 placeholder:text-slate-600 outline-none transition-colors focus:border-cyan-500 ${errors.value ? 'border-red-500' : 'border-slate-700'}`}
                    />
                    {errors.value && <p className="text-red-400 text-xs mt-1">{errors.value}</p>}
                  </div>

                  {/* Description */}
                  <div>
                    <Label tooltip="Context and details about this indicator and its associated threat activity">Description</Label>
                    <textarea
                      value={form.description}
                      onChange={(e) => set('description', e.target.value.slice(0, 4000))}
                      placeholder="Description"
                      rows={4}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-colors focus:border-cyan-500 resize-none"
                    />
                    <p className="text-right text-xs text-slate-600 -mt-1">{descLen}/4000</p>
                  </div>

                  {/* Type + Source */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label required tooltip="The type of indicator (IP, Domain, URL, Hash, Email, etc.)">Type</Label>
                      <SelectField value={form.type} onChange={(v) => set('type', v)} placeholder="Select an option" options={IOC_TYPES} />
                      {errors.type && <p className="text-red-400 text-xs mt-1">{errors.type}</p>}
                    </div>
                    <div>
                      <Label required tooltip="The intelligence source or feed that reported this indicator">Source</Label>
                      <div className="relative">
                        <input
                          value={form.source}
                          onChange={(e) => set('source', e.target.value)}
                          list="source-list"
                          placeholder="e.g. CISA Advisory"
                          className={`w-full bg-slate-800 border rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-colors focus:border-cyan-500 ${errors.source ? 'border-red-500' : 'border-slate-700'}`}
                        />
                        <datalist id="source-list">
                          {SOURCES.map((s) => <option key={s} value={s} />)}
                        </datalist>
                      </div>
                      {errors.source && <p className="text-red-400 text-xs mt-1">{errors.source}</p>}
                    </div>
                  </div>

                  {/* Related Incident */}
                  <div>
                    <Label tooltip="Incident ID this IOC is linked to, if any">Related Incident</Label>
                    <input
                      value={form.related_incident}
                      onChange={(e) => set('related_incident', e.target.value)}
                      placeholder="e.g. INC-0001"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-colors focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Right — Status, Severity, Confidence */}
                <div className="flex flex-col gap-4 lg:w-52">
                  <div>
                    <Label tooltip="Current operational status of this indicator">Status</Label>
                    <SelectField value={form.status} onChange={(v) => set('status', v)} placeholder="Status" options={STATUSES} />
                  </div>
                  <div>
                    <Label required tooltip="Threat severity level of this indicator">Severity</Label>
                    <SelectField value={form.severity} onChange={(v) => set('severity', v)} placeholder="Severity" options={SEVERITIES} />
                    {errors.severity && <p className="text-red-400 text-xs mt-1">{errors.severity}</p>}
                  </div>
                  <div>
                    <Label tooltip="Analyst confidence in the accuracy of this indicator (0–100%)">Confidence</Label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min={0} max={100}
                        value={form.confidence}
                        onChange={(e) => set('confidence', Number(e.target.value))}
                        className="w-full accent-cyan-500"
                      />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Low</span>
                        <span className={`font-bold tabular-nums ${form.confidence >= 80 ? 'text-emerald-400' : form.confidence >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{form.confidence}%</span>
                        <span>High</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* ── Classification ── */}
            <Section title="Classification & Attribution" open={sections.classification} onToggle={() => toggle('classification')}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label tooltip="Threat actor attributed to this indicator">Threat Actor</Label>
                  <SelectField value={form.threat_actor} onChange={(v) => set('threat_actor', v)} placeholder="Threat Actor" options={THREAT_ACTORS} />
                </div>
                <div>
                  <Label tooltip="Tags to categorise and group this indicator">Tags</Label>
                  <div className="flex gap-2">
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                      placeholder="Add tag + Enter"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500"
                    />
                    <button type="button" onClick={addTag} className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors">Add</button>
                  </div>
                  {form.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.tags.map((t) => (
                        <span key={t} className="flex items-center gap-1 bg-slate-700/60 text-slate-400 text-xs px-2 py-1 rounded-lg">
                          {t}
                          <button type="button" onClick={() => removeTag(t)} className="text-slate-600 hover:text-red-400 transition-colors">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Section>

            {/* ── Context ── */}
            <Section title="Timeline & Context" open={sections.context} onToggle={() => toggle('context')}>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label tooltip="When this indicator was first observed">First Seen</Label>
                  <input
                    type="datetime-local"
                    value={form.first_seen}
                    onChange={(e) => set('first_seen', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <Label tooltip="When this indicator was most recently observed">Last Seen</Label>
                  <input
                    type="datetime-local"
                    value={form.last_seen}
                    onChange={(e) => set('last_seen', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <Label tooltip="Date after which this indicator should be reviewed or removed">Expiry Date</Label>
                  <input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => set('expiry_date', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>
            </Section>

            {/* ── Additional Details ── */}
            <Section title="Additional Details" open={sections.additional} onToggle={() => toggle('additional')}>
              <div>
                <Label tooltip="Supporting evidence, PCAP files, screenshots, or related reports">Attach File(s)</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 border border-slate-700 rounded-lg px-4 py-3 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600 cursor-pointer transition-colors"
                >
                  <Upload size={18} className="text-cyan-400 flex-shrink-0" />
                  <span className="text-slate-500 text-sm flex-1">
                    {attachments.length === 0 ? 'Click to upload files' : `Uploaded (${attachments.length})`}
                  </span>
                  <span className="text-slate-600 text-xs">Uploaded ({attachments.length})</span>
                </div>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileAdd} />
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {attachments.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2">
                        <FileText size={13} className="text-slate-400 flex-shrink-0" />
                        <span className="text-slate-300 text-xs flex-1 truncate">{file.name}</span>
                        <span className="text-slate-600 text-xs">{(file.size / 1024).toFixed(1)} KB</span>
                        <button type="button" onClick={() => setAttachments((p) => p.filter((_, idx) => idx !== i))} className="text-slate-600 hover:text-red-400 transition-colors">
                          <XCircle size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Section>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              <X size={15} /> Close
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-colors"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
