import { useState, useRef } from 'react';
import { X, ChevronDown, ChevronUp, Info, Upload, FileText, XCircle } from 'lucide-react';
import type { Incident, SeverityLevel, PriorityType } from '../lib/types';

export type NewIncident = Omit<Incident, 'id'>;

interface DeclareIncidentModalProps {
  onClose: () => void;
  onSubmit: (incident: Incident) => void;
}

const INCIDENT_TYPES = [
  'Security Breach', 'Data Leak', 'Ransomware', 'DDoS', 'Phishing',
  'Insider Threat', 'Malware', 'Unauthorized Access', 'System Outage',
  'Supply Chain Attack', 'Social Engineering', 'Physical Security',
];
const SEVERITIES: SeverityLevel[] = ['Critical', 'High', 'Medium', 'Low'];
const PRIORITIES: PriorityType[] = ['P1', 'P2', 'P3', 'P4'];
const STATUSES = ['Open', 'Investigating', 'Contained', 'Resolved', 'Closed'];
const ASSIGNEES = [
  'IR Team', 'Alice Chen', 'Bob Martinez', 'Carol Smith', 'David Lee',
  'Eva Wilson', 'Frank Zhang', 'Grace Kim', 'Network Team', 'Cloud Team',
  'SecOps Team', 'CISO Office',
];
const REPORTERS = [
  'EDR Alert', 'SIEM Alert', 'User Report', 'WAF Logs', 'AWS GuardDuty',
  'NDR Platform', 'Vulnerability Scanner', 'Threat Intel Feed', 'UEBA Alert',
  'Help Desk', 'External Party', 'Automated Monitor',
];

const PRIORITY_META: Record<PriorityType, { label: string; desc: string; color: string; bg: string }> = {
  P1: { label: 'P1 — Critical', desc: 'Severe business impact, immediate response required', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/40' },
  P2: { label: 'P2 — High',     desc: 'Significant impact, response within 1 hour',           color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/40' },
  P3: { label: 'P3 — Medium',   desc: 'Moderate impact, response within 4 hours',              color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/40' },
  P4: { label: 'P4 — Low',      desc: 'Minimal impact, response within 24 hours',              color: 'text-slate-400', bg: 'bg-slate-700/40 border-slate-600/40' },
};

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

function Section({ title, open, onToggle, children, accent }: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode; accent?: boolean;
}) {
  return (
    <div className={`border rounded-xl overflow-hidden ${accent ? 'border-red-500/30' : 'border-slate-700/60'}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center gap-2 px-5 py-3.5 transition-colors text-left ${accent ? 'bg-red-500/10 hover:bg-red-500/15' : 'bg-slate-800/60 hover:bg-slate-800'}`}
      >
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        <span className="text-slate-200 font-semibold text-sm">{title}</span>
      </button>
      {open && <div className="px-5 py-5 bg-slate-900/40 space-y-4">{children}</div>}
    </div>
  );
}

export default function DeclareIncidentModal({ onClose, onSubmit }: DeclareIncidentModalProps) {
  const [sections, setSections] = useState({ general: true, classification: true, assignment: true, timeline: true, additional: true });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [tagInput, setTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: '',
    severity: '' as SeverityLevel | '',
    priority: '' as PriorityType | '',
    status: 'Open',
    assigned_to: '',
    reported_by: '',
    detected_at: new Date().toISOString().slice(0, 16),
    resolved_at: '',
    tags: [] as string[],
    affected_systems: '',
    affected_users: '',
    initial_vector: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const toggle = (s: keyof typeof sections) =>
    setSections((p) => ({ ...p, [s]: !p[s] }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !form.tags.includes(t)) set('tags', [...form.tags, t]);
    setTagInput('');
  };
  const removeTag = (t: string) => set('tags', form.tags.filter((x) => x !== t));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim())    e.title    = 'Incident title is required';
    if (!form.type)            e.type     = 'Incident type is required';
    if (!form.severity)        e.severity = 'Severity is required';
    if (!form.priority)        e.priority = 'Priority is required';
    if (!form.assigned_to)     e.assigned_to = 'Assignee is required';
    if (!form.reported_by)     e.reported_by = 'Reporter / detection source is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const incident: Incident = {
      id: `INC-${String(Date.now()).slice(-6)}`,
      title: form.title.trim(),
      type: form.type,
      severity: form.severity as SeverityLevel,
      priority: form.priority as PriorityType,
      status: form.status,
      assigned_to: form.assigned_to,
      reported_by: form.reported_by,
      detected_at: form.detected_at ? new Date(form.detected_at).toISOString() : new Date().toISOString(),
      resolved_at: form.resolved_at ? new Date(form.resolved_at).toISOString() : undefined,
      tags: [
        ...form.tags,
        ...(form.affected_systems ? [form.affected_systems.toLowerCase().replace(/\s+/g, '-')] : []),
      ],
      is_dora_reportable: false,
      dora_reported: false,
      financial_impact_estimate: 0,
      affected_users: 0,
      downtime_minutes: 0,
    };
    onSubmit(incident);
  };

  const descLen = form.description.length;
  const selectedPriority = form.priority as PriorityType | '';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-red-500/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-red-400 font-bold text-sm">!</span>
            </div>
            <div>
              <h2 className="text-slate-100 font-bold text-base">Declare Incident</h2>
              <p className="text-slate-500 text-xs">Log and assign a new security incident for immediate response</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">

            {/* ── General ── */}
            <Section title="General" open={sections.general} onToggle={() => toggle('general')} accent>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-x-8 gap-y-4">

                {/* Left */}
                <div className="space-y-4">
                  <div>
                    <Label required tooltip="A clear, concise title for this incident">Incident Title</Label>
                    <input
                      value={form.title}
                      onChange={(e) => set('title', e.target.value)}
                      placeholder="e.g. Ransomware Detection on Finance Workstation"
                      className={`w-full bg-slate-800 border rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-colors focus:border-cyan-500 ${errors.title ? 'border-red-500' : 'border-slate-700'}`}
                    />
                    {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <Label tooltip="Detailed description of what was observed, how it was detected, and initial impact assessment">Description</Label>
                    <textarea
                      value={form.description}
                      onChange={(e) => set('description', e.target.value.slice(0, 4000))}
                      placeholder="Describe the incident in detail — what was detected, when, initial indicators, and business impact..."
                      rows={4}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-colors focus:border-cyan-500 resize-none"
                    />
                    <p className="text-right text-xs text-slate-600 -mt-1">{descLen}/4000</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label required tooltip="The category of security incident">Incident Type</Label>
                      <SelectField value={form.type} onChange={(v) => set('type', v)} placeholder="Select type" options={INCIDENT_TYPES} />
                      {errors.type && <p className="text-red-400 text-xs mt-1">{errors.type}</p>}
                    </div>
                    <div>
                      <Label tooltip="Initial attack vector or entry point">Initial Vector</Label>
                      <input
                        value={form.initial_vector}
                        onChange={(e) => set('initial_vector', e.target.value)}
                        placeholder="e.g. Phishing email, VPN exploit"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-colors focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label tooltip="Systems or applications directly impacted">Affected Systems</Label>
                      <input
                        value={form.affected_systems}
                        onChange={(e) => set('affected_systems', e.target.value)}
                        placeholder="e.g. Finance Workstation, ERP"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-colors focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <Label tooltip="Number or description of affected users or accounts">Affected Users</Label>
                      <input
                        value={form.affected_users}
                        onChange={(e) => set('affected_users', e.target.value)}
                        placeholder="e.g. 3 finance staff, all admins"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-colors focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Right — Status + Priority selector */}
                <div className="flex flex-col gap-4 lg:w-52">
                  <div>
                    <Label tooltip="Current response status of this incident">Status</Label>
                    <SelectField value={form.status} onChange={(v) => set('status', v)} placeholder="Status" options={STATUSES} />
                  </div>
                </div>
              </div>
            </Section>

            {/* ── Classification ── */}
            <Section title="Classification & Priority" open={sections.classification} onToggle={() => toggle('classification')}>
              {/* Priority cards */}
              <div>
                <Label required tooltip="Priority determines the response SLA and escalation path">Priority</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRIORITIES.map((p) => {
                    const meta = PRIORITY_META[p];
                    const active = form.priority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => set('priority', p)}
                        className={`flex flex-col gap-1 px-3 py-3 rounded-xl border text-left transition-all ${
                          active ? `${meta.bg} ring-1 ring-current` : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                        }`}
                      >
                        <span className={`text-sm font-bold ${active ? meta.color : 'text-slate-400'}`}>{p}</span>
                        <span className={`text-xs leading-tight ${active ? meta.color : 'text-slate-600'}`}>{meta.desc}</span>
                      </button>
                    );
                  })}
                </div>
                {selectedPriority && (
                  <p className={`text-xs mt-2 ${PRIORITY_META[selectedPriority].color}`}>
                    {PRIORITY_META[selectedPriority].desc}
                  </p>
                )}
                {errors.priority && <p className="text-red-400 text-xs mt-1">{errors.priority}</p>}
              </div>

              {/* Severity */}
              <div>
                <Label required tooltip="Business impact severity of this incident">Severity</Label>
                <div className="grid grid-cols-4 gap-2">
                  {SEVERITIES.map((s) => {
                    const colors: Record<string, string> = {
                      Critical: 'bg-red-500/15 border-red-500/40 text-red-400 ring-red-500/50',
                      High:     'bg-orange-500/15 border-orange-500/40 text-orange-400 ring-orange-500/50',
                      Medium:   'bg-amber-500/15 border-amber-500/40 text-amber-400 ring-amber-500/50',
                      Low:      'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 ring-emerald-500/50',
                    };
                    const active = form.severity === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set('severity', s)}
                        className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                          active ? `${colors[s]} ring-1` : 'bg-slate-800/50 border-slate-700/50 text-slate-500 hover:border-slate-600 hover:text-slate-400'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
                {errors.severity && <p className="text-red-400 text-xs mt-1">{errors.severity}</p>}
              </div>

              {/* Tags */}
              <div>
                <Label tooltip="Tags to categorise and quickly identify this incident">Tags</Label>
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
            </Section>

            {/* ── Assignment ── */}
            <Section title="Assignment & Detection" open={sections.assignment} onToggle={() => toggle('assignment')}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label required tooltip="The team or individual leading the incident response">Assigned To</Label>
                  <div className="relative">
                    <input
                      value={form.assigned_to}
                      onChange={(e) => set('assigned_to', e.target.value)}
                      list="assignee-list"
                      placeholder="e.g. IR Team"
                      className={`w-full bg-slate-800 border rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-colors focus:border-cyan-500 ${errors.assigned_to ? 'border-red-500' : 'border-slate-700'}`}
                    />
                    <datalist id="assignee-list">
                      {ASSIGNEES.map((a) => <option key={a} value={a} />)}
                    </datalist>
                  </div>
                  {errors.assigned_to && <p className="text-red-400 text-xs mt-1">{errors.assigned_to}</p>}
                </div>
                <div>
                  <Label required tooltip="How or who detected this incident (e.g. EDR alert, user report)">Reported By / Detection Source</Label>
                  <div className="relative">
                    <input
                      value={form.reported_by}
                      onChange={(e) => set('reported_by', e.target.value)}
                      list="reporter-list"
                      placeholder="e.g. SIEM Alert"
                      className={`w-full bg-slate-800 border rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-colors focus:border-cyan-500 ${errors.reported_by ? 'border-red-500' : 'border-slate-700'}`}
                    />
                    <datalist id="reporter-list">
                      {REPORTERS.map((r) => <option key={r} value={r} />)}
                    </datalist>
                  </div>
                  {errors.reported_by && <p className="text-red-400 text-xs mt-1">{errors.reported_by}</p>}
                </div>
              </div>
            </Section>

            {/* ── Timeline ── */}
            <Section title="Timeline" open={sections.timeline} onToggle={() => toggle('timeline')}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label required tooltip="When the incident was first detected or reported">Detection Time</Label>
                  <input
                    type="datetime-local"
                    value={form.detected_at}
                    onChange={(e) => set('detected_at', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <Label tooltip="When the incident was fully resolved (leave blank if still open)">Resolution Time</Label>
                  <input
                    type="datetime-local"
                    value={form.resolved_at}
                    onChange={(e) => set('resolved_at', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>
            </Section>

            {/* ── Additional Details ── */}
            <Section title="Additional Details" open={sections.additional} onToggle={() => toggle('additional')}>
              <div>
                <Label tooltip="Attach evidence, screenshots, PCAP files, or forensic reports">Attach File(s)</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 border border-slate-700 rounded-lg px-4 py-3 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600 cursor-pointer transition-colors"
                >
                  <Upload size={18} className="text-cyan-400 flex-shrink-0" />
                  <span className="text-slate-500 text-sm flex-1">
                    {attachments.length === 0 ? 'Click to upload evidence files' : `Uploaded (${attachments.length})`}
                  </span>
                  <span className="text-slate-600 text-xs">Uploaded ({attachments.length})</span>
                </div>
                <input
                  ref={fileInputRef} type="file" multiple className="hidden"
                  onChange={(e) => { setAttachments((p) => [...p, ...Array.from(e.target.files ?? [])]); e.target.value = ''; }}
                />
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
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-red-500 hover:bg-red-400 text-white font-semibold text-sm transition-colors"
            >
              <span className="font-bold">!</span> Declare Incident
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
