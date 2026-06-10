/**
 * WazuhWidget.tsx — compact Wazuh live-status widget
 * Drop into any page that wants a Wazuh data panel.
 * Requires: node threat-proxy.cjs running on localhost:3001
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Shield, WifiOff, RefreshCw, Server, AlertTriangle,
  Activity, ExternalLink, CheckCircle2, Loader2, Zap,
  ChevronDown, ChevronUp,
} from 'lucide-react';

const PROXY = 'http://localhost:3001';

export interface WazuhStats {
  manager: { version: string; hostname: string; type: string };
  agents:  { active: number; disconnected: number; never_connected: number; total: number };
  alerts:  { critical: number; high: number; medium: number; low: number; total: number };
}

interface WazuhWidgetProps {
  mode:       'threats' | 'assets' | 'vulnerabilities' | 'dashboard';
  onDataLoad?: (data: any) => void;
  compact?:   boolean;
}

function timeAgo(iso: string) {
  if (!iso) return '—';
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function sevColor(s: string) {
  if (s === 'Critical') return 'text-red-400 bg-red-500/10 border-red-500/20';
  if (s === 'High')     return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
  if (s === 'Medium')   return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
}

export default function WazuhWidget({ mode, onDataLoad, compact = false }: WazuhWidgetProps) {
  const [connected,  setConnected]  = useState<boolean | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [expanded,   setExpanded]   = useState(!compact);
  const [stats,      setStats]      = useState<WazuhStats | null>(null);
  const [agents,     setAgents]     = useState<any[]>([]);
  const [threats,    setThreats]    = useState<any[]>([]);
  const [vulns,      setVulns]      = useState<any[]>([]);
  const [error,      setError]      = useState<string | null>(null);
  const [lastFetch,  setLastFetch]  = useState<Date | null>(null);
  const [diagResult, setDiagResult] = useState<string | null>(null);

  const runDiagnose = async () => {
    setDiagResult('Running…');
    try {
      const r = await fetch(`${PROXY}/wazuh/diagnose`);
      const j = await r.json();
      const summary = j.results?.summary?.join('\n') || 'No result';
      setDiagResult(`${j.fix}\n\n${summary}`);
    } catch {
      setDiagResult('Cannot reach proxy. Make sure node threat-proxy.cjs is running.');
    }
  };

  const fetchWazuh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDiagResult(null);

    try {
      const statsRes = await fetch(`${PROXY}/wazuh/stats`);
      // Proxy always returns 200 now — even on permission errors
      if (statsRes.status !== 200 && statsRes.status !== undefined) {
        throw new Error(`Proxy not running (HTTP ${statsRes.status}) — run: node threat-proxy.cjs`);
      }
      const statsJson = await statsRes.json().catch(() => ({ success: false, error: 'Invalid response from proxy' }));

      if (!statsJson.success && !statsJson.data) {
        setConnected(false);
        setError(statsJson.error || 'Wazuh API unreachable');
        return;
      }

      setConnected(true);
      setStats(statsJson.data);

      const fetches: Promise<void>[] = [];

      if (mode === 'assets' || mode === 'dashboard') {
        fetches.push(
          fetch(`${PROXY}/wazuh/agents`).then(r => r.json()).then(j => {
            if (j.success) setAgents(j.data || []);
          }).catch(() => {})
        );
      }

      if (mode === 'threats' || mode === 'dashboard') {
        fetches.push(
          fetch(`${PROXY}/wazuh/threats`).then(r => r.json()).then(j => {
            if (j.success) setThreats(j.data || []);
          }).catch(() => {})
        );
      }

      if (mode === 'vulnerabilities' || mode === 'dashboard') {
        fetches.push(
          fetch(`${PROXY}/wazuh/vulnerabilities`).then(r => r.json()).then(j => {
            if (j.success) setVulns(j.data || []);
          }).catch(() => {})
        );
      }

      await Promise.all(fetches);
      setLastFetch(new Date());
      onDataLoad?.({ stats: statsJson.data, agents, threats, vulns });

    } catch (e) {
      setConnected(false);
      const msg = (e as Error).message;
      setError(msg.includes('fetch') || msg.includes('NetworkError') || msg.includes('Failed to fetch')
        ? 'Proxy not running — open a terminal and run: node threat-proxy.cjs'
        : msg
      );
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => { fetchWazuh(); }, [fetchWazuh]);

  // ── Compact header bar ────────────────────────────────────────────────────

  const headerBar = (
    <div className="flex items-center justify-between px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl">
      <div className="flex items-center gap-3">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
          connected === true  ? 'bg-emerald-500/15' :
          connected === false ? 'bg-red-500/15'     : 'bg-slate-700/50'
        }`}>
          <Shield size={14} className={
            connected === true  ? 'text-emerald-400' :
            connected === false ? 'text-red-400'     : 'text-slate-500'
          } />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-slate-200 font-medium text-sm">Wazuh SIEM</span>
            {connected === true && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
            )}
            {connected === false && (
              <span className="flex items-center gap-1 text-xs text-red-400">
                <WifiOff size={10} /> Offline
              </span>
            )}
            {connected === null && <span className="text-xs text-slate-500">Connecting…</span>}
          </div>
          {stats && (
            <p className="text-slate-500 text-xs">{stats.agents.active} agents · {stats.alerts.total} alerts</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {lastFetch && <span className="text-slate-600 text-xs">{timeAgo(lastFetch.toISOString())}</span>}
        <button onClick={fetchWazuh} disabled={loading}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-40">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
        {compact && (
          <button onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>
    </div>
  );

  if (!expanded && compact) return headerBar;

  return (
    <div className="space-y-3">
      {headerBar}

      {/* Error state — clean, no hardcoded ports */}
      {error && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-300 font-medium text-sm">Wazuh unreachable</p>
              <p className="text-slate-400 text-xs font-mono bg-slate-900/60 px-2 py-1.5 rounded mt-1">{error}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <button onClick={runDiagnose}
                  className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg hover:bg-amber-500/20 transition-colors">
                  <Activity size={11} /> Run Diagnosis
                </button>
                <button onClick={fetchWazuh}
                  className="flex items-center gap-1.5 text-xs text-slate-400 border border-slate-700 px-2.5 py-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                  <RefreshCw size={11} /> Retry
                </button>
                <a href="https://192.168.1.212" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-cyan-400 transition-colors">
                  Open Wazuh <ExternalLink size={10} />
                </a>
              </div>
              {diagResult && (
                <pre className="text-xs text-slate-300 bg-slate-900/80 px-3 py-2 rounded-lg mt-2 whitespace-pre-wrap border border-slate-700/50">
                  {diagResult}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && !stats && (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
          <Loader2 size={18} className="animate-spin text-cyan-500" />
          <span className="text-sm">Connecting to Wazuh…</span>
        </div>
      )}

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Active Agents',   value: stats.agents.active,      c: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Disconnected',    value: stats.agents.disconnected, c: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20'         },
            { label: 'Critical Alerts', value: stats.alerts.critical,     c: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20'         },
            { label: 'Total Alerts',    value: stats.alerts.total,        c: 'text-slate-300',   bg: 'bg-slate-700/40 border-slate-600'        },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-3 ${s.bg}`}>
              <p className={`text-2xl font-bold tabular-nums ${s.c}`}>{s.value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Threats */}
      {(mode === 'threats' || mode === 'dashboard') && threats.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-2">
            <Activity size={14} className="text-red-400" />
            <span className="text-slate-200 font-medium text-sm">Live Alerts</span>
            <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">{threats.length}</span>
          </div>
          <div className="divide-y divide-slate-800/60 max-h-56 overflow-y-auto">
            {threats.slice(0, 8).map((t: any) => (
              <div key={t.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-800/30">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded border flex-shrink-0 mt-0.5 ${sevColor(t.severity)}`}>
                  {t.severity.slice(0, 4)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-xs font-medium truncate">{t.title}</p>
                  <p className="text-slate-600 text-xs">{t.agents?.slice(0,2).join(', ')} · {t.count}× · {timeAgo(t.first_seen)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agents */}
      {(mode === 'assets' || mode === 'dashboard') && agents.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-2">
            <Server size={14} className="text-cyan-400" />
            <span className="text-slate-200 font-medium text-sm">Monitored Agents</span>
            <span className="text-xs bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded">{agents.length}</span>
          </div>
          <div className="divide-y divide-slate-800/60 max-h-48 overflow-y-auto">
            {agents.slice(0, 6).map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/30">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.wazuh_status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-xs font-medium">{a.name}</p>
                  <p className="text-slate-500 text-xs">{a.ip} · {a.os}</p>
                </div>
                <span className="text-slate-600 text-xs">{timeAgo(a.last_seen)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vulnerabilities */}
      {mode === 'vulnerabilities' && vulns.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-orange-400" />
              <span className="text-slate-200 font-medium text-sm">Vulnerabilities from Wazuh</span>
              <span className="text-xs bg-orange-500/15 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded">{vulns.length}</span>
            </div>
            <button onClick={() => window.dispatchEvent(new CustomEvent('wazuh-vulns', { detail: vulns }))}
              className="flex items-center gap-1 text-xs text-cyan-400 border border-cyan-500/20 px-2 py-1 rounded hover:bg-cyan-500/10 transition-colors">
              <CheckCircle2 size={11} /> Import All
            </button>
          </div>
          <div className="divide-y divide-slate-800/60 max-h-48 overflow-y-auto">
            {vulns.slice(0, 6).map((v: any) => (
              <div key={v.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/30">
                <span className={`text-xs font-bold w-8 tabular-nums ${
                  v.cvss_score >= 9 ? 'text-red-400' : v.cvss_score >= 7 ? 'text-orange-400' : 'text-amber-400'
                }`}>{v.cvss_score.toFixed(1)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-xs font-mono">{v.cve_id}</p>
                  <p className="text-slate-500 text-xs truncate">{v.title} · {v.asset}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manager footer */}
      {stats?.manager && (
        <div className="flex items-center gap-2 text-xs text-slate-600 px-1 flex-wrap">
          <span>Wazuh {stats.manager.version}</span>
          <span>·</span>
          <span>{stats.manager.hostname}</span>
          <span>·</span>
          <a href="https://192.168.1.212" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
            Open Dashboard <ExternalLink size={10} />
          </a>
        </div>
      )}
    </div>
  );
}
