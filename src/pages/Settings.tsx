import { useState, useEffect } from 'react';
import {
  Shield, Save, RefreshCw, CheckCircle2, AlertTriangle,
  Eye, EyeOff, ExternalLink, Wifi, WifiOff, Server,
  Activity, Zap, Database, Lock, Globe, Info,
} from 'lucide-react';

const PROXY = 'http://localhost:3001';

// Stored in localStorage so settings persist across sessions
const STORAGE_KEY = 'cyberriskiq_wazuh_config';

interface WazuhConfig {
  host:     string;
  port:     string;
  username: string;
  password: string;
  enabled:  boolean;
}

function loadConfig(): WazuhConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    host:     '192.168.1.212',
    port:     '55000',
    username: 'wazuh',
    password: '',
    enabled:  false,
  };
}

function saveConfig(cfg: WazuhConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

interface ConnectionStatus {
  state:    'idle' | 'testing' | 'success' | 'error';
  message:  string;
  manager?: string;
  agents?:  number;
  version?: string;
}

export default function Settings() {
  const [config,      setConfig]      = useState<WazuhConfig>(loadConfig);
  const [showPass,    setShowPass]    = useState(false);
  const [conn,        setConn]        = useState<ConnectionStatus>({ state: 'idle', message: '' });
  const [saved,       setSaved]       = useState(false);
  const [activeTab,   setActiveTab]   = useState<'wazuh' | 'general' | 'notifications'>('wazuh');

  const set = <K extends keyof WazuhConfig>(key: K, val: WazuhConfig[K]) =>
    setConfig(c => ({ ...c, [key]: val }));

  const handleSave = () => {
    saveConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const testConnection = async () => {
    setConn({ state: 'testing', message: 'Running port probe and auth test…' });
    try {
      // First run diagnostics to get clear port/auth info
      const diagRes  = await fetch(`${PROXY}/wazuh/diagnose`);
      if (!diagRes.ok) throw new Error(`Proxy not running (HTTP ${diagRes.status}). Start it: node threat-proxy.cjs`);
      const diagJson = await diagRes.json();
      const summary  = diagJson.results?.summary || [];
      const fix      = diagJson.fix || '';

      // Check if auth succeeded
      const authOk = diagJson.results?.auth?.success;
      if (!authOk) {
        const authErr = summary.find((s: string) => s.includes('credentials') || s.includes('401') || s.includes('cannot reach') || s.includes('Cannot reach'));
        setConn({
          state:   'error',
          message: (authErr || fix || summary.join(' | ') || 'Could not authenticate with Wazuh'),
        });
        return;
      }

      // Auth worked — now get actual stats
      const statsRes  = await fetch(`${PROXY}/wazuh/stats`);
      const statsJson = await statsRes.json();

      setConn({
        state:   'success',
        message: fix || 'Connected successfully',
        manager: statsJson.data?.manager?.hostname || config.host,
        agents:  statsJson.data?.agents?.active || 0,
        version: statsJson.data?.manager?.version || diagJson.results?.manager?.[diagJson.results?.auth?.port]?.version || '',
      });
    } catch (err) {
      const msg = (err as Error).message;
      setConn({
        state:   'error',
        message: msg.includes('fetch') || msg.includes('Failed')
          ? 'Cannot reach proxy. Run: node threat-proxy.cjs in your project directory.'
          : msg,
      });
    }
  };

  const TABS = [
    { id: 'wazuh',         label: 'Wazuh SIEM',    icon: Shield    },
    { id: 'general',       label: 'General',        icon: Database  },
    { id: 'notifications', label: 'Notifications',  icon: Activity  },
  ] as const;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl">

      {/* Header */}
      <div>
        <h2 className="text-slate-100 font-bold text-xl">Platform Settings</h2>
        <p className="text-slate-500 text-sm">Configure integrations, connections and platform preferences</p>
      </div>

      {/* Tab nav */}
      <div className="flex border-b border-slate-700 gap-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === t.id
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>
            <t.icon size={15} />{t.label}
          </button>
        ))}
      </div>

      {/* ── Wazuh Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'wazuh' && (
        <div className="space-y-6">

          {/* Info banner */}
          <div className="flex items-start gap-3 bg-cyan-500/8 border border-cyan-500/20 rounded-xl p-4 text-sm">
            <Info size={15} className="text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="text-slate-400 text-xs leading-relaxed space-y-1">
              <p>CyberRiskIQ connects to Wazuh through the local proxy (<code className="text-cyan-400">threat-proxy.cjs</code>).</p>
              <p>The proxy handles authentication and HTTPS certificate bypass for internal networks.</p>
              <p className="text-slate-500">
                To update credentials: edit <code className="text-cyan-400">WAZUH_CONFIG</code> in <code className="text-cyan-400">threat-proxy.cjs</code>, then restart the proxy.
              </p>
            </div>
          </div>

          {/* Connection config card */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                  <Shield size={16} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-slate-100 font-semibold text-sm">Wazuh API Connection</h3>
                  <p className="text-slate-500 text-xs">API on port 55000</p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-slate-400">Enable Integration</span>
                <div
                  onClick={() => set('enabled', !config.enabled)}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${config.enabled ? 'bg-cyan-500' : 'bg-slate-600'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${config.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </label>
            </div>

            <div className="p-5 space-y-4">
              {/* Host + Port */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Globe size={12} /> Wazuh Host / IP
                  </label>
                  <input
                    value={config.host}
                    onChange={e => set('host', e.target.value)}
                    placeholder="192.168.1.212"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500 transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Port</label>
                  <input
                    value={config.port}
                    onChange={e => set('port', e.target.value)}
                    placeholder="55000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500 transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Manager API Credentials */}
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest pt-1">Manager API (port 55000)</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Lock size={12} /> API Username
                  </label>
                  <input
                    value={config.username}
                    onChange={e => set('username', e.target.value)}
                    placeholder="wazuh"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Lock size={12} /> API Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={config.password}
                      onChange={e => set('password', e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 pr-10 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500 transition-colors"
                    />
                    <button
                      onClick={() => setShowPass(s => !s)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Indexer credentials — needed for vulnerabilities (4.8+) */}
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest pt-2">Indexer API (port 9200) — Vulnerabilities</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Database size={12} /> Indexer Username
                  </label>
                  <input
                    defaultValue="admin"
                    placeholder="admin"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Lock size={12} /> Indexer Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>
              <div className="bg-blue-500/8 border border-blue-500/15 rounded-lg px-4 py-2.5 text-xs text-blue-400/80 leading-relaxed">
                <strong className="text-blue-400">Wazuh 4.8+:</strong> Vulnerabilities moved from the Manager API to the Wazuh Indexer (OpenSearch at port 9200). The indexer uses separate admin credentials — usually <code className="bg-slate-800 px-1">admin</code> / the password set during Wazuh installation.
              </div>

              {/* Important note */}
              <div className="space-y-2">
                <div className="bg-amber-500/8 border border-amber-500/20 rounded-lg px-4 py-3 text-xs text-amber-400/80 leading-relaxed space-y-1.5">
                  <p><strong className="text-amber-300">API port is 55000</strong> — confirmed responding. The issue is credentials.</p>
                  <p><strong className="text-amber-300">These are NOT your dashboard login.</strong> Find the API user in Wazuh:<br/>
                  <em>Server Management → Settings → API</em> — the username is shown there.</p>
                  <p>To find/reset the password on your Wazuh server terminal:<br/>
                  <code className="bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded">sudo cat /etc/wazuh-indexer/opensearch.yml</code><br/>
                  or use the Wazuh password tool to reset all credentials.</p>
                </div>
                <div className="bg-amber-500/8 border border-amber-500/20 rounded-lg px-4 py-3 text-xs text-amber-400/80 leading-relaxed">
                  <strong className="text-amber-400">After any change:</strong> Update <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400">WAZUH</code> in <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400">threat-proxy.cjs</code> and restart: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400">node threat-proxy.cjs</code>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button onClick={testConnection} disabled={conn.state === 'testing'}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-colors disabled:opacity-50">
                  <RefreshCw size={14} className={conn.state === 'testing' ? 'animate-spin' : ''} />
                  {conn.state === 'testing' ? 'Testing…' : 'Test Connection'}
                </button>
                <button onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 text-sm font-semibold transition-colors">
                  {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
                  {saved ? 'Saved!' : 'Save Settings'}
                </button>
                <a href="https://192.168.1.212" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition-colors">
                  <ExternalLink size={13} /> Open Wazuh
                </a>
              </div>
            </div>
          </div>

          {/* Connection result */}
          {conn.state !== 'idle' && (
            <div className={`flex items-start gap-3 rounded-xl p-4 border text-sm ${
              conn.state === 'testing' ? 'bg-slate-800/50 border-slate-700/50' :
              conn.state === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
              'bg-red-500/10 border-red-500/20'
            }`}>
              {conn.state === 'testing' && <RefreshCw size={16} className="animate-spin text-slate-400 mt-0.5 flex-shrink-0" />}
              {conn.state === 'success' && <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />}
              {conn.state === 'error'   && <AlertTriangle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />}
              <div>
                <p className={`font-medium ${
                  conn.state === 'success' ? 'text-emerald-300' :
                  conn.state === 'error'   ? 'text-red-300'     : 'text-slate-300'
                }`}>
                  {conn.state === 'success' ? 'Wazuh Connected' :
                   conn.state === 'error'   ? 'Connection Failed' : 'Testing…'}
                </p>
                <p className="text-xs mt-0.5 text-slate-400">{conn.message}</p>
                {conn.state === 'success' && (
                  <div className="flex gap-4 mt-2 text-xs text-slate-400">
                    {conn.manager && <span><Server size={11} className="inline mr-1" />{conn.manager}</span>}
                    {conn.version && <span>v{conn.version}</span>}
                    {conn.agents !== undefined && <span className="text-emerald-400">{conn.agents} active agents</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Data integration map */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h4 className="text-slate-300 font-medium text-sm mb-4">Data Integration Map</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { wazuh: 'Security Alerts (level ≥ 10)',  app: 'Threat Intelligence',   icon: Activity, color: 'text-red-400',     status: 'auto' },
                { wazuh: 'Monitored Agents',              app: 'Asset Inventory',        icon: Server,   color: 'text-cyan-400',    status: 'auto' },
                { wazuh: 'Vulnerability Module',          app: 'Vulnerability Register', icon: Zap,      color: 'text-orange-400',  status: 'manual' },
                { wazuh: 'MITRE ATT&CK Mappings',        app: 'Threat Intelligence',    icon: Shield,   color: 'text-purple-400',  status: 'auto' },
                { wazuh: 'SCA Policies',                  app: 'Compliance',             icon: CheckCircle2, color: 'text-emerald-400', status: 'coming' },
                { wazuh: 'Manager Stats',                 app: 'Dashboard KPIs',         icon: Activity, color: 'text-blue-400',    status: 'auto' },
              ].map(item => (
                <div key={item.wazuh} className="flex items-center gap-3 bg-slate-900/50 rounded-lg px-3 py-2.5">
                  <item.icon size={14} className={item.color} />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 text-xs font-medium truncate">{item.wazuh}</p>
                    <p className="text-slate-600 text-xs">→ {item.app}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border ${
                    item.status === 'auto'   ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    item.status === 'manual' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'       :
                    'bg-slate-700/50 text-slate-500 border-slate-600'
                  }`}>
                    {item.status === 'auto' ? 'Live' : item.status === 'manual' ? 'On-demand' : 'Soon'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick setup guide */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h4 className="text-slate-300 font-medium text-sm mb-3">Quick Setup Guide</h4>
            <ol className="space-y-2.5 text-xs text-slate-400">
              {[
                { step: '1', text: 'Open threat-proxy.cjs and find the WAZUH config block near the top' },
                { step: '2', text: 'Set manager credentials: username / password (used for JWT auth at port 443)' },
                { step: '3', text: 'Set indexer credentials: indexer_user / indexer_pass (admin at port 9200 — needed for vulnerabilities)' },
                { step: '4', text: 'Run: node threat-proxy.cjs in a terminal and keep it running' },
                { step: '5', text: 'Click "Test Connection" above — it will confirm manager API connectivity' },
                { step: '6', text: 'Navigate to Wazuh SIEM in the sidebar — all three tabs load simultaneously' },
              ].map(s => (
                <li key={s.step} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold text-xs">{s.step}</span>
                  <span className="leading-relaxed">{s.text}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* ── General Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'general' && (
        <div className="space-y-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-4">
            <h3 className="text-slate-200 font-semibold text-sm">Platform Preferences</h3>
            {[
              { label: 'Organisation Name',   key: 'org',      val: 'Acme Financial Corp', type: 'text'   },
              { label: 'Default Risk Appetite', key: 'appetite', val: 'Low',               type: 'text'   },
              { label: 'Reporting Currency',   key: 'currency', val: 'USD',                type: 'text'   },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">{f.label}</label>
                <input defaultValue={f.val} type={f.type}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-cyan-500 transition-colors" />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 text-sm font-semibold transition-colors">
              <Save size={14} /> Save
            </button>
          </div>
        </div>
      )}

      {/* ── Notifications Tab ─────────────────────────────────────────────── */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-4">
            <h3 className="text-slate-200 font-semibold text-sm">Alert Thresholds</h3>
            {[
              { label: 'Notify on Critical risks',       on: true  },
              { label: 'Notify on new DORA incidents',   on: true  },
              { label: 'Notify on Wazuh critical alerts',on: true  },
              { label: 'Notify on compliance gaps',      on: false },
              { label: 'Daily digest email',             on: false },
            ].map(n => (
              <div key={n.label} className="flex items-center justify-between py-1">
                <span className="text-slate-300 text-sm">{n.label}</span>
                <div className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${n.on ? 'bg-cyan-500' : 'bg-slate-600'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${n.on ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
