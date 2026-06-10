import { useState, useRef } from 'react';
import { X, ChevronDown, ChevronUp, Info, Upload, FileText, XCircle } from 'lucide-react';

export interface NewAsset {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  hierarchy: string;
  type: string;
  category: string;
  criticality: string;
  confidentiality: string;
  integrity: string;
  availability: string;
  ip_address: string;
  location: string;
  secondary_location: string;
  owner: string;
  business_unit: string;
  risk_score: number;
  vulnerability_count: number;
  last_scanned_at: string;
  attachments: string[];
}

interface AddAssetModalProps {
  onClose: () => void;
  onSubmit: (asset: NewAsset) => void;
}

const TYPES = ['Application', 'Database', 'Network', 'Server', 'Workstation', 'IoT', 'Mobile', 'Cloud Service', 'Physical'];
const CRITICALITIES = ['Critical', 'High', 'Medium', 'Low'];
const CIA_OPTIONS = ['High', 'Medium', 'Low', 'Not Applicable'];
const HIERARCHY_OPTIONS = ['Level 1', 'Level 2', 'Level 3', 'Level 4'];
const BUSINESS_UNITS = ['Banking Ops', 'Digital Team', 'HR IT', 'Trading Ops', 'Network Team', 'Engineering', 'Infra Team', 'ATM Ops', 'Security', 'Finance', 'Compliance'];
const OWNERS = ['Alice Chen', 'Bob Martinez', 'Carol Smith', 'David Lee', 'Eva Wilson', 'Frank Zhang', 'Grace Kim', 'Henry Park', 'Iris Wang', 'James Liu', 'SecOps Team', 'Network Team', 'IR Team'];

function Label({ children, required, tooltip }: { children: React.ReactNode; required?: boolean; tooltip?: string }) {
  return (
    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
      {children}
      {required && <span className="text-red-400">*</span>}
      {tooltip && (
        <span className="relative group cursor-help">
          <Info size={13} className="text-slate-500 hover:text-slate-400 transition-colors" />
          <span className="absolute left-5 top-0 z-50 hidden group-hover:block bg-slate-800 border border-slate-700 text-slate-400 text-xs rounded-lg px-2.5 py-1.5 w-48 shadow-xl">
            {tooltip}
          </span>
        </span>
      )}
    </label>
  );
}

function SelectField({ value, onChange, placeholder, options, disabled }: {
  value: string; onChange: (v: string) => void; placeholder: string; options: string[]; disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full appearance-none rounded-lg border px-3 py-2.5 pr-9 text-sm outline-none transition-colors ${
          disabled
            ? 'bg-slate-800/40 border-slate-700/50 text-slate-600 cursor-not-allowed'
            : value
              ? 'bg-slate-800 border-slate-700 text-slate-200 focus:border-cyan-500'
              : 'bg-slate-800 border-slate-700 text-slate-500 focus:border-cyan-500'
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

export default function AddAssetModal({ onClose, onSubmit }: AddAssetModalProps) {
  const [sections, setSections] = useState({ general: true, ownership: true, additional: true });
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    status: true,
    hierarchy: 'Level 1',
    type: '',
    criticality: '',
    confidentiality: '',
    integrity: '',
    availability: '',
    ip_address: '',
    location: '',
    secondary_location: '',
    owner: '',
    business_unit: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggle = (s: keyof typeof sections) =>
    setSections((prev) => ({ ...prev, [s]: !prev[s] }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Title is required';
    if (!form.type) e.type = 'Type is required';
    if (!form.business_unit) e.business_unit = 'Business Unit is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const asset: NewAsset = {
      id: `asset-${Date.now()}`,
      name: form.name.trim(),
      description: form.description,
      status: form.status ? 'Active' : 'Inactive',
      hierarchy: form.hierarchy,
      type: form.type,
      category: form.type === 'Cloud Service' ? 'Cloud' : form.type === 'IoT' ? 'OT' : 'IT',
      criticality: form.criticality || 'Medium',
      confidentiality: form.confidentiality,
      integrity: form.integrity,
      availability: form.availability,
      ip_address: form.ip_address || '—',
      location: form.location || '—',
      secondary_location: form.secondary_location,
      owner: form.owner || 'Unassigned',
      business_unit: form.business_unit,
      risk_score: 0,
      vulnerability_count: 0,
      last_scanned_at: new Date().toISOString(),
      attachments: attachments.map((f) => f.name),
    };
    onSubmit(asset);
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const removeAttachment = (i: number) =>
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));

  const descLen = form.description.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-slate-100 font-bold text-base">Add Asset</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">

            {/* ── General ── */}
            <Section title="General" open={sections.general} onToggle={() => toggle('general')}>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-x-8 gap-y-4">

                {/* Left col */}
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <Label required tooltip="The name of this asset as it appears in the inventory">Title</Label>
                    <input
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                      placeholder="Title"
                      className={`w-full bg-slate-800 border rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-colors focus:border-cyan-500 ${errors.name ? 'border-red-500' : 'border-slate-700'}`}
                    />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                  </div>

                  {/* Description */}
                  <div>
                    <Label tooltip="A brief description of what this asset does and its business purpose">Description</Label>
                    <textarea
                      value={form.description}
                      onChange={(e) => set('description', e.target.value.slice(0, 4000))}
                      placeholder="Description"
                      rows={4}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-colors focus:border-cyan-500 resize-none"
                    />
                    <p className="text-right text-xs text-slate-600 -mt-1">{descLen}/4000</p>
                  </div>

                  {/* Type + Business Criticality */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label required tooltip="The category of asset (e.g. Application, Database, Network device)">Type</Label>
                      <SelectField value={form.type} onChange={(v) => set('type', v)} placeholder="Select an option" options={TYPES} />
                      {errors.type && <p className="text-red-400 text-xs mt-1">{errors.type}</p>}
                    </div>
                    <div>
                      <Label tooltip="Overall business criticality rating for this asset">Business Criticality</Label>
                      <SelectField value={form.criticality} onChange={(v) => set('criticality', v)} placeholder="Business Criticality" options={CRITICALITIES} />
                    </div>
                  </div>

                  {/* CIA Triad */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label tooltip="How sensitive is the data this asset handles?">Confidentiality</Label>
                      <SelectField value={form.confidentiality} onChange={(v) => set('confidentiality', v)} placeholder="Confidentiality" options={CIA_OPTIONS} />
                    </div>
                    <div>
                      <Label tooltip="How critical is the accuracy and completeness of this asset's data?">Integrity</Label>
                      <SelectField value={form.integrity} onChange={(v) => set('integrity', v)} placeholder="Integrity" options={CIA_OPTIONS} />
                    </div>
                    <div>
                      <Label tooltip="How critical is it that this asset remains continuously available?">Availability</Label>
                      <SelectField value={form.availability} onChange={(v) => set('availability', v)} placeholder="Availability" options={CIA_OPTIONS} />
                    </div>
                  </div>

                  {/* Locations */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label tooltip="Primary physical or logical location of this asset">Primary Location</Label>
                      <input
                        value={form.location}
                        onChange={(e) => set('location', e.target.value)}
                        placeholder="Primary Location"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-colors focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <Label tooltip="Secondary or backup location for this asset">Secondary Location</Label>
                      <input
                        value={form.secondary_location}
                        onChange={(e) => set('secondary_location', e.target.value)}
                        placeholder="Secondary Location"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-colors focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Right col — Status + Hierarchy */}
                <div className="flex flex-col gap-4 lg:w-52">
                  <div>
                    <Label tooltip="Whether this asset is currently active in the environment">Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => set('status', !form.status)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${form.status ? 'bg-cyan-500' : 'bg-slate-700'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.status ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                      <span className="text-sm text-slate-300">{form.status ? 'Active' : 'Inactive'}</span>
                    </div>
                    <p className="text-slate-500 text-xs mt-1">New</p>
                  </div>
                  <div>
                    <Label tooltip="Asset hierarchy level within the organisation">Hierarchy</Label>
                    <SelectField value={form.hierarchy} onChange={(v) => set('hierarchy', v)} placeholder="Level" options={HIERARCHY_OPTIONS} />
                  </div>
                  <div>
                    <Label tooltip="IP address or CIDR range of the asset">IP / CIDR</Label>
                    <input
                      value={form.ip_address}
                      onChange={(e) => set('ip_address', e.target.value)}
                      placeholder="e.g. 10.0.1.100"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-colors focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            </Section>

            {/* ── Ownership and Review ── */}
            <Section title="Ownership and Review" open={sections.ownership} onToggle={() => toggle('ownership')}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label required tooltip="The business unit responsible for this asset">Business Unit(s)</Label>
                  <div className="relative">
                    <select
                      value={form.business_unit}
                      onChange={(e) => set('business_unit', e.target.value)}
                      className={`w-full appearance-none rounded-lg border px-3 py-2.5 pr-9 text-sm outline-none transition-colors bg-slate-800 focus:border-cyan-500 ${form.business_unit ? 'border-slate-700 text-slate-200' : errors.business_unit ? 'border-red-500 text-slate-500' : 'border-slate-700 text-slate-500'}`}
                    >
                      <option value="" disabled>Business Unit</option>
                      {BUSINESS_UNITS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                  {errors.business_unit && <p className="text-red-400 text-xs mt-1">{errors.business_unit}</p>}
                </div>
                <div>
                  <Label tooltip="The person or team responsible for maintaining this asset">Owner(s)</Label>
                  <SelectField value={form.owner} onChange={(v) => set('owner', v)} placeholder="Owner(s)" options={OWNERS} />
                </div>
              </div>
            </Section>

            {/* ── Additional Details ── */}
            <Section title="Additional Details" open={sections.additional} onToggle={() => toggle('additional')}>
              <div>
                <Label tooltip="Supporting documents, diagrams, or evidence files for this asset">Attach File(s)</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 border border-slate-700 rounded-lg px-4 py-3 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600 cursor-pointer transition-colors group"
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
                        <button type="button" onClick={() => removeAttachment(i)} className="text-slate-600 hover:text-red-400 transition-colors">
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
