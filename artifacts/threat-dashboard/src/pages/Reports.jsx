import { useState } from 'react';
import { Download, FileText, Calendar, BarChart2, Shield, TrendingUp, DollarSign, AlertTriangle, CheckCircle, Clock, Users, RefreshCw } from 'react-feather';
import { Card, Row, Col } from 'react-bootstrap';
import {
  mockKPIs, mockOrg, mockRisks, mockComplianceFrameworks, mockIncidents,
  mockVulnerabilities, mockAssets, mockRegulatoryMetrics, mockMonteCarloResults,
} from '../lib/mockData';
import { pdfGenerators } from '../lib/pdfExport';

const fmt$ = (n) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K`
  : `$${n}`;

const TODAY     = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const TODAY_ISO = new Date().toISOString().slice(0, 10);

const reportTemplates = [
  { id: 'exec',       title: 'Executive Risk Summary',       icon: TrendingUp,    category: 'Executive',   lastGenerated: '2026-05-10', frequency: 'Monthly',   description: 'High-level KPIs, risk trend, compliance posture, and board-level metrics.',                           sections: ['Risk Overview','Financial Exposure','Compliance Summary','Top Risks','Incident Summary'] },
  { id: 'fair',       title: 'FAIR Financial Risk Report',   icon: DollarSign,    category: 'Financial',   lastGenerated: '2026-05-12', frequency: 'Monthly',   description: 'ALE analysis, Monte Carlo VaR distribution, remediation ROI and treatment investment.',              sections: ['Aggregate ALE','VaR Percentiles','Per-Risk FAIR Analysis','Remediation ROI','Treatment Budget'] },
  { id: 'board',      title: 'Board & Executive Deck',       icon: Users,         category: 'Executive',   lastGenerated: '2026-05-01', frequency: 'Quarterly', description: 'One-page board summary: VaR, DORA/NIS2 status, top financial risks, and mitigation spend.',            sections: ['VaR & ALE Summary','DORA Compliance','NIS2 Readiness','Investment vs Risk Reduction'] },
  { id: 'risk',       title: 'Full Risk Register Report',    icon: Shield,        category: 'Risk',        lastGenerated: '2026-05-12', frequency: 'Weekly',    description: 'Complete risk register with FAIR scoring, treatment plans, GRC framework linkage.',                   sections: ['Risk Register Table','Heat Map','Treatment Mix','Framework Linkage'] },
  { id: 'compliance', title: 'Compliance Status Report',     icon: FileText,      category: 'Compliance',  lastGenerated: '2026-05-01', frequency: 'Monthly',   description: 'Framework-by-framework compliance posture with gap analysis and assessment history.',                  sections: ['Framework Scores','Control Gap Analysis','Assessment History','Remediation Roadmap'] },
  { id: 'dora',       title: 'DORA / NIS2 Regulatory Report',icon: AlertTriangle, category: 'Regulatory',  lastGenerated: '2026-05-08', frequency: 'Monthly',   description: 'DORA ICT incident reporting status, RTO/RPO metrics, and NIS2 readiness breakdown.',                 sections: ['DORA Incident Register','RTO/RPO Status','NIS2 Gap Assessment','3rd Party ICT Risk'] },
  { id: 'vuln',       title: 'Vulnerability Management Report',icon: BarChart2,  category: 'Technical',   lastGenerated: '2026-05-13', frequency: 'Weekly',    description: 'Open CVEs, CVSS distribution, remediation SLA tracking, asset exposure.',                            sections: ['CVE Summary','CVSS Distribution','SLA Compliance','Asset Exposure'] },
  { id: 'incident',   title: 'Incident Response Summary',    icon: Calendar,      category: 'Operations',  lastGenerated: '2026-05-12', frequency: 'Weekly',    description: 'MTTR, MTTD, financial impact per incident, DORA reportability, and lessons learned.',                sections: ['Incident Overview','Financial Impact','DORA Reportable Events','MTTR / MTTD'] },
];

const categoryStyle = (cat) => {
  if (cat === 'Executive')  return { bg: '#eff6ff', color: '#3B82EC', border: '#bfdbfe' };
  if (cat === 'Financial')  return { bg: '#f0fdf4', color: '#4BBF73', border: '#bbf7d0' };
  if (cat === 'Risk')       return { bg: '#fff5f5', color: '#d9534f', border: '#fecaca' };
  if (cat === 'Compliance') return { bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' };
  if (cat === 'Regulatory') return { bg: '#fffbeb', color: '#f0ad4e', border: '#fde68a' };
  if (cat === 'Technical')  return { bg: '#fff7ed', color: '#fd7e14', border: '#fed7aa' };
  return { bg: '#f9fafb', color: '#6c757d', border: '#e4e7ec' };
};

export default function Reports() {
  const [generating, setGenerating] = useState(null);
  const [toast,      setToast]      = useState(null);

  const openRisks      = mockRisks.filter(r => r.status === 'Open').length;
  const criticalRisks  = mockRisks.filter(r => r.inherent_score >= 16).length;
  const avgCompliance  = Math.round(mockComplianceFrameworks.reduce((s, f) => s + f.score, 0) / mockComplianceFrameworks.length);
  const totalALE       = mockRisks.reduce((s, r) => s + r.fair.ale, 0);
  const totalTreatment = mockRisks.reduce((s, r) => s + r.treatment_cost, 0);
  const avgROI         = Math.round(mockRisks.filter(r => r.remediation_roi > 0).reduce((s, r) => s + r.remediation_roi, 0) / mockRisks.filter(r => r.remediation_roi > 0).length);
  const totalFinancial = mockIncidents.reduce((s, i) => s + i.financial_impact_estimate, 0);
  const openCVEs       = mockVulnerabilities.filter(v => v.status === 'Open').length;
  const criticalCVEs   = mockVulnerabilities.filter(v => v.severity === 'Critical').length;
  const doraIncidents  = mockIncidents.filter(i => i.is_dora_reportable);
  const doraReported   = doraIncidents.filter(i => i.dora_reported).length;

  const handleGenerate = async (id, title) => {
    setGenerating(id);
    await new Promise(r => setTimeout(r, 800));
    pdfGenerators[id]?.();
    setGenerating(null);
    setToast(`"${title}" exported as PDF`);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="progrec-page p-4 p-lg-5">
      {toast && (
        <div className="pg-toast">
          <CheckCircle size={14} color="#4BBF73" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: '#101828' }}>Reports & Analytics</h5>
          <span style={{ fontSize: '0.82rem', color: '#667085' }}>Export financial risk, compliance, DORA/NIS2, and operational reports</span>
        </div>
      </div>

      {/* Live posture snapshot */}
      <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: 10 }}>
        <Card.Body className="p-4">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#101828' }}>{mockOrg.name} — Live Posture Snapshot</div>
              <div style={{ fontSize: '0.75rem', color: '#98a2b3' }}>{mockOrg.industry} · {TODAY}</div>
            </div>
            <div className="d-flex align-items-center gap-1 px-3 py-1 rounded" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '0.75rem', color: '#4BBF73' }}>
              <span className="live-dot" style={{ background: '#4BBF73' }} /> Live
            </div>
          </div>
          <Row className="g-3 mb-3">
            {[
              { l: 'Risk Score',    v: `${mockOrg.overallRiskScore}/100`, c: '#fd7e14' },
              { l: 'Aggregate ALE', v: fmt$(totalALE),                    c: '#d9534f' },
              { l: 'VaR 95th Pct', v: fmt$(mockKPIs.valueAtRisk_95),      c: '#d9534f' },
              { l: 'Treatment $',  v: fmt$(totalTreatment),               c: '#3B82EC' },
              { l: 'Avg ROI',      v: `${avgROI}%`,                       c: '#4BBF73' },
              { l: 'Compliance',   v: `${avgCompliance}%`,                c: '#3B82EC' },
              { l: 'DORA Ready',   v: `${mockRegulatoryMetrics.dora.readiness}%`, c: '#f0ad4e' },
              { l: 'NIS2 Ready',   v: `${mockRegulatoryMetrics.nis2.readiness}%`, c: '#f0ad4e' },
            ].map(s => (
              <Col key={s.l} xs={6} sm={3} xl={Math.floor(12/8)}>
                <div className="text-center p-2 rounded" style={{ background: '#f9fafb', border: '1px solid #e4e7ec' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: s.c, fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
                  <div style={{ fontSize: '0.68rem', color: '#98a2b3' }}>{s.l}</div>
                </div>
              </Col>
            ))}
          </Row>
          <div className="row g-2 pt-3" style={{ borderTop: '1px solid #e4e7ec' }}>
            {[
              { l: 'Open Risks',             v: String(openRisks),             sub: `${criticalRisks} critical`,   icon: AlertTriangle, c: '#d9534f' },
              { l: 'Financial Impact (YTD)', v: fmt$(totalFinancial),           sub: 'Incident estimates',          icon: DollarSign,    c: '#fd7e14' },
              { l: 'DORA Incidents',         v: String(doraIncidents.length),   sub: `${doraReported} reported`,    icon: Clock,         c: '#f0ad4e' },
              { l: 'Open CVEs',              v: String(openCVEs),               sub: `${criticalCVEs} critical`,    icon: Shield,        c: '#3B82EC' },
            ].map(s => (
              <div key={s.l} className="col-6 col-md-3">
                <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ background: '#f9fafb', border: '1px solid #e4e7ec' }}>
                  <s.icon size={15} color={s.c} />
                  <div>
                    <div style={{ fontWeight: 700, color: s.c, fontVariantNumeric: 'tabular-nums', fontSize: '0.9rem' }}>{s.v}</div>
                    <div style={{ fontSize: '0.72rem', color: '#344054' }}>{s.l}</div>
                    <div style={{ fontSize: '0.65rem', color: '#98a2b3' }}>{s.sub}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Report templates */}
      <div className="mb-2 d-flex align-items-center justify-content-between mb-3">
        <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#98a2b3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Report Templates</div>
        <div style={{ fontSize: '0.72rem', color: '#98a2b3' }}>Click Generate to download PDF</div>
      </div>
      <Row className="g-3 mb-4">
        {reportTemplates.map(rpt => {
          const Icon        = rpt.icon;
          const isGen       = generating === rpt.id;
          const cs          = categoryStyle(rpt.category);
          return (
            <Col key={rpt.id} xs={12} sm={6} xl={3}>
              <Card className="h-100 shadow-sm border-0" style={{ borderRadius: 10 }}>
                <Card.Body className="p-4 d-flex flex-column">
                  <div className="d-flex align-items-start gap-3 mb-3">
                    <div className="d-flex align-items-center justify-content-center rounded flex-shrink-0" style={{ width: 36, height: 36, background: '#f4f7f9', border: '1px solid #e4e7ec' }}>
                      <Icon size={17} color="#667085" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: 20, background: cs.bg, color: cs.color, border: `1px solid ${cs.border}`, fontWeight: 500 }}>{rpt.category}</span>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#101828', marginTop: 6, lineHeight: 1.3 }}>{rpt.title}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#667085', lineHeight: 1.6, flex: 1 }}>{rpt.description}</p>

                  <div className="d-flex flex-wrap gap-1 mb-3">
                    {rpt.sections.map(s => (
                      <span key={s} style={{ fontSize: '0.65rem', background: '#f4f7f9', border: '1px solid #e4e7ec', borderRadius: 4, padding: '1px 6px', color: '#667085' }}>{s}</span>
                    ))}
                  </div>

                  <div className="d-flex align-items-center justify-content-between mt-auto">
                    <div style={{ fontSize: '0.72rem', color: '#98a2b3' }}>
                      <span style={{ color: '#667085' }}>{rpt.frequency}</span> · {rpt.lastGenerated}
                    </div>
                    <button onClick={() => handleGenerate(rpt.id, rpt.title)} disabled={isGen}
                      className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                      {isGen ? <><RefreshCw size={11} className="spin" /> Generating…</> : <><Download size={11} /> Generate</>}
                    </button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* VaR + Compliance inline */}
      <Row className="g-3">
        <Col xs={12} xl={6}>
          <Card className="shadow-sm border-0 h-100" style={{ borderRadius: 10 }}>
            <Card.Header className="bg-white d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: '1px solid #e4e7ec' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#101828' }}>Value at Risk — Monte Carlo</div>
                <div style={{ fontSize: '0.72rem', color: '#98a2b3' }}>{mockMonteCarloResults.simulations.toLocaleString()} simulations · FAIR model</div>
              </div>
              <button onClick={() => handleGenerate('fair', 'FAIR Financial Risk Report')} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                <Download size={11} /> Export
              </button>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="d-flex flex-column gap-2">
                {mockMonteCarloResults.percentiles.map(p => {
                  const max   = mockMonteCarloResults.percentiles[mockMonteCarloResults.percentiles.length - 1].value;
                  const color = p.pct >= 95 ? '#d9534f' : p.pct >= 90 ? '#fd7e14' : p.pct >= 75 ? '#f0ad4e' : '#3B82EC';
                  return (
                    <div key={p.pct} className="d-flex align-items-center gap-2">
                      <span style={{ fontSize: '0.72rem', color: '#98a2b3', width: 28, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.pct}%</span>
                      <div style={{ flex: 1, height: 10, background: '#f0f0f0', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 999, background: color, width: `${(p.value / max) * 100}%` }} />
                      </div>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 600, color, width: 52 }}>{fmt$(p.value)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="d-flex gap-4 mt-3 pt-3" style={{ borderTop: '1px solid #e4e7ec', fontSize: '0.78rem', color: '#98a2b3' }}>
                <span>Mean: <strong style={{ color: '#344054' }}>{fmt$(mockMonteCarloResults.mean_loss)}</strong></span>
                <span>Std Dev: <strong style={{ color: '#344054' }}>{fmt$(mockMonteCarloResults.std_dev)}</strong></span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} xl={6}>
          <Card className="shadow-sm border-0 h-100" style={{ borderRadius: 10 }}>
            <Card.Header className="bg-white d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: '1px solid #e4e7ec' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#101828' }}>Compliance Framework Scores</div>
                <div style={{ fontSize: '0.72rem', color: '#98a2b3' }}>Posture across {mockComplianceFrameworks.length} active frameworks</div>
              </div>
              <button onClick={() => handleGenerate('compliance', 'Compliance Status Report')} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                <Download size={11} /> Export
              </button>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="d-flex flex-column gap-2">
                {mockComplianceFrameworks.map(fw => (
                  <div key={fw.id} className="d-flex align-items-center gap-2">
                    <span style={{ width: 72, fontSize: '0.78rem', color: '#667085', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>{fw.name}</span>
                    <div style={{ flex: 1, height: 10, background: '#f0f0f0', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 999, background: fw.score >= 80 ? '#4BBF73' : fw.score >= 65 ? '#f0ad4e' : '#d9534f', width: `${fw.score}%` }} />
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, width: 36, textAlign: 'right', color: fw.score >= 80 ? '#4BBF73' : fw.score >= 65 ? '#f0ad4e' : '#d9534f' }}>{fw.score}%</span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
