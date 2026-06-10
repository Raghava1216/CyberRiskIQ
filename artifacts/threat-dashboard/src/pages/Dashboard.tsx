import { useState } from 'react';
import { Card, Row, Col, Badge, ProgressBar, Nav } from 'react-bootstrap';
import { AlertTriangle, Shield, DollarSign, BarChart2, TrendingUp, CheckCircle, ArrowUpRight, ArrowDownRight } from 'react-feather';
import {
  mockOrg, mockKPIs, mockRisks, mockIncidents, mockComplianceFrameworks,
  mockRiskTrend, mockRegulatoryMetrics, mockMonteCarloResults, mockTreatmentMix,
} from '../lib/mockData';
import type { NavPage } from '../lib/types';

interface DashboardProps { onNavigate: (p: NavPage) => void }

const fmt$ = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K`
  : `$${n}`;

function ScoreGauge({ score }: { score: number }) {
  const r = 54; const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ * 0.75;
  const color = score <= 40 ? '#4BBF73' : score <= 65 ? '#f0ad4e' : '#d9534f';
  return (
    <div className="d-flex justify-content-center">
      <svg width={140} height={100} viewBox="0 0 140 100">
        <path d="M 16 90 A 54 54 0 0 1 124 90" fill="none" stroke="#e9ecef" strokeWidth="10" strokeLinecap="round" />
        <path d="M 16 90 A 54 54 0 0 1 124 90" fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 1s ease' }} />
        <text x="70" y="82" textAnchor="middle" fill={color} fontSize="26" fontWeight="bold">{score}</text>
        <text x="70" y="97" textAnchor="middle" fill="#98a2b3" fontSize="10">/ 100</text>
      </svg>
    </div>
  );
}

const BAR_AREA_H = 96; // px — bar column height

function MiniBar({ month, critical, high, medium, low, maxVal }: {
  month: string; critical: number; high: number; medium: number; low: number; maxVal: number;
}) {
  const total   = critical + high + medium + low;
  // Scale total column height proportionally; each segment carved from that height
  const colH    = maxVal > 0 ? (total / maxVal) * BAR_AREA_H : 0;
  const segH    = (v: number) => total > 0 ? Math.max(2, (v / total) * colH) : 0;

  const segs = [
    { v: low,      c: '#3B82EC99', label: 'low'      },
    { v: medium,   c: '#f0ad4e99', label: 'medium'   },
    { v: high,     c: '#fd7e1499', label: 'high'      },
    { v: critical, c: '#d9534fcc', label: 'critical'  },
  ];

  return (
    <div className="d-flex flex-column align-items-center flex-fill" style={{ gap: 5, minWidth: 0 }}>
      {/* Fixed-height well; bars grow from the bottom */}
      <div style={{ height: BAR_AREA_H, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column-reverse', gap: 1 }}>
          {segs.filter(s => s.v > 0).map(s => (
            <div key={s.label} style={{ height: segH(s.v), background: s.c, borderRadius: 2, width: '100%' }} />
          ))}
        </div>
      </div>
      <span style={{ fontSize: '0.67rem', color: 'var(--pg-text-muted, #667085)', lineHeight: 1 }}>{month}</span>
      <span style={{ fontSize: '0.65rem', color: 'var(--pg-text-subtle, #98a2b3)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{total}</span>
    </div>
  );
}

function VaRBar() {
  const { percentiles } = mockMonteCarloResults;
  const max = percentiles[percentiles.length - 1].value;
  return (
    <div className="d-flex flex-column gap-2">
      {percentiles.map(p => (
        <div key={p.pct} className="d-flex align-items-center gap-2">
          <span style={{ fontSize: '0.72rem', color: '#98a2b3', width: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.pct}%</span>
          <div style={{ flex: 1, height: 14, background: '#f0f0f0', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999,
              width: `${(p.value / max) * 100}%`,
              background: p.pct >= 95 ? '#d9534f' : p.pct >= 90 ? '#fd7e14' : p.pct >= 75 ? '#f0ad4e' : '#3B82EC',
              transition: 'width 0.7s ease',
            }} />
          </div>
          <span style={{
            fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 600, width: 56,
            color: p.pct >= 95 ? '#d9534f' : p.pct >= 90 ? '#fd7e14' : p.pct >= 75 ? '#f0ad4e' : '#3B82EC',
          }}>{fmt$(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function TreatmentDonut() {
  const colors = ['#3B82EC', '#f0ad4e', '#4BBF73', '#d9534f'];
  const total = mockTreatmentMix.reduce((s, t) => s + t.count, 0);
  let cum = 0;
  const r = 36; const cx = 50; const cy = 50; const circ = 2 * Math.PI * r;
  return (
    <div className="d-flex align-items-center gap-4">
      <svg width={100} height={100} viewBox="0 0 100 100">
        {mockTreatmentMix.map((t, i) => {
          const frac = t.count / total;
          const offset = circ * (1 - cum);
          const dash = circ * frac;
          cum += frac;
          return (
            <circle key={t.treatment} cx={cx} cy={cy} r={r} fill="none"
              stroke={colors[i]} strokeWidth="14"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="#101828" fontSize="16" fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#98a2b3" fontSize="8">risks</text>
      </svg>
      <div className="d-flex flex-column gap-2">
        {mockTreatmentMix.map((t, i) => (
          <div key={t.treatment} className="d-flex align-items-center gap-2">
            <div className="rounded-circle flex-shrink-0" style={{ width: 10, height: 10, background: colors[i] }} />
            <span style={{ fontSize: '0.78rem', color: '#667085' }}>{t.treatment}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#344054', marginLeft: 'auto', paddingLeft: 8 }}>{t.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadinessBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="d-flex align-items-center gap-2">
      <span style={{ fontSize: '0.75rem', color: '#667085', width: 160, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: color, borderRadius: 999, width: `${score}%`, transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#344054', width: 36, textAlign: 'right' }}>{score}%</span>
    </div>
  );
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'financial' | 'regulatory'>('financial');
  const maxTrend = Math.max(...mockRiskTrend.map(m => m.critical + m.high + m.medium + m.low));

  const totalALE = mockRisks.reduce((s, r) => s + r.fair.ale, 0);
  const totalTreatmentBudget = mockRisks.reduce((s, r) => s + r.treatment_cost, 0);
  const avgROI = mockRisks.filter(r => r.remediation_roi > 0).reduce((s, r) => s + r.remediation_roi, 0)
    / mockRisks.filter(r => r.remediation_roi > 0).length;

  const doraIncidents = mockIncidents.filter(i => i.is_dora_reportable);
  const doraReported  = doraIncidents.filter(i => i.dora_reported).length;
  const totalFinancialImpact = mockIncidents.reduce((s, i) => s + i.financial_impact_estimate, 0);
  const top5Risks = [...mockRisks].sort((a, b) => b.fair.ale - a.fair.ale).slice(0, 5);

  const kpis = [
    { label: 'Aggregate ALE',      value: fmt$(totalALE),                     sub: 'Annualised Loss Exp.', icon: DollarSign, accent: '#d9534f', nav: 'risks' as NavPage },
    { label: 'VaR 95th Pct',       value: fmt$(mockKPIs.valueAtRisk_95),       sub: 'Monte Carlo',         icon: TrendingUp, accent: '#fd7e14', nav: 'risks' as NavPage },
    { label: 'Treatment Budget',   value: fmt$(totalTreatmentBudget),          sub: 'Total invested',      icon: Shield,     accent: '#3B82EC', nav: 'risks' as NavPage },
    { label: 'DORA Incidents',     value: String(doraIncidents.length),        sub: `${doraReported} reported`, icon: AlertTriangle, accent: '#f0ad4e', nav: 'incidents' as NavPage },
    { label: 'NIS2 Readiness',     value: `${mockKPIs.nis2ReadinessScore}%`,   sub: 'Compliance posture',  icon: CheckCircle, accent: '#4BBF73', nav: 'compliance' as NavPage },
    { label: 'Avg Remediation ROI', value: `${Math.round(avgROI)}%`,           sub: 'Risk reduction return', icon: BarChart2, accent: '#6f42c1', nav: 'risks' as NavPage },
  ];

  return (
    <div className="progrec-page p-4 p-lg-5">

      {/* Page header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: '#101828' }}>{mockOrg.name} — Security Posture</h5>
          <span style={{ fontSize: '0.82rem', color: '#667085' }}>{mockOrg.industry} · {mockOrg.size} · Risk Appetite: {mockOrg.risk_appetite}</span>
        </div>
        <div className="d-flex align-items-center gap-2 px-3 py-2 rounded" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '0.78rem', color: '#16a34a' }}>
          <span className="live-dot" style={{ background: '#4BBF73' }} />
          Live · Updated {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* KPI strip */}
      <Row className="g-3 mb-4">
        {kpis.map(k => (
          <Col key={k.label} xs={6} sm={4} xl={2}>
            <Card className="h-100 border-0 shadow-sm" style={{ cursor: 'pointer', borderRadius: 10 }} onClick={() => onNavigate(k.nav)}>
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 32, height: 32, background: `${k.accent}18` }}>
                    <k.icon size={15} color={k.accent} />
                  </div>
                  <ArrowUpRight size={13} color="#98a2b3" />
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: k.accent, fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
                <div style={{ fontSize: '0.75rem', color: '#344054', fontWeight: 500 }}>{k.label}</div>
                <div style={{ fontSize: '0.7rem', color: '#98a2b3' }}>{k.sub}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Row 2: Score + Trend + Treatment Mix */}
      <Row className="g-3 mb-4">
        <Col xs={12} lg={4}>
          <Card className="h-100 shadow-sm border-0" style={{ borderRadius: 10 }}>
            <Card.Body className="p-4">
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#101828' }}>Overall Risk Score</div>
              <div style={{ fontSize: '0.75rem', color: '#98a2b3', marginBottom: 16 }}>Composite inherent risk posture</div>
              <ScoreGauge score={mockOrg.overallRiskScore} />
              <div className="d-flex align-items-center justify-content-center gap-1 mt-1">
                <ArrowDownRight size={14} color="#4BBF73" />
                <span style={{ color: '#4BBF73', fontSize: '0.82rem', fontWeight: 600 }}>{Math.abs(mockOrg.trend)}% vs last month</span>
              </div>
              <Row className="g-2 mt-3">
                {[
                  { l: 'Critical Risks', v: mockKPIs.criticalRisks,     c: '#d9534f' },
                  { l: 'Open Risks',     v: mockKPIs.totalRisks,        c: '#fd7e14' },
                  { l: 'Compliance',     v: `${mockKPIs.complianceScore}%`, c: '#4BBF73' },
                  { l: 'Threat Alerts',  v: mockKPIs.threatAlerts,      c: '#f0ad4e' },
                ].map(s => (
                  <Col key={s.l} xs={6}>
                    <div className="text-center rounded p-2" style={{ background: '#f9fafb', border: '1px solid #e4e7ec' }}>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: s.c, fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
                      <div style={{ fontSize: '0.68rem', color: '#98a2b3' }}>{s.l}</div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={4}>
          <Card className="h-100 shadow-sm border-0" style={{ borderRadius: 10 }}>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#101828' }}>Risk Trend (7-Month)</div>
                  <div style={{ fontSize: '0.75rem', color: '#98a2b3' }}>Volume by severity level</div>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {[['#d9534fcc','Crit'],['#fd7e1499','High'],['#f0ad4e99','Med'],['#3B82EC99','Low']].map(([c, l]) => (
                    <span key={l} className="d-flex align-items-center gap-1" style={{ fontSize: '0.68rem', color: '#98a2b3' }}>
                      <span className="rounded-1 d-inline-block" style={{ width: 8, height: 8, background: c }} />{l}
                    </span>
                  ))}
                </div>
              </div>
              <div className="d-flex gap-2" style={{ height: BAR_AREA_H + 36 }}>
                {mockRiskTrend.map(m => <MiniBar key={m.month} {...m} maxVal={maxTrend} />)}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={4}>
          <Card className="h-100 shadow-sm border-0" style={{ borderRadius: 10 }}>
            <Card.Body className="p-4">
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#101828' }}>Risk Treatment Mix</div>
              <div style={{ fontSize: '0.75rem', color: '#98a2b3', marginBottom: 16 }}>How risks are being handled</div>
              <TreatmentDonut />
              <div className="d-flex gap-3 justify-content-center mt-4 pt-3" style={{ borderTop: '1px solid #e4e7ec', textAlign: 'center' }}>
                <div>
                  <div style={{ color: '#3B82EC', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt$(totalTreatmentBudget)}</div>
                  <div style={{ fontSize: '0.7rem', color: '#98a2b3' }}>Total Treatment Cost</div>
                </div>
                <div>
                  <div style={{ color: '#4BBF73', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{Math.round(avgROI)}%</div>
                  <div style={{ fontSize: '0.7rem', color: '#98a2b3' }}>Avg Remediation ROI</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Row 3: Financial/Regulatory tabs + Top Risks */}
      <Row className="g-3 mb-4">
        <Col xs={12} xl={7}>
          <Card className="shadow-sm border-0 h-100" style={{ borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ borderBottom: '1px solid #e4e7ec' }}>
              <Nav variant="tabs" className="border-0 px-2 pt-2">
                {(['financial', 'regulatory'] as const).map(tab => (
                  <Nav.Item key={tab}>
                    <Nav.Link active={activeTab === tab} onClick={() => setActiveTab(tab)}
                      style={{ fontSize: '0.82rem', fontFamily: 'Poppins,sans-serif', cursor: 'pointer', color: activeTab === tab ? '#3B82EC' : '#667085' }}>
                      {tab === 'financial' ? 'Financial Risk (FAIR / VaR)' : 'DORA / NIS2 Readiness'}
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>
            </div>

            {activeTab === 'financial' ? (
              <Card.Body className="p-4">
                <Row className="g-2 mb-4">
                  {[
                    { l: 'Aggregate ALE', v: fmt$(totalALE),                    c: '#d9534f', sub: 'Expected annual loss' },
                    { l: 'VaR 90th Pct',  v: fmt$(mockKPIs.valueAtRisk_90),     c: '#fd7e14', sub: 'Monte Carlo' },
                    { l: 'VaR 95th Pct',  v: fmt$(mockKPIs.valueAtRisk_95),     c: '#d9534f', sub: 'Monte Carlo' },
                  ].map(s => (
                    <Col key={s.l} xs={4}>
                      <div className="text-center p-3 rounded" style={{ background: '#f9fafb', border: '1px solid #e4e7ec' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: s.c, fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
                        <div style={{ fontSize: '0.72rem', color: '#344054' }}>{s.l}</div>
                        <div style={{ fontSize: '0.68rem', color: '#98a2b3' }}>{s.sub}</div>
                      </div>
                    </Col>
                  ))}
                </Row>
                <div style={{ fontSize: '0.7rem', color: '#98a2b3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Value at Risk — Monte Carlo Percentiles ({mockMonteCarloResults.simulations.toLocaleString()} simulations)
                </div>
                <VaRBar />
                <div className="d-flex flex-wrap gap-3 mt-3 p-3 rounded" style={{ background: '#f9fafb', border: '1px solid #e4e7ec', fontSize: '0.78rem', color: '#98a2b3' }}>
                  <span>Mean Loss: <strong style={{ color: '#344054' }}>{fmt$(mockMonteCarloResults.mean_loss)}</strong></span>
                  <span>Std Dev: <strong style={{ color: '#344054' }}>{fmt$(mockMonteCarloResults.std_dev)}</strong></span>
                  <span>Incident Impact: <strong style={{ color: '#d9534f' }}>{fmt$(totalFinancialImpact)}</strong></span>
                </div>
              </Card.Body>
            ) : (
              <Card.Body className="p-4">
                {/* DORA */}
                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#101828' }}>DORA — Digital Operational Resilience Act</div>
                    <Badge bg={mockRegulatoryMetrics.dora.readiness >= 80 ? 'success' : mockRegulatoryMetrics.dora.readiness >= 60 ? 'warning' : 'danger'} style={{ fontSize: '0.72rem' }}>
                      {mockRegulatoryMetrics.dora.readiness}% Ready
                    </Badge>
                  </div>
                  <Row className="g-2 mb-3">
                    {[
                      { l: 'ICT Incidents YTD', v: mockRegulatoryMetrics.dora.incidents_ytd,      c: '#f0ad4e' },
                      { l: 'Reported',           v: mockRegulatoryMetrics.dora.incidents_reported, c: '#4BBF73' },
                      { l: 'Pending',            v: mockRegulatoryMetrics.dora.incidents_pending,  c: '#d9534f' },
                      { l: '3rd Party ICT',      v: mockRegulatoryMetrics.dora.third_party_ict_risks, c: '#fd7e14' },
                    ].map(s => (
                      <Col key={s.l} xs={3}>
                        <div className="text-center p-2 rounded" style={{ background: '#f9fafb', border: '1px solid #e4e7ec' }}>
                          <div style={{ fontWeight: 700, color: s.c, fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
                          <div style={{ fontSize: '0.66rem', color: '#98a2b3', lineHeight: 1.2 }}>{s.l}</div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                  <Row className="g-2">
                    {[
                      { l: 'RTO: Target vs Actual', target: `${mockRegulatoryMetrics.dora.rto_target_hours}h`, actual: `${mockRegulatoryMetrics.dora.rto_actual_hours}h`, ok: mockRegulatoryMetrics.dora.rto_actual_hours <= mockRegulatoryMetrics.dora.rto_target_hours },
                      { l: 'RPO: Target vs Actual', target: `${mockRegulatoryMetrics.dora.rpo_target_hours}h`, actual: `${mockRegulatoryMetrics.dora.rpo_actual_hours}h`, ok: mockRegulatoryMetrics.dora.rpo_actual_hours <= mockRegulatoryMetrics.dora.rpo_target_hours },
                    ].map(s => (
                      <Col key={s.l} xs={6}>
                        <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ background: s.ok ? '#f0fdf4' : '#fff5f5', border: `1px solid ${s.ok ? '#bbf7d0' : '#fecaca'}`, fontSize: '0.75rem' }}>
                          <CheckCircle size={12} color={s.ok ? '#4BBF73' : '#d9534f'} />
                          <span style={{ color: '#667085' }}>{s.l}:</span>
                          <span style={{ color: '#344054', fontWeight: 500 }}>{s.target}</span>
                          <span style={{ color: '#98a2b3' }}>/</span>
                          <span style={{ color: s.ok ? '#4BBF73' : '#d9534f', fontWeight: 500 }}>{s.actual}</span>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>

                {/* NIS2 */}
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#101828' }}>NIS2 — Network & Information Security Directive</div>
                    <Badge bg="warning" text="dark" style={{ fontSize: '0.72rem' }}>{mockRegulatoryMetrics.nis2.readiness}% Ready</Badge>
                  </div>
                  <div className="d-flex flex-column gap-2">
                    {[
                      { l: 'Governance & Board Oversight',    s: mockRegulatoryMetrics.nis2.governance_score,         c: '#3B82EC' },
                      { l: 'Technical Security Measures',    s: mockRegulatoryMetrics.nis2.technical_measures_score, c: '#6f42c1' },
                      { l: 'Business Continuity',            s: mockRegulatoryMetrics.nis2.business_continuity_score, c: '#f0ad4e' },
                      { l: 'Incident Handling',              s: mockRegulatoryMetrics.nis2.incident_handling_score,  c: '#4BBF73' },
                      { l: 'Supply Chain Security',          s: mockRegulatoryMetrics.nis2.supply_chain_score,       c: '#d9534f' },
                      { l: 'Cryptography & Encryption',      s: mockRegulatoryMetrics.nis2.cryptography_score,       c: '#3B82EC' },
                    ].map(row => <ReadinessBar key={row.l} label={row.l} score={row.s} color={row.c} />)}
                  </div>
                </div>
              </Card.Body>
            )}
          </Card>
        </Col>

        <Col xs={12} xl={5}>
          <Card className="shadow-sm border-0 h-100" style={{ borderRadius: 10, overflow: 'hidden' }}>
            <Card.Header className="bg-white d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: '1px solid #e4e7ec' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#101828' }}>Top Financial Risks</div>
                <div style={{ fontSize: '0.72rem', color: '#98a2b3' }}>Ranked by ALE (FAIR model)</div>
              </div>
              <button className="btn btn-sm btn-outline-primary" style={{ fontSize: '0.75rem' }} onClick={() => onNavigate('risks')}>View all</button>
            </Card.Header>
            <div>
              {top5Risks.map((r, i) => (
                <div key={r.id} className="px-4 py-3 d-flex align-items-start gap-3" style={{ borderBottom: '1px solid #f4f7f9' }}>
                  <span className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 22, height: 22, background: '#f4f7f9', border: '1px solid #e4e7ec', color: '#667085', fontSize: '0.72rem', fontWeight: 700, marginTop: 2 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 500, color: '#344054', lineHeight: 1.3 }}>{r.title}</div>
                    <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                      <span style={{ color: '#d9534f', fontSize: '0.78rem', fontWeight: 600 }}>{fmt$(r.fair.ale)}</span>
                      <span style={{ color: '#98a2b3', fontSize: '0.72rem' }}>ALE</span>
                      <span style={{ color: '#4BBF73', fontSize: '0.72rem' }}>{r.remediation_roi}% ROI</span>
                    </div>
                    <div className="d-flex gap-1 mt-1 flex-wrap">
                      {r.framework_tags.slice(0, 3).map(f => (
                        <span key={f} style={{ fontSize: '0.65rem', padding: '1px 6px', background: '#f4f7f9', border: '1px solid #e4e7ec', borderRadius: 4, color: '#667085' }}>{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Row 4: Compliance + Incidents */}
      <Row className="g-3">
        <Col xs={12} xl={6}>
          <Card className="shadow-sm border-0" style={{ borderRadius: 10 }}>
            <Card.Header className="bg-white d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: '1px solid #e4e7ec' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#101828' }}>Framework Compliance</div>
                <div style={{ fontSize: '0.72rem', color: '#98a2b3' }}>Active regulatory & security frameworks</div>
              </div>
              <button className="btn btn-sm btn-outline-primary" style={{ fontSize: '0.75rem' }} onClick={() => onNavigate('compliance')}>Manage</button>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="d-flex flex-column gap-2">
                {mockComplianceFrameworks.map(fw => (
                  <div key={fw.id} className="d-flex align-items-center gap-3">
                    <span style={{ width: 80, fontSize: '0.78rem', color: '#667085', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>{fw.name}</span>
                    <div style={{ flex: 1, height: 10, background: '#f0f0f0', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 999, width: `${fw.score}%`, background: fw.score >= 80 ? '#4BBF73' : fw.score >= 65 ? '#f0ad4e' : '#d9534f', transition: 'width 0.8s ease' }} />
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, width: 36, textAlign: 'right', color: fw.score >= 80 ? '#4BBF73' : fw.score >= 65 ? '#f0ad4e' : '#d9534f' }}>{fw.score}%</span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} xl={6}>
          <Card className="shadow-sm border-0" style={{ borderRadius: 10 }}>
            <Card.Header className="bg-white d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: '1px solid #e4e7ec' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#101828' }}>Recent Incidents</div>
                <div style={{ fontSize: '0.72rem', color: '#98a2b3' }}>Financial impact & DORA reportability</div>
              </div>
              <button className="btn btn-sm btn-outline-primary" style={{ fontSize: '0.75rem' }} onClick={() => onNavigate('incidents')}>View all</button>
            </Card.Header>
            <div>
              {mockIncidents.slice(0, 5).map(inc => (
                <div key={inc.id} className="d-flex align-items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #f4f7f9' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 500, color: '#344054', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.title}</div>
                    <div className="d-flex gap-2 mt-1">
                      <span style={{ fontSize: '0.7rem', color: '#98a2b3' }}>{inc.type}</span>
                      {inc.is_dora_reportable && <span style={{ fontSize: '0.7rem', color: '#6f42c1', background: '#f3e8ff', borderRadius: 4, padding: '1px 6px' }}>DORA</span>}
                    </div>
                  </div>
                  <div className="text-end flex-shrink-0">
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#d9534f' }}>{fmt$(inc.financial_impact_estimate)}</div>
                    <Badge bg={inc.priority === 'P1' ? 'danger' : inc.priority === 'P2' ? 'warning' : 'secondary'} style={{ fontSize: '0.65rem' }}>{inc.priority}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

    </div>
  );
}
