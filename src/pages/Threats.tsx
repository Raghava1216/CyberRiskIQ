import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, ChevronDown, ExternalLink, Radio, RefreshCw, AlertTriangle, Wifi, WifiOff, X, Pause, Play, Activity, CheckCircle2 } from 'lucide-react';
import { mockThreats, mockThreatActors } from '../lib/mockData';
import SeverityBadge from '../components/SeverityBadge';
import AddIOCModal from '../components/AddIOCModal';
import type { IOC } from '../lib/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
//const FEEDS_URL = `${SUPABASE_URL}/functions/v1/threat-feeds`;
const FEEDS_URL = 'http://localhost:3001/threat-feeds';

const LIVE_POLL_INTERVAL = 60_000; // re-fetch every 60s when live feed panel is open

const CATEGORIES = ['All', 'APT', 'Ransomware', 'Malware', 'Phishing', 'Botnet', 'RAT', 'Loader', 'DDoS', 'Insider', 'Supply Chain'];
const STATUSES = ['All', 'Active', 'Investigating', 'Mitigated', 'Closed'];
const SOURCES = ['All', 'Live Feed', 'Manual'];


interface LiveThreat {
  id: string;
  title: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: string;
  confidence: number;
  source: string;
  ioc_type: string;
  ioc_value: string;
  first_seen: string;
  last_seen: string;
  tags: string[];
  malware_family?: string;
  reporter?: string;
}

function IOCBadge({ type, value }: { type: string; value: string }) {
  const colors: Record<string, string> = {
    IP: 'bg-red-500/10 text-red-400 border-red-500/20',
    Domain: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Hash: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    URL: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Email: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    IOC: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded border ${colors[type] ?? colors.IOC}`}>
      <span className="font-sans text-xs opacity-60">{type}:</span>
      <span className="truncate max-w-[160px]">{value}</span>
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-500' : 'bg-orange-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-8">{value}%</span>
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function severityColor(s: string) {
  if (s === 'Critical') return 'text-red-400';
  if (s === 'High') return 'text-orange-400';
  if (s === 'Medium') return 'text-amber-400';
  return 'text-emerald-400';
}

function severityDot(s: string) {
  if (s === 'Critical') return 'bg-red-500';
  if (s === 'High') return 'bg-orange-500';
  if (s === 'Medium') return 'bg-amber-500';
  return 'bg-emerald-500';
}

// --- Live Feed Drawer ---
interface LiveFeedDrawerProps {
  onClose: () => void;
  initialThreats: LiveThreat[];
  loading: boolean;
  fetchError: string | null;
  onRefresh: () => void;
}

function LiveFeedDrawer({ onClose, initialThreats, loading, fetchError, onRefresh }: LiveFeedDrawerProps) {
  const [paused, setPaused] = useState(false);
  const [streamLog, setStreamLog] = useState<LiveThreat[]>(initialThreats);
  const [newCount, setNewCount] = useState(0);
  const [countdown, setCountdown] = useState(LIVE_POLL_INTERVAL / 1000);
  const logRef = useRef<HTMLDivElement>(null);
  const prevIds = useRef<Set<string>>(new Set(initialThreats.map((t) => t.id)));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll to top when new items arrive
  useEffect(() => {
    if (logRef.current && !paused) {
      logRef.current.scrollTop = 0;
    }
  }, [streamLog.length, paused]);

  // Merge incoming threats (new ones bubble to top)
  useEffect(() => {
    if (initialThreats.length === 0) return;
    setStreamLog((prev) => {
      const prevMap = new Map(prev.map((t) => [t.id, t]));
      let added = 0;
      for (const t of initialThreats) {
        if (!prevMap.has(t.id)) { added++; prevIds.current.add(t.id); }
        prevMap.set(t.id, t);
      }
      if (added > 0 && !paused) setNewCount((n) => n + added);
      return [...initialThreats, ...prev.filter((t) => !initialThreats.find((x) => x.id === t.id))];
    });
  }, [initialThreats, paused]);

  // Countdown timer + auto-poll
  const startCountdown = useCallback(() => {
    setCountdown(LIVE_POLL_INTERVAL / 1000);
    if (cdRef.current) clearInterval(cdRef.current);
    cdRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) return LIVE_POLL_INTERVAL / 1000;
        return c - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (paused) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cdRef.current) clearInterval(cdRef.current);
      return;
    }
    startCountdown();
    timerRef.current = setInterval(() => {
      onRefresh();
      startCountdown();
    }, LIVE_POLL_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cdRef.current) clearInterval(cdRef.current);
    };
  }, [paused, onRefresh, startCountdown]);

  const clearNew = () => setNewCount(0);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer panel */}
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-700 flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15">
              <Activity size={16} className="text-emerald-400" />
              {!paused && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />}
            </div>
            <div>
              <h2 className="text-slate-100 font-semibold text-sm">Live Threat Feed</h2>
              <p className="text-slate-500 text-xs">ThreatFox · URLhaus · abuse.ch</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setPaused((p) => !p); clearNew(); }}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                paused
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                  : 'border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {paused ? <><Play size={12} /> Resume</> : <><Pause size={12} /> Pause</>}
            </button>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-800/50 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            {loading ? (
              <span className="flex items-center gap-1.5 text-slate-400">
                <RefreshCw size={12} className="animate-spin" /> Fetching...
              </span>
            ) : fetchError ? (
              <span className="flex items-center gap-1.5 text-red-400">
                <WifiOff size={12} /> Feed error
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Wifi size={12} /> Connected
              </span>
            )}
            <span className="text-slate-600">·</span>
            <span className="text-slate-500">{streamLog.length} indicators loaded</span>
          </div>
          <div className="flex items-center gap-2">
            {newCount > 0 && (
              <button onClick={clearNew} className="flex items-center gap-1 bg-cyan-500/15 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20 hover:bg-cyan-500/25 transition-colors">
                +{newCount} new
              </button>
            )}
            {!paused && (
              <span className="text-slate-600">
                Refresh in <span className="text-slate-400 font-mono">{countdown}s</span>
              </span>
            )}
            {paused && <span className="text-amber-500">Paused</span>}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-5 py-2 border-b border-slate-800 text-xs">
          {['Critical', 'High', 'Medium', 'Low'].map((s) => (
            <span key={s} className={`flex items-center gap-1.5 ${severityColor(s)}`}>
              <span className={`w-2 h-2 rounded-full ${severityDot(s)}`} />{s}
            </span>
          ))}
        </div>

        {/* Stream log */}
        <div ref={logRef} className="flex-1 overflow-y-auto">
          {fetchError && streamLog.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-center px-6">
              <AlertTriangle size={24} className="text-amber-400" />
              <p className="text-amber-300 text-sm font-medium">Live feed unavailable</p>
              <p className="text-slate-500 text-xs">{fetchError}</p>
              <button onClick={onRefresh} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          )}

          {streamLog.length === 0 && !fetchError && loading && (
            <div className="space-y-px">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-slate-700 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-800 rounded w-3/4" />
                    <div className="h-2.5 bg-slate-800 rounded w-1/2" />
                  </div>
                  <div className="h-2.5 bg-slate-800 rounded w-12" />
                </div>
              ))}
            </div>
          )}

          {streamLog.map((threat, idx) => (
            <div
              key={threat.id}
              className={`flex items-start gap-3 px-5 py-3 border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors cursor-default group ${
                idx === 0 && newCount > 0 ? 'bg-cyan-500/5' : ''
              }`}
            >
              {/* Severity dot */}
              <div className="flex flex-col items-center gap-1 pt-0.5 flex-shrink-0">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${severityDot(threat.severity)} ${
                  threat.status === 'Active' ? 'animate-pulse' : ''
                }`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className={`text-xs font-bold ${severityColor(threat.severity)}`}>{threat.severity}</span>
                  <span className="text-slate-600 text-xs">·</span>
                  <span className="text-xs text-slate-500">{threat.category}</span>
                  {threat.source.includes('ThreatFox') && (
                    <span className="text-xs bg-blue-500/10 text-blue-400 px-1.5 py-px rounded">ThreatFox</span>
                  )}
                  {threat.source.includes('URLhaus') && (
                    <span className="text-xs bg-amber-500/10 text-amber-400 px-1.5 py-px rounded">URLhaus</span>
                  )}
                </div>
                <p className="text-slate-200 text-sm leading-snug truncate">{threat.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`font-mono text-xs px-1.5 py-px rounded border ${
                    threat.ioc_type === 'IP' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    threat.ioc_type === 'Domain' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    threat.ioc_type === 'URL' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {threat.ioc_type}: {threat.ioc_value.slice(0, 40)}{threat.ioc_value.length > 40 ? '…' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                  <span>{timeAgo(threat.first_seen)}</span>
                  {threat.reporter && <span>via {threat.reporter}</span>}
                  <span>{threat.confidence}% confidence</span>
                </div>
              </div>

              {/* Tags - show on hover */}
              <div className="hidden group-hover:flex flex-col gap-1 items-end flex-shrink-0">
                {threat.tags.slice(0, 2).map((t) => (
                  <span key={t} className="text-xs bg-slate-700/70 text-slate-500 px-1.5 py-px rounded">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-600">
          <span>Data: ThreatFox & URLhaus (abuse.ch) · CC0 License</span>
          <button
            onClick={() => { onRefresh(); startCountdown(); }}
            disabled={loading}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh now
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Threats() {
  const [liveThreats, setLiveThreats] = useState<LiveThreat[]>([]);
  const [manualIOCs, setManualIOCs] = useState<IOC[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [livePanelOpen, setLivePanelOpen] = useState(false);
  const [addIOCOpen, setAddIOCOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [tab, setTab] = useState<'feeds' | 'actors'>('feeds');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleAddIOC = (ioc: IOC) => {
    setManualIOCs((prev) => [ioc, ...prev]);
    setAddIOCOpen(false);
    showToast(`IOC "${ioc.value}" added to threat intelligence`);
  };
  
  const fetchLiveFeeds = useCallback(async (force = false) => {
  if (!force && lastFetched && Date.now() - lastFetched.getTime() < 5 * 60 * 1000) return;
  setLoading(true);
  setFetchError(null);
  try {
    const res = await fetch(FEEDS_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      setLiveThreats(json.data);
      setLastFetched(new Date());
    } else {
      throw new Error(json.error ?? 'Unknown error');
    }
  } catch (err) {
    setFetchError((err as Error).message);
  } finally {
    setLoading(false);
  }
}, [lastFetched]);

  /*const fetchLiveFeeds = useCallback(async (force = false) => {
    if (!force && lastFetched && Date.now() - lastFetched.getTime() < 5 * 60 * 1000) return;
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(FEEDS_URL, {
        headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLiveThreats(json.data);
        setLastFetched(new Date());
      } else {
        throw new Error(json.error ?? 'Unknown error');
      }
    } catch (err) {
      setFetchError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [lastFetched]);*/

  // Initial load
  useEffect(() => { fetchLiveFeeds(); }, []);

  // When panel opens, ensure data is fresh
  const handleOpenLivePanel = () => {
    setLivePanelOpen(true);
    fetchLiveFeeds(true);
  };

  const manualAsThreats: LiveThreat[] = manualIOCs.map((ioc) => ({
    id: ioc.id,
    title: `${ioc.type} IOC: ${ioc.value.slice(0, 60)}${ioc.value.length > 60 ? '…' : ''}`,
    category: 'Manual',
    severity: ioc.severity,
    status: ioc.status === 'Active' ? 'Active' : ioc.status === 'Under Review' ? 'Investigating' : 'Mitigated',
    confidence: ioc.confidence,
    source: ioc.source,
    ioc_type: ioc.type,
    ioc_value: ioc.value,
    first_seen: ioc.first_seen,
    last_seen: ioc.last_seen,
    tags: ioc.tags,
    reporter: ioc.threat_actor !== 'Unknown' ? ioc.threat_actor : undefined,
  }));

  const allThreats = [
    ...manualAsThreats,
    ...liveThreats,
    ...mockThreats.map((t) => ({ ...t })),
  ];

  const filtered = allThreats.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.ioc_value.toLowerCase().includes(search.toLowerCase()) ||
      (t.tags ?? []).some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    const matchCat = category === 'All' || t.category === category;
    const matchStatus = status === 'All' || t.status === status;
    const isLive = t.source.includes('abuse.ch') || t.source.includes('ThreatFox') || t.source.includes('URLhaus');
    const matchSource =
      sourceFilter === 'All' ||
      (sourceFilter === 'Live Feed' && isLive) ||
      (sourceFilter === 'Manual' && !isLive);
    return matchSearch && matchCat && matchStatus && matchSource;
  });

  const activeCnt = allThreats.filter((t) => t.status === 'Active').length;
  const critCnt = allThreats.filter((t) => t.severity === 'Critical').length;
  const mitigatedCnt = allThreats.filter((t) => t.status === 'Mitigated').length;
  const liveCnt = liveThreats.length;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-screen-2xl relative">
      {addIOCOpen && <AddIOCModal onClose={() => setAddIOCOpen(false)} onSubmit={handleAddIOC} />}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-3 rounded-xl shadow-xl backdrop-blur">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
          {toast}
        </div>
      )}

      {/* Live Feed Drawer */}
      {livePanelOpen && (
        <LiveFeedDrawer
          onClose={() => setLivePanelOpen(false)}
          initialThreats={liveThreats}
          loading={loading}
          fetchError={fetchError}
          onRefresh={() => fetchLiveFeeds(true)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-slate-100 font-bold text-xl">Threat Intelligence</h2>
          <p className="text-slate-500 text-sm">
            {liveCnt > 0
              ? `${liveCnt} live indicators from ThreatFox & URLhaus · Last updated ${lastFetched ? timeAgo(lastFetched.toISOString()) : '—'}`
              : 'Aggregated threat feeds and manual intelligence'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchLiveFeeds(true)}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleOpenLivePanel}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-600/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-sm transition-colors"
          >
            <Radio size={16} className="animate-pulse" />
            Live Feed
            {liveCnt > 0 && (
              <span className="bg-emerald-500/20 text-emerald-300 text-xs px-1.5 py-px rounded-full font-medium">
                {liveCnt}
              </span>
            )}
          </button>
          <button
            onClick={() => setAddIOCOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm transition-colors"
          >
            <Plus size={16} /> Add IOC
          </button>
        </div>
      </div>

      {/* Source attribution */}
      {liveCnt > 0 && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'ThreatFox', desc: 'Malware IOCs', count: liveThreats.filter((t) => t.source.includes('ThreatFox')).length },
            { label: 'URLhaus', desc: 'Malware URLs', count: liveThreats.filter((t) => t.source.includes('URLhaus')).length },
          ].map((src) => (
            <button
              key={src.label}
              onClick={handleOpenLivePanel}
              className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 rounded-lg px-3 py-2 text-xs transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-300 font-medium">{src.label}</span>
              <span className="text-slate-500">{src.desc}</span>
              <span className="text-cyan-400 font-semibold">{src.count} IOCs</span>
            </button>
          ))}
        </div>
      )}

      {fetchError && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm">
          <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-300 font-medium">Live feed temporarily unavailable</p>
            <p className="text-amber-500/80 text-xs mt-0.5">Showing manual data. Error: {fetchError}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Threats', value: activeCnt, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          { label: 'Critical Severity', value: critCnt, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
          { label: 'Mitigated', value: mitigatedCnt, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {(['feeds', 'actors'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {t === 'feeds' ? `Threat Feeds (${filtered.length})` : 'Threat Actors'}
          </button>
        ))}
      </div>

      {tab === 'feeds' ? (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 flex-1">
              <Search size={16} className="text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search threats, IOCs, malware families..."
                className="bg-transparent text-slate-300 text-sm outline-none flex-1 placeholder:text-slate-600"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { val: category, set: setCategory, opts: CATEGORIES },
                { val: status, set: setStatus, opts: STATUSES },
                { val: sourceFilter, set: setSourceFilter, opts: SOURCES },
              ].map((f, i) => (
                <div key={i} className="relative">
                  <select
                    value={f.val}
                    onChange={(e) => f.set(e.target.value)}
                    className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 pr-8 outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {f.opts.map((o) => <option key={o}>{o}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-3 text-slate-500 pointer-events-none" />
                </div>
              ))}
            </div>
          </div>

          {loading && allThreats.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="h-4 bg-slate-700 rounded w-16" />
                    <div className="h-4 bg-slate-700 rounded w-24" />
                  </div>
                  <div className="h-5 bg-slate-700 rounded w-2/3 mt-3" />
                  <div className="h-4 bg-slate-700 rounded w-40 mt-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((threat) => {
                const isLive = threat.source.includes('abuse.ch') || threat.source.includes('ThreatFox') || threat.source.includes('URLhaus');
                return (
                  <div key={threat.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <SeverityBadge level={threat.severity} size="md" />
                          <SeverityBadge level={threat.status} />
                          <span className="text-xs bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded">{threat.category}</span>
                          {isLive && (
                            <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Live
                            </span>
                          )}
                        </div>
                        <h3 className="text-slate-100 font-semibold">{threat.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          <IOCBadge type={threat.ioc_type} value={threat.ioc_value} />
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                          <span>Source: <span className="text-slate-400">{threat.source}</span></span>
                          <span>First seen: <span className="text-slate-400">{timeAgo(threat.first_seen)}</span></span>
                          <span>Last seen: <span className="text-slate-400">{timeAgo(threat.last_seen)}</span></span>
                          {(threat as LiveThreat).reporter && (
                            <span>Reporter: <span className="text-slate-400">{(threat as LiveThreat).reporter}</span></span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
                        <div className="text-xs text-slate-500">Confidence</div>
                        <ConfidenceBar value={threat.confidence} />
                        <div className="flex gap-1 flex-wrap justify-end">
                          {(threat.tags ?? []).slice(0, 3).map((t) => (
                            <span key={t} className="text-xs bg-slate-700/50 text-slate-500 px-1.5 py-0.5 rounded">{t}</span>
                          ))}
                        </div>
                        <button className="text-cyan-400 text-xs hover:text-cyan-300 flex items-center gap-1 mt-1">
                          Details <ExternalLink size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="py-16 text-center text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  No threats match the current filters.
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockThreatActors.map((actor) => (
            <div key={actor.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-slate-100 font-semibold">{actor.name}</h3>
                  <p className="text-slate-500 text-xs mt-0.5">{actor.type} · {actor.sophistication} sophistication</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${actor.active ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`} />
                  <span className={`text-xs font-medium ${actor.active ? 'text-red-400' : 'text-slate-500'}`}>
                    {actor.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Motivation</p>
                <div className="flex flex-wrap gap-1">
                  {actor.motivation.map((m) => (
                    <span key={m} className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded">{m}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Target Sectors</p>
                <div className="flex flex-wrap gap-1">
                  {actor.target_sectors.map((s) => (
                    <span key={s} className="text-xs bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-600">Last seen: {actor.last_seen}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
