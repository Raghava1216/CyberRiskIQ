import { useState } from 'react';
import {
  Container, Row, Col, Card, Badge, Button, Form,
  InputGroup, Table, ProgressBar,
} from 'react-bootstrap';
import {
  Plus, Search, Server, Cloud, Cpu, Monitor, Upload,
  CheckCircle, AlertTriangle, Shield, Tag, DollarSign,
} from 'react-feather';
import { mockAssets } from '../lib/mockData';
import AddAssetModal from '../components/AddAssetModal';
import ImportAssetCSVModal from '../components/ImportAssetCSVModal';

const CATEGORIES    = ['All', 'IT', 'OT', 'Cloud', 'Mobile'];
const CRITICALITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];
const CLASSES       = ['All', 'Primary', 'Supporting', 'External'];
const REG_SCOPE     = ['All', 'DORA', 'NIS2', 'GDPR', 'PCI DSS', 'SOC 2', 'ISO 27001', 'MiFID II'];

const typeIcon = (type) => {
  if (type === 'Cloud' || type === 'Application' || type === 'Cloud Service') return Cloud;
  if (type === 'IoT') return Cpu;
  if (type === 'Workstation') return Monitor;
  return Server;
};

function critVariant(c) {
  if (c === 'Critical') return 'danger';
  if (c === 'High')     return 'warning';
  if (c === 'Medium')   return 'warning';
  return 'success';
}

function critStyle(c) {
  if (c === 'High')   return { backgroundColor: '#fd7e14', color: '#fff' };
  if (c === 'Medium') return { backgroundColor: '#f0ad4e', color: '#212529' };
  return {};
}

function critIconStyle(c) {
  if (c === 'Critical') return { background: 'rgba(217,83,79,0.12)',  color: '#d9534f'  };
  if (c === 'High')     return { background: 'rgba(253,126,20,0.12)', color: '#fd7e14'  };
  if (c === 'Medium')   return { background: 'rgba(240,173,78,0.12)', color: '#b07d20'  };
  return { background: '#f4f7f9', color: '#6c757d' };
}

function dataClassBadge(d) {
  if (d === 'Restricted')   return { bg: 'danger',   label: d };
  if (d === 'Confidential') return { bg: 'warning',  label: d };
  if (d === 'Internal')     return { bg: 'secondary', label: d };
  return { bg: 'light', label: d };
}

function assetClassStyle(c) {
  if (c === 'Primary')    return { background: 'rgba(59,130,236,0.1)', color: '#3B82EC', border: '1px solid rgba(59,130,236,0.3)', fontSize: '0.7rem' };
  if (c === 'Supporting') return { background: 'rgba(31,155,207,0.1)', color: '#1F9BCF', border: '1px solid rgba(31,155,207,0.3)', fontSize: '0.7rem' };
  return { background: '#f4f7f9', color: '#6c757d', border: '1px solid #dee2e6', fontSize: '0.7rem' };
}

function riskVariant(score) {
  if (score >= 80) return 'danger';
  if (score >= 60) return 'warning';
  if (score >= 40) return 'warning';
  return 'success';
}

function riskStyle(score) {
  if (score >= 60 && score < 80) return { backgroundColor: '#fd7e14' };
  if (score >= 40 && score < 60) return { backgroundColor: '#f0ad4e' };
  return {};
}

const fmt$ = (n) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(0)}M`
  : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K`
  : `$${n}`;

function timeAgo(iso) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Assets() {
  const [assets, setAssets]           = useState(mockAssets);
  const [search, setSearch]           = useState('');
  const [category, setCategory]       = useState('All');
  const [criticality, setCriticality] = useState('All');
  const [assetClass, setAssetClass]   = useState('All');
  const [regScope, setRegScope]       = useState('All');
  const [view, setView]               = useState('grid');
  const [addOpen, setAddOpen]         = useState(false);
  const [importOpen, setImportOpen]   = useState(false);
  const [toast, setToast]             = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 5000); };

  const handleAddAsset = (asset) => {
    const full = {
      ...asset,
      asset_class: 'Supporting',
      open_cve_count: 0,
      regulatory_scope: [],
      data_classification: 'Internal',
      business_function: '',
      annual_value: 0,
    };
    setAssets(prev => [full, ...prev]);
    setAddOpen(false);
    showToast(`Asset "${asset.name}" added`);
  };

  const handleImportAssets = (newAssets) => {
    const fullAssets = newAssets.map(a => ({
      ...a,
      asset_class: 'Supporting',
      open_cve_count: 0,
      regulatory_scope: [],
      data_classification: 'Internal',
      business_function: '',
      annual_value: 0,
    }));
    setAssets(prev => [...fullAssets, ...prev]);
    showToast(`${newAssets.length} asset(s) imported`);
  };

  const filtered = assets.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = a.name.toLowerCase().includes(q) || a.owner.toLowerCase().includes(q) || a.ip_address.includes(q);
    const matchCat    = category === 'All'    || a.category === category;
    const matchCrit   = criticality === 'All' || a.criticality === criticality;
    const matchClass  = assetClass === 'All'  || a.asset_class === assetClass;
    const matchReg    = regScope === 'All'    || (a.regulatory_scope ?? []).includes(regScope);
    return matchSearch && matchCat && matchCrit && matchClass && matchReg;
  });

  const stats = {
    total:      assets.length,
    critical:   assets.filter(a => a.criticality === 'Critical').length,
    highRisk:   assets.filter(a => a.risk_score >= 70).length,
    openCVEs:   assets.reduce((s, a) => s + (a.open_cve_count ?? 0), 0),
    totalValue: assets.reduce((s, a) => s + (a.annual_value ?? 0), 0),
  };

  return (
    <div className="progrec-page p-3 p-lg-4">
      {addOpen    && <AddAssetModal onClose={() => setAddOpen(false)} onSubmit={handleAddAsset} />}
      {importOpen && <ImportAssetCSVModal onClose={() => setImportOpen(false)} onImport={handleImportAssets} />}

      {toast && (
        <div className="pg-toast">
          <CheckCircle size={16} color="#4BBF73" />
          <span>{toast}</span>
        </div>
      )}

      {/* Page header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1">Asset Inventory</h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
            {assets.length} assets · Regulatory scope · CVE tracking · Business value
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={() => setImportOpen(true)}
            className="d-flex align-items-center gap-2">
            <Upload size={15} /> Import CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}
            className="d-flex align-items-center gap-2">
            <Plus size={15} /> Add Asset
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Row className="g-3 mb-4">
        {[
          { label: 'Total Assets',      value: stats.total,            cls: 'stat-card-primary', color: '#3B82EC', icon: Server     },
          { label: 'Critical Assets',   value: stats.critical,         cls: 'stat-card-danger',  color: '#d9534f', icon: AlertTriangle },
          { label: 'High Risk',         value: stats.highRisk,         cls: 'stat-card-warning', color: '#fd7e14', icon: Shield     },
          { label: 'Open CVEs',         value: stats.openCVEs,         cls: 'stat-card-warning', color: '#f0ad4e', icon: Tag        },
          { label: 'Total Asset Value', value: fmt$(stats.totalValue), cls: 'stat-card-success', color: '#4BBF73', icon: DollarSign },
        ].map(s => (
          <Col key={s.label} xs={6} md={4} lg="auto" className="flex-lg-fill">
            <Card className={`shadow-sm border h-100 ${s.cls}`}>
              <Card.Body className="py-3 px-3">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <s.icon size={16} color={s.color} />
                  <span className="fw-bold" style={{ fontSize: '1.3rem', color: s.color }}>{s.value}</span>
                </div>
                <div className="text-muted" style={{ fontSize: '0.78rem' }}>{s.label}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <Row className="g-2 mb-3 align-items-center">
        <Col xs={12} md={4}>
          <InputGroup size="sm">
            <InputGroup.Text className="bg-white border-end-0">
              <Search size={14} color="#6c757d" />
            </InputGroup.Text>
            <Form.Control
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search assets, IPs, owners…"
              className="border-start-0 ps-0"
            />
          </InputGroup>
        </Col>
        <Col xs="auto" key="cat">
          <Form.Select size="sm" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(o => <option key={`cat-${o}`} value={o}>{o}</option>)}
          </Form.Select>
        </Col>
        <Col xs="auto" key="crit">
          <Form.Select size="sm" value={criticality} onChange={e => setCriticality(e.target.value)}>
            {CRITICALITIES.map(o => <option key={`crit-${o}`} value={o}>{o}</option>)}
          </Form.Select>
        </Col>
        <Col xs="auto" key="cls">
          <Form.Select size="sm" value={assetClass} onChange={e => setAssetClass(e.target.value)}>
            {CLASSES.map(o => <option key={`cls-${o}`} value={o}>{o}</option>)}
          </Form.Select>
        </Col>
        <Col xs="auto" key="reg">
          <Form.Select size="sm" value={regScope} onChange={e => setRegScope(e.target.value)}>
            {REG_SCOPE.map(o => <option key={`reg-${o}`} value={o}>{o}</option>)}
          </Form.Select>
        </Col>
        <Col xs="auto" className="ms-auto">
          <div className="btn-group btn-group-sm">
            <Button variant={view === 'grid'  ? 'primary'         : 'outline-secondary'} onClick={() => setView('grid')}>Grid</Button>
            <Button variant={view === 'table' ? 'primary'         : 'outline-secondary'} onClick={() => setView('table')}>Table</Button>
          </div>
        </Col>
      </Row>

      {/* Grid view */}
      {view === 'grid' && (
        <Row className="g-3">
          {filtered.map(asset => {
            const a    = asset;
            const Icon = typeIcon(asset.type);
            const dc   = dataClassBadge(a.data_classification ?? '');
            return (
              <Col key={asset.id} md={6} xl={4}>
                <Card className="asset-card shadow-sm h-100"
                  style={{ borderColor: asset.criticality === 'Critical' ? 'rgba(217,83,79,0.25)' : undefined }}>
                  <Card.Body>
                    {/* Header */}
                    <div className="d-flex align-items-start gap-3 mb-3">
                      <div className="d-flex align-items-center justify-content-center rounded flex-shrink-0"
                        style={{ width: 40, height: 40, ...critIconStyle(asset.criticality) }}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <h6 className="fw-semibold mb-0 text-truncate">{asset.name}</h6>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{asset.type} · {asset.location}</div>
                      </div>
                      <div className="d-flex flex-column align-items-end gap-1">
                        <Badge bg={critVariant(asset.criticality)} style={critStyle(asset.criticality)}>
                          {asset.criticality}
                        </Badge>
                        {a.asset_class && (
                          <span className="badge rounded-pill" style={assetClassStyle(a.asset_class)}>{a.asset_class}</span>
                        )}
                      </div>
                    </div>

                    {/* Risk score */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.75rem' }}>
                        <span className="text-muted">Risk Score</span>
                        <span className="text-muted">{asset.owner}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <ProgressBar now={asset.risk_score} variant={riskVariant(asset.risk_score)}
                          style={{ height: 6, flex: 1, borderRadius: 99, ...riskStyle(asset.risk_score) }} />
                        <span className="fw-bold" style={{
                          fontSize: '0.78rem', width: 24, textAlign: 'right',
                          color: asset.risk_score >= 80 ? '#d9534f' : asset.risk_score >= 60 ? '#fd7e14' : asset.risk_score >= 40 ? '#f0ad4e' : '#4BBF73',
                        }}>{asset.risk_score}</span>
                      </div>
                    </div>

                    {/* CVE + data class */}
                    <div className="d-flex flex-wrap gap-1 mb-2">
                      {a.open_cve_count > 0 && (
                        <Badge bg="danger" className="fw-semibold">{a.open_cve_count} CVE{a.open_cve_count !== 1 ? 's' : ''}</Badge>
                      )}
                      {asset.vulnerability_count > 0 && (
                        <Badge bg="warning" className="fw-normal" style={{ color: '#212529' }}>{asset.vulnerability_count} vulns</Badge>
                      )}
                      {a.data_classification && (
                        <Badge bg={dc.bg} className="fw-normal"
                          style={dc.bg === 'light' ? { color: '#6c757d', border: '1px solid #dee2e6' } : {}}>
                          {dc.label}
                        </Badge>
                      )}
                    </div>

                    {/* Regulatory scope */}
                    {(a.regulatory_scope ?? []).length > 0 && (
                      <div className="d-flex flex-wrap gap-1 mb-2">
                        {(a.regulatory_scope ?? []).map(r => (
                          <span key={r} className="badge rounded-pill"
                            style={{ background: '#f4f7f9', color: '#6c757d', border: '1px solid #dee2e6', fontSize: '0.68rem', fontWeight: 400 }}>{r}</span>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-2"
                      style={{ fontSize: '0.75rem' }}>
                      <span className="text-muted font-monospace">{asset.ip_address}</span>
                      <div className="d-flex align-items-center gap-2">
                        {a.annual_value > 0 && (
                          <span className="fw-medium" style={{ color: '#4BBF73' }}>{fmt$(a.annual_value)}</span>
                        )}
                        <span className="text-muted">Scanned {timeAgo(asset.last_scanned_at)}</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
          {filtered.length === 0 && (
            <Col xs={12}>
              <Card className="shadow-sm">
                <Card.Body className="py-5 text-center text-muted">No assets match current filters.</Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* Table view */}
      {view === 'table' && (
        <Card className="shadow-sm">
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle" style={{ fontSize: '0.83rem' }}>
              <thead className="table-light">
                <tr>
                  {['Asset', 'Type / Class', 'Criticality', 'Risk Score', 'Open CVEs', 'Data Class', 'Regulatory Scope', 'Annual Value', 'Last Scanned'].map(h => (
                    <th key={h} className="text-uppercase fw-semibold text-muted px-3 py-2 border-bottom"
                      style={{ fontSize: '0.7rem', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(asset => {
                  const a  = asset;
                  const dc = dataClassBadge(a.data_classification ?? '');
                  return (
                    <tr key={asset.id} className="border-bottom">
                      <td className="px-3 py-2">
                        <div className="fw-medium">{asset.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{asset.owner} · {asset.location}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-muted">{asset.type}</div>
                        {a.asset_class && (
                          <span className="badge rounded-pill" style={assetClassStyle(a.asset_class)}>{a.asset_class}</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Badge bg={critVariant(asset.criticality)} style={critStyle(asset.criticality)}>
                          {asset.criticality}
                        </Badge>
                      </td>
                      <td className="px-3 py-2" style={{ minWidth: 100 }}>
                        <div className="d-flex align-items-center gap-2">
                          <ProgressBar now={asset.risk_score} variant={riskVariant(asset.risk_score)}
                            style={{ height: 6, flex: 1, borderRadius: 99, ...riskStyle(asset.risk_score) }} />
                          <span className="fw-bold" style={{
                            fontSize: '0.75rem', width: 22,
                            color: asset.risk_score >= 80 ? '#d9534f' : asset.risk_score >= 60 ? '#fd7e14' : asset.risk_score >= 40 ? '#f0ad4e' : '#4BBF73',
                          }}>{asset.risk_score}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={a.open_cve_count > 0 ? 'fw-semibold text-danger' : 'text-muted'}>
                          {a.open_cve_count ?? 0}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {a.data_classification && (
                          <Badge bg={dc.bg} className="fw-normal"
                            style={dc.bg === 'light' ? { color: '#6c757d', border: '1px solid #dee2e6' } : {}}>
                            {dc.label}
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="d-flex flex-wrap gap-1">
                          {(a.regulatory_scope ?? []).map(r => (
                            <span key={r} className="badge rounded-pill"
                              style={{ background: '#f4f7f9', color: '#6c757d', border: '1px solid #dee2e6', fontSize: '0.68rem', fontWeight: 400 }}>{r}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="fw-medium" style={{ color: a.annual_value ? '#4BBF73' : '#adb5bd' }}>
                          {a.annual_value ? fmt$(a.annual_value) : '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted" style={{ whiteSpace: 'nowrap' }}>
                        {timeAgo(asset.last_scanned_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
          {filtered.length === 0 && (
            <div className="py-5 text-center text-muted">No assets match current filters.</div>
          )}
        </Card>
      )}
    </div>
  );
}
