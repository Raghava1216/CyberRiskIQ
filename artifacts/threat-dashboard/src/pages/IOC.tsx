import { useState } from 'react';
import { Plus, Search, Download, Upload, Globe, Hash, Link2, Mail, File, HardDrive, Key, Target, CheckCircle } from 'react-feather';
import { Card, Form, InputGroup, Table } from 'react-bootstrap';
import { useIOCStore, iocStore } from '../lib/iocStore';
import type { IOC } from '../lib/types';
import AddIOCModal from '../components/AddIOCModal';
import ImportIOCCSVModal from '../components/ImportIOCCSVModal';

const TYPES      = ['All', 'IP', 'Domain', 'URL', 'Hash', 'Email', 'File', 'Registry', 'Certificate'];
const SEVERITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];
const STATUSES   = ['All', 'Active', 'Inactive', 'Under Review', 'Whitelisted'];

const typeIcon = (type: string) => {
  switch (type) {
    case 'IP':          return Globe;
    case 'Domain':      return Globe;
    case 'URL':         return Link2;
    case 'Hash':        return Hash;
    case 'Email':       return Mail;
    case 'File':        return File;
    case 'Registry':    return HardDrive;
    case 'Certificate': return Key;
    default:            return Target;
  }
};

const typeStyle = (type: string) => {
  switch (type) {
    case 'IP':          return { bg: '#eff6ff', color: '#3B82EC', border: '#bfdbfe' };
    case 'Domain':      return { bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' };
    case 'URL':         return { bg: '#f5f3ff', color: '#6f42c1', border: '#ddd6fe' };
    case 'Hash':        return { bg: '#fffbeb', color: '#f0ad4e', border: '#fde68a' };
    case 'Email':       return { bg: '#fdf2f8', color: '#be185d', border: '#fbcfe8' };
    case 'File':        return { bg: '#fff7ed', color: '#fd7e14', border: '#fed7aa' };
    case 'Registry':    return { bg: '#f9fafb', color: '#6c757d', border: '#e4e7ec' };
    case 'Certificate': return { bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' };
    default:            return { bg: '#f9fafb', color: '#6c757d', border: '#e4e7ec' };
  }
};

const sevStyle = (s: string) => {
  if (s === 'Critical') return { bg: '#fff5f5', color: '#d9534f', border: '#fecaca' };
  if (s === 'High')     return { bg: '#fff7ed', color: '#fd7e14', border: '#fed7aa' };
  if (s === 'Medium')   return { bg: '#fffbeb', color: '#f0ad4e', border: '#fde68a' };
  if (s === 'Low')      return { bg: '#f0fdf4', color: '#4BBF73', border: '#bbf7d0' };
  return { bg: '#f9fafb', color: '#6c757d', border: '#e4e7ec' };
};

const statusStyle = (s: string) => {
  if (s === 'Active')       return { bg: '#fff5f5', color: '#d9534f', border: '#fecaca' };
  if (s === 'Under Review') return { bg: '#fffbeb', color: '#f0ad4e', border: '#fde68a' };
  if (s === 'Inactive')     return { bg: '#f9fafb', color: '#98a2b3', border: '#e4e7ec' };
  if (s === 'Whitelisted')  return { bg: '#f0fdf4', color: '#4BBF73', border: '#bbf7d0' };
  return { bg: '#f9fafb', color: '#6c757d', border: '#e4e7ec' };
};

function Chip({ text, style }: { text: string; style: { bg: string; color: string; border: string } }) {
  return (
    <span style={{ display: 'inline-block', fontSize: '0.72rem', padding: '2px 8px', borderRadius: 6, background: style.bg, color: style.color, border: `1px solid ${style.border}`, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {text}
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? '#4BBF73' : value >= 50 ? '#f0ad4e' : '#d9534f';
  return (
    <div className="d-flex align-items-center gap-2">
      <div style={{ width: 52, height: 6, background: '#f0f0f0', borderRadius: 999, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ height: '100%', borderRadius: 999, background: color, width: `${value}%` }} />
      </div>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', minWidth: 28 }}>{value}%</span>
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1)  return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function exportToCSV(iocs: IOC[]) {
  const headers = ['ID','Value','Type','Severity','Status','Confidence','Source','Threat Actor','Tags','First Seen','Last Seen'];
  const rows = iocs.map(i => [i.id, `"${i.value.replace(/"/g,'""')}"`, i.type, i.severity, i.status, i.confidence, `"${i.source}"`, `"${i.threat_actor}"`, `"${i.tags.join('; ')}"`, i.first_seen, i.last_seen]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `ioc-register-${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

export default function IOCPage() {
  const iocs = useIOCStore();
  const [search,       setSearch]       = useState('');
  const [typeFilter,   setTypeFilter]   = useState('All');
  const [sevFilter,    setSevFilter]    = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [addOpen,      setAddOpen]      = useState(false);
  const [importOpen,   setImportOpen]   = useState(false);
  const [toast,        setToast]        = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  const handleAdd = (ioc: IOC) => {
    const added = iocStore.add(ioc);
    setAddOpen(false);
    showToast(added > 0 ? `IOC "${ioc.value}" added` : `IOC "${ioc.value}" already exists`);
  };

  const handleImport = (newIOCs: IOC[]) => {
    const added = iocStore.add(newIOCs);
    showToast(`${added} ${added === 1 ? 'IOC' : 'IOCs'} imported (${newIOCs.length - added} duplicates skipped)`);
  };

  const filtered = iocs.filter(i => {
    const q = search.toLowerCase();
    return (i.value.toLowerCase().includes(q) || i.source.toLowerCase().includes(q) || i.threat_actor.toLowerCase().includes(q) || i.tags.some(t => t.toLowerCase().includes(q))) &&
      (typeFilter   === 'All' || i.type     === typeFilter) &&
      (sevFilter    === 'All' || i.severity === sevFilter) &&
      (statusFilter === 'All' || i.status   === statusFilter);
  });

  const stats = {
    total:    iocs.length,
    critical: iocs.filter(i => i.severity === 'Critical').length,
    active:   iocs.filter(i => i.status   === 'Active').length,
    review:   iocs.filter(i => i.status   === 'Under Review').length,
  };

  return (
    <div className="progrec-page p-4 p-lg-5">
      {addOpen    && <AddIOCModal       onClose={() => setAddOpen(false)}    onSubmit={handleAdd}    />}
      {importOpen && <ImportIOCCSVModal onClose={() => setImportOpen(false)} onImport={handleImport} />}
      {toast && <div className="pg-toast"><span className="live-dot" />{toast}</div>}

      {/* Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: '#101828' }}>IOC Register</h5>
          <span style={{ fontSize: '0.82rem', color: '#667085' }}>{iocs.length} indicators tracked · Last updated today</span>
        </div>
        <div className="d-flex gap-2">
          <button onClick={() => exportToCSV(filtered)} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2">
            <Download size={14} /> Export {filtered.length !== iocs.length ? `(${filtered.length})` : ''}
          </button>
          <button onClick={() => setImportOpen(true)} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2">
            <Upload size={14} /> Import CSV
          </button>
          <button onClick={() => setAddOpen(true)} className="btn btn-sm btn-primary d-flex align-items-center gap-2">
            <Plus size={14} /> Add IOC
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total IOCs',   value: stats.total,    accent: '#3B82EC', cls: 'stat-card-primary' },
          { label: 'Critical',     value: stats.critical, accent: '#d9534f', cls: 'stat-card-danger'  },
          { label: 'Active',       value: stats.active,   accent: '#fd7e14', cls: 'stat-card-warning' },
          { label: 'Under Review', value: stats.review,   accent: '#f0ad4e', cls: 'stat-card-warning' },
        ].map(s => (
          <div key={s.label} className="col-6 col-md-3">
            <Card className={`border shadow-sm h-100 ${s.cls}`} style={{ borderRadius: 10 }}>
              <Card.Body className="p-3">
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.accent, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                <div style={{ fontSize: '0.78rem', color: '#667085' }}>{s.label}</div>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>

      {/* IOC type distribution grid */}
      <div className="row g-2 mb-4">
        {(['IP','Domain','URL','Hash','Email','File','Registry','Certificate'] as IOC['type'][]).map(t => {
          const count  = iocs.filter(i => i.type === t).length;
          const Icon   = typeIcon(t);
          const ts     = typeStyle(t);
          const active = typeFilter === t;
          return (
            <div key={t} className="col-3 col-sm-auto" style={{ flex: '1 1 80px' }}>
              <button
                onClick={() => setTypeFilter(typeFilter === t ? 'All' : t)}
                className="w-100 d-flex flex-column align-items-center gap-1 p-2 rounded"
                style={{
                  border: active ? `2px solid ${ts.color}` : '1px solid #e4e7ec',
                  background: active ? ts.bg : '#fff',
                  cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                }}
              >
                <Icon size={16} color={active ? ts.color : '#667085'} />
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: active ? ts.color : '#667085' }}>{t}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: active ? ts.color : '#344054', fontVariantNumeric: 'tabular-nums' }}>{count}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <InputGroup style={{ maxWidth: 320, flex: '1 1 200px' }}>
          <InputGroup.Text className="bg-white border-end-0"><Search size={14} color="#98a2b3" /></InputGroup.Text>
          <Form.Control value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by value, source, actor, or tag…" style={{ fontSize: '0.82rem', borderLeft: 0 }} />
        </InputGroup>
        <Form.Select value={sevFilter}    onChange={e => setSevFilter(e.target.value)}    style={{ maxWidth: 130, fontSize: '0.82rem' }}>{SEVERITIES.map(o => <option key={o}>{o}</option>)}</Form.Select>
        <Form.Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 150, fontSize: '0.82rem' }}>{STATUSES.map(o => <option key={o}>{o}</option>)}</Form.Select>
      </div>

      {/* Table */}
      <Card className="shadow-sm border-0" style={{ borderRadius: 10, overflow: 'hidden' }}>
        <div className="table-responsive">
          <Table hover className="mb-0" style={{ fontSize: '0.82rem' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                {['Indicator','Type','Severity','Confidence','Source','Threat Actor','Status','Last Seen',''].map(h => (
                  <th key={h} className="px-4 py-3 border-bottom fw-semibold" style={{ fontSize: '0.72rem', color: '#98a2b3', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(ioc => {
                const Icon  = typeIcon(ioc.type);
                const ts    = typeStyle(ioc.type);
                const isNew = !ioc.id.startsWith('mock') && Date.now() - new Date(ioc.first_seen).getTime() < 10 * 60 * 1000;
                return (
                  <tr key={ioc.id} className="align-middle">
                    <td className="px-4 py-3" style={{ maxWidth: 260 }}>
                      <div className="d-flex align-items-center gap-2">
                        <div className="d-flex align-items-center justify-content-center rounded flex-shrink-0" style={{ width: 28, height: 28, background: ts.bg, border: `1px solid ${ts.border}` }}>
                          <Icon size={13} color={ts.color} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div className="d-flex align-items-center gap-1">
                            <span style={{ color: '#344054', fontFamily: 'monospace', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{ioc.value}</span>
                            {isNew && <span style={{ fontSize: '0.65rem', background: '#eff6ff', color: '#3B82EC', border: '1px solid #bfdbfe', borderRadius: 4, padding: '1px 6px', flexShrink: 0 }}>New</span>}
                          </div>
                          <div className="d-flex gap-1 mt-1 flex-wrap">
                            {ioc.tags.slice(0,2).map(t => <span key={t} style={{ fontSize: '0.65rem', background: '#f4f7f9', border: '1px solid #e4e7ec', borderRadius: 4, padding: '1px 5px', color: '#667085' }}>{t}</span>)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Chip text={ioc.type} style={ts} /></td>
                    <td className="px-4 py-3"><Chip text={ioc.severity} style={sevStyle(ioc.severity)} /></td>
                    <td className="px-4 py-3" style={{ minWidth: 110 }}><ConfidenceBar value={ioc.confidence} /></td>
                    <td className="px-4 py-3"><span style={{ color: '#667085', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{ioc.source}</span></td>
                    <td className="px-4 py-3"><span style={{ color: '#667085', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{ioc.threat_actor}</span></td>
                    <td className="px-4 py-3"><Chip text={ioc.status} style={statusStyle(ioc.status)} /></td>
                    <td className="px-4 py-3"><span style={{ color: '#98a2b3', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{timeAgo(ioc.last_seen)}</span></td>
                    <td className="px-4 py-3">
                      <button onClick={() => { iocStore.remove(ioc.id); showToast(`IOC "${ioc.value}" removed`); }}
                        className="btn btn-sm btn-link p-0 text-danger opacity-0 show-on-hover" style={{ fontSize: '0.72rem' }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
        {filtered.length === 0 && <div className="py-5 text-center" style={{ color: '#98a2b3' }}>No IOCs match the current filters.</div>}
      </Card>
    </div>
  );
}
