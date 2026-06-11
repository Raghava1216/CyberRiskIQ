import { useState } from 'react';
import { Plus, Search, Clock, User, CheckCircle, AlertTriangle, X } from 'react-feather';
import { Card, Row, Col, Form, InputGroup, Badge } from 'react-bootstrap';
import { mockIncidents } from '../lib/mockData';
import SeverityBadge from '../components/SeverityBadge';
import DeclareIncidentModal from '../components/DeclareIncidentModal';
import type { Incident } from '../lib/types';

const TYPES      = ['All','Security Breach','Data Leak','Ransomware','DDoS','Phishing','Insider Threat','Malware','Unauthorized Access','System Outage','Supply Chain Attack','Social Engineering','Physical Security'];
const STATUSES   = ['All','Open','Investigating','Contained','Resolved','Closed'];
const PRIORITIES = ['All','P1','P2','P3','P4'];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1)  return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function duration(start: string, end?: string) {
  const ms = (end ? new Date(end) : new Date()).getTime() - new Date(start).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const prioStyle = (p: string) => {
  if (p === 'P1') return { bg: '#fff5f5', color: '#d9534f', border: '#fecaca' };
  if (p === 'P2') return { bg: '#fff7ed', color: '#fd7e14', border: '#fed7aa' };
  if (p === 'P3') return { bg: '#fffbeb', color: '#f0ad4e', border: '#fde68a' };
  return { bg: '#f9fafb', color: '#98a2b3', border: '#e4e7ec' };
};

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents as Incident[]);
  const [search,    setSearch]    = useState('');
  const [type,      setType]      = useState('All');
  const [status,    setStatus]    = useState('All');
  const [priority,  setPriority]  = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [toast,     setToast]     = useState<{ msg: string; id: string } | null>(null);

  const showToast = (msg: string, id: string) => { setToast({ msg, id }); setTimeout(() => setToast(null), 5000); };

  const handleDeclare = (incident: Incident) => {
    setIncidents(prev => [incident, ...prev]);
    setModalOpen(false);
    showToast(`Incident "${incident.title}" declared as ${incident.id}`, incident.id);
  };

  const filtered = incidents.filter(i =>
    (i.title.toLowerCase().includes(search.toLowerCase()) ||
     i.assigned_to.toLowerCase().includes(search.toLowerCase()) ||
     i.reported_by.toLowerCase().includes(search.toLowerCase())) &&
    (type     === 'All' || i.type     === type) &&
    (status   === 'All' || i.status   === status) &&
    (priority === 'All' || i.priority === priority)
  );

  const stats = {
    open:      incidents.filter(i => i.status === 'Open' || i.status === 'Investigating').length,
    p1:        incidents.filter(i => i.priority === 'P1').length,
    contained: incidents.filter(i => i.status === 'Contained').length,
    resolved:  incidents.filter(i => i.status === 'Resolved' || i.status === 'Closed').length,
  };

  return (
    <div className="progrec-page p-4 p-lg-5">
      {modalOpen && <DeclareIncidentModal onClose={() => setModalOpen(false)} onSubmit={handleDeclare} />}

      {toast && (
        <div className="pg-toast" style={{ background: '#fff5f5', borderColor: '#fecaca', color: '#d9534f' }}>
          <AlertTriangle size={14} color="#d9534f" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>Incident Declared</div>
            <div style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: 2 }}>{toast.msg}</div>
          </div>
          <button onClick={() => setToast(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
            <X size={14} color="#98a2b3" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: '#101828' }}>Incident Response</h5>
          <span style={{ fontSize: '0.82rem', color: '#667085' }}>{incidents.length} incidents tracked</span>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn btn-danger btn-sm d-flex align-items-center gap-2">
          <Plus size={15} /> Declare Incident
        </button>
      </div>

      {/* Stat cards */}
      <Row className="g-3 mb-4">
        {[
          { label: 'Active Incidents', value: stats.open,      accent: '#d9534f', cls: 'stat-card-danger'  },
          { label: 'P1 Critical',      value: stats.p1,        accent: '#d9534f', cls: 'stat-card-danger'  },
          { label: 'Contained',        value: stats.contained, accent: '#3B82EC', cls: 'stat-card-primary' },
          { label: 'Resolved',         value: stats.resolved,  accent: '#4BBF73', cls: 'stat-card-success' },
        ].map(s => (
          <Col key={s.label} xs={6} md={3}>
            <Card className={`border shadow-sm h-100 ${s.cls}`} style={{ borderRadius: 10 }}>
              <Card.Body className="p-3">
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.accent, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                <div style={{ fontSize: '0.78rem', color: '#667085' }}>{s.label}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <InputGroup style={{ maxWidth: 300, flex: '1 1 200px' }}>
          <InputGroup.Text className="bg-white border-end-0"><Search size={14} color="#98a2b3" /></InputGroup.Text>
          <Form.Control value={search} onChange={e => setSearch(e.target.value)} placeholder="Search incidents, assignees…" style={{ fontSize: '0.82rem', borderLeft: 0 }} />
        </InputGroup>
        <Form.Select value={type}     onChange={e => setType(e.target.value)}     style={{ maxWidth: 180, fontSize: '0.82rem' }}>{TYPES.map(o => <option key={o}>{o}</option>)}</Form.Select>
        <Form.Select value={status}   onChange={e => setStatus(e.target.value)}   style={{ maxWidth: 140, fontSize: '0.82rem' }}>{STATUSES.map(o => <option key={o}>{o}</option>)}</Form.Select>
        <Form.Select value={priority} onChange={e => setPriority(e.target.value)} style={{ maxWidth: 100, fontSize: '0.82rem' }}>{PRIORITIES.map(o => <option key={o}>{o}</option>)}</Form.Select>
      </div>

      {/* Incident cards */}
      <div className="d-flex flex-column gap-3">
        {filtered.map(inc => {
          const ps    = prioStyle(inc.priority);
          const isNew = inc.id.startsWith('INC-') && inc.id.length > 6;
          const isP1Active = inc.priority === 'P1' && (inc.status === 'Open' || inc.status === 'Investigating');
          return (
            <Card key={inc.id} className="shadow-sm border-0" style={{ borderRadius: 10, borderLeft: `3px solid ${isP1Active ? '#d9534f' : isNew ? '#3B82EC' : '#e4e7ec'}` }}>
              <Card.Body className="p-4">
                <div className="d-flex flex-column flex-sm-row align-items-sm-start gap-3">
                  {/* Priority badge */}
                  <span className="flex-shrink-0 px-2 py-1 rounded fw-bold" style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`, marginTop: 2 }}>
                    {inc.priority}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
                      <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#101828' }}>{inc.title}</span>
                      {isNew && <span style={{ fontSize: '0.65rem', background: '#eff6ff', color: '#3B82EC', border: '1px solid #bfdbfe', borderRadius: 4, padding: '1px 6px' }}>New</span>}
                    </div>
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      <SeverityBadge level={inc.severity} />
                      <SeverityBadge level={inc.status} />
                      <span style={{ fontSize: '0.72rem', background: '#f4f7f9', border: '1px solid #e4e7ec', borderRadius: 4, padding: '2px 8px', color: '#667085' }}>{inc.type}</span>
                      {inc.is_dora_reportable && (
                        <span style={{ fontSize: '0.72rem', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 4, padding: '2px 8px', color: '#6f42c1' }}>DORA</span>
                      )}
                    </div>
                    <div className="d-flex flex-wrap gap-3" style={{ fontSize: '0.75rem', color: '#98a2b3' }}>
                      <span className="d-flex align-items-center gap-1"><Clock size={11} /> Detected {timeAgo(inc.detected_at)}</span>
                      <span className="d-flex align-items-center gap-1"><User size={11} /> {inc.assigned_to}</span>
                      <span style={{ color: '#b0b8c4' }}>via {inc.reported_by}</span>
                      {inc.resolved_at
                        ? <span style={{ color: '#4BBF73' }}>Resolved in {duration(inc.detected_at, inc.resolved_at)}</span>
                        : <span style={{ color: '#f0ad4e' }}>Open for {duration(inc.detected_at)}</span>
                      }
                    </div>
                  </div>

                  <div className="d-flex flex-column align-items-end gap-2 flex-shrink-0">
                    <span style={{ color: '#98a2b3', fontSize: '0.72rem', fontFamily: 'monospace' }}>{inc.id}</span>
                    {inc.financial_impact_estimate > 0 && (
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#d9534f' }}>
                        ${(inc.financial_impact_estimate / 1000).toFixed(0)}K impact
                      </span>
                    )}
                    <div className="d-flex flex-wrap gap-1 justify-content-end">
                      {inc.tags.slice(0, 3).map(t => (
                        <span key={t} style={{ fontSize: '0.65rem', background: '#f4f7f9', border: '1px solid #e4e7ec', borderRadius: 4, padding: '1px 5px', color: '#667085' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="shadow-sm border-0 py-5 text-center" style={{ borderRadius: 10 }}>
            <div style={{ color: '#98a2b3' }}>No incidents match the current filters.</div>
          </Card>
        )}
      </div>
    </div>
  );
}
