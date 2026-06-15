import { useState } from 'react';
import { Shield, Save, RefreshCw, CheckCircle, AlertTriangle, Eye, EyeOff, ExternalLink, Server, Activity, Zap, Database, Lock, Globe, Info } from 'react-feather';
import { Card, Row, Col, Nav, Form } from 'react-bootstrap';

const PROXY = '/api';
const STORAGE_KEY = 'cyberriskiq_wazuh_config';

const DEFAULT_CONFIG = { host: '', port: '55000', username: '', password: '', enabled: false };

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw);
      if (stored && typeof stored === 'object') {
        // Credentials are never read from the browser — drop any legacy secrets.
        delete stored.username; delete stored.password;
        return { ...DEFAULT_CONFIG, ...stored };
      }
    }
  } catch {}
  return { ...DEFAULT_CONFIG };
}

function saveConfig(cfg) {
  // Never persist credentials in the browser; the API server reads them from
  // environment variables. Only keep non-secret connection preferences.
  const safe = { host: cfg.host, port: cfg.port, enabled: cfg.enabled };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
}

function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ position: 'relative', width: 40, height: 22, borderRadius: 11, background: on ? '#3B82EC' : '#d0d5dd', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 20 : 3, width: 16, height: 16, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left 0.2s' }} />
    </div>
  );
}

export default function Settings() {
  const [config,    setConfig]    = useState(loadConfig);
  const [showPass,  setShowPass]  = useState(false);
  const [conn,      setConn]      = useState({ state: 'idle', message: '' });
  const [saved,     setSaved]     = useState(false);
  const [activeTab, setActiveTab] = useState('wazuh');

  const set = (key, val) => setConfig(c => ({ ...c, [key]: val }));

  const handleSave = () => { saveConfig(config); setSaved(true); setTimeout(() => setSaved(false), 3000); };

  const testConnection = async () => {
    setConn({ state: 'testing', message: 'Testing connection to the Wazuh API…' });
    try {
      const statsRes  = await fetch(`${PROXY}/wazuh/stats`);
      const statsJson = await statsRes.json().catch(() => ({ success: false, error: `HTTP ${statsRes.status}` }));
      if (statsJson.success === false || statsJson.error || !statsJson.data) {
        setConn({ state: 'error', message: statsJson.error || `Could not reach the Wazuh API (HTTP ${statsRes.status})` });
        return;
      }
      setConn({ state: 'success', message: 'Connected successfully', manager: statsJson.data?.manager?.hostname || config.host, agents: statsJson.data?.agents?.active || 0, version: statsJson.data?.manager?.version || '' });
    } catch (err) {
      const msg = err.message;
      setConn({ state: 'error', message: msg.includes('fetch') || msg.includes('Failed') ? 'Cannot reach the Wazuh API service.' : msg });
    }
  };

  const TABS = [
    { id: 'wazuh',         label: 'Wazuh SIEM',    icon: Shield    },
    { id: 'general',       label: 'General',        icon: Database  },
    { id: 'notifications', label: 'Notifications',  icon: Activity  },
  ];

  return (
    <div className="progrec-page p-4 p-lg-5">
      <div style={{ maxWidth: 800 }}>

        {/* Header */}
        <div className="mb-4">
          <h5 className="fw-bold mb-0" style={{ color: '#101828' }}>Platform Settings</h5>
          <span style={{ fontSize: '0.82rem', color: '#667085' }}>Configure integrations, connections and platform preferences</span>
        </div>

        {/* Tab nav */}
        <div className="mb-4" style={{ borderBottom: '1px solid #e4e7ec' }}>
          <Nav variant="tabs" className="border-0">
            {TABS.map(t => (
              <Nav.Item key={t.id}>
                <Nav.Link active={activeTab === t.id} onClick={() => setActiveTab(t.id)}
                  className="d-flex align-items-center gap-2"
                  style={{ fontSize: '0.82rem', fontFamily: 'Poppins,sans-serif', cursor: 'pointer', color: activeTab === t.id ? '#3B82EC' : '#667085' }}>
                  <t.icon size={14} /> {t.label}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </div>

        {/* Wazuh Tab */}
        {activeTab === 'wazuh' && (
          <div className="d-flex flex-column gap-4">

            {/* Info banner */}
            <div className="d-flex align-items-start gap-3 p-3 rounded" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: '0.78rem', color: '#344054', lineHeight: 1.7 }}>
              <Info size={14} color="#3B82EC" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p className="mb-1">CyberRiskIQ connects to Wazuh through the API server, which handles authentication and JWT token caching.</p>
                <p className="mb-1">Credentials are read from environment variables on the server — they are never stored in the browser.</p>
                <p className="mb-0" style={{ color: '#667085' }}>To configure: set <code style={{ background: '#fff', padding: '1px 5px', borderRadius: 4, color: '#3B82EC' }}>WAZUH_HOST</code>, <code style={{ background: '#fff', padding: '1px 5px', borderRadius: 4, color: '#3B82EC' }}>WAZUH_USERNAME</code> and <code style={{ background: '#fff', padding: '1px 5px', borderRadius: 4, color: '#3B82EC' }}>WAZUH_PASSWORD</code>, then restart the API server.</p>
              </div>
            </div>

            {/* Connection config */}
            <Card className="shadow-sm border-0" style={{ borderRadius: 10, overflow: 'hidden' }}>
              <Card.Header className="bg-white d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: '1px solid #e4e7ec' }}>
                <div className="d-flex align-items-center gap-2">
                  <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 32, height: 32, background: '#eff6ff' }}>
                    <Shield size={15} color="#3B82EC" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#101828' }}>Wazuh API Connection</div>
                    <div style={{ fontSize: '0.72rem', color: '#98a2b3' }}>API on port 443</div>
                  </div>
                </div>
                <label className="d-flex align-items-center gap-2" style={{ cursor: 'pointer', fontSize: '0.78rem', color: '#667085' }}>
                  Enable Integration
                  <Toggle on={config.enabled} onChange={v => set('enabled', v)} />
                </label>
              </Card.Header>
              <Card.Body className="p-4">

                {/* Host + Port */}
                <Row className="g-3 mb-3">
                  <Col xs={8}>
                    <Form.Label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.04em' }} className="d-flex align-items-center gap-1 mb-1">
                      <Globe size={11} /> Wazuh Host / IP
                    </Form.Label>
                    <Form.Control value={config.host} onChange={e => set('host', e.target.value)} placeholder="wazuh.example.com" style={{ fontSize: '0.82rem', fontFamily: 'monospace' }} />
                  </Col>
                  <Col xs={4}>
                    <Form.Label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.04em' }} className="mb-1">Port</Form.Label>
                    <Form.Control value={config.port} onChange={e => set('port', e.target.value)} placeholder="443" style={{ fontSize: '0.82rem', fontFamily: 'monospace' }} />
                  </Col>
                </Row>

                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#98a2b3', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Manager API (port 443)</div>
                <Row className="g-3 mb-4">
                  <Col xs={6}>
                    <Form.Label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.04em' }} className="d-flex align-items-center gap-1 mb-1"><Lock size={11} /> API Username</Form.Label>
                    <Form.Control value={config.username} onChange={e => set('username', e.target.value)} placeholder="wazuh" style={{ fontSize: '0.82rem' }} />
                  </Col>
                  <Col xs={6}>
                    <Form.Label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.04em' }} className="d-flex align-items-center gap-1 mb-1"><Lock size={11} /> API Password</Form.Label>
                    <div style={{ position: 'relative' }}>
                      <Form.Control type={showPass ? 'text' : 'password'} value={config.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" style={{ fontSize: '0.82rem', paddingRight: 36 }} />
                      <button onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#98a2b3' }}>
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </Col>
                </Row>

                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#98a2b3', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Indexer API (port 9200) — Vulnerabilities</div>
                <Row className="g-3 mb-4">
                  <Col xs={6}>
                    <Form.Label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.04em' }} className="d-flex align-items-center gap-1 mb-1"><Database size={11} /> Indexer Username</Form.Label>
                    <Form.Control defaultValue="admin" placeholder="admin" style={{ fontSize: '0.82rem' }} />
                  </Col>
                  <Col xs={6}>
                    <Form.Label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.04em' }} className="d-flex align-items-center gap-1 mb-1"><Lock size={11} /> Indexer Password</Form.Label>
                    <Form.Control type="password" placeholder="••••••••" style={{ fontSize: '0.82rem' }} />
                  </Col>
                </Row>

                <div className="mb-4 p-3 rounded" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: '0.75rem', color: '#344054' }}>
                  <strong style={{ color: '#3B82EC' }}>Wazuh 4.8+:</strong> Vulnerabilities moved from the Manager API to the Wazuh Indexer (OpenSearch at port 9200). The indexer uses separate admin credentials.
                </div>
                <div className="p-3 rounded mb-4" style={{ background: '#fffbeb', border: '1px solid #fde68a', fontSize: '0.75rem', color: '#667085' }}>
                  <strong style={{ color: '#f0ad4e' }}>After any change:</strong> Update the <code style={{ background: '#f4f7f9', padding: '1px 5px', borderRadius: 4, color: '#3B82EC' }}>WAZUH_*</code> environment variables and restart the API server.
                </div>

                {/* Action buttons */}
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <button onClick={testConnection} disabled={conn.state === 'testing'} className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2">
                    <RefreshCw size={13} className={conn.state === 'testing' ? 'spin' : ''} />
                    {conn.state === 'testing' ? 'Testing…' : 'Test Connection'}
                  </button>
                  <button onClick={handleSave} className="btn btn-primary btn-sm d-flex align-items-center gap-2">
                    {saved ? <CheckCircle size={13} /> : <Save size={13} />}
                    {saved ? 'Saved!' : 'Save Settings'}
                  </button>
                  {config.host && (
                    <a href={`https://${config.host}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2">
                      <ExternalLink size={13} /> Open Wazuh
                    </a>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Connection result */}
            {conn.state !== 'idle' && (
              <div className="d-flex align-items-start gap-3 p-4 rounded" style={{
                background: conn.state === 'success' ? '#f0fdf4' : conn.state === 'error' ? '#fff5f5' : '#f9fafb',
                border: `1px solid ${conn.state === 'success' ? '#bbf7d0' : conn.state === 'error' ? '#fecaca' : '#e4e7ec'}`,
                fontSize: '0.82rem',
              }}>
                {conn.state === 'testing' && <RefreshCw size={16} className="spin" color="#98a2b3" />}
                {conn.state === 'success' && <CheckCircle size={16} color="#4BBF73" />}
                {conn.state === 'error'   && <AlertTriangle size={16} color="#d9534f" />}
                <div>
                  <div style={{ fontWeight: 600, color: conn.state === 'success' ? '#4BBF73' : conn.state === 'error' ? '#d9534f' : '#667085', marginBottom: 4 }}>
                    {conn.state === 'success' ? 'Wazuh Connected' : conn.state === 'error' ? 'Connection Failed' : 'Testing…'}
                  </div>
                  <div style={{ color: '#667085', fontSize: '0.78rem' }}>{conn.message}</div>
                  {conn.state === 'success' && (
                    <div className="d-flex gap-3 mt-2" style={{ fontSize: '0.75rem', color: '#98a2b3' }}>
                      {conn.manager && <span className="d-flex align-items-center gap-1"><Server size={11} />{conn.manager}</span>}
                      {conn.version && <span>v{conn.version}</span>}
                      {conn.agents !== undefined && <span style={{ color: '#4BBF73' }}>{conn.agents} active agents</span>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Data integration map */}
            <Card className="shadow-sm border-0" style={{ borderRadius: 10 }}>
              <Card.Body className="p-4">
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#101828', marginBottom: 16 }}>Data Integration Map</div>
                <div className="row g-2">
                  {[
                    { wazuh: 'Security Alerts (level ≥ 10)',  app: 'Threat Intelligence',   icon: Activity, color: '#d9534f', status: 'auto'   },
                    { wazuh: 'Monitored Agents',              app: 'Asset Inventory',        icon: Server,   color: '#3B82EC', status: 'auto'   },
                    { wazuh: 'Vulnerability Module',          app: 'Vulnerability Register', icon: Zap,      color: '#fd7e14', status: 'manual' },
                    { wazuh: 'MITRE ATT&CK Mappings',        app: 'Threat Intelligence',    icon: Shield,   color: '#6f42c1', status: 'auto'   },
                    { wazuh: 'SCA Policies',                  app: 'Compliance',             icon: CheckCircle, color: '#4BBF73', status: 'coming' },
                    { wazuh: 'Manager Stats',                 app: 'Dashboard KPIs',         icon: Activity, color: '#3B82EC', status: 'auto'   },
                  ].map(item => (
                    <div key={item.wazuh} className="col-12 col-md-6">
                      <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ background: '#f9fafb', border: '1px solid #e4e7ec' }}>
                        <item.icon size={13} color={item.color} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 500, color: '#344054', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.wazuh}</div>
                          <div style={{ fontSize: '0.68rem', color: '#98a2b3' }}>→ {item.app}</div>
                        </div>
                        <span style={{ fontSize: '0.68rem', padding: '1px 7px', borderRadius: 20, fontWeight: 500, background: item.status === 'auto' ? '#f0fdf4' : item.status === 'manual' ? '#fffbeb' : '#f9fafb', color: item.status === 'auto' ? '#4BBF73' : item.status === 'manual' ? '#f0ad4e' : '#98a2b3', border: `1px solid ${item.status === 'auto' ? '#bbf7d0' : item.status === 'manual' ? '#fde68a' : '#e4e7ec'}` }}>
                          {item.status === 'auto' ? 'Live' : item.status === 'manual' ? 'On-demand' : 'Soon'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

            {/* Setup guide */}
            <Card className="shadow-sm border-0" style={{ borderRadius: 10 }}>
              <Card.Body className="p-4">
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#101828', marginBottom: 14 }}>Quick Setup Guide</div>
                <ol className="ps-0 mb-0" style={{ listStyle: 'none' }}>
                  {[
                    'Set WAZUH_HOST, WAZUH_USERNAME and WAZUH_PASSWORD on the API server (manager API, JWT auth)',
                    'Optionally set WAZUH_INDEXER_USERNAME / WAZUH_INDEXER_PASSWORD for the indexer (port 9200 — vulnerabilities)',
                    'For self-signed internal certificates only, set WAZUH_REJECT_UNAUTHORIZED=false',
                    'Restart the API server so the new environment variables take effect',
                    'Click "Test Connection" above — it will confirm manager API connectivity',
                    'Navigate to Wazuh SIEM in the sidebar — all three tabs load simultaneously',
                  ].map((text, i) => (
                    <li key={i} className="d-flex align-items-start gap-3 mb-2">
                      <span className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 20, height: 20, background: '#eff6ff', color: '#3B82EC', fontSize: '0.68rem', fontWeight: 700, marginTop: 1 }}>{i + 1}</span>
                      <span style={{ fontSize: '0.78rem', color: '#667085', lineHeight: 1.6 }}>{text}</span>
                    </li>
                  ))}
                </ol>
              </Card.Body>
            </Card>
          </div>
        )}

        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="d-flex flex-column gap-4">
            <Card className="shadow-sm border-0" style={{ borderRadius: 10 }}>
              <Card.Body className="p-4 d-flex flex-column gap-3">
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#101828', marginBottom: 4 }}>Platform Preferences</div>
                {[
                  { label: 'Organisation Name',    key: 'org',      val: 'Acme Financial Corp' },
                  { label: 'Default Risk Appetite', key: 'appetite', val: 'Low'                },
                  { label: 'Reporting Currency',    key: 'currency', val: 'USD'                },
                ].map(f => (
                  <div key={f.key}>
                    <Form.Label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.04em' }} className="mb-1">{f.label}</Form.Label>
                    <Form.Control defaultValue={f.val} style={{ fontSize: '0.82rem' }} />
                  </div>
                ))}
              </Card.Body>
            </Card>
            <div className="d-flex justify-content-end">
              <button className="btn btn-primary btn-sm d-flex align-items-center gap-2"><Save size={13} /> Save</button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="d-flex flex-column gap-4">
            <Card className="shadow-sm border-0" style={{ borderRadius: 10 }}>
              <Card.Body className="p-4 d-flex flex-column gap-3">
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#101828', marginBottom: 4 }}>Alert Thresholds</div>
                {[
                  { label: 'Notify on Critical risks',        on: true  },
                  { label: 'Notify on new DORA incidents',    on: true  },
                  { label: 'Notify on Wazuh critical alerts', on: true  },
                  { label: 'Notify on compliance gaps',       on: false },
                  { label: 'Daily digest email',              on: false },
                ].map((n, i) => (
                  <div key={i} className="d-flex align-items-center justify-content-between py-1" style={{ borderBottom: i < 4 ? '1px solid #f4f7f9' : 'none' }}>
                    <span style={{ fontSize: '0.85rem', color: '#344054' }}>{n.label}</span>
                    <Toggle on={n.on} onChange={() => {}} />
                  </div>
                ))}
              </Card.Body>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
