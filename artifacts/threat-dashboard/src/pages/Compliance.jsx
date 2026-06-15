import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, MinusCircle, RefreshCw, ChevronRight, Calendar, User, Clock, AlertTriangle, PlayCircle } from 'react-feather';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import {
  fetchFrameworks, fetchAssessments, fetchControls, createAssessment,
} from '../lib/complianceData';
import RunAssessmentModal from '../components/RunAssessmentModal';
import AssessmentReviewPanel from '../components/AssessmentReviewPanel';

function ScoreRing({ score, size = 72 }) {
  const r = (size / 2) - 7;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? '#4BBF73' : score >= 60 ? '#f0ad4e' : '#d9534f';
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e9ecef" strokeWidth="6" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize="13" fontWeight="bold" fontFamily="Poppins,sans-serif">
        {score}%
      </text>
    </svg>
  );
}

function ControlBar({ compliant, partial, noncompliant }) {
  const total = compliant + partial + noncompliant;
  if (total === 0) return <div style={{ height: 6, background: '#e9ecef', borderRadius: 999 }} />;
  return (
    <div style={{ display: 'flex', borderRadius: 999, overflow: 'hidden', height: 6, gap: 1 }}>
      {compliant    > 0 && <div style={{ background: '#4BBF73', width: `${(compliant    / total) * 100}%`, transition: 'width 0.8s' }} />}
      {partial      > 0 && <div style={{ background: '#f0ad4e', width: `${(partial      / total) * 100}%`, transition: 'width 0.8s' }} />}
      {noncompliant > 0 && <div style={{ background: '#d9534f', width: `${(noncompliant / total) * 100}%`, transition: 'width 0.8s' }} />}
    </div>
  );
}

const categoryStyle = (cat) => {
  if (cat === 'Security') return { bg: '#eff6ff', color: '#3B82EC', border: '#bfdbfe' };
  if (cat === 'Privacy')  return { bg: '#f0fdf4', color: '#4BBF73', border: '#bbf7d0' };
  if (cat === 'Industry') return { bg: '#fffbeb', color: '#f0ad4e', border: '#fde68a' };
  return { bg: '#f9fafb', color: '#6c757d', border: '#e4e7ec' };
};

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function statusChipStyle(s) {
  if (s === 'completed')   return { bg: '#f0fdf4', color: '#4BBF73', border: '#bbf7d0' };
  if (s === 'in_progress') return { bg: '#fffbeb', color: '#f0ad4e', border: '#fde68a' };
  return { bg: '#f9fafb', color: '#98a2b3', border: '#e4e7ec' };
}

export default function Compliance() {
  const [frameworks, setFrameworks]     = useState([]);
  const [loadingFw,  setLoadingFw]      = useState(true);
  const [fwError,    setFwError]        = useState(null);
  const [selectedFwId, setSelectedFwId] = useState(null);
  const [assessments,  setAssessments]  = useState([]);
  const [loadingAss,   setLoadingAss]   = useState(false);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [preselectedId, setPreselectedId] = useState(undefined);
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000); };

  const loadFrameworks = useCallback(async () => {
    setLoadingFw(true); setFwError(null);
    try { setFrameworks(await fetchFrameworks()); }
    catch (e) { setFwError(e.message); }
    finally   { setLoadingFw(false); }
  }, []);

  useEffect(() => { loadFrameworks(); }, [loadFrameworks]);

  const loadAssessments = useCallback(async (fwId) => {
    setLoadingAss(true);
    try { setAssessments(await fetchAssessments(fwId)); }
    catch { setAssessments([]); }
    finally { setLoadingAss(false); }
  }, []);

  const handleFrameworkClick = (fw) => {
    if (selectedFwId === fw.id) { setSelectedFwId(null); setAssessments([]); }
    else { setSelectedFwId(fw.id); loadAssessments(fw.id); }
  };

  const handleRunAssessment = (preId) => { setPreselectedId(preId); setRunModalOpen(true); };

  const handleStartAssessment = async (form) => {
    const controls = await fetchControls(form.framework_id);
    const assessmentId = await createAssessment(form, controls);
    const fw = frameworks.find(f => f.id === form.framework_id);
    setRunModalOpen(false);
    setActiveAssessment({ id: assessmentId, frameworkName: fw?.name ?? 'Unknown', assessedBy: form.assessed_by });
  };

  const handleAssessmentComplete = async (score) => {
    setActiveAssessment(null);
    showToast(`Assessment completed! Overall score: ${score}%`);
    await loadFrameworks();
    if (selectedFwId) loadAssessments(selectedFwId);
  };

  const selectedFw    = frameworks.find(f => f.id === selectedFwId);
  const avgScore      = frameworks.length > 0 ? Math.round(frameworks.reduce((s, f) => s + f.score, 0) / frameworks.length) : 0;
  const totalControls = frameworks.reduce((s, f) => s + f.controls_total, 0);
  const totalCompliant = frameworks.reduce((s, f) => s + f.controls_compliant, 0);

  return (
    <div className="progrec-page p-4 p-lg-5">
      {toast && (
        <div className={`pg-toast ${toast.ok ? '' : 'pg-toast-warning'}`}>
          {toast.ok ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: '#101828' }}>Compliance Management</h5>
          <span style={{ fontSize: '0.82rem', color: '#667085' }}>
            {frameworks.length} frameworks · {totalControls} controls · Average {avgScore}% compliant
          </span>
        </div>
        <div className="d-flex gap-2">
          <button onClick={loadFrameworks} disabled={loadingFw} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2">
            <RefreshCw size={14} className={loadingFw ? 'spin' : ''} /> Refresh
          </button>
          <button onClick={() => handleRunAssessment()} className="btn btn-sm btn-primary d-flex align-items-center gap-2">
            <PlayCircle size={14} /> Run Assessment
          </button>
        </div>
      </div>

      {/* Error */}
      {fwError && (
        <div className="d-flex align-items-center gap-2 mb-4 p-3 rounded" style={{ background: '#fff5f5', border: '1px solid #fecaca', color: '#d9534f', fontSize: '0.82rem' }}>
          <AlertTriangle size={15} /> {fwError}
        </div>
      )}

      {/* Summary KPIs */}
      {!loadingFw && frameworks.length > 0 && (
        <Row className="g-3 mb-4">
          {[
            { label: 'Avg Compliance',     value: `${avgScore}%`,                       accent: '#3B82EC', cls: 'stat-card-primary' },
            { label: 'Controls Compliant', value: `${totalCompliant}/${totalControls}`,  accent: '#4BBF73', cls: 'stat-card-success' },
            { label: 'Frameworks Active',  value: String(frameworks.length),             accent: '#667085', cls: '' },
          ].map(s => (
            <Col key={s.label} xs={4}>
              <Card className={`border shadow-sm h-100 ${s.cls}`} style={{ borderRadius: 10 }}>
                <Card.Body className="p-3">
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: s.accent, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                  <div style={{ fontSize: '0.78rem', color: '#667085' }}>{s.label}</div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Loading skeleton */}
      {loadingFw && (
        <Row className="g-3 mb-4">
          {[1,2,3,4,5,6].map(i => (
            <Col key={i} xs={12} md={6} xl={4}>
              <div className="rounded p-4" style={{ background: '#f9fafb', border: '1px solid #e4e7ec', height: 140 }} />
            </Col>
          ))}
        </Row>
      )}

      {/* Framework cards */}
      {!loadingFw && frameworks.length > 0 && (
        <Row className="g-3 mb-4">
          {frameworks.map(fw => {
            const active = selectedFwId === fw.id;
            const cs = categoryStyle(fw.category);
            return (
              <Col key={fw.id} xs={12} md={6} xl={4}>
                <Card className="h-100 shadow-sm" style={{
                  borderRadius: 10, border: active ? '2px solid #3B82EC' : '1px solid #e4e7ec',
                  background: active ? '#f8faff' : '#fff', cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <button className="border-0 bg-transparent w-100 text-start p-4" onClick={() => handleFrameworkClick(fw)}>
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <ScoreRing score={fw.score} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                          <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#101828' }}>{fw.name}</span>
                          <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: 6, background: cs.bg, color: cs.color, border: `1px solid ${cs.border}` }}>{fw.category}</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#98a2b3' }}>v{fw.version} · {fw.controls_total} controls</span>
                        <ChevronRight size={13} color={active ? '#3B82EC' : '#98a2b3'} style={{ display: 'block', marginTop: 4, transform: active ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                      </div>
                    </div>
                    <ControlBar compliant={fw.controls_compliant} partial={fw.controls_partial} noncompliant={fw.controls_noncompliant} />
                    <div className="d-flex justify-content-between mt-2" style={{ fontSize: '0.72rem' }}>
                      <span className="d-flex align-items-center gap-1" style={{ color: '#4BBF73' }}><CheckCircle size={11} /> {fw.controls_compliant}</span>
                      <span className="d-flex align-items-center gap-1" style={{ color: '#f0ad4e' }}><MinusCircle size={11} /> {fw.controls_partial}</span>
                      <span className="d-flex align-items-center gap-1" style={{ color: '#d9534f' }}><XCircle size={11} /> {fw.controls_noncompliant}</span>
                    </div>
                  </button>
                  <div className="px-4 pb-4">
                    <button onClick={() => handleRunAssessment(fw.id)} className="btn btn-sm btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2" style={{ fontSize: '0.75rem' }}>
                      <PlayCircle size={12} /> Run Assessment
                    </button>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Assessment history */}
      {selectedFwId && selectedFw && (
        <Card className="shadow-sm border-0" style={{ borderRadius: 10, overflow: 'hidden' }}>
          <Card.Header className="bg-white d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: '1px solid #e4e7ec' }}>
            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#101828' }}>{selectedFw.name} — Assessment History</div>
            <button onClick={() => handleRunAssessment(selectedFwId)} className="btn btn-sm btn-primary d-flex align-items-center gap-2">
              <PlayCircle size={12} /> New Assessment
            </button>
          </Card.Header>

          {loadingAss ? (
            <div className="py-5 text-center"><RefreshCw size={20} color="#3B82EC" className="spin" /></div>
          ) : assessments.length === 0 ? (
            <div className="py-5 text-center">
              <div style={{ color: '#98a2b3', fontSize: '0.88rem', fontWeight: 500 }}>No assessments yet for {selectedFw.name}</div>
              <div style={{ color: '#b0b8c4', fontSize: '0.78rem', marginTop: 4 }}>Run your first assessment to track posture over time</div>
            </div>
          ) : (
            <div>
              {assessments.map(a => {
                const scs = statusChipStyle(a.status);
                return (
                  <div key={a.id} className="d-flex align-items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #f4f7f9' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 20, background: scs.bg, color: scs.color, border: `1px solid ${scs.border}`, fontWeight: 500 }}>
                          {a.status === 'in_progress' ? 'In Progress' : a.status === 'completed' ? 'Completed' : 'Cancelled'}
                        </span>
                        {a.notes && <span style={{ color: '#667085', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>{a.notes}</span>}
                      </div>
                      <div className="d-flex align-items-center flex-wrap gap-3" style={{ fontSize: '0.75rem', color: '#98a2b3' }}>
                        <span className="d-flex align-items-center gap-1"><User size={11} /> {a.assessed_by}</span>
                        <span className="d-flex align-items-center gap-1"><Calendar size={11} /> {fmtDate(a.started_at)}</span>
                        {a.completed_at && <span className="d-flex align-items-center gap-1"><Clock size={11} /> {fmtTime(a.completed_at)}</span>}
                      </div>
                    </div>
                    <div className="text-end flex-shrink-0">
                      {a.overall_score != null ? (
                        <div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: a.overall_score >= 80 ? '#4BBF73' : a.overall_score >= 60 ? '#f0ad4e' : '#d9534f', fontVariantNumeric: 'tabular-nums' }}>{a.overall_score}%</div>
                          <div style={{ fontSize: '0.68rem', color: '#98a2b3' }}>overall</div>
                        </div>
                      ) : (
                        <span style={{ color: '#98a2b3', fontSize: '0.78rem' }}>pending</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {runModalOpen && (
        <RunAssessmentModal frameworks={frameworks} preselectedId={preselectedId} onClose={() => setRunModalOpen(false)} onStart={handleStartAssessment} />
      )}
      {activeAssessment && (
        <AssessmentReviewPanel assessmentId={activeAssessment.id} frameworkName={activeAssessment.frameworkName} assessedBy={activeAssessment.assessedBy} onClose={() => setActiveAssessment(null)} onComplete={handleAssessmentComplete} />
      )}
    </div>
  );
}
