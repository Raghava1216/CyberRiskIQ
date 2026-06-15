import { useState, useEffect, useCallback } from 'react';
import { Shield, Server, Activity, RefreshCw, WifiOff, ExternalLink, AlertTriangle, Zap, Target, Eye, Download, Info, BarChart2, HardDrive, Cpu, Globe, Lock, Users, Wifi } from 'react-feather';
import { Card, Nav } from 'react-bootstrap';

const PROXY = '/api';

interface WazuhStats {
  manager: { version: string; hostname: string; type: string };
  agents:  { active: number; disconnected: number; never_connected: number; pending: number; total: number };
  alerts:  { critical: number; high: number; medium: number; low: number; total: number };
}
interface Agent {
  id: string; name: string; ip: string; os: string; os_name: string;
  arch: string; status: string; wazuh_status: string; version: string;
  last_seen: string; groups: string[]; node: string;
}
interface Alert {
  id: string; rule_id: string; rule_desc: string; rule_level: number;
  rule_groups: string[]; severity: string; agent_id: string; agent_name: string;
  agent_ip: string; timestamp: string; location: string; decoder: string;
  mitre_id: string; mitre_tactic: string; mitre_tech: string; full_log: string;
}
interface Threat {
  id: string; title: string; category: string; severity: string;
  confidence: number; source: string; ioc_value: string;
  first_seen: string; count: number; rule_id: string;
  mitre_id: string; mitre_tactic: string; mitre_tech: string;
  agents: string[]; tags: string[]; description: string;
}
interface MitreTech {
  id: string; tactic: string; technique: string;
  count: number; agents: string[]; severity: string;
}

function timeAgo(iso: string) {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const m  = Math.floor(ms / 60_000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const sevStyle = (s: string) => {
  if (s === 'Critical') return { color: '#d9534f', bg: '#fff5f5', border: '#fecaca' };
  if (s === 'High')     return { color: '#fd7e14', bg: '#fff7ed', border: '#fed7aa' };
  if (s === 'Medium')   return { color: '#f0ad4e', bg: '#fffbeb', border: '#fde68a' };
  return                       { color: '#4BBF73', bg: '#f0fdf4', border: '#bbf7d0' };
};

function SevChip({ s, small }: { s: string; small?: boolean }) {
  const st = sevStyle(s);
  return (
    <span style={{ display: 'inline-block', fontSize: small ? '0.65rem' : '0.72rem', padding: '2px 7px', borderRadius: 6, background: st.bg, color: st.color, border: `1px solid ${st.border}`, fontWeight: 500 }}>{s}</span>
  );
}

function useWazuh<T>(endpoint: string, enabled = true) {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [ts,      setTs]      = useState<Date | null>(null);

  const fetch_ = useCallback(async () => {
    if (!enabled) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${PROXY}${endpoint}`);
      const j = await r.json().catch(() => ({ success: false, error: `HTTP ${r.status}` }));
      if (j.success === false || j.error) {
        setData(null);
        setError(j.error || `Request failed (HTTP ${r.status})`);
      } else {
        setData((j.data ?? j) as T);
        setTs(new Date());
      }
    } catch (e) {
      setData(null);
      setError((e as Error).message.includes('fetch') ? 'Cannot reach the Wazuh API service.' : (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, enabled]);

  useEffect(() => { fetch_(); }, [fetch_]);
  return { data, loading, error, ts, refetch: fetch_ };
}

function SectionCard({
  title, icon: Icon, iconBg, badge, loading, error, refetch, ts, children, action,
}: {
  title: string; icon: React.ElementType; iconBg: string; badge?: number | string;
  loading?: boolean; error?: string | null; refetch?: () => void; ts?: Date | null;
  children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm border-0 h-100" style={{ borderRadius: 10, overflow: 'hidden' }}>
      <Card.Header className="bg-white d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: '1px solid #e4e7ec' }}>
        <div className="d-flex align-items-center gap-2">
          <div className="d-flex align-items-center justify-content-center rounded flex-shrink-0" style={{ width: 30, height: 30, ...iconBgStyle(iconBg) }}>
            <Icon size={14} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#101828' }}>{title}</span>
              {badge !== undefined && <span style={{ fontSize: '0.68rem', padding: '1px 7px', borderRadius: 20, background: '#f4f7f9', border: '1px solid #e4e7ec', color: '#667085' }}>{badge}</span>}
            </div>
            {ts && <div style={{ fontSize: '0.7rem', color: '#98a2b3' }}>Updated {timeAgo(ts.toISOString())}</div>}
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          {action}
          {refetch && (
            <button onClick={refetch} disabled={loading} className="btn btn-sm btn-outline-secondary p-1 border-0" style={{ color: loading ? '#98a2b3' : '#667085' }}>
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
            </button>
          )}
        </div>
      </Card.Header>
      <Card.Body className="p-0" style={{ overflow: 'auto', maxHeight: 440 }}>
        {loading && !ts && (
          <div className="d-flex align-items-center justify-content-center gap-2 py-5" style={{ color: '#98a2b3' }}>
            <RefreshCw size={16} className="spin" color="#3B82EC" />
            <span style={{ fontSize: '0.82rem' }}>Loading from Wazuh…</span>
          </div>
        )}
        {error && (
          <div className="m-3 p-3 rounded d-flex align-items-start gap-2" style={{ background: '#fff5f5', border: '1px solid #fecaca', fontSize: '0.78rem' }}>
            <AlertTriangle size={13} color="#d9534f" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ color: '#d9534f', fontWeight: 600 }}>Failed to load</div>
              <div style={{ color: '#b0b8c4', marginTop: 2 }}>{error}</div>
            </div>
          </div>
        )}
        {!loading && !error && children}
      </Card.Body>
    </Card>
  );
}

function iconBgStyle(spec: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    purple: { background: '#f5f3ff', color: '#6f42c1' },
    red:    { background: '#fff5f5', color: '#d9534f' },
    blue:   { background: '#eff6ff', color: '#3B82EC' },
    green:  { background: '#f0fdf4', color: '#4BBF73' },
    amber:  { background: '#fffbeb', color: '#f0ad4e' },
  };
  return map[spec] ?? map.blue;
}

export default function WazuhPage() {
  const [activeTab,   setActiveTab]   = useState<'threats' | 'secops' | 'servers'>('threats');
  const [alertFilter, setAlertFilter] = useState('All');
  const [agentFilter, setAgentFilter] = useState('All');

  const stats   = useWazuh<WazuhStats>('/wazuh/stats');
  const threats = useWazuh<Threat[]>    ('/wazuh/threats',                       activeTab === 'threats');
  const mitre   = useWazuh<MitreTech[]> ('/wazuh/mitre',                         activeTab === 'threats');
  const alerts  = useWazuh<Alert[]>     ('/wazuh/alerts?limit=200&minLevel=3',    activeTab === 'secops');
  const agents  = useWazuh<Agent[]>     ('/wazuh/agents',                        activeTab === 'servers');
  const sca     = useWazuh<any[]>       ('/wazuh/sca',                           activeTab === 'servers');

  const connected = stats.data !== null;
  const offline   = stats.error !== null;

  const filteredAlerts = (alerts.data || []).filter(a => alertFilter === 'All' || a.severity === alertFilter);
  const alertBySev     = (alerts.data || []).reduce((acc, a) => { acc[a.severity] = (acc[a.severity] || 0) + 1; return acc; }, {} as Record<string, number>);
  const filteredAgents = (agents.data || []).filter(a => agentFilter === 'All' || a.wazuh_status === agentFilter);
  const osCounts       = (agents.data || []).reduce((acc, a) => { const k = a.os.split(' ')[0] || 'Unknown'; acc[k] = (acc[k] || 0) + 1; return acc; }, {} as Record<string, number>);

  const TABS = [
    { id: 'threats', label: 'Threat Intelligence', icon: Target,   count: threats.data?.length },
    { id: 'secops',  label: 'Security Operations', icon: Activity, count: alerts.data?.length  },
    { id: 'servers', label: 'Server Management',   icon: Server,   count: agents.data?.length  },
  ] as const;

  return (
    <div className="progrec-page p-4 p-lg-5">

      {/* Page header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 40, height: 40, background: offline ? '#fff5f5' : connected ? '#f0fdf4' : '#f4f7f9' }}>
            <Shield size={20} color={offline ? '#d9534f' : connected ? '#4BBF73' : '#98a2b3'} />
          </div>
          <div>
            <h5 className="fw-bold mb-0" style={{ color: '#101828' }}>Wazuh SIEM Integration</h5>
            <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.75rem' }}>
              {offline ? (
                <span className="d-flex align-items-center gap-1" style={{ color: '#d9534f' }}><WifiOff size={11} /> Cannot reach Wazuh</span>
              ) : connected ? (
                <span className="d-flex align-items-center gap-1" style={{ color: '#4BBF73' }}>
                  <span className="live-dot" style={{ background: '#4BBF73' }} />
                  Live · {stats.data?.manager?.hostname || 'Wazuh Manager'} · v{stats.data?.manager?.version}
                </span>
              ) : (
                <span className="d-flex align-items-center gap-1" style={{ color: '#98a2b3' }}>
                  <RefreshCw size={11} className="spin" /> Connecting…
                </span>
              )}
              {connected && <><span style={{ color: '#e4e7ec' }}>·</span><span style={{ color: '#98a2b3' }}>{stats.data?.agents?.active || 0} agents active</span></>}
            </div>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button onClick={stats.refetch} disabled={stats.loading} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2">
            <RefreshCw size={13} className={stats.loading ? 'spin' : ''} /> Refresh all
          </button>
          {stats.data?.manager?.hostname && (
            <a href={`https://${stats.data.manager.hostname}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2">
              <ExternalLink size={13} /> Open Wazuh
            </a>
          )}
        </div>
      </div>

      {/* Offline banner */}
      {offline && (
        <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: 10, border: '1px solid #fecaca !important', background: '#fff5f5' }}>
          <Card.Body className="p-4">
            <div className="d-flex align-items-start gap-3">
              <AlertTriangle size={16} color="#d9534f" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, color: '#d9534f', fontSize: '0.88rem', marginBottom: 6 }}>Wazuh not reachable</div>
                <code style={{ fontSize: '0.75rem', background: '#f9fafb', border: '1px solid #e4e7ec', padding: '4px 10px', borderRadius: 6, color: '#344054', display: 'block', marginBottom: 12 }}>{stats.error}</code>
                <div style={{ fontSize: '0.78rem', color: '#667085' }}>
                  <div className="fw-semibold mb-2" style={{ color: '#344054' }}>How to fix:</div>
                  <ol className="mb-0 ps-3" style={{ lineHeight: 2 }}>
                    <li>Credentials are correct — the issue is <strong style={{ color: '#f0ad4e' }}>user permissions</strong></li>
                    <li>The configured API user needs an <code style={{ background: '#f4f7f9', padding: '1px 6px', borderRadius: 4, color: '#3B82EC' }}>agents_admin</code> or <code style={{ background: '#f4f7f9', padding: '1px 6px', borderRadius: 4, color: '#3B82EC' }}>readonly</code> role in Wazuh</li>
                    <li>Minimum: <code style={{ background: '#f4f7f9', padding: '1px 6px', borderRadius: 4, color: '#3B82EC' }}>agents_admin</code> + <code style={{ background: '#f4f7f9', padding: '1px 6px', borderRadius: 4, color: '#3B82EC' }}>events_reader</code></li>
                  </ol>
                </div>
                <button onClick={() => stats.refetch()} disabled={stats.loading} className="btn btn-sm mt-3 d-flex align-items-center gap-2" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#f0ad4e' }}>
                  <RefreshCw size={12} className={stats.loading ? 'spin' : ''} /> Retry Connection
                </button>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* KPI strip */}
      {stats.data && (
        <div className="row g-3 mb-4">
          {[
            { label: 'Active Agents',   value: stats.data.agents.active,      accent: '#4BBF73', cls: 'stat-card-success' },
            { label: 'Disconnected',    value: stats.data.agents.disconnected, accent: '#d9534f', cls: 'stat-card-danger'  },
            { label: 'Critical Alerts', value: stats.data.alerts.critical,     accent: '#d9534f', cls: 'stat-card-danger'  },
            { label: 'High Alerts',     value: stats.data.alerts.high,         accent: '#fd7e14', cls: 'stat-card-warning' },
            { label: 'Medium Alerts',   value: stats.data.alerts.medium,       accent: '#f0ad4e', cls: 'stat-card-warning' },
            { label: 'Total Alerts',    value: stats.data.alerts.total,        accent: '#667085', cls: ''                  },
            { label: 'Total Agents',    value: stats.data.agents.total || (stats.data.agents.active + stats.data.agents.disconnected), accent: '#3B82EC', cls: 'stat-card-primary' },
          ].map(k => (
            <div key={k.label} className="col-6 col-sm-4 col-md-3 col-xl">
              <Card className={`border shadow-sm h-100 ${k.cls}`} style={{ borderRadius: 10 }}>
                <Card.Body className="p-3">
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: k.accent, fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
                  <div style={{ fontSize: '0.72rem', color: '#667085' }}>{k.label}</div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Tab bar */}
      <div className="mb-4" style={{ borderBottom: '1px solid #e4e7ec' }}>
        <Nav variant="tabs" className="border-0">
          {TABS.map(t => (
            <Nav.Item key={t.id}>
              <Nav.Link active={activeTab === t.id} onClick={() => setActiveTab(t.id)}
                className="d-flex align-items-center gap-2"
                style={{ fontSize: '0.82rem', fontFamily: 'Poppins,sans-serif', cursor: 'pointer', color: activeTab === t.id ? '#3B82EC' : '#667085' }}>
                <t.icon size={14} />
                {t.label}
                {t.count !== undefined && (
                  <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: 20, background: activeTab === t.id ? '#eff6ff' : '#f4f7f9', color: activeTab === t.id ? '#3B82EC' : '#98a2b3', border: '1px solid #e4e7ec' }}>{t.count}</span>
                )}
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>
      </div>

      {/* TAB 1: Threat Intelligence */}
      {activeTab === 'threats' && (
        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <SectionCard title="MITRE ATT&CK Techniques" icon={Target} iconBg="purple" badge={mitre.data?.length} loading={mitre.loading} error={mitre.error} refetch={mitre.refetch} ts={mitre.ts}>
              {mitre.data && mitre.data.length === 0 && <div className="py-5 text-center" style={{ color: '#98a2b3' }}>No MITRE ATT&CK mappings found in recent alerts.</div>}
              {mitre.data && mitre.data.length > 0 && (
                <div className="p-4 d-flex flex-column gap-3">
                  {mitre.data.slice(0, 20).map(m => {
                    const st = sevStyle(m.severity);
                    const pct = Math.min(100, (m.count / (mitre.data![0]?.count || 1)) * 100);
                    return (
                      <div key={m.id}>
                        <div className="d-flex align-items-center gap-3">
                          <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', background: '#eff6ff', color: '#3B82EC', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: 4, width: 90, textAlign: 'center', flexShrink: 0 }}>{m.id}</span>
                          <div style={{ flex: 1 }}>
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <span style={{ fontSize: '0.78rem', color: '#344054', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.technique || m.tactic}</span>
                              <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-2">
                                <SevChip s={m.severity} small />
                                <span style={{ fontSize: '0.72rem', color: '#98a2b3' }}>{m.count}×</span>
                              </div>
                            </div>
                            <div style={{ height: 6, background: '#f0f0f0', borderRadius: 999, overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: 999, background: st.color + '99', width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#98a2b3', marginLeft: 114, marginTop: 2 }}>{m.tactic} · {m.agents.slice(0,3).join(', ')}{m.agents.length > 3 ? ` +${m.agents.length-3}` : ''}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="col-12 col-lg-5">
            <SectionCard
              title="Active Threat Groups" icon={Eye} iconBg="red"
              badge={threats.data?.length} loading={threats.loading} error={threats.error} refetch={threats.refetch} ts={threats.ts}
              action={
                <button onClick={() => { threats.data?.forEach(t => { window.dispatchEvent(new CustomEvent('wazuh-ioc', { detail: { id: t.id, type: t.ioc_value?.includes('.') ? 'IP' : 'Host', value: t.ioc_value, severity: t.severity, source: 'Wazuh', tags: t.tags, description: t.description } })); }); }}
                  className="btn btn-sm d-flex align-items-center gap-1" style={{ fontSize: '0.72rem', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3B82EC' }}>
                  <Download size={11} /> Export IOCs
                </button>
              }
            >
              {threats.data && threats.data.length === 0 && <div className="py-5 text-center" style={{ color: '#98a2b3' }}>No high-severity threats detected.</div>}
              {threats.data && threats.data.length > 0 && (
                <div>
                  {threats.data.slice(0, 12).map(t => (
                    <div key={t.id} className="px-4 py-3" style={{ borderBottom: '1px solid #f4f7f9' }}>
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-1">
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#344054', lineHeight: 1.3, flex: 1 }}>{t.title}</span>
                        <SevChip s={t.severity} small />
                      </div>
                      {t.mitre_id && (
                        <div className="d-flex gap-1 mb-1">
                          <span style={{ fontSize: '0.65rem', background: '#f5f3ff', color: '#6f42c1', border: '1px solid #ddd6fe', borderRadius: 4, padding: '1px 5px' }}>{t.mitre_id}</span>
                          {t.mitre_tactic && <span style={{ fontSize: '0.65rem', color: '#98a2b3' }}>{t.mitre_tactic}</span>}
                        </div>
                      )}
                      <div style={{ fontSize: '0.7rem', color: '#98a2b3' }}>{t.source} · {timeAgo(t.first_seen)} · {t.count}×</div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {/* TAB 2: Security Operations */}
      {activeTab === 'secops' && (
        <div className="row g-4">
          {/* Alert severity breakdown */}
          {alerts.data && alerts.data.length > 0 && (
            <div className="col-12">
              <div className="row g-3 mb-2">
                {['Critical','High','Medium','Low'].map(sev => {
                  const st = sevStyle(sev);
                  return (
                    <div key={sev} className="col-6 col-md-3">
                      <Card className="shadow-sm border-0" style={{ borderRadius: 10, borderLeft: `3px solid ${st.color}` }}>
                        <Card.Body className="p-3">
                          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: st.color }}>{alertBySev[sev] || 0}</div>
                          <div style={{ fontSize: '0.75rem', color: '#667085' }}>{sev} Alerts</div>
                        </Card.Body>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="col-12">
            <SectionCard title="Live Security Alerts" icon={Zap} iconBg="red" badge={filteredAlerts.length} loading={alerts.loading} error={alerts.error} refetch={alerts.refetch} ts={alerts.ts}
              action={
                <select value={alertFilter} onChange={e => setAlertFilter(e.target.value)} className="form-select form-select-sm" style={{ fontSize: '0.75rem', width: 'auto' }}>
                  {['All','Critical','High','Medium','Low'].map(s => <option key={s}>{s}</option>)}
                </select>
              }
            >
              {filteredAlerts.length === 0 && !alerts.loading && <div className="py-5 text-center" style={{ color: '#98a2b3' }}>No alerts match the filter.</div>}
              {filteredAlerts.slice(0, 50).map(a => {
                const st = sevStyle(a.severity);
                return (
                  <div key={a.id} className="d-flex align-items-start gap-3 px-4 py-3" style={{ borderBottom: '1px solid #f4f7f9' }}>
                    <SevChip s={a.severity} small />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', color: '#344054', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.rule_desc}</div>
                      <div style={{ fontSize: '0.7rem', color: '#98a2b3' }}>Level {a.rule_level} · {a.agent_name} ({a.agent_ip}) · {timeAgo(a.timestamp)}</div>
                      {a.mitre_id && <span style={{ fontSize: '0.65rem', background: '#f5f3ff', color: '#6f42c1', border: '1px solid #ddd6fe', borderRadius: 4, padding: '1px 5px', display: 'inline-block', marginTop: 2 }}>{a.mitre_id} {a.mitre_tech}</span>}
                    </div>
                    <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#98a2b3', flexShrink: 0 }}>R:{a.rule_id}</span>
                  </div>
                );
              })}
            </SectionCard>
          </div>
        </div>
      )}

      {/* TAB 3: Server Management */}
      {activeTab === 'servers' && (
        <div className="row g-4">
          {/* OS breakdown */}
          {Object.keys(osCounts).length > 0 && (
            <div className="col-12">
              <div className="d-flex flex-wrap gap-2 mb-4">
                {Object.entries(osCounts).map(([os, count]) => (
                  <span key={os} style={{ fontSize: '0.78rem', padding: '4px 12px', borderRadius: 20, background: '#f4f7f9', border: '1px solid #e4e7ec', color: '#344054', fontWeight: 500 }}>
                    {os}: <strong>{count}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="col-12">
            <SectionCard title="Agent Inventory" icon={Server} iconBg="blue" badge={filteredAgents.length} loading={agents.loading} error={agents.error} refetch={agents.refetch} ts={agents.ts}
              action={
                <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)} className="form-select form-select-sm" style={{ fontSize: '0.75rem', width: 'auto' }}>
                  {['All','Active','Disconnected','Never connected'].map(s => <option key={s}>{s}</option>)}
                </select>
              }
            >
              {filteredAgents.length === 0 && !agents.loading && <div className="py-5 text-center" style={{ color: '#98a2b3' }}>No agents match the filter.</div>}
              {filteredAgents.map(a => {
                const isActive = a.wazuh_status === 'Active' || a.status === 'active';
                return (
                  <div key={a.id} className="d-flex align-items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #f4f7f9' }}>
                    <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 8, height: 8, background: isActive ? '#4BBF73' : '#d9534f' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#344054' }}>{a.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#98a2b3' }}>{a.ip} · {a.os}</div>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <div style={{ fontSize: '0.72rem', color: isActive ? '#4BBF73' : '#d9534f', fontWeight: 500 }}>{a.wazuh_status}</div>
                      <div style={{ fontSize: '0.68rem', color: '#98a2b3' }}>v{a.version}</div>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#98a2b3', textAlign: 'right', flexShrink: 0 }}>{timeAgo(a.last_seen)}</div>
                  </div>
                );
              })}
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}
