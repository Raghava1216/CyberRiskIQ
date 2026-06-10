import { useState } from 'react';
import { Card, Row, Col, Badge, Form, InputGroup, Table, Nav } from 'react-bootstrap';
import { Plus, Download, Search, DollarSign, TrendingUp, Shield, AlertTriangle, X } from 'react-feather';
import { mockRisks } from '../lib/mockData';
import RiskMatrix from '../components/RiskMatrix';
import AddRiskModal, { type NewRisk } from '../components/AddRiskModal';
import type { Risk } from '../lib/types';

const CATEGORIES = ['All', 'Strategic', 'Operational', 'Technical', 'Compliance', 'Financial', 'Reputational'];
const STATUSES   = ['All', 'Open', 'In Treatment', 'Accepted', 'Closed', 'Transferred'];
const TREATMENTS = ['All', 'Mitigate', 'Accept', 'Transfer', 'Avoid'];
const FRAMEWORKS = ['All', 'DORA', 'NIS2', 'NIST CSF', 'ISO 27001', 'GDPR', 'PCI DSS', 'SOC 2'];

const fmt$ = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K`
  : `$${n}`;

const treatmentBg = (t: string) => {
  if (t === 'Mitigate')  return { bg: '#eff6ff', color: '#3B82EC', border: '#bfdbfe' };
  if (t === 'Accept')    return { bg: '#f9fafb', color: '#6c757d', border: '#e4e7ec' };
  if (t === 'Transfer')  return { bg: '#f0fdf4', color: '#4BBF73', border: '#bbf7d0' };
  if (t === 'Avoid')     return { bg: '#fff7ed', color: '#fd7e14', border: '#fed7aa' };
  return { bg: '#f9fafb', color: '#6c757d', border: '#e4e7ec' };
};

const statusBg = (s: string) => {
  if (s === 'Open')         return { bg: '#fff5f5', color: '#d9534f', border: '#fecaca' };
  if (s === 'In Treatment') return { bg: '#fffbeb', color: '#f0ad4e', border: '#fde68a' };
  if (s === 'Accepted')     return { bg: '#f9fafb', color: '#6c757d', border: '#e4e7ec' };
  if (s === 'Closed')       return { bg: '#f0fdf4', color: '#4BBF73', border: '#bbf7d0' };
  return { bg: '#f9fafb', color: '#6c757d', border: '#e4e7ec' };
};

function InlineBadge({ text, style }: { text: string; style: { bg: string; color: string; border: string } }) {
  return (
    <span style={{ display: 'inline-block', fontSize: '0.72rem', padding: '2px 8px', borderRadius: 6, background: style.bg, color: style.color, border: `1px solid ${style.border}`, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {text}
    </span>
  );
}

function ScoreBar({ score, max = 25 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color = score >= 16 ? '#d9534f' : score >= 10 ? '#fd7e14' : score >= 6 ? '#f0ad4e' : '#4BBF73';
  return (
    <div className="d-flex align-items-center gap-2">
      <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 999, background: color, width: `${pct}%` }} />
      </div>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, color, width: 20, textAlign: 'right' }}>{score}</span>
    </div>
  );
}

function FAIRDetailPanel({ risk, onClose }: { risk: Risk; onClose: () => void }) {
  const tm = treatmentBg(risk.treatment);
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.5)', zIndex: 1040 }} onClick={onClose} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 1050, width: '100%', maxWidth: 480, background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', overflowY: 'auto', fontFamily: 'Poppins,sans-serif' }}>
        <div className="d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: '1px solid #e4e7ec', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#101828' }}>FAIR Risk Analysis</div>
            <div style={{ fontSize: '0.75rem', color: '#98a2b3', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 360 }}>{risk.title}</div>
          </div>
          <button className="btn p-1 border-0" onClick={onClose} style={{ color: '#667085' }}><X size={18} /></button>
        </div>
        <div className="p-4">
          <Row className="g-2 mb-4">
            {[
              { l: 'ALE (Most Likely)', v: fmt$(risk.fair.ale),           c: '#d9534f', sub: 'Annualised Loss Expectancy' },
              { l: 'ALE Min',           v: fmt$(risk.fair.ale_min),       c: '#f0ad4e', sub: 'Best case' },
              { l: 'ALE Max',           v: fmt$(risk.fair.ale_max),       c: '#d9534f', sub: 'Worst case' },
              { l: 'Treatment Cost',    v: fmt$(risk.treatment_cost),     c: '#3B82EC', sub: 'Investment to remediate' },
            ].map(s => (
              <Col key={s.l} xs={6}>
                <div className="p-3 rounded" style={{ background: '#f9fafb', border: '1px solid #e4e7ec' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: '0.75rem', color: '#344054', fontWeight: 500 }}>{s.l}</div>
                  <div style={{ fontSize: '0.68rem', color: '#98a2b3' }}>{s.sub}</div>
                </div>
              </Col>
            ))}
          </Row>

          {risk.treatment_cost > 0 && (
            <div className="p-3 rounded mb-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div style={{ color: '#4BBF73', fontWeight: 700, fontSize: '1.4rem' }}>{risk.remediation_roi}%</div>
                  <div style={{ color: '#667085', fontSize: '0.78rem' }}>Remediation ROI</div>
                </div>
                <div className="text-end">
                  <div style={{ color: '#344054', fontWeight: 500 }}>{fmt$(risk.fair.ale - risk.treatment_cost)}</div>
                  <div style={{ color: '#98a2b3', fontSize: '0.72rem' }}>Net risk reduction value</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ fontSize: '0.7rem', color: '#98a2b3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>FAIR Model Inputs</div>
          {[
            { l: 'Threat Event Frequency (TEF)', v: `${risk.fair.tef_min}–${risk.fair.tef_likely}–${risk.fair.tef_max} /yr` },
            { l: 'Vulnerability / Contact probability', v: `${risk.fair.vulnerability}%` },
            { l: 'Loss Event Frequency (LEF)', v: `${risk.fair.lef} /yr` },
            { l: 'Loss Magnitude — Min / Likely / Max', v: `${fmt$(risk.fair.lm_min)} / ${fmt$(risk.fair.lm_likely)} / ${fmt$(risk.fair.lm_max)}` },
          ].map(row => (
            <div key={row.l} className="d-flex align-items-center justify-content-between py-2" style={{ borderBottom: '1px solid #f4f7f9', fontSize: '0.78rem' }}>
              <span style={{ color: '#667085' }}>{row.l}</span>
              <span style={{ color: '#344054', fontFamily: 'monospace', fontWeight: 500 }}>{row.v}</span>
            </div>
          ))}

          <div className="mt-4">
            <div style={{ fontSize: '0.7rem', color: '#98a2b3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>GRC / Regulatory Linkage</div>
            <div className="d-flex flex-wrap gap-1 mb-2">
              {risk.framework_tags.map(f => (
                <span key={f} style={{ fontSize: '0.72rem', padding: '3px 8px', background: '#f4f7f9', border: '1px solid #e4e7ec', borderRadius: 6, color: '#344054' }}>{f}</span>
              ))}
            </div>
            {risk.regulatory_reference && <div style={{ fontSize: '0.75rem', color: '#98a2b3' }}>{risk.regulatory_reference}</div>}
          </div>

          <div className="mt-4">
            <div style={{ fontSize: '0.7rem', color: '#98a2b3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Treatment Details</div>
            <Row className="g-2">
              <Col xs={6}>
                <div className="p-3 rounded" style={{ background: '#f9fafb', border: '1px solid #e4e7ec' }}>
                  <div style={{ fontSize: '0.72rem', color: '#98a2b3', marginBottom: 4 }}>Strategy</div>
                  <InlineBadge text={risk.treatment} style={tm} />
                </div>
              </Col>
              <Col xs={6}>
                <div className="p-3 rounded" style={{ background: '#f9fafb', border: '1px solid #e4e7ec' }}>
                  <div style={{ fontSize: '0.72rem', color: '#98a2b3', marginBottom: 4 }}>Treatment Status</div>
                  <span style={{ fontSize: '0.8rem', color: '#344054', fontWeight: 500 }}>{risk.treatment_status}</span>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </div>
    </>
  );
}

function exportToCSV(risks: Risk[]) {
  const headers = ['ID','Title','Category','Status','Treatment','Inherent Score','Residual Score','ALE','ALE Min','ALE Max','Treatment Cost','ROI %','Framework Tags','Regulatory Ref','Owner','Review Date'];
  const rows = risks.map(r => [r.id, `"${r.title.replace(/"/g,'""')}"`, r.category, r.status, r.treatment, r.inherent_score, r.residual_score, r.fair.ale, r.fair.ale_min, r.fair.ale_max, r.treatment_cost, r.remediation_roi, `"${r.framework_tags.join('; ')}"`, `"${r.regulatory_reference}"`, `"${r.owner}"`, r.review_date]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `risk-register-fair-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
}

export default function Risks() {
  const [riskData, setRiskData]       = useState<Risk[]>(mockRisks as Risk[]);
  const [search, setSearch]           = useState('');
  const [category, setCategory]       = useState('All');
  const [status, setStatus]           = useState('All');
  const [treatment, setTreatment]     = useState('All');
  const [framework, setFramework]     = useState('All');
  const [view, setView]               = useState<'list' | 'matrix' | 'financial'>('list');
  const [modalOpen, setModalOpen]     = useState(false);
  const [detailRisk, setDetailRisk]   = useState<Risk | null>(null);
  const [toast, setToast]             = useState<string | null>(null);

  const filtered = riskData.filter(r => {
    const q = search.toLowerCase();
    return (r.title.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q) || r.regulatory_reference?.toLowerCase().includes(q))
      && (category === 'All' || r.category === category)
      && (status === 'All' || r.status === status)
      && (treatment === 'All' || r.treatment === treatment)
      && (framework === 'All' || r.framework_tags?.includes(framework));
  });

  const totalALE = filtered.reduce((s, r) => s + r.fair.ale, 0);
  const totalTreatment = filtered.reduce((s, r) => s + r.treatment_cost, 0);
  const avgROI = filtered.filter(r => r.remediation_roi > 0).length > 0
    ? Math.round(filtered.filter(r => r.remediation_roi > 0).reduce((s, r) => s + r.remediation_roi, 0) / filtered.filter(r => r.remediation_roi > 0).length) : 0;

  const handleAddRisk = (newRisk: NewRisk) => {
    const score = newRisk.likelihood * newRisk.impact;
    const ale = score * 80_000;
    const row: Risk = {
      id: String(riskData.length + 1), title: newRisk.title, category: newRisk.category,
      status: newRisk.status === 'Active' ? 'Open' : 'Accepted',
      likelihood: newRisk.likelihood, impact: newRisk.impact,
      inherent_score: score, residual_score: Math.max(1, score - 3),
      owner: newRisk.owners[0] ?? 'Unassigned',
      review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      tags: newRisk.tags,
      fair: { tef_min: 0.5, tef_max: 3, tef_likely: 1, vulnerability: 60, lm_min: ale * 0.2, lm_max: ale * 3, lm_likely: ale, ale, ale_min: ale * 0.1, ale_max: ale * 2, lef: 1 },
      treatment: 'Mitigate', treatment_cost: Math.round(ale * 0.1), treatment_status: 'Not Started',
      remediation_roi: Math.round(((ale - ale * 0.1) / (ale * 0.1)) * 100),
      financial_impact: ale, framework_tags: [], regulatory_reference: '',
    };
    setRiskData(prev => [row, ...prev]);
    setToast(`Risk "${newRisk.title}" added to register`);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="progrec-page p-4 p-lg-5">
      {modalOpen && <AddRiskModal onClose={() => setModalOpen(false)} onSubmit={handleAddRisk} />}
      {detailRisk && <FAIRDetailPanel risk={detailRisk} onClose={() => setDetailRisk(null)} />}

      {toast && (
        <div className="pg-toast">
          <span className="live-dot" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: '#101828' }}>Risk Register</h5>
          <span style={{ fontSize: '0.82rem', color: '#667085' }}>{riskData.length} risks · FAIR financial model · GRC framework linkage</span>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2" onClick={() => exportToCSV(filtered)}>
            <Download size={15} /> Export FAIR CSV
          </button>
          <button className="btn btn-primary btn-sm d-flex align-items-center gap-2" onClick={() => setModalOpen(true)}>
            <Plus size={15} /> Add Risk
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <Row className="g-3 mb-4">
        {[
          { l: 'Aggregate ALE',     v: fmt$(totalALE),        sub: 'Annualised Loss Expectancy',   accent: '#d9534f', icon: DollarSign,    cls: 'stat-card-danger' },
          { l: 'Treatment Budget',  v: fmt$(totalTreatment),  sub: 'Total remediation cost',        accent: '#3B82EC', icon: Shield,        cls: 'stat-card-primary' },
          { l: 'Avg Remediation ROI', v: `${avgROI}%`,        sub: 'Return on risk investment',     accent: '#4BBF73', icon: TrendingUp,    cls: 'stat-card-success' },
          { l: 'Open/In Treatment', v: String(filtered.filter(r => ['Open','In Treatment'].includes(r.status)).length), sub: `of ${filtered.length} filtered`, accent: '#f0ad4e', icon: AlertTriangle, cls: 'stat-card-warning' },
        ].map(s => (
          <Col key={s.l} xs={6} md={3}>
            <Card className={`shadow-sm border ${s.cls} h-100`} style={{ borderRadius: 10 }}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <s.icon size={14} color={s.accent} />
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: s.accent, fontVariantNumeric: 'tabular-nums' }}>{s.v}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#344054', fontWeight: 500 }}>{s.l}</div>
                <div style={{ fontSize: '0.7rem', color: '#98a2b3' }}>{s.sub}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <InputGroup style={{ maxWidth: 280, flex: '1 1 200px' }}>
          <InputGroup.Text className="bg-white border-end-0"><Search size={14} color="#98a2b3" /></InputGroup.Text>
          <Form.Control value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, owner, regulation…" style={{ fontSize: '0.82rem', borderLeft: 0 }} />
        </InputGroup>
        {[
          { val: category, set: setCategory, opts: CATEGORIES },
          { val: status,   set: setStatus,   opts: STATUSES   },
          { val: treatment,set: setTreatment,opts: TREATMENTS  },
          { val: framework,set: setFramework,opts: FRAMEWORKS  },
        ].map(({ val, set, opts }, i) => (
          <Form.Select key={i} value={val} onChange={e => set(e.target.value)} style={{ maxWidth: 140, fontSize: '0.82rem' }}>
            {opts.map(o => <option key={o}>{o}</option>)}
          </Form.Select>
        ))}
        <div className="btn-group">
          {(['list','financial','matrix'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} className={`btn btn-sm ${view === v ? 'btn-primary' : 'btn-outline-secondary'}`} style={{ fontSize: '0.78rem', textTransform: 'capitalize' }}>{v}</button>
          ))}
        </div>
      </div>

      {/* Matrix view */}
      {view === 'matrix' && (
        <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: 10 }}>
          <Card.Body className="p-4">
            <h6 className="fw-semibold mb-4" style={{ color: '#101828' }}>Risk Heat Map</h6>
            <RiskMatrix risks={filtered} />
          </Card.Body>
        </Card>
      )}

      {/* Financial view */}
      {view === 'financial' && (
        <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: 10, overflow: 'hidden' }}>
          <Card.Header className="bg-white px-4 py-3 d-flex align-items-center gap-2" style={{ borderBottom: '1px solid #e4e7ec' }}>
            <DollarSign size={16} color="#3B82EC" />
            <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#101828' }}>Financial Risk View — FAIR Model</span>
          </Card.Header>
          <div className="table-responsive">
            <Table hover className="mb-0" style={{ fontSize: '0.82rem' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>{['Risk','ALE (Likely)','ALE Range','Treatment','Treatment Cost','ROI','Frameworks','Status'].map(h => (
                  <th key={h} className="px-4 py-3 border-bottom fw-semibold" style={{ fontSize: '0.72rem', color: '#98a2b3', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setDetailRisk(r)}>
                    <td className="px-4 py-3" style={{ maxWidth: 200 }}>
                      <div style={{ color: '#344054', fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                      <div style={{ color: '#98a2b3', fontSize: '0.72rem' }}>{r.category}</div>
                    </td>
                    <td className="px-4 py-3"><span style={{ color: '#d9534f', fontWeight: 600, fontFamily: 'monospace' }}>{fmt$(r.fair.ale)}</span></td>
                    <td className="px-4 py-3"><span style={{ color: '#98a2b3', fontSize: '0.75rem', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{fmt$(r.fair.ale_min)} – {fmt$(r.fair.ale_max)}</span></td>
                    <td className="px-4 py-3"><InlineBadge text={r.treatment} style={treatmentBg(r.treatment)} /></td>
                    <td className="px-4 py-3"><span style={{ color: '#3B82EC', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.78rem' }}>{r.treatment_cost > 0 ? fmt$(r.treatment_cost) : '—'}</span></td>
                    <td className="px-4 py-3"><span style={{ fontWeight: 600, color: r.remediation_roi >= 500 ? '#4BBF73' : r.remediation_roi > 0 ? '#3B82EC' : '#98a2b3' }}>{r.remediation_roi > 0 ? `${r.remediation_roi}%` : '—'}</span></td>
                    <td className="px-4 py-3"><div className="d-flex gap-1 flex-wrap">{(r.framework_tags ?? []).slice(0,2).map(f => <span key={f} style={{ fontSize: '0.65rem', padding: '1px 5px', background: '#f4f7f9', border: '1px solid #e4e7ec', borderRadius: 4, color: '#667085' }}>{f}</span>)}</div></td>
                    <td className="px-4 py-3"><InlineBadge text={r.status} style={statusBg(r.status)} /></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          {filtered.length === 0 && <div className="py-5 text-center" style={{ color: '#98a2b3' }}>No risks match filters.</div>}
        </Card>
      )}

      {/* List view */}
      {view === 'list' && (
        <Card className="shadow-sm border-0" style={{ borderRadius: 10, overflow: 'hidden' }}>
          <div className="table-responsive">
            <Table hover className="mb-0" style={{ fontSize: '0.82rem' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>{['Risk','Category','Status','Inherent','Residual','ALE','Treatment','Framework','Owner'].map(h => (
                  <th key={h} className="px-4 py-3 border-bottom fw-semibold" style={{ fontSize: '0.72rem', color: '#98a2b3', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setDetailRisk(r)}>
                    <td className="px-4 py-3" style={{ maxWidth: 220 }}>
                      <div style={{ color: '#344054', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                      <div className="d-flex gap-1 mt-1 flex-wrap">{r.tags.slice(0,2).map(t => <span key={t} style={{ fontSize: '0.65rem', padding: '1px 5px', background: '#f4f7f9', border: '1px solid #e4e7ec', borderRadius: 4, color: '#667085' }}>{t}</span>)}</div>
                    </td>
                    <td className="px-4 py-3"><span style={{ color: '#667085', fontSize: '0.78rem' }}>{r.category}</span></td>
                    <td className="px-4 py-3"><InlineBadge text={r.status} style={statusBg(r.status)} /></td>
                    <td className="px-4 py-3" style={{ minWidth: 110 }}><ScoreBar score={r.inherent_score} /></td>
                    <td className="px-4 py-3" style={{ minWidth: 110 }}><ScoreBar score={r.residual_score} /></td>
                    <td className="px-4 py-3"><span style={{ color: '#d9534f', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.78rem' }}>{fmt$(r.fair.ale)}</span></td>
                    <td className="px-4 py-3"><InlineBadge text={r.treatment} style={treatmentBg(r.treatment)} /></td>
                    <td className="px-4 py-3"><div className="d-flex gap-1 flex-wrap">{(r.framework_tags ?? []).slice(0,2).map(f => <span key={f} style={{ fontSize: '0.65rem', padding: '1px 5px', background: '#f4f7f9', border: '1px solid #e4e7ec', borderRadius: 4, color: '#667085' }}>{f}</span>)}</div></td>
                    <td className="px-4 py-3"><span style={{ color: '#667085', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{r.owner}</span></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          {filtered.length === 0 && <div className="py-5 text-center" style={{ color: '#98a2b3' }}>No risks match the current filters.</div>}
        </Card>
      )}
    </div>
  );
}
