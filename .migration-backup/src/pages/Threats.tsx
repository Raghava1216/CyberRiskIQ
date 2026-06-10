import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Search, ChevronDown, ExternalLink, Radio, RefreshCw,
  AlertTriangle, Wifi, WifiOff, X, Pause, Play, Activity,
  CheckCircle2, Clock, Shield, PlusCircle, ChevronRight,
} from 'lucide-react';
import { mockThreats, mockThreatActors } from '../lib/mockData';
import { iocStore } from '../lib/iocStore';
import SeverityBadge from '../components/SeverityBadge';
import AddIOCModal from '../components/AddIOCModal';
import type { IOC } from '../lib/types';

const PROXY_URL          = 'http://localhost:3001/threat-feeds';
const LIVE_POLL_INTERVAL = 60_000;

const CATEGORIES = ['All', 'APT', 'Ransomware', 'Malware', 'Phishing', 'Botnet', 'RAT', 'Loader', 'DDoS', 'Insider', 'Supply Chain'];
const STATUSES   = ['All', 'Active', 'Investigating', 'Mitigated', 'Closed'];
const SOURCES    = ['All', 'Live Feed', 'Manual'];

interface LiveThreat {
  id:               string;
  title:            string;
  category:         string;
  severity:         'Critical' | 'High' | 'Medium' | 'Low';
  status:           string;
  confidence:       number;
  source:           string;
  ioc_type:         string;
  ioc_value:        string;
  associated_iocs?: string[];
  first_seen:       string;
  last_seen:        string;
  tags:             string[];
  reporter?:        string;
  description?:     string;
  synonyms?:        string[];
  country?:         string;
  targets?:         string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function severityColor(s: string) {
  if (s === 'Critical') return 'text-red-400';
  if (s === 'High')     return 'text-orange-400';
  if (s === 'Medium')   return 'text-amber-400';
  return 'text-emerald-400';
}

function severityDot(s: string) {
  if (s === 'Critical') return 'bg-red-500';
  if (s === 'High')     return 'bg-orange-500';
  if (s === 'Medium')   return 'bg-amber-500';
  return 'bg-emerald-500';
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1)  return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function sourceChip(source: string) {
  if (source.includes('IPsum'))        return { label: 'IPsum',   color: 'bg-red-500/10 text-red-400 border-red-500/20'          };
  if (source.includes('Ransomware'))   return { label: 'MISP RW', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20'  };
  if (source.includes('Threat Actor')) return { label: 'MISP TA', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20'        };
  return                                      { label: 'Feed',    color: 'bg-slate-500/10 text-slate-400 border-slate-500/20'     };
}

// Convert LiveThreat → IOC for the shared register
function threatToIOC(threat: LiveThreat): IOC {
  const typeMap: Record<string, IOC['type']> = {
    IP: 'IP', Domain: 'Domain', URL: 'URL', Hash: 'Hash', Email: 'Email',
    File: 'File', Registry: 'Registry',
  };
  return {
    id:               `ioc-from-${threat.id}-${Date.now()}`,
    value:            threat.ioc_value,
    type:             (typeMap[threat.ioc_type] ?? 'IP') as IOC['type'],
    severity:         threat.severity,
    status:           'Active',
    confidence:       threat.confidence,
    source:           threat.source,
    threat_actor:     threat.synonyms?.join(', ') || threat.reporter || 'Unknown',
    tags:             threat.tags ?? [],
    description:      threat.description || threat.title,
    first_seen:       threat.first_seen,
    last_seen:        threat.last_seen,
    expiry_date:      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    related_incident: '',
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function IOCBadge({ type, value }: { type: string; value: string }) {
  const colors: Record<string, string> = {
    IP:     'bg-red-500/10 text-red-400 border-red-500/20',
    Domain: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Hash:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
    URL:    'bg-amber-500/10 text-amber-400 border-amber-500/20',
    IOC:    'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded border ${colors[type] ?? colors.IOC}`}>
      <span className="font-sans text-xs opacity-60">{type}:</span>
      <span className="truncate max-w-[220px]">{value}</span>
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

// ── Threat card ───────────────────────────────────────────────────────────────

interface ThreatCardProps {
  threat:     LiveThreat;
  isLive:     boolean;
  onAddToIOC: (t: LiveThreat) => void;
  added:      boolean;
}

function ThreatCard({ threat, isLive, onAddToIOC, added }: ThreatCardProps) {
  const [expanded, setExpanded] = useState(false);
  const src = sourceChip(threat.source);

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600 transition-colors">
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge level={threat.severity} size="md" />
              <SeverityBadge level={threat.status} />
              <span className="text-xs bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded">{threat.category}</span>
              <span className={`text-xs px-1.5 py-px rounded border ${src.color}`}>{src.label}</span>
              {isLive && (
                <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                </span>
              )}
            </div>

            <h3 className="text-slate-100 font-semibold">{threat.title}</h3>

            {/* Primary IOC + associated toggle */}
            <div className="flex flex-wrap gap-2 items-center">
              <IOCBadge type={threat.ioc_type} value={threat.ioc_value} />
              {threat.associated_iocs && threat.associated_iocs.length > 0 && (
                <button
                  onClick={() => setExpanded(e => !e)}
                  className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                >
                  <ChevronRight size={12} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
                  +{threat.associated_iocs.length} associated
                </button>
              )}
            </div>

            {/* Expanded associated IOCs */}
            {expanded && threat.associated_iocs && threat.associated_iocs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pl-2 border-l-2 border-slate-700">
                {threat.associated_iocs.map((ioc, i) => (
                  <span key={i} className="text-xs font-mono bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded">
                    {ioc}
                  </span>
                ))}
              </div>
            )}

            {/* Synonyms for threat actors */}
            {threat.synonyms && threat.synonyms.length > 0 && (
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-xs text-slate-600">Also known as:</span>
                {threat.synonyms.slice(0, 4).map((s, i) => (
                  <span key={i} className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-px rounded">{s}</span>
                ))}
              </div>
            )}

            {threat.description && (
              <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{threat.description}</p>
            )}

            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
              <span>Source: <span className="text-slate-400">{threat.source}</span></span>
              <span>Seen: <span className="text-slate-400">{timeAgo(threat.first_seen)}</span></span>
              {threat.country && threat.country !== 'Unknown' && (
                <span>Origin: <span className="text-slate-400">{threat.country}</span></span>
              )}
              {threat.reporter && (
                <span>Via: <span className="text-slate-400">{threat.reporter}</span></span>
              )}
            </div>

            <div className="flex gap-1 flex-wrap">
              {(threat.tags ?? []).slice(0, 5).map(t => (
                <span key={t} className="text-xs bg-slate-700/50 text-slate-500 px-1.5 py-0.5 rounded">{t}</span>
              ))}
            </div>
          </div>

          {/* Right: confidence + add button */}
          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-2 flex-shrink-0">
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-slate-500">Confidence</span>
              <ConfidenceBar value={threat.confidence} />
            </div>

            <button
              onClick={() => onAddToIOC(threat)}
              disabled={added}
              title={added ? 'Already in IOC Register' : 'Add to IOC Register'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                added
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 cursor-default'
                  : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 cursor-pointer'
              }`}
            >
              {added
                ? <><CheckCircle2 size={12} /> In Register</>
                : <><PlusCircle size={12} /> Add to Register</>
              }
            </button>

            <button className="text-slate-600 hover:text-cyan-400 text-xs flex items-center gap-1 transition-colors">
              Details <ExternalLink size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Live Feed Drawer ──────────────────────────────────────────────────────────

interface LiveFeedDrawerProps {
  onClose:       () => void;
  threats:       LiveThreat[];
  loading:       boolean;
  fetchError:    string | null;
  onRefresh:     () => void;
  lastFetched:   Date | null;
  countdown:     number;
  paused:        boolean;
  onTogglePause: () => void;
  newCount:      number;
  onClearNew:    () => void;
  addedIds:      Set<string>;
  onAddToIOC:    (t: LiveThreat) => void;
}

function LiveFeedDrawer({
  onClose, threats, loading, fetchError, onRefresh,
  lastFetched, countdown, paused, onTogglePause,
  newCount, onClearNew, addedIds, onAddToIOC,
}: LiveFeedDrawerProps) {
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logRef.current && !paused) logRef.current.scrollTop = 0;
  }, [threats.length, paused]);

  const ipsumCount = threats.filter(t => t.source.includes('IPsum')).length;
  const rwCount    = threats.filter(t => t.source.includes('Ransomware')).length;
  const taCount    = threats.filter(t => t.source.includes('Threat Actor')).length;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-700 flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Activity size={16} className="text-emerald-400" />
              {!paused && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />}
            </div>
            <div>
              <h2 className="text-slate-100 font-semibold text-sm">Live Threat Feed</h2>
              <p className="text-slate-500 text-xs">IPsum · MISP Ransomware · MISP Threat Actors</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onTogglePause}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                paused ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' : 'border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}>
              {paused ? <><Play size={12} /> Resume</> : <><Pause size={12} /> Pause</>}
            </button>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-800/50 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            {loading
              ? <span className="flex items-center gap-1.5 text-slate-400"><RefreshCw size={12} className="animate-spin" /> Fetching…</span>
              : fetchError
              ? <span className="flex items-center gap-1.5 text-red-400"><WifiOff size={12} /> Proxy offline</span>
              : <span className="flex items-center gap-1.5 text-emerald-400"><Wifi size={12} /> Live · {threats.length} indicators</span>
            }
          </div>
          <div className="flex items-center gap-2">
            {newCount > 0 && (
              <button onClick={onClearNew} className="flex items-center gap-1 bg-cyan-500/15 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20">
                +{newCount} new
              </button>
            )}
            {lastFetched && <span className="text-slate-600 flex items-center gap-1"><Clock size={10} /> {timeAgo(lastFetched.toISOString())}</span>}
            {!paused && <span className="text-slate-600">Next in <span className="text-slate-400 font-mono">{countdown}s</span></span>}
            {paused && <span className="text-amber-500">Paused</span>}
          </div>
        </div>

        {/* Source breakdown */}
        {threats.length > 0 && (
          <div className="flex gap-2 px-5 py-2 border-b border-slate-800 text-xs flex-wrap">
            <span className="flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded">
              <Shield size={10} /> IPsum: {ipsumCount}
            </span>
            <span className="flex items-center gap-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded">
              MISP RW: {rwCount}
            </span>
            <span className="flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
              MISP TA: {taCount}
            </span>
            <span className="ml-auto text-slate-600 text-xs">Click Add to push to IOC Register</span>
          </div>
        )}

        {/* Severity legend */}
        <div className="flex items-center gap-4 px-5 py-2 border-b border-slate-800 text-xs">
          {['Critical','High','Medium','Low'].map(s => (
            <span key={s} className={`flex items-center gap-1.5 ${severityColor(s)}`}>
              <span className={`w-2 h-2 rounded-full ${severityDot(s)}`} />{s}
            </span>
          ))}
        </div>

        {/* Stream */}
        <div ref={logRef} className="flex-1 overflow-y-auto">

          {loading && threats.length === 0 && (
            <div className="space-y-px">
              {[1,2,3,4,5,6].map(n => (
                <div key={n} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-800 rounded w-3/4" />
                    <div className="h-2.5 bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && threats.length === 0 && fetchError && (
            <div className="flex flex-col items-center justify-center h-56 gap-4 text-center px-6">
              <AlertTriangle size={28} className="text-amber-400" />
              <div>
                <p className="text-amber-300 text-sm font-medium mb-1">Proxy server not running</p>
                <p className="text-slate-500 text-xs mb-2">Start it in a separate terminal:</p>
                <code className="block bg-slate-800 text-cyan-400 text-xs px-3 py-2 rounded-lg">node threat-proxy.cjs</code>
              </div>
              <button onClick={onRefresh}
                className="flex items-center gap-1.5 text-xs text-cyan-400 px-3 py-1.5 rounded-lg border border-cyan-500/20 hover:bg-cyan-500/10">
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          )}

          {threats.map((threat, idx) => {
            const src     = sourceChip(threat.source);
            const isAdded = addedIds.has(threat.id);
            return (
              <div key={threat.id}
                className={`flex items-start gap-3 px-5 py-3 border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors group ${
                  idx === 0 && newCount > 0 ? 'bg-cyan-500/5' : ''
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${severityDot(threat.severity)} ${
                  threat.status === 'Active' ? 'animate-pulse' : ''
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className={`text-xs font-bold ${severityColor(threat.severity)}`}>{threat.severity}</span>
                    <span className="text-slate-600 text-xs">·</span>
                    <span className="text-xs text-slate-500">{threat.category}</span>
                    <span className={`text-xs px-1.5 py-px rounded border ${src.color}`}>{src.label}</span>
                  </div>
                  <p className="text-slate-200 text-sm leading-snug truncate">{threat.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`font-mono text-xs px-1.5 py-px rounded border truncate max-w-[200px] ${
                      threat.ioc_type === 'IP'   ? 'bg-red-500/10 text-red-400 border-red-500/20'    :
                      threat.ioc_type === 'Hash' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    }`}>
                      {threat.ioc_type}: {threat.ioc_value}
                    </span>
                    {threat.associated_iocs && threat.associated_iocs.length > 0 && (
                      <span className="text-xs text-slate-600">+{threat.associated_iocs.length}</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {threat.confidence}% confidence · {timeAgo(threat.first_seen)}
                  </div>
                </div>
                {/* Add button */}
                <button
                  onClick={() => onAddToIOC(threat)}
                  disabled={isAdded}
                  title={isAdded ? 'Already in IOC Register' : 'Add to IOC Register'}
                  className={`flex-shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-all ${
                    isAdded
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 cursor-default'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-cyan-500/15 hover:text-cyan-400 hover:border-cyan-500/30'
                  }`}
                >
                  {isAdded ? <CheckCircle2 size={11} /> : <PlusCircle size={11} />}
                  {isAdded ? 'Added' : 'Add'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-600">
          <span>IPsum (CC0) · MISP Galaxy (CC0)</span>
          <button onClick={onRefresh} disabled={loading}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-300 disabled:opacity-40">
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Threats() {
  const [liveThreats,   setLiveThreats]   = useState<LiveThreat[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [fetchError,    setFetchError]    = useState<string | null>(null);
  const [lastFetched,   setLastFetched]   = useState<Date | null>(null);
  const [livePanelOpen, setLivePanelOpen] = useState(false);
  const [addIOCOpen,    setAddIOCOpen]    = useState(false);
  const [toast,         setToast]         = useState<string | null>(null);
  const [paused,        setPaused]        = useState(false);
  const [newCount,      setNewCount]      = useState(0);
  const [countdown,     setCountdown]     = useState(LIVE_POLL_INTERVAL / 1000);
  const [addedIds,      setAddedIds]      = useState<Set<string>>(new Set());

  const [search,       setSearch]       = useState('');
  const [category,     setCategory]     = useState('All');
  const [status,       setStatus]       = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [tab,          setTab]          = useState<'feeds' | 'actors'>('feeds');

  const prevIdsRef = useRef<Set<string>>(new Set());
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const cdRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // ── Add to shared IOC store ───────────────────────────────────────────────

  const handleAddToIOC = (threat: LiveThreat) => {
    if (addedIds.has(threat.id)) return;
    const ioc   = threatToIOC(threat);
    const added = iocStore.add(ioc);
    setAddedIds(prev => new Set([...prev, threat.id]));
    showToast(
      added > 0
        ? `"${threat.title}" added to IOC Register — navigate to IOC Register to view`
        : `"${threat.ioc_value}" already exists in the IOC Register`
    );
  };

  // ── Fetch from proxy ──────────────────────────────────────────────────────

  const fetchFeeds = useCallback(async (force = false) => {
    if (!force && lastFetched && Date.now() - lastFetched.getTime() < 5 * 60 * 1000) return;
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(PROXY_URL);
      if (!res.ok) throw new Error(`Proxy returned HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Unknown proxy error');

      const threats: LiveThreat[] = json.data ?? [];
      const newOnes = threats.filter(t => !prevIdsRef.current.has(t.id));
      if (newOnes.length > 0 && prevIdsRef.current.size > 0) {
        setNewCount(n => n + newOnes.length);
      }
      threats.forEach(t => prevIdsRef.current.add(t.id));
      setLiveThreats(threats);
      setLastFetched(new Date());
    } catch (err) {
      setFetchError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [lastFetched]);

  // ── Countdown + auto-poll ─────────────────────────────────────────────────

  const startCountdown = useCallback(() => {
    setCountdown(LIVE_POLL_INTERVAL / 1000);
    if (cdRef.current) clearInterval(cdRef.current);
    cdRef.current = setInterval(() => {
      setCountdown(c => c <= 1 ? LIVE_POLL_INTERVAL / 1000 : c - 1);
    }, 1000);
  }, []);

  useEffect(() => {
    if (paused) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cdRef.current)    clearInterval(cdRef.current);
      return;
    }
    startCountdown();
    timerRef.current = setInterval(() => { fetchFeeds(true); startCountdown(); }, LIVE_POLL_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cdRef.current)    clearInterval(cdRef.current);
    };
  }, [paused, fetchFeeds, startCountdown]);

  useEffect(() => { fetchFeeds(true); }, []);

  const handleOpenLivePanel = () => { setLivePanelOpen(true); fetchFeeds(true); };

  const handleAddIOCManual = (ioc: IOC) => {
    iocStore.add(ioc);
    setAddIOCOpen(false);
    showToast(`IOC "${ioc.value}" added to register`);
  };

  // ── Combine sources ───────────────────────────────────────────────────────

  const allThreats = [
    ...liveThreats,
    ...mockThreats.map(t => ({ ...t } as unknown as LiveThreat)),
  ];

  const filtered = allThreats.filter(t => {
    const q        = search.toLowerCase();
    const matchQ   = t.title.toLowerCase().includes(q) || t.ioc_value.toLowerCase().includes(q) || (t.tags ?? []).some(tag => tag.includes(q));
    const matchCat = category === 'All' || t.category === category;
    const matchSt  = status   === 'All' || t.status   === status;
    const isLive   = t.source.includes('IPsum') || t.source.includes('MISP') || t.source.includes('abuse.ch');
    const matchSrc = sourceFilter === 'All' || (sourceFilter === 'Live Feed' && isLive) || (sourceFilter === 'Manual' && !isLive);
    return matchQ && matchCat && matchSt && matchSrc;
  });

  const activeCnt    = allThreats.filter(t => t.status === 'Active').length;
  const critCnt      = allThreats.filter(t => t.severity === 'Critical').length;
  const mitigatedCnt = allThreats.filter(t => t.status === 'Mitigated').length;
  const liveCnt      = liveThreats.length;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-screen-2xl relative">

      {addIOCOpen && <AddIOCModal onClose={() => setAddIOCOpen(false)} onSubmit={handleAddIOCManual} />}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-3 rounded-xl shadow-xl backdrop-blur">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />{toast}
        </div>
      )}

      {livePanelOpen && (
        <LiveFeedDrawer
          onClose={() => { setLivePanelOpen(false); setNewCount(0); }}
          threats={liveThreats}
          loading={loading}
          fetchError={fetchError}
          onRefresh={() => fetchFeeds(true)}
          lastFetched={lastFetched}
          countdown={countdown}
          paused={paused}
          onTogglePause={() => setPaused(p => !p)}
          newCount={newCount}
          onClearNew={() => setNewCount(0)}
          addedIds={addedIds}
          onAddToIOC={handleAddToIOC}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-slate-100 font-bold text-xl">Threat Intelligence</h2>
          <p className="text-slate-500 text-sm">
            {loading
              ? 'Fetching live indicators…'
              : liveCnt > 0
              ? `${liveCnt} live indicators · IPsum · MISP Galaxy · Updated ${lastFetched ? timeAgo(lastFetched.toISOString()) : '—'}`
              : fetchError
              ? 'Proxy offline — run: node threat-proxy.cjs'
              : 'Aggregated threat feeds and manual intelligence'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchFeeds(true)} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm transition-colors disabled:opacity-50">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={handleOpenLivePanel}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-600/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-sm transition-colors">
            <Radio size={16} className={liveCnt > 0 ? 'animate-pulse' : ''} />
            Live Feed
            {liveCnt > 0 && <span className="bg-emerald-500/20 text-emerald-300 text-xs px-1.5 py-px rounded-full">{liveCnt}</span>}
            {newCount > 0 && <span className="bg-cyan-500/20 text-cyan-300 text-xs px-1.5 py-px rounded-full">+{newCount}</span>}
          </button>
          <button onClick={() => setAddIOCOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm transition-colors">
            <Plus size={16} /> Add IOC
          </button>
        </div>
      </div>

      {/* Source badges */}
      {liveCnt > 0 && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'IPsum',           desc: 'Malicious IP clusters', count: liveThreats.filter(t => t.source.includes('IPsum')).length,       color: 'text-red-400'    },
            { label: 'MISP Ransomware', desc: 'Active families',       count: liveThreats.filter(t => t.source.includes('Ransomware')).length,   color: 'text-purple-400' },
            { label: 'MISP Actors',     desc: 'APT / threat groups',   count: liveThreats.filter(t => t.source.includes('Threat Actor')).length, color: 'text-blue-400'   },
          ].map(src => (
            <button key={src.label} onClick={handleOpenLivePanel}
              className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 rounded-lg px-3 py-2 text-xs transition-colors">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-300 font-medium">{src.label}</span>
              <span className="text-slate-500">{src.desc}</span>
              <span className={`font-semibold ${src.color}`}>{src.count}</span>
            </button>
          ))}
          {addedIds.size > 0 && (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-emerald-400">
              <CheckCircle2 size={12} /> {addedIds.size} added to IOC Register
            </div>
          )}
        </div>
      )}

      {/* Proxy offline banner */}
      {fetchError && liveCnt === 0 && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm">
          <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-300 font-medium">Proxy server not running</p>
            <p className="text-amber-500/80 text-xs mt-1">
              Open a terminal and run: <code className="bg-slate-800 text-cyan-400 px-2 py-0.5 rounded">node threat-proxy.cjs</code>
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Threats', value: activeCnt,    color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20'       },
          { label: 'Critical',       value: critCnt,      color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20'  },
          { label: 'Mitigated',      value: mitigatedCnt, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {(['feeds', 'actors'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>
            {t === 'feeds' ? `Threat Feeds (${filtered.length})` : 'Threat Actors'}
          </button>
        ))}
      </div>

      {tab === 'feeds' ? (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 flex-1">
              <Search size={16} className="text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search threats, IOCs, families…"
                className="bg-transparent text-slate-300 text-sm outline-none flex-1 placeholder:text-slate-600" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { val: category,     set: setCategory,     opts: CATEGORIES },
                { val: status,       set: setStatus,       opts: STATUSES   },
                { val: sourceFilter, set: setSourceFilter, opts: SOURCES    },
              ].map((f, i) => (
                <div key={i} className="relative">
                  <select value={f.val} onChange={e => f.set(e.target.value)}
                    className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 pr-8 outline-none focus:border-cyan-500 cursor-pointer">
                    {f.opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-3 text-slate-500 pointer-events-none" />
                </div>
              ))}
            </div>
          </div>

          {loading && allThreats.length === 0 ? (
            <div className="space-y-3">
              {[1,2,3].map(n => (
                <div key={n} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 animate-pulse h-24" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(threat => {
                const isLive = threat.source.includes('IPsum') || threat.source.includes('MISP') || threat.source.includes('abuse.ch');
                return (
                  <ThreatCard
                    key={threat.id}
                    threat={threat as LiveThreat}
                    isLive={isLive}
                    onAddToIOC={handleAddToIOC}
                    added={addedIds.has(threat.id)}
                  />
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
          {mockThreatActors.map(actor => (
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
                  {actor.motivation.map(m => (
                    <span key={m} className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded">{m}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Target Sectors</p>
                <div className="flex flex-wrap gap-1">
                  {actor.target_sectors.map(s => (
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
