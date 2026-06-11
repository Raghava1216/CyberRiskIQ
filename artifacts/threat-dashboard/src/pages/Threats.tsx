import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container, Row, Col, Card, Badge, Button, Nav, Form,
  InputGroup, Offcanvas, ProgressBar, Spinner,
} from 'react-bootstrap';
import {
  Plus, Search, ExternalLink, Radio, RefreshCw,
  AlertTriangle, Wifi, WifiOff, X, Pause, Play, Activity,
  CheckCircle, Clock, Shield, PlusCircle, ChevronRight,
} from 'react-feather';
import { mockThreats, mockThreatActors } from '../lib/mockData';
import { iocStore } from '../lib/iocStore';
import AddIOCModal from '../components/AddIOCModal';
import type { IOC } from '../lib/types';

const PROXY_URL          = '/api/threat-feeds';
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

function severityVariant(s: string): string {
  if (s === 'Critical') return 'danger';
  if (s === 'High')     return 'warning';
  if (s === 'Medium')   return 'warning';
  return 'success';
}

function severityStyle(s: string): React.CSSProperties {
  if (s === 'High')   return { backgroundColor: '#fd7e14', color: '#fff' };
  if (s === 'Medium') return { backgroundColor: '#f0ad4e', color: '#212529' };
  return {};
}

function confidenceVariant(v: number): string {
  if (v >= 80) return 'success';
  if (v >= 60) return 'warning';
  return 'danger';
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1)  return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function sourceChip(source: string): { label: string; cls: string } {
  if (source.includes('IPsum'))        return { label: 'IPsum',   cls: 'source-chip-ipsum'   };
  if (source.includes('Ransomware'))   return { label: 'MISP RW', cls: 'source-chip-misp-rw' };
  if (source.includes('Threat Actor')) return { label: 'MISP TA', cls: 'source-chip-misp-ta' };
  return                                      { label: 'Feed',    cls: 'source-chip-feed'    };
}

function iocBadgeCls(type: string): string {
  if (type === 'IP')     return 'ioc-badge ioc-badge-ip';
  if (type === 'Domain') return 'ioc-badge ioc-badge-domain';
  if (type === 'Hash')   return 'ioc-badge ioc-badge-hash';
  if (type === 'URL')    return 'ioc-badge ioc-badge-url';
  return 'ioc-badge ioc-badge-other';
}

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

interface ThreatCardProps {
  threat:     LiveThreat;
  isLive:     boolean;
  onAddToIOC: (t: LiveThreat) => void;
  added:      boolean;
}

function ThreatCard({ threat, isLive, onAddToIOC, added }: ThreatCardProps) {
  const [expanded, setExpanded] = useState(false);
  const src = sourceChip(threat.source);
  const sev = severityVariant(threat.severity);

  return (
    <Card className="threat-card shadow-sm mb-3">
      <Card.Body className="p-3">
        <div className="d-flex gap-3">
          <div className="flex-grow-1 min-width-0">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <Badge bg={sev} style={severityStyle(threat.severity)}>{threat.severity}</Badge>
              <Badge bg="secondary" className="fw-normal">{threat.status}</Badge>
              <span className="badge rounded-pill" style={{ background: '#f4f7f9', color: '#495057', fontSize: '0.7rem', border: '1px solid #dee2e6' }}>{threat.category}</span>
              <span className={`source-chip ${src.cls}`}>{src.label}</span>
              {isLive && (
                <span className="d-inline-flex align-items-center gap-1 badge"
                  style={{ background: 'rgba(75,191,115,0.1)', color: '#4BBF73', border: '1px solid rgba(75,191,115,0.3)', fontSize: '0.7rem' }}>
                  <span className="live-dot" style={{ width: 6, height: 6 }} /> Live
                </span>
              )}
            </div>

            <h6 className="fw-semibold mb-2">{threat.title}</h6>

            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <span className={iocBadgeCls(threat.ioc_type)}>
                <span style={{ opacity: 0.6, fontSize: '0.65rem' }}>{threat.ioc_type}:</span>
                <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{threat.ioc_value}</span>
              </span>
              {threat.associated_iocs && threat.associated_iocs.length > 0 && (
                <button className="btn btn-link btn-sm p-0 text-muted" style={{ fontSize: '0.75rem' }}
                  onClick={() => setExpanded(e => !e)}>
                  <ChevronRight size={12} style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                  +{threat.associated_iocs.length} associated
                </button>
              )}
            </div>

            {expanded && threat.associated_iocs && threat.associated_iocs.length > 0 && (
              <div className="d-flex flex-wrap gap-1 mb-2 ps-2 border-start border-2">
                {threat.associated_iocs.map((ioc, i) => (
                  <span key={i} className="ioc-badge ioc-badge-other">{ioc}</span>
                ))}
              </div>
            )}

            {threat.synonyms && threat.synonyms.length > 0 && (
              <div className="d-flex flex-wrap align-items-center gap-1 mb-2">
                <span className="text-muted" style={{ fontSize: '0.72rem' }}>Also known as:</span>
                {threat.synonyms.slice(0, 4).map((s, i) => (
                  <span key={i} className="badge rounded-pill"
                    style={{ background: 'rgba(59,130,236,0.1)', color: '#3B82EC', border: '1px solid rgba(59,130,236,0.25)', fontSize: '0.7rem' }}>{s}</span>
                ))}
              </div>
            )}

            {threat.description && (
              <p className="text-muted mb-2" style={{ fontSize: '0.78rem', lineHeight: 1.5,
                overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {threat.description}
              </p>
            )}

            <div className="d-flex flex-wrap gap-3 mb-2" style={{ fontSize: '0.75rem', color: '#6c757d' }}>
              <span>Source: <span className="text-dark">{threat.source}</span></span>
              <span>Seen: <span className="text-dark">{timeAgo(threat.first_seen)}</span></span>
              {threat.country && threat.country !== 'Unknown' && (
                <span>Origin: <span className="text-dark">{threat.country}</span></span>
              )}
              {threat.reporter && (
                <span>Via: <span className="text-dark">{threat.reporter}</span></span>
              )}
            </div>

            <div className="d-flex flex-wrap gap-1">
              {(threat.tags ?? []).slice(0, 5).map(t => (
                <span key={t} className="badge rounded-pill"
                  style={{ background: '#f4f7f9', color: '#6c757d', border: '1px solid #dee2e6', fontSize: '0.68rem', fontWeight: 400 }}>{t}</span>
              ))}
            </div>
          </div>

          <div className="d-flex flex-column align-items-end gap-2 flex-shrink-0" style={{ minWidth: 120 }}>
            <div className="text-end w-100">
              <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>Confidence</div>
              <div className="d-flex align-items-center gap-2">
                <ProgressBar now={threat.confidence} variant={confidenceVariant(threat.confidence)}
                  style={{ height: 6, width: 64, borderRadius: 99 }} />
                <span className="text-muted" style={{ fontSize: '0.72rem', width: 28 }}>{threat.confidence}%</span>
              </div>
            </div>

            <Button size="sm" variant={added ? 'outline-success' : 'outline-primary'}
              disabled={added} onClick={() => onAddToIOC(threat)}
              className="d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
              {added
                ? <><CheckCircle size={11} /> In Register</>
                : <><PlusCircle size={11} /> Add to Register</>}
            </Button>

            <button className="btn btn-link btn-sm p-0 text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
              Details <ExternalLink size={10} />
            </button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

interface LiveFeedDrawerProps {
  show:          boolean;
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
  show, onClose, threats, loading, fetchError, onRefresh,
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
    <Offcanvas show={show} onHide={onClose} placement="end" className="pg-offcanvas">
      <Offcanvas.Header className="border-bottom py-3">
        <div className="d-flex align-items-center gap-2 flex-grow-1">
          <div className="d-flex align-items-center justify-content-center rounded position-relative"
            style={{ width: 36, height: 36, background: 'rgba(75,191,115,0.1)' }}>
            <Activity size={16} color="#4BBF73" />
            {!paused && <span className="live-dot position-absolute" style={{ top: 2, right: 2, width: 8, height: 8 }} />}
          </div>
          <div>
            <div className="fw-semibold" style={{ fontSize: '0.875rem' }}>Live Threat Feed</div>
            <div className="text-muted" style={{ fontSize: '0.72rem' }}>IPsum · MISP Ransomware · MISP Threat Actors</div>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Button size="sm" variant={paused ? 'warning' : 'outline-secondary'}
            onClick={onTogglePause} className="d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
            {paused ? <><Play size={11} /> Resume</> : <><Pause size={11} /> Pause</>}
          </Button>
          <button className="btn-close" onClick={onClose} />
        </div>
      </Offcanvas.Header>

      <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom"
        style={{ background: '#f8f9fa', fontSize: '0.78rem' }}>
        <div>
          {loading
            ? <span className="d-flex align-items-center gap-1 text-muted"><Spinner animation="border" size="sm" style={{ width: 12, height: 12 }} /> Fetching…</span>
            : fetchError
            ? <span className="d-flex align-items-center gap-1 text-danger"><WifiOff size={12} /> Proxy offline</span>
            : <span className="d-flex align-items-center gap-1 text-success"><Wifi size={12} /> Live · {threats.length} indicators</span>
          }
        </div>
        <div className="d-flex align-items-center gap-2">
          {newCount > 0 && (
            <button className="badge rounded-pill border-0"
              style={{ background: 'rgba(59,130,236,0.1)', color: '#3B82EC', cursor: 'pointer' }}
              onClick={onClearNew}>+{newCount} new</button>
          )}
          {lastFetched && (
            <span className="text-muted d-flex align-items-center gap-1">
              <Clock size={10} /> {timeAgo(lastFetched.toISOString())}
            </span>
          )}
          {!paused && <span className="text-muted">Next in <span className="fw-medium">{countdown}s</span></span>}
          {paused && <span className="text-warning fw-medium">Paused</span>}
        </div>
      </div>

      {threats.length > 0 && (
        <div className="d-flex gap-2 px-3 py-2 border-bottom flex-wrap" style={{ fontSize: '0.72rem' }}>
          <span className="source-chip source-chip-ipsum d-flex align-items-center gap-1"><Shield size={10} /> IPsum: {ipsumCount}</span>
          <span className="source-chip source-chip-misp-rw">MISP RW: {rwCount}</span>
          <span className="source-chip source-chip-misp-ta">MISP TA: {taCount}</span>
          <span className="ms-auto text-muted">Click Add to push to IOC Register</span>
        </div>
      )}

      <div className="d-flex align-items-center gap-3 px-3 py-2 border-bottom" style={{ fontSize: '0.72rem' }}>
        {(['Critical','High','Medium','Low'] as const).map(s => (
          <span key={s} className="d-flex align-items-center gap-1">
            <span style={{
              width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
              background: s === 'Critical' ? '#d9534f' : s === 'High' ? '#fd7e14' : s === 'Medium' ? '#f0ad4e' : '#4BBF73'
            }} />
            <span className="text-muted">{s}</span>
          </span>
        ))}
      </div>

      <Offcanvas.Body ref={logRef} className="p-0 overflow-auto">
        {loading && threats.length === 0 && (
          <div>
            {[1,2,3,4,5].map(n => (
              <div key={n} className="d-flex align-items-center gap-3 px-3 py-3 border-bottom placeholder-glow">
                <span className="placeholder rounded-circle" style={{ width: 10, height: 10 }} />
                <div className="flex-grow-1">
                  <div className="placeholder col-8 mb-1" style={{ height: 12, borderRadius: 4 }} />
                  <div className="placeholder col-5" style={{ height: 10, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && threats.length === 0 && fetchError && (
          <div className="d-flex flex-column align-items-center justify-content-center text-center px-4 py-5">
            <AlertTriangle size={28} color="#f0ad4e" className="mb-3" />
            <p className="fw-medium mb-1">Proxy server not running</p>
            <p className="text-muted mb-2" style={{ fontSize: '0.8rem' }}>Start it in a separate terminal:</p>
            <code className="d-block px-3 py-2 rounded mb-3" style={{ background: '#f4f7f9', color: '#3B82EC', fontSize: '0.78rem' }}>node threat-proxy.cjs</code>
            <Button variant="outline-primary" size="sm" onClick={onRefresh} className="d-flex align-items-center gap-1">
              <RefreshCw size={12} /> Retry
            </Button>
          </div>
        )}

        {threats.map((threat, idx) => {
          const src     = sourceChip(threat.source);
          const isAdded = addedIds.has(threat.id);
          const dotColor = threat.severity === 'Critical' ? '#d9534f' : threat.severity === 'High' ? '#fd7e14'
            : threat.severity === 'Medium' ? '#f0ad4e' : '#4BBF73';
          return (
            <div key={threat.id}
              className={`d-flex align-items-start gap-3 px-3 py-3 border-bottom${idx === 0 && newCount > 0 ? ' bg-primary bg-opacity-10' : ''}`}
              style={{ transition: 'background 0.15s' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor, flexShrink: 0, marginTop: 4,
                animation: threat.status === 'Active' ? 'pg-pulse 1.5s infinite' : 'none' }} />
              <div className="flex-grow-1 min-w-0">
                <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                  <span className="fw-bold" style={{ fontSize: '0.78rem', color: dotColor }}>{threat.severity}</span>
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>·</span>
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>{threat.category}</span>
                  <span className={`source-chip ${src.cls}`}>{src.label}</span>
                </div>
                <p className="mb-1 fw-medium" style={{ fontSize: '0.85rem' }}>{threat.title}</p>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className={iocBadgeCls(threat.ioc_type)} style={{ maxWidth: 200 }}>
                    {threat.ioc_type}: {threat.ioc_value}
                  </span>
                  {threat.associated_iocs && threat.associated_iocs.length > 0 && (
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>+{threat.associated_iocs.length}</span>
                  )}
                </div>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                  {threat.confidence}% confidence · {timeAgo(threat.first_seen)}
                </div>
              </div>
              <Button size="sm" variant={isAdded ? 'outline-success' : 'outline-secondary'}
                disabled={isAdded} onClick={() => onAddToIOC(threat)}
                className="d-flex align-items-center gap-1 flex-shrink-0" style={{ fontSize: '0.7rem' }}>
                {isAdded ? <CheckCircle size={10} /> : <PlusCircle size={10} />}
                {isAdded ? 'Added' : 'Add'}
              </Button>
            </div>
          );
        })}
      </Offcanvas.Body>

      <div className="d-flex align-items-center justify-content-between px-3 py-2 border-top"
        style={{ fontSize: '0.72rem', color: '#6c757d' }}>
        <span>IPsum (CC0) · MISP Galaxy (CC0)</span>
        <Button variant="link" size="sm" className="p-0 text-muted d-flex align-items-center gap-1"
          onClick={onRefresh} disabled={loading} style={{ fontSize: '0.72rem' }}>
          <RefreshCw size={11} className={loading ? 'spin' : ''} /> Refresh
        </Button>
      </div>
    </Offcanvas>
  );
}

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

  const handleAddToIOC = (threat: LiveThreat) => {
    if (addedIds.has(threat.id)) return;
    const ioc   = threatToIOC(threat);
    const added = iocStore.add(ioc);
    setAddedIds(prev => new Set([...prev, threat.id]));
    showToast(
      added > 0
        ? `"${threat.title}" added to IOC Register`
        : `"${threat.ioc_value}" already exists in the IOC Register`
    );
  };

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
      if (newOnes.length > 0 && prevIdsRef.current.size > 0) setNewCount(n => n + newOnes.length);
      threats.forEach(t => prevIdsRef.current.add(t.id));
      setLiveThreats(threats);
      setLastFetched(new Date());
    } catch (err) {
      setFetchError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [lastFetched]);

  const startCountdown = useCallback(() => {
    setCountdown(LIVE_POLL_INTERVAL / 1000);
    if (cdRef.current) clearInterval(cdRef.current);
    cdRef.current = setInterval(() => setCountdown(c => c <= 1 ? LIVE_POLL_INTERVAL / 1000 : c - 1), 1000);
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
    <div className="progrec-page p-3 p-lg-4">
      {addIOCOpen && <AddIOCModal onClose={() => setAddIOCOpen(false)} onSubmit={handleAddIOCManual} />}

      {toast && (
        <div className="pg-toast">
          <CheckCircle size={16} color="#4BBF73" />
          <span>{toast}</span>
        </div>
      )}

      <LiveFeedDrawer
        show={livePanelOpen}
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

      {/* Page header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1">Threat Intelligence</h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
            {loading
              ? 'Fetching live indicators…'
              : liveCnt > 0
              ? `${liveCnt} live indicators · IPsum · MISP Galaxy · Updated ${lastFetched ? timeAgo(lastFetched.toISOString()) : '—'}`
              : fetchError
              ? 'Proxy offline — run: node threat-proxy.cjs'
              : 'Aggregated threat feeds and manual intelligence'}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={() => fetchFeeds(true)} disabled={loading}
            className="d-flex align-items-center gap-2">
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
          </Button>
          <Button variant="outline-success" size="sm" onClick={handleOpenLivePanel}
            className="d-flex align-items-center gap-2">
            <Radio size={15} className={liveCnt > 0 ? 'live-dot-icon' : ''} />
            Live Feed
            {liveCnt > 0 && <Badge bg="success" pill>{liveCnt}</Badge>}
            {newCount > 0 && <Badge bg="primary" pill>+{newCount}</Badge>}
          </Button>
          <Button variant="primary" size="sm" onClick={() => setAddIOCOpen(true)}
            className="d-flex align-items-center gap-2">
            <Plus size={15} /> Add IOC
          </Button>
        </div>
      </div>

      {/* Live source badges */}
      {liveCnt > 0 && (
        <div className="d-flex flex-wrap gap-2 mb-4">
          {[
            { label: 'IPsum',           desc: 'Malicious IP clusters', count: liveThreats.filter(t => t.source.includes('IPsum')).length,       color: '#d9534f'  },
            { label: 'MISP Ransomware', desc: 'Active families',       count: liveThreats.filter(t => t.source.includes('Ransomware')).length,   color: '#6f42c1' },
            { label: 'MISP Actors',     desc: 'APT / threat groups',   count: liveThreats.filter(t => t.source.includes('Threat Actor')).length, color: '#3B82EC' },
          ].map(src => (
            <button key={src.label} onClick={handleOpenLivePanel}
              className="btn btn-light border d-flex align-items-center gap-2"
              style={{ fontSize: '0.78rem', borderRadius: 8 }}>
              <span className="live-dot" style={{ width: 7, height: 7 }} />
              <span className="fw-medium">{src.label}</span>
              <span className="text-muted">{src.desc}</span>
              <span className="fw-semibold" style={{ color: src.color }}>{src.count}</span>
            </button>
          ))}
          {addedIds.size > 0 && (
            <div className="d-flex align-items-center gap-1 px-3 py-1 rounded-3 border"
              style={{ background: 'rgba(75,191,115,0.08)', borderColor: 'rgba(75,191,115,0.3)', color: '#4BBF73', fontSize: '0.78rem' }}>
              <CheckCircle size={13} /> {addedIds.size} added to IOC Register
            </div>
          )}
        </div>
      )}

      {/* Proxy offline alert */}
      {fetchError && liveCnt === 0 && (
        <div className="alert alert-warning d-flex align-items-start gap-3 mb-4" role="alert">
          <AlertTriangle size={16} className="flex-shrink-0 mt-1" />
          <div>
            <div className="fw-medium">Proxy server not running</div>
            <div style={{ fontSize: '0.8rem' }}>
              Open a terminal and run: <code>node threat-proxy.cjs</code>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <Row className="g-3 mb-4">
        {[
          { label: 'Active Threats', value: activeCnt,    cls: 'stat-card-danger',   color: '#d9534f'  },
          { label: 'Critical',       value: critCnt,      cls: 'stat-card-warning',  color: '#fd7e14'  },
          { label: 'Mitigated',      value: mitigatedCnt, cls: 'stat-card-success',  color: '#4BBF73'  },
        ].map(s => (
          <Col key={s.label} xs={4}>
            <Card className={`shadow-sm border h-100 ${s.cls}`}>
              <Card.Body className="py-3 px-3">
                <div className="fw-bold mb-1" style={{ fontSize: '1.5rem', color: s.color }}>{s.value}</div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>{s.label}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Tabs */}
      <Nav variant="tabs" className="mb-3" activeKey={tab} onSelect={k => setTab(k as 'feeds' | 'actors')}>
        <Nav.Item>
          <Nav.Link eventKey="feeds">
            Threat Feeds {tab === 'feeds' && <Badge bg="primary" pill className="ms-1">{filtered.length}</Badge>}
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="actors">Threat Actors</Nav.Link>
        </Nav.Item>
      </Nav>

      {tab === 'feeds' ? (
        <>
          {/* Filters */}
          <Row className="g-2 mb-3">
            <Col xs={12} md={4}>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-white border-end-0">
                  <Search size={14} color="#6c757d" />
                </InputGroup.Text>
                <Form.Control
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search threats, IOCs, families…"
                  className="border-start-0 ps-0"
                />
              </InputGroup>
            </Col>
            <Col xs="auto" key="cat-filter">
              <Form.Select size="sm" value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(o => <option key={`cat-${o}`} value={o}>{o}</option>)}
              </Form.Select>
            </Col>
            <Col xs="auto" key="status-filter">
              <Form.Select size="sm" value={status} onChange={e => setStatus(e.target.value)}>
                {STATUSES.map(o => <option key={`st-${o}`} value={o}>{o}</option>)}
              </Form.Select>
            </Col>
            <Col xs="auto" key="src-filter">
              <Form.Select size="sm" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
                {SOURCES.map(o => <option key={`src-${o}`} value={o}>{o}</option>)}
              </Form.Select>
            </Col>
          </Row>

          {loading && allThreats.length === 0 ? (
            <div>
              {[1,2,3].map(n => (
                <Card key={n} className="mb-3 shadow-sm placeholder-glow">
                  <Card.Body className="py-3">
                    <div className="placeholder col-12 mb-2" style={{ height: 16, borderRadius: 4 }} />
                    <div className="placeholder col-8" style={{ height: 12, borderRadius: 4 }} />
                  </Card.Body>
                </Card>
              ))}
            </div>
          ) : (
            <div>
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
                <Card className="shadow-sm">
                  <Card.Body className="py-5 text-center text-muted">
                    No threats match the current filters.
                  </Card.Body>
                </Card>
              )}
            </div>
          )}
        </>
      ) : (
        <Row className="g-3">
          {mockThreatActors.map(actor => (
            <Col key={actor.id} md={6}>
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                    <div>
                      <h6 className="fw-semibold mb-0">{actor.name}</h6>
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                        {actor.type} · {actor.sophistication} sophistication
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
                        background: actor.active ? '#d9534f' : '#adb5bd',
                        animation: actor.active ? 'pg-pulse 1.5s infinite' : 'none',
                      }} />
                      <span className={`fw-medium`} style={{ fontSize: '0.78rem', color: actor.active ? '#d9534f' : '#6c757d' }}>
                        {actor.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-muted mb-1" style={{ fontSize: '0.72rem' }}>Motivation</div>
                    <div className="d-flex flex-wrap gap-1">
                      {actor.motivation.map(m => (
                        <Badge key={m} bg="danger" className="fw-normal" style={{ fontSize: '0.7rem' }}>{m}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="text-muted mb-1" style={{ fontSize: '0.72rem' }}>Target Sectors</div>
                    <div className="d-flex flex-wrap gap-1">
                      {actor.target_sectors.map(s => (
                        <span key={s} className="badge rounded-pill"
                          style={{ background: '#f4f7f9', color: '#495057', border: '1px solid #dee2e6', fontSize: '0.7rem', fontWeight: 400 }}>{s}</span>
                      ))}
                    </div>
                  </div>

                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Last seen: {actor.last_seen}</div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
