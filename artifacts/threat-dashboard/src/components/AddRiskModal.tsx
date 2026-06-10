import { useState, useRef } from 'react';
import { X, ChevronDown, ChevronUp, Info, Upload, Plus, Minus } from 'lucide-react';

interface AddRiskModalProps {
  onClose: () => void;
  onSubmit: (risk: NewRisk) => void;
}

export interface NewRisk {
  title: string;
  description: string;
  category: string;
  type: string;
  status: string;
  is_key_risk: boolean;
  hierarchy: string;
  business_unit: string;
  owners: string[];
  likelihood: number;
  impact: number;
  tags: string[];
  files: File[];
}

const CATEGORIES = [
  'Strategic', 'Operational', 'Technical', 'Compliance',
  'Financial', 'Reputational', 'Legal', 'Environmental',
];

const TYPES = [
  'Cyber Attack', 'Data Breach', 'Insider Threat', 'Third-Party Risk',
  'Regulatory', 'Business Continuity', 'Fraud', 'Physical Security',
  'Technology Failure', 'Human Error',
];

const HIERARCHIES = ['Level 1', 'Level 2', 'Level 3', 'Level 4'];

const BUSINESS_UNITS = [
  'Corporate', 'Finance', 'Technology', 'Operations',
  'Human Resources', 'Legal & Compliance', 'Sales', 'Marketing',
  'Risk Management', 'Audit',
];

const OWNERS = [
  'Alice Chen', 'Bob Martinez', 'Carol Smith', 'David Lee',
  'Eva Wilson', 'Frank Zhang', 'Grace Kim', 'Henry Park',
];

const LIKELIHOOD_LABELS = ['', 'Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];
const IMPACT_LABELS = ['', 'Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'];

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-slate-500 hover:text-cyan-400 transition-colors"
      >
        <Info size={13} />
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-48 bg-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 z-50 shadow-lg pointer-events-none">
          {text}
        </span>
      )}
    </span>
  );
}

function SectionHeader({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-2 text-left group"
    >
      {open ? (
        <ChevronDown size={16} className="text-cyan-400 flex-shrink-0" />
      ) : (
        <ChevronUp size={16} className="text-slate-500 flex-shrink-0" />
      )}
      <span className="text-slate-200 font-semibold text-sm">{title}</span>
      <div className="flex-1 h-px bg-slate-700 ml-2" />
    </button>
  );
}

function ScoreCell({ value, selected, onClick }: { value: number; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-8 h-8 rounded text-xs font-bold transition-all border ${
        selected
          ? 'bg-cyan-500 text-slate-900 border-cyan-400 scale-110 shadow-lg shadow-cyan-500/20'
          : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:bg-slate-700 hover:text-slate-200'
      }`}
    >
      {value}
    </button>
  );
}

function RiskScoreMatrix({ likelihood, impact, onLikelihood, onImpact }: {
  likelihood: number; impact: number; onLikelihood: (v: number) => void; onImpact: (v: number) => void;
}) {
  const score = likelihood * impact;
  const scoreColor =
    score >= 16 ? 'text-red-400 bg-red-500/10 border-red-500/30' :
    score >= 10 ? 'text-orange-400 bg-orange-500/10 border-orange-500/30' :
    score >= 5  ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
                  'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  const scoreLabel =
    score >= 16 ? 'Critical' : score >= 10 ? 'High' : score >= 5 ? 'Medium' : 'Low';

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Likelihood */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2">
          Likelihood <Tooltip text="Probability that the risk event will occur (1=Rare, 5=Almost Certain)" />
        </label>
        <div className="flex gap-1.5 mb-1">
          {[1, 2, 3, 4, 5].map((v) => (
            <ScoreCell key={v} value={v} selected={likelihood === v} onClick={() => onLikelihood(v)} />
          ))}
        </div>
        <p className="text-xs text-slate-500">{LIKELIHOOD_LABELS[likelihood]}</p>
      </div>

      {/* Impact */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2">
          Impact <Tooltip text="Severity of the consequence if the risk materialises (1=Negligible, 5=Catastrophic)" />
        </label>
        <div className="flex gap-1.5 mb-1">
          {[1, 2, 3, 4, 5].map((v) => (
            <ScoreCell key={v} value={v} selected={impact === v} onClick={() => onImpact(v)} />
          ))}
        </div>
        <p className="text-xs text-slate-500">{IMPACT_LABELS[impact]}</p>
      </div>

      {/* Inherent Score */}
      <div className="col-span-2 flex items-center gap-3">
        <span className="text-xs text-slate-500">Inherent Risk Score:</span>
        <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${scoreColor}`}>
          {score} — {scoreLabel}
        </span>
        <span className="text-xs text-slate-600">({likelihood} × {impact})</span>
      </div>
    </div>
  );
}

export default function AddRiskModal({ onClose, onSubmit }: AddRiskModalProps) {
  const [sections, setSections] = useState({ general: true, scoring: true, ownership: true, additional: true });
  const [tagInput, setTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<NewRisk>({
    title: '',
    description: '',
    category: '',
    type: '',
    status: 'Active',
    is_key_risk: false,
    hierarchy: 'Level 1',
    business_unit: '',
    owners: [],
    likelihood: 3,
    impact: 3,
    tags: [],
    files: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: keyof NewRisk, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const toggleSection = (key: keyof typeof sections) =>
    setSections((s) => ({ ...s, [key]: !s[key] }));

  const toggleOwner = (name: string) => {
    set('owners', form.owners.includes(name)
      ? form.owners.filter((o) => o !== name)
      : [...form.owners, name]);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      set('tags', [...form.tags, t]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => set('tags', form.tags.filter((x) => x !== t));

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      set('files', [...form.files, ...Array.from(e.target.files)]);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.category) e.category = 'Category is required';
    if (!form.business_unit) e.business_unit = 'Business Unit is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
              <span className="text-cyan-400 text-sm font-bold">R</span>
            </div>
            <div>
              <h2 className="text-slate-100 font-bold text-base">Add Risk</h2>
              <p className="text-slate-500 text-xs">Regorisk · ProGReC Platform</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-6">

            {/* ── General ── */}
            <div className="space-y-4">
              <SectionHeader title="General" open={sections.general} onToggle={() => toggleSection('general')} />
              {sections.general && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* Title (wide) */}
                    <div className="sm:col-span-2">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                        Title <span className="text-red-400">*</span>
                        <Tooltip text="A concise name that clearly identifies the risk" />
                      </label>
                      <input
                        value={form.title}
                        onChange={(e) => set('title', e.target.value)}
                        placeholder="Risk title"
                        className={`w-full bg-slate-800 border text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-cyan-500 placeholder:text-slate-600 transition-colors ${
                          errors.title ? 'border-red-500' : 'border-slate-700'
                        }`}
                      />
                      {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                    </div>

                    {/* Status + Key Risk */}
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-400 mb-1.5 block">Status</label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">New</span>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.status === 'Active'}
                              onChange={(e) => set('status', e.target.checked ? 'Active' : 'Inactive')}
                              className="w-4 h-4 rounded accent-cyan-500"
                            />
                            <span className="text-xs text-slate-300">Active</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-400 mb-1.5 block">Key Risk</label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.is_key_risk}
                            onChange={(e) => set('is_key_risk', e.target.checked)}
                            className="w-4 h-4 rounded accent-cyan-500"
                          />
                          <span className="text-xs text-slate-300">Key Risk</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                        Description
                        <Tooltip text="Detailed narrative of the risk, its causes and potential consequences" />
                      </label>
                      <div className="relative">
                        <textarea
                          value={form.description}
                          onChange={(e) => set('description', e.target.value)}
                          maxLength={4000}
                          rows={4}
                          placeholder="Description"
                          className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-cyan-500 placeholder:text-slate-600 resize-y transition-colors"
                        />
                        <span className="absolute bottom-2 right-3 text-xs text-slate-600">
                          {form.description.length}/4000
                        </span>
                      </div>
                    </div>

                    {/* Hierarchy */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                        Hierarchy
                        <Tooltip text="The organisational level at which this risk is managed" />
                      </label>
                      <div className="relative">
                        <select
                          value={form.hierarchy}
                          onChange={(e) => set('hierarchy', e.target.value)}
                          className="appearance-none w-full bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2.5 pr-8 outline-none focus:border-cyan-500 cursor-pointer"
                        >
                          {HIERARCHIES.map((h) => <option key={h}>{h}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-2.5 top-3 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Category + Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                        Category <span className="text-red-400">*</span>
                        <Tooltip text="The risk domain this risk belongs to" />
                      </label>
                      <div className="relative">
                        <select
                          value={form.category}
                          onChange={(e) => set('category', e.target.value)}
                          className={`appearance-none w-full bg-slate-800 border text-slate-300 text-sm rounded-lg px-3 py-2.5 pr-8 outline-none focus:border-cyan-500 cursor-pointer ${
                            errors.category ? 'border-red-500' : 'border-slate-700'
                          }`}
                        >
                          <option value="">Select an option</option>
                          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-2.5 top-3 text-slate-500 pointer-events-none" />
                      </div>
                      {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category}</p>}
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                        Type
                        <Tooltip text="The specific type of risk event" />
                      </label>
                      <div className="relative">
                        <select
                          value={form.type}
                          onChange={(e) => set('type', e.target.value)}
                          className="appearance-none w-full bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2.5 pr-8 outline-none focus:border-cyan-500 cursor-pointer"
                        >
                          <option value="">Select an option</option>
                          {TYPES.map((t) => <option key={t}>{t}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-2.5 top-3 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800" />

            {/* ── Risk Scoring ── */}
            <div className="space-y-4">
              <SectionHeader title="Risk Scoring" open={sections.scoring} onToggle={() => toggleSection('scoring')} />
              {sections.scoring && (
                <RiskScoreMatrix
                  likelihood={form.likelihood}
                  impact={form.impact}
                  onLikelihood={(v) => set('likelihood', v)}
                  onImpact={(v) => set('impact', v)}
                />
              )}
            </div>

            <div className="border-t border-slate-800" />

            {/* ── Ownership and Review ── */}
            <div className="space-y-4">
              <SectionHeader title="Ownership and Review" open={sections.ownership} onToggle={() => toggleSection('ownership')} />
              {sections.ownership && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Business Unit */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                      Business Unit(s) <span className="text-red-400">*</span>
                      <Tooltip text="The business unit(s) accountable for managing this risk" />
                    </label>
                    <div className="relative">
                      <select
                        value={form.business_unit}
                        onChange={(e) => set('business_unit', e.target.value)}
                        className={`appearance-none w-full bg-slate-800 border text-slate-300 text-sm rounded-lg px-3 py-2.5 pr-8 outline-none focus:border-cyan-500 cursor-pointer ${
                          errors.business_unit ? 'border-red-500' : 'border-slate-700'
                        }`}
                      >
                        <option value="">Business Unit</option>
                        {BUSINESS_UNITS.map((b) => <option key={b}>{b}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 top-3 text-slate-500 pointer-events-none" />
                    </div>
                    {errors.business_unit && <p className="text-red-400 text-xs mt-1">{errors.business_unit}</p>}
                  </div>

                  {/* Owners */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                      Owner(s)
                      <Tooltip text="People responsible for managing and monitoring this risk" />
                    </label>
                    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 min-h-[42px] flex flex-wrap gap-1.5 focus-within:border-cyan-500 transition-colors">
                      {form.owners.map((o) => (
                        <span key={o} className="flex items-center gap-1 bg-cyan-500/15 text-cyan-300 text-xs px-2 py-0.5 rounded-full">
                          {o}
                          <button type="button" onClick={() => toggleOwner(o)} className="hover:text-white ml-0.5">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                      <div className="relative flex-1 min-w-[80px]">
                        <select
                          value=""
                          onChange={(e) => { if (e.target.value) toggleOwner(e.target.value); }}
                          className="appearance-none bg-transparent text-slate-500 text-xs outline-none w-full cursor-pointer"
                        >
                          <option value="">{form.owners.length === 0 ? 'Owner(s)' : '+ Add'}</option>
                          {OWNERS.filter((o) => !form.owners.includes(o)).map((o) => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800" />

            {/* ── Additional Details ── */}
            <div className="space-y-4">
              <SectionHeader title="Additional Details" open={sections.additional} onToggle={() => toggleSection('additional')} />
              {sections.additional && (
                <div className="space-y-4">
                  {/* Tags */}
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">Tags</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {form.tags.map((t) => (
                        <span key={t} className="flex items-center gap-1 bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">
                          {t}
                          <button type="button" onClick={() => removeTag(t)} className="hover:text-white">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); }}}
                        placeholder="Add tag and press Enter"
                        className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:border-cyan-500 placeholder:text-slate-600"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {/* File upload */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                      Attach File(s)
                      <Tooltip text="Supporting evidence, policies or documentation related to this risk" />
                    </label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-3 bg-slate-800 border border-dashed border-slate-600 hover:border-cyan-500 rounded-lg px-4 py-3 text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <Upload size={16} className="flex-shrink-0" />
                      <span className="flex-1 text-left">
                        {form.files.length > 0
                          ? `Uploaded (${form.files.length}) — ${form.files.map((f) => f.name).join(', ')}`
                          : 'Uploaded (0) — Click to attach files'}
                      </span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFiles}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl">
            <p className="text-xs text-slate-600">© 2026 · ProGReC Apps</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm font-medium transition-colors"
              >
                <Minus size={14} /> Close
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
