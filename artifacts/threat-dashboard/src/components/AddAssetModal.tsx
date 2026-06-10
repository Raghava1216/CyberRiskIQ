import { useState, useRef } from 'react';
import {
  Modal, Form, Row, Col, Button, InputGroup,
} from 'react-bootstrap';
import { Info, Upload, FileText, XCircle, ChevronDown, ChevronUp, X } from 'react-feather';

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

const TYPES         = ['Application', 'Database', 'Network', 'Server', 'Workstation', 'IoT', 'Mobile', 'Cloud Service', 'Physical'];
const CRITICALITIES = ['Critical', 'High', 'Medium', 'Low'];
const CIA_OPTIONS   = ['High', 'Medium', 'Low', 'Not Applicable'];
const HIERARCHY_OPTIONS = ['Level 1', 'Level 2', 'Level 3', 'Level 4'];
const BUSINESS_UNITS = ['Banking Ops', 'Digital Team', 'HR IT', 'Trading Ops', 'Network Team', 'Engineering', 'Infra Team', 'ATM Ops', 'Security', 'Finance', 'Compliance'];
const OWNERS = ['Alice Chen', 'Bob Martinez', 'Carol Smith', 'David Lee', 'Eva Wilson', 'Frank Zhang', 'Grace Kim', 'Henry Park', 'Iris Wang', 'James Liu', 'SecOps Team', 'Network Team', 'IR Team'];

const MAX = 4000;

function FieldLabel({ children, required, tooltip }: { children: React.ReactNode; required?: boolean; tooltip?: string }) {
  return (
    <Form.Label className="d-flex align-items-center gap-1 mb-1" style={{ fontSize: '0.82rem', fontWeight: 500, color: '#344054' }}>
      {children}
      {required && <span className="text-danger">*</span>}
      {tooltip && (
        <span className="position-relative d-inline-flex" style={{ cursor: 'help' }}>
          <Info size={13} color="#98a2b3" />
          <span className="pg-field-tip">{tooltip}</span>
        </span>
      )}
    </Form.Label>
  );
}

function PgSelect({ value, onChange, placeholder, options, isInvalid }: {
  value: string; onChange: (v: string) => void; placeholder: string; options: string[]; isInvalid?: boolean;
}) {
  return (
    <Form.Select value={value} onChange={e => onChange(e.target.value)} isInvalid={isInvalid}
      className="pg-form-control" style={{ fontSize: '0.85rem' }}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </Form.Select>
  );
}

function SectionHeader({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className="d-flex align-items-center gap-2 w-100 border-0 bg-transparent px-0 py-0 mb-3"
      style={{ color: '#101828' }}>
      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{title}</span>
      <span className="flex-grow-1 mx-2" style={{ height: 1, background: '#e4e7ec' }} />
      {open ? <ChevronUp size={15} color="#667085" /> : <ChevronDown size={15} color="#667085" />}
    </button>
  );
}

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'General Info' },
    { n: 2, label: 'Ownership' },
    { n: 3, label: 'Attachments' },
  ];
  return (
    <div className="d-flex align-items-center justify-content-center px-4 py-3 border-bottom"
      style={{ background: '#f9fafb', gap: 0 }}>
      {steps.map((s, i) => (
        <div key={s.n} className="d-flex align-items-center" style={{ flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div className="d-flex flex-column align-items-center" style={{ gap: 4, minWidth: 80 }}>
            <div className="d-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: 28, height: 28, fontSize: '0.78rem', fontWeight: 600,
                background: s.n === current ? '#3B82EC' : s.n < current ? '#3B82EC' : '#d0d5dd',
                color: '#fff',
              }}>
              {s.n}
            </div>
            <span style={{ fontSize: '0.7rem', color: s.n === current ? '#3B82EC' : '#667085', fontWeight: s.n === current ? 600 : 400, whiteSpace: 'nowrap' }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 1, background: '#e4e7ec', marginBottom: 18 }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function AddAssetModal({ onClose, onSubmit }: AddAssetModalProps) {
  const [sections, setSections] = useState({ general: true, ownership: true, additional: true });
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    scope: '',
    description: '',
    exceptions: '',
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

  const set = (key: string, value: string | boolean) => setForm(f => ({ ...f, [key]: value }));
  const toggle = (s: keyof typeof sections) => setSections(p => ({ ...p, [s]: !p[s] }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())    e.name = 'Title is required';
    if (!form.type)           e.type = 'Type is required';
    if (!form.business_unit)  e.business_unit = 'Business Unit is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (draft = false) => {
    if (!validate()) return;
    const asset: NewAsset = {
      id:                 `asset-${Date.now()}`,
      name:               form.name.trim(),
      description:        form.description || form.scope,
      status:             form.status ? 'Active' : 'Inactive',
      hierarchy:          form.hierarchy,
      type:               form.type,
      category:           form.type === 'Cloud Service' ? 'Cloud' : form.type === 'IoT' ? 'OT' : 'IT',
      criticality:        form.criticality || 'Medium',
      confidentiality:    form.confidentiality,
      integrity:          form.integrity,
      availability:       form.availability,
      ip_address:         form.ip_address || '—',
      location:           form.location || '—',
      secondary_location: form.secondary_location,
      owner:              form.owner || 'Unassigned',
      business_unit:      form.business_unit,
      risk_score:         0,
      vulnerability_count: 0,
      last_scanned_at:    new Date().toISOString(),
      attachments:        attachments.map(f => f.name),
    };
    onSubmit(asset);
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setAttachments(prev => [...prev, ...files]);
    e.target.value = '';
  };
  const removeAttachment = (i: number) => setAttachments(prev => prev.filter((_, idx) => idx !== i));

  return (
    <>
      <style>{`
        .pg-modal-backdrop { position:fixed;inset:0;background:rgba(16,24,40,0.6);z-index:1040;backdrop-filter:blur(2px); }
        .pg-modal-wrap { position:fixed;inset:0;z-index:1050;overflow-y:auto;padding:2rem 1rem;display:flex;align-items:flex-start;justify-content:center; }
        .pg-modal-box { background:#fff;border-radius:12px;box-shadow:0 20px 60px rgba(16,24,40,0.18);width:100%;max-width:720px;font-family:'Poppins',sans-serif; }
        .pg-form-control { font-size:0.85rem !important;border-color:#d0d5dd !important;border-radius:8px !important;color:#101828 !important; }
        .pg-form-control:focus { border-color:#3B82EC !important;box-shadow:0 0 0 3px rgba(59,130,236,0.12) !important; }
        .pg-form-control::placeholder { color:#98a2b3 !important; }
        .pg-textarea { resize:none;min-height:90px; }
        .pg-char-count { font-size:0.7rem;color:#98a2b3;text-align:right;margin-top:3px; }
        .pg-field-tip { display:none;position:absolute;left:20px;top:0;z-index:200;background:#1d2939;color:#f2f4f7;font-size:0.72rem;border-radius:6px;padding:6px 10px;width:200px;white-space:normal;line-height:1.4; }
        .pg-field-tip:before{display:none}
        span:hover > .pg-field-tip { display:block; }
        .pg-attach-row { display:flex;align-items:center;gap:10px;border:1px solid #d0d5dd;border-radius:8px;padding:10px 14px;cursor:pointer;background:#fff;transition:border-color 0.15s,background 0.15s; }
        .pg-attach-row:hover { border-color:#3B82EC;background:#f5f8ff; }
        .pg-status-toggle { position:relative;width:44px;height:22px;border-radius:999px;border:none;cursor:pointer;transition:background 0.2s;flex-shrink:0; }
        .pg-status-toggle .knob { position:absolute;top:2px;width:18px;height:18px;background:#fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.2);transition:left 0.2s; }
        .btn-pg-dark { background:#1d2939;border-color:#1d2939;color:#fff;font-size:0.82rem;font-weight:500;padding:8px 16px;border-radius:8px; }
        .btn-pg-dark:hover { background:#101828;border-color:#101828;color:#fff; }
        .btn-pg-close { background:#fff;border:1px solid #fda29b;color:#b42318;font-size:0.82rem;font-weight:500;padding:8px 16px;border-radius:8px;display:inline-flex;align-items:center;gap:6px; }
        .btn-pg-close:hover { background:#fff8f7; }
        .pg-section-body { padding:0 0 16px 0; }
      `}</style>

      <div className="pg-modal-backdrop" onClick={onClose} />
      <div className="pg-modal-wrap">
        <div className="pg-modal-box">

          {/* Header */}
          <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom">
            <h6 className="mb-0 fw-semibold" style={{ fontSize: '0.95rem', color: '#101828' }}>Add Asset</h6>
            <button type="button" className="btn p-1 border-0" onClick={onClose} style={{ color: '#667085' }}>
              <X size={18} />
            </button>
          </div>

          {/* Step indicator */}
          <StepIndicator current={1} />

          {/* Body */}
          <div className="px-4 pt-4 pb-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>

            {/* ── General Information ── */}
            <div className="mb-4">
              <SectionHeader title="General Information" open={sections.general} onToggle={() => toggle('general')} />
              {sections.general && (
                <div className="pg-section-body">

                  {/* Title */}
                  <Form.Group className="mb-3">
                    <FieldLabel required tooltip="The name of this asset as it appears in the inventory">Title</FieldLabel>
                    <Form.Control
                      className="pg-form-control" placeholder="Title"
                      value={form.name} onChange={e => set('name', e.target.value)}
                      isInvalid={!!errors.name}
                    />
                    <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                  </Form.Group>

                  {/* Scope */}
                  <Form.Group className="mb-3">
                    <FieldLabel tooltip="Scope or boundary of this asset within the organisation">Scope</FieldLabel>
                    <Form.Control as="textarea" className="pg-form-control pg-textarea" placeholder="Scope"
                      value={form.scope} onChange={e => set('scope', e.target.value.slice(0, MAX))} />
                    <div className="pg-char-count">{form.scope.length}/{MAX}</div>
                  </Form.Group>

                  {/* Purpose + Type / Classification */}
                  <Row className="g-3 mb-3">
                    <Col xs={12} md={7}>
                      <Form.Group>
                        <FieldLabel tooltip="What business purpose does this asset serve?">Purpose</FieldLabel>
                        <Form.Control as="textarea" className="pg-form-control pg-textarea" placeholder="Purpose"
                          value={form.description} onChange={e => set('description', e.target.value.slice(0, MAX))} />
                        <div className="pg-char-count">{form.description.length}/{MAX}</div>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={5}>
                      <Form.Group className="mb-3">
                        <FieldLabel required tooltip="The category of asset (e.g. Application, Database, Network device)">Type</FieldLabel>
                        <PgSelect value={form.type} onChange={v => set('type', v)} placeholder="Type" options={TYPES} isInvalid={!!errors.type} />
                        <Form.Control.Feedback type="invalid">{errors.type}</Form.Control.Feedback>
                      </Form.Group>
                      <Form.Group>
                        <FieldLabel tooltip="Overall business criticality rating for this asset">Classification</FieldLabel>
                        <PgSelect value={form.criticality} onChange={v => set('criticality', v)} placeholder="Classification" options={CRITICALITIES} />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Exceptions */}
                  <Form.Group className="mb-3">
                    <FieldLabel tooltip="Any exceptions, known exclusions, or special circumstances for this asset">Exceptions</FieldLabel>
                    <Form.Control as="textarea" className="pg-form-control pg-textarea" placeholder="Exceptions"
                      value={form.exceptions} onChange={e => set('exceptions', e.target.value.slice(0, MAX))} />
                    <div className="pg-char-count">{form.exceptions.length}/{MAX}</div>
                  </Form.Group>

                  {/* Attachment */}
                  <Form.Group className="mb-2">
                    <FieldLabel required tooltip="Supporting documents, diagrams, or evidence files for this asset">Attachment</FieldLabel>
                    <div className="pg-attach-row" onClick={() => fileInputRef.current?.click()}>
                      <Upload size={18} color="#3B82EC" />
                      <span style={{ flex: 1, fontSize: '0.82rem', color: '#98a2b3' }}>
                        {attachments.length === 0 ? 'Click to upload files' : ''}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: '#667085' }}>Uploaded ({attachments.length})</span>
                    </div>
                    <input ref={fileInputRef} type="file" multiple className="d-none" onChange={handleFileAdd} />
                    {attachments.length > 0 && (
                      <div className="mt-2 d-flex flex-column gap-1">
                        {attachments.map((file, i) => (
                          <div key={i} className="d-flex align-items-center gap-2 px-3 py-2 rounded"
                            style={{ background: '#f9fafb', border: '1px solid #e4e7ec', fontSize: '0.8rem' }}>
                            <FileText size={13} color="#667085" />
                            <span className="flex-grow-1 text-truncate" style={{ color: '#344054' }}>{file.name}</span>
                            <span style={{ color: '#98a2b3' }}>{(file.size / 1024).toFixed(1)} KB</span>
                            <button type="button" className="btn p-0 border-0" onClick={() => removeAttachment(i)}>
                              <XCircle size={14} color="#fda29b" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Form.Group>

                </div>
              )}
            </div>

            {/* ── Ownership & Security ── */}
            <div className="mb-4">
              <SectionHeader title="Ownership & Security" open={sections.ownership} onToggle={() => toggle('ownership')} />
              {sections.ownership && (
                <div className="pg-section-body">
                  <Row className="g-3 mb-3">
                    <Col xs={12} md={6}>
                      <Form.Group>
                        <FieldLabel required tooltip="The business unit responsible for this asset">Business Unit</FieldLabel>
                        <PgSelect value={form.business_unit} onChange={v => set('business_unit', v)}
                          placeholder="Business Unit" options={BUSINESS_UNITS} isInvalid={!!errors.business_unit} />
                        <Form.Control.Feedback type="invalid">{errors.business_unit}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group>
                        <FieldLabel tooltip="The person or team responsible for maintaining this asset">Author / Owner</FieldLabel>
                        <PgSelect value={form.owner} onChange={v => set('owner', v)} placeholder="Author / Owner" options={OWNERS} />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-3 mb-3">
                    <Col xs={12} md={4}>
                      <Form.Group>
                        <FieldLabel tooltip="Asset hierarchy level within the organisation">Hierarchy</FieldLabel>
                        <PgSelect value={form.hierarchy} onChange={v => set('hierarchy', v)} placeholder="Hierarchy" options={HIERARCHY_OPTIONS} />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={4}>
                      <Form.Group>
                        <FieldLabel tooltip="Primary physical or logical location of this asset">Primary Location</FieldLabel>
                        <Form.Control className="pg-form-control" placeholder="Primary Location"
                          value={form.location} onChange={e => set('location', e.target.value)} />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={4}>
                      <Form.Group>
                        <FieldLabel tooltip="IP address or CIDR range of the asset">IP / CIDR</FieldLabel>
                        <Form.Control className="pg-form-control font-monospace" placeholder="e.g. 10.0.1.100"
                          value={form.ip_address} onChange={e => set('ip_address', e.target.value)} />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* CIA Triad */}
                  <Row className="g-3 mb-3">
                    {[
                      { key: 'confidentiality', label: 'Confidentiality', tip: 'How sensitive is the data this asset handles?' },
                      { key: 'integrity',        label: 'Integrity',        tip: 'How critical is the accuracy of this asset\'s data?' },
                      { key: 'availability',     label: 'Availability',     tip: 'How critical is continuous availability of this asset?' },
                    ].map(f => (
                      <Col key={f.key} xs={12} md={4}>
                        <Form.Group>
                          <FieldLabel tooltip={f.tip}>{f.label}</FieldLabel>
                          <PgSelect value={(form as any)[f.key]} onChange={v => set(f.key, v)} placeholder={f.label} options={CIA_OPTIONS} />
                        </Form.Group>
                      </Col>
                    ))}
                  </Row>

                  {/* Status */}
                  <Form.Group>
                    <FieldLabel tooltip="Whether this asset is currently active in the environment">Status</FieldLabel>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <button type="button" className="pg-status-toggle"
                        style={{ background: form.status ? '#3B82EC' : '#d0d5dd' }}
                        onClick={() => set('status', !form.status)}>
                        <span className="knob" style={{ left: form.status ? 22 : 2 }} />
                      </button>
                      <span style={{ fontSize: '0.82rem', color: form.status ? '#3B82EC' : '#667085', fontWeight: 500 }}>
                        {form.status ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </Form.Group>
                </div>
              )}
            </div>

          </div>

          {/* Footer action bar */}
          <div className="d-flex align-items-center justify-content-between px-4 py-3 border-top"
            style={{ background: '#f9fafb', borderRadius: '0 0 12px 12px', gap: 8 }}>
            <div style={{ fontSize: '0.75rem', color: '#98a2b3' }}>
              Fields marked <span className="text-danger">*</span> are required
            </div>
            <div className="d-flex align-items-center gap-2">
              <Button className="btn-pg-dark border-0" onClick={() => handleSubmit(true)}>
                Send for Approval
              </Button>
              <Button className="btn-pg-dark border-0" onClick={() => handleSubmit(false)}>
                Save
              </Button>
              <button type="button" className="btn-pg-close border" onClick={onClose}>
                <X size={14} /> Close
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
