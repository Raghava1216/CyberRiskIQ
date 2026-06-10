/**
 * WazuhPage.tsx  —  CyberRiskIQ Wazuh Integration Hub
 *
 * Three panels surfaced from your internal Wazuh instance at 192.168.1.212:
 *   1. Threat Intelligence  — MITRE ATT&CK mappings, active threat groups, IOCs
 *   2. Security Operations  — Live security alerts, rule firing summary, severity breakdown
 *   3. Server Management    — Agent inventory, OS breakdown, connection health
 *
 * HOW TO USE:
 *   1. Copy to src/pages/WazuhPage.tsx
 *   2. Add route in App.tsx:  <Route path="/wazuh" element={<WazuhPage />} />
 *   3. Add nav item in Sidebar pointing to /wazuh
 *   4. Make sure node threat-proxy.cjs is running
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield, Server, Activity, RefreshCw, Wifi, WifiOff, ExternalLink,
  AlertTriangle, CheckCircle2, Zap, ChevronRight, Loader2, Target,
  Eye, TrendingUp, Clock, Filter, Download, Info, BarChart2,
  HardDrive, Cpu, Globe, Lock, Users,
} from 'lucide-react';

const PROXY = '/api';

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const m  = Math.floor(ms / 60_000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function sevColor(s: string) {
  if (s === 'Critical') return { text: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/25'     };
  if (s === 'High')     return { text: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/25'  };
  if (s === 'Medium')   return { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25'   };
  return                       { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' };
}

function SevBadge({ s, small }: { s: string; small?: boolean }) {
  const c = sevColor(s);
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded border font-semibold ${c.text} ${c.bg} ${c.border} ${small ? 'text-[10px]' : 'text-xs'}`}>
      {s}
    </span>
  );
}

// ── Hook: fetches one Wazuh endpoint ─────────────────────────────────────────

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
      // Always parse JSON — proxy now returns 200 with empty data on permission errors
      const j = await r.json().catch(() => ({ success: false, data: [], error: `HTTP ${r.status}` }));
      if (!j.success && j.error && !j.data) {
        setError(j.error);
      } else {
        // Use data even if success=false — may have partial data or empty array
        setData((j.data ?? j) as T);
        setTs(new Date());
      }
    } catch (e) {
      setError((e as Error).message.includes('fetch') ? 'Proxy not running — start: node threat-proxy.cjs' : (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, enabled]);

  useEffect(() => { fetch_(); }, [fetch_]);
  return { data, loading, error, ts, refetch: fetch_ };
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title, icon: Icon, iconColor, badge, loading, error, refetch, ts, children, action,
}: {
  title: string; icon: any; iconColor: string; badge?: number | string;
  loading?: boolean; error?: string | null; refetch?: () => void; ts?: Date | null;
  children: React.ReactNode | React.ReactNode[]; action?: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
            <Icon size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-slate-100 font-semibold text-sm">{title}</h3>
              {badge !== undefined && (
                <span className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full tabular-nums">{badge}</span>
              )}
            </div>
            {ts && <p className="text-slate-600 text-xs">Updated {timeAgo(ts.toISOString())}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {action}
          {refetch && (
            <button onClick={refetch} disabled={loading}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-40">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {loading && !ts && (
          <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
            <Loader2 size={18} className="animate-spin text-cyan-500" />
            <span className="text-sm">Loading from Wazuh…</span>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-3 m-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs">
            <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-medium">Failed to load</p>
              <p className="text-red-400/70 mt-0.5">{error}</p>
            </div>
          </div>
        )}
        {!loading && !error && children}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function WazuhPage() {

  const [activeTab, setActiveTab] = useState<'threats' | 'secops' | 'servers'>('threats');
  const [alertFilter, setAlertFilter] = useState('All');
  const [agentFilter, setAgentFilter] = useState('All');

  // Connection status
  const stats   = useWazuh<WazuhStats>('/wazuh/stats');

  // Tab data — only fetch when tab is active
  const threats = useWazuh<Threat[]>    ('/wazuh/threats',         activeTab === 'threats');
  const mitre   = useWazuh<MitreTech[]> ('/wazuh/mitre',           activeTab === 'threats');
  const alerts  = useWazuh<Alert[]>     ('/wazuh/alerts?limit=200&minLevel=3', activeTab === 'secops');
  const agents  = useWazuh<Agent[]>     ('/wazuh/agents',          activeTab === 'servers');
  const sca     = useWazuh<any[]>       ('/wazuh/sca',             activeTab === 'servers');

  const connected = stats.data !== null;
  const offline   = stats.error !== null;

  // ── Derived alert data ────────────────────────────────────────────────────

  const filteredAlerts = (alerts.data || []).filter(a =>
    alertFilter === 'All' || a.severity === alertFilter
  );

  const alertBySev = (alerts.data || []).reduce(
    (acc, a) => { acc[a.severity] = (acc[a.severity] || 0) + 1; return acc; },
    {} as Record<string, number>
  );

  // ── Derived agent data ────────────────────────────────────────────────────

  const filteredAgents = (agents.data || []).filter(a =>
    agentFilter === 'All' || a.wazuh_status === agentFilter
  );

  const osCounts = (agents.data || []).reduce((acc, a) => {
    const key = a.os.split(' ')[0] || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // ── Tabs ──────────────────────────────────────────────────────────────────

  const TABS = [
    { id: 'threats', label: 'Threat Intelligence', icon: Target,   count: threats.data?.length },
    { id: 'secops',  label: 'Security Operations', icon: Activity, count: alerts.data?.length  },
    { id: 'servers', label: 'Server Management',   icon: Server,   count: agents.data?.length  },
  ] as const;

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-screen-2xl">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            offline ? 'bg-red-500/15' : connected ? 'bg-emerald-500/15' : 'bg-slate-700/60'
          }`}>
            <Shield size={20} className={offline ? 'text-red-400' : connected ? 'text-emerald-400' : 'text-slate-500'} />
          </div>
          <div>
            <h2 className="text-slate-100 font-bold text-xl">Wazuh SIEM Integration</h2>
            <div className="flex items-center gap-2 text-xs">
              {offline ? (
                <span className="flex items-center gap-1 text-red-400"><WifiOff size={11} /> Cannot reach Wazuh</span>
              ) : connected ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live · {stats.data?.manager.hostname || '192.168.1.212'} · v{stats.data?.manager.version}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-slate-500"><Loader2 size={11} className="animate-spin" /> Connecting…</span>
              )}
              {connected && (
                <>
                  <span className="text-slate-700">·</span>
                  <span className="text-slate-500">{stats.data?.agents.active || 0} agents active</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={stats.refetch} disabled={stats.loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm transition-colors disabled:opacity-50">
            <RefreshCw size={13} className={stats.loading ? 'animate-spin' : ''} /> Refresh all
          </button>
          <a href="https://192.168.1.212" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-cyan-400 text-sm transition-colors">
            <ExternalLink size={13} /> Open Wazuh
          </a>
        </div>
      </div>

      {/* ── Proxy error banner ──────────────────────────────────────────── */}
      {offline && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <p className="text-red-300 font-semibold text-sm">Wazuh not reachable</p>
              <p className="text-slate-400 text-xs font-mono bg-slate-900/60 px-3 py-2 rounded-lg">{stats.error}</p>

              <div className="text-xs text-slate-400 space-y-1.5 pt-1">
                <p className="font-medium text-slate-300">How to fix:</p>
                <div className="space-y-1 ml-2">
                  <p>① Credentials are correct — the issue is <strong className="text-amber-300">user permissions</strong></p>
                  <p>② User <code className="bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded">pramod</code> needs the <code className="bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded">agents_admin</code> or <code className="bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded">readonly</code> role in Wazuh</p>
                  <p>③ Ask your Wazuh admin: <em>Server Management → Security → Users → pramod → assign role</em></p>
                  <p>④ Minimum roles needed: <code className="bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded">agents_admin</code> + <code className="bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded">events_reader</code></p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1 flex-wrap">
                <button
                  onClick={async () => {
                    try {
                      const r = await fetch('http://localhost:3001/wazuh/diagnose');
                      const j = await r.json();
                      alert(`DIAGNOSE RESULT:\n\n${j.results?.summary?.join('\n') ?? ''}\n\nFIX: ${j.fix ?? ''}`);
                    } catch (e) {
                      alert('Proxy not running. Start it first: node threat-proxy.cjs');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/25 transition-colors"
                >
                  <Activity size={12} /> Run Diagnosis
                </button>
                <span className="text-slate-600 text-xs">Probes all candidate ports and shows exact error</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Top KPI strip ───────────────────────────────────────────────── */}
      {stats.data && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Active Agents',    value: stats.data.agents.active,       color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Disconnected',     value: stats.data.agents.disconnected,  color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20'         },
            { label: 'Critical Alerts',  value: stats.data.alerts.critical,      color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20'         },
            { label: 'High Alerts',      value: stats.data.alerts.high,          color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20'   },
            { label: 'Medium Alerts',    value: stats.data.alerts.medium,        color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'     },
            { label: 'Total Alerts',     value: stats.data.alerts.total,         color: 'text-slate-200',   bg: 'bg-slate-700/40 border-slate-600'        },
            { label: 'Total Agents',     value: stats.data.agents.total || stats.data.agents.active + stats.data.agents.disconnected,
                                                                                  color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/20'       },
          ].map(k => (
            <div key={k.label} className={`rounded-xl border p-3 ${k.bg}`}>
              <p className={`text-2xl font-bold tabular-nums ${k.color}`}>{k.value}</p>
              <p className="text-slate-500 text-xs">{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-700 gap-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === t.id
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>
            <t.icon size={15} />
            {t.label}
            {t.count !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full tabular-nums ${
                activeTab === t.id ? 'bg-cyan-500/15 text-cyan-400' : 'bg-slate-700 text-slate-400'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
           TAB 1 — THREAT INTELLIGENCE
         ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'threats' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* MITRE ATT&CK heatmap — wide */}
          <div className="lg:col-span-3">
            <Section
              title="MITRE ATT&CK Techniques Observed"
              icon={Target} iconColor="bg-purple-500/15 text-purple-400"
              badge={mitre.data?.length}
              loading={mitre.loading} error={mitre.error}
              refetch={mitre.refetch} ts={mitre.ts}
            >
              {mitre.data && mitre.data.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-10">No MITRE ATT&CK mappings found in recent alerts.</p>
              )}
              {mitre.data && mitre.data.length > 0 && (
                <div className="p-4 space-y-2 max-h-[420px] overflow-y-auto">
                  {mitre.data.slice(0, 20).map(m => {
                    const c = sevColor(m.severity);
                    const pct = Math.min(100, (m.count / (mitre.data![0]?.count || 1)) * 100);
                    return (
                      <div key={m.id} className="group">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded w-24 text-center flex-shrink-0">
                            {m.id}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-slate-300 text-xs truncate">{m.technique || m.tactic}</span>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <SevBadge s={m.severity} small />
                                <span className="text-slate-500 text-xs tabular-nums">{m.count}×</span>
                              </div>
                            </div>
                            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${c.bg.replace('/10','/60')}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                        <p className="text-slate-600 text-xs ml-28 mt-0.5">{m.tactic} · {m.agents.slice(0,3).join(', ')}{m.agents.length > 3 ? ` +${m.agents.length-3}` : ''}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>
          </div>

          {/* Active threat groups — narrow */}
          <div className="lg:col-span-2">
            <Section
              title="Active Threat Groups"
              icon={Eye} iconColor="bg-red-500/15 text-red-400"
              badge={threats.data?.length}
              loading={threats.loading} error={threats.error}
              refetch={threats.refetch} ts={threats.ts}
              action={
                <button
                  onClick={() => {
                    if (!threats.data) return;
                    // Push to IOC store via custom event
                    threats.data.forEach(t => {
                      window.dispatchEvent(new CustomEvent('wazuh-ioc', { detail: {
                        id: t.id, type: t.ioc_value?.includes('.') ? 'IP' : 'Host',
                        value: t.ioc_value, severity: t.severity, source: 'Wazuh',
                        tags: t.tags, description: t.description,
                      }}));
                    });
                  }}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded border border-cyan-500/20 hover:bg-cyan-500/10 transition-colors"
                >
                  <Download size={11} /> Export IOCs
                </button>
              }
            >
              {threats.data && threats.data.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-10">No high-severity threats detected.</p>
              )}
              {threats.data && threats.data.length > 0 && (
                <div className="divide-y divide-slate-800/60 max-h-[420px] overflow-y-auto">
                  {threats.data.slice(0, 12).map(t => (
                    <div key={t.id} className="px-4 py-3 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-slate-200 text-xs font-medium leading-snug flex-1">{t.title}</p>
                        <SevBadge s={t.severity} small />
                      </div>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {t.mitre_id && (
                          <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded">{t.mitre_id}</span>
                        )}
                        {t.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-xs bg-slate-700/50 text-slate-400 border border-slate-600/50 px-1.5 py-0.5 rounded">{tag}</span>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>{t.agents.slice(0,2).join(', ')}{t.agents.length>2?` +${t.agents.length-2}`:''}</span>
                        <span>{t.count}× · {timeAgo(t.first_seen)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
           TAB 2 — SECURITY OPERATIONS
         ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'secops' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Alert severity breakdown */}
          <div className="lg:col-span-1 space-y-5">

            {/* Severity breakdown card */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 size={15} className="text-cyan-400" />
                <h3 className="text-slate-200 font-semibold text-sm">Alert Breakdown</h3>
              </div>
              {['Critical','High','Medium','Low'].map(s => {
                const count = alertBySev[s] || 0;
                const total = alerts.data?.length || 1;
                const pct   = Math.round((count / total) * 100);
                const c     = sevColor(s);
                return (
                  <div key={s}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={c.text}>{s}</span>
                      <span className="text-slate-400 tabular-nums">{count}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.bg.replace('/10','/70')}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <p className="text-slate-600 text-xs pt-1">Total: {alerts.data?.length || 0} events</p>
            </div>

            {/* Top agents by alert count */}
            {alerts.data && alerts.data.length > 0 && (() => {
              const agMap: Record<string, number> = {};
              alerts.data.forEach(a => { agMap[a.agent_name] = (agMap[a.agent_name]||0) + 1; });
              const top = Object.entries(agMap).sort((a,b)=>b[1]-a[1]).slice(0,8);
              return (
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={14} className="text-orange-400" />
                    <h3 className="text-slate-200 font-semibold text-sm">Top Alerting Agents</h3>
                  </div>
                  <div className="space-y-2">
                    {top.map(([name, count]) => (
                      <div key={name} className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-mono truncate flex-1">{name}</span>
                        <span className="text-orange-400 font-bold ml-2 tabular-nums">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Live alert feed */}
          <div className="lg:col-span-2">
            <Section
              title="Live Security Alerts"
              icon={Activity} iconColor="bg-red-500/15 text-red-400"
              badge={filteredAlerts.length}
              loading={alerts.loading} error={alerts.error}
              refetch={alerts.refetch} ts={alerts.ts}
              action={
                <div className="flex gap-1.5">
                  {['All','Critical','High','Medium','Low'].map(s => (
                    <button key={s} onClick={() => setAlertFilter(s)}
                      className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                        alertFilter === s
                          ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                          : 'border-slate-700 text-slate-500 hover:text-slate-300'
                      }`}>{s}</button>
                  ))}
                </div>
              }
            >
              <div className="divide-y divide-slate-800/60 max-h-[520px] overflow-y-auto">
                {filteredAlerts.slice(0, 50).map(a => (
                  <div key={a.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-800/30 transition-colors">
                    {/* Level pill */}
                    <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold mt-0.5 ${sevColor(a.severity).bg} ${sevColor(a.severity).text}`}>
                      {a.rule_level}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-slate-200 text-xs font-medium">{a.rule_desc}</p>
                        {a.mitre_id && (
                          <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1 py-0.5 rounded">{a.mitre_id}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-slate-600">
                        <span className="text-slate-400">{a.agent_name}</span>
                        {a.agent_ip && <span>{a.agent_ip}</span>}
                        {a.decoder && <span>{a.decoder}</span>}
                        <span className="text-slate-600">{timeAgo(a.timestamp)}</span>
                      </div>
                      {a.full_log && (
                        <p className="text-slate-700 text-xs mt-1 font-mono truncate">{a.full_log}</p>
                      )}
                    </div>
                    <SevBadge s={a.severity} small />
                  </div>
                ))}
                {filteredAlerts.length === 0 && !alerts.loading && (
                  <p className="text-slate-500 text-sm text-center py-12">No alerts match the current filter.</p>
                )}
              </div>
            </Section>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
           TAB 3 — SERVER MANAGEMENT
         ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'servers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left column: summary cards */}
          <div className="space-y-4">

            {/* Agent status breakdown */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-cyan-400" />
                <h3 className="text-slate-200 font-semibold text-sm">Agent Status</h3>
              </div>
              {stats.data && (
                <div className="space-y-2">
                  {[
                    { label: 'Active',           val: stats.data.agents.active,           color: 'bg-emerald-500' },
                    { label: 'Disconnected',      val: stats.data.agents.disconnected,     color: 'bg-red-500'     },
                    { label: 'Never Connected',   val: stats.data.agents.never_connected || 0, color: 'bg-slate-600' },
                    { label: 'Pending',           val: stats.data.agents.pending || 0,     color: 'bg-amber-500'   },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-2 text-xs">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.color}`} />
                      <span className="text-slate-400 flex-1">{s.label}</span>
                      <span className="text-slate-200 font-bold tabular-nums">{s.val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* OS breakdown */}
            {agents.data && agents.data.length > 0 && (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Cpu size={14} className="text-blue-400" />
                  <h3 className="text-slate-200 font-semibold text-sm">OS Breakdown</h3>
                </div>
                <div className="space-y-2">
                  {Object.entries(osCounts).sort((a,b)=>(b[1] as number)-(a[1] as number)).map(([os, cnt]) => (
                    <div key={os} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{os}</span>
                      <span className="text-slate-200 font-bold tabular-nums">{cnt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SCA summary */}
            {sca.data && sca.data.length > 0 && (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Lock size={14} className="text-emerald-400" />
                  <h3 className="text-slate-200 font-semibold text-sm">Security Config Assessment</h3>
                </div>
                <div className="space-y-3">
                  {sca.data.slice(0, 5).map((s, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 truncate flex-1">{s.agent_name}</span>
                        <span className={`font-bold ml-2 ${
                          (s.score||0) >= 80 ? 'text-emerald-400' : (s.score||0) >= 50 ? 'text-amber-400' : 'text-red-400'
                        }`}>{s.score ?? '—'}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${
                          (s.score||0) >= 80 ? 'bg-emerald-500' : (s.score||0) >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`} style={{ width: `${s.score || 0}%` }} />
                      </div>
                      <p className="text-slate-600 text-xs mt-0.5">{s.name} · {s.pass}✓ {s.fail}✗</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Agent inventory table */}
          <div className="lg:col-span-2">
            <Section
              title="Monitored Agent Inventory"
              icon={Server} iconColor="bg-cyan-500/15 text-cyan-400"
              badge={filteredAgents.length}
              loading={agents.loading} error={agents.error}
              refetch={agents.refetch} ts={agents.ts}
              action={
                <div className="flex gap-1.5">
                  {['All','active','disconnected'].map(f => (
                    <button key={f} onClick={() => setAgentFilter(f)}
                      className={`text-xs px-2 py-1 rounded-lg border transition-colors capitalize ${
                        agentFilter === f
                          ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                          : 'border-slate-700 text-slate-500 hover:text-slate-300'
                      }`}>{f}</button>
                  ))}
                </div>
              }
            >
              <div className="overflow-x-auto max-h-[540px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-800/90 backdrop-blur">
                    <tr className="border-b border-slate-700/50">
                      {['Status','Name','IP Address','OS','Groups','Version','Last Seen'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredAgents.map(a => (
                      <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${a.wazuh_status === 'active' ? 'bg-emerald-500 shadow-emerald-500/50 shadow-sm' : 'bg-red-500'}`} />
                            <span className={a.wazuh_status === 'active' ? 'text-emerald-400' : 'text-red-400'}>{a.wazuh_status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-200 font-medium">{a.name}</p>
                          <p className="text-slate-600 font-mono">ID: {a.id}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400">{a.ip}</td>
                        <td className="px-4 py-3">
                          <p className="text-slate-300">{a.os.split(' ').slice(0,2).join(' ')}</p>
                          {a.arch && <p className="text-slate-600">{a.arch}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {(a.groups || []).slice(0,2).map(g => (
                              <span key={g} className="text-slate-500 bg-slate-700/40 px-1.5 py-0.5 rounded border border-slate-700/50">{g}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500">{a.version}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{timeAgo(a.last_seen)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredAgents.length === 0 && !agents.loading && (
                  <p className="text-slate-500 text-sm text-center py-12">No agents match the filter.</p>
                )}
              </div>
            </Section>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-700 pt-2">
        <span>Data sourced from Wazuh REST API via local proxy at localhost:3001</span>
        <a href="https://192.168.1.212" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
          Open full Wazuh dashboard <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
}
