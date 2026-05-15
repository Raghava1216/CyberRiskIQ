import { useState } from 'react';
import {
  Download, FileText, Calendar, BarChart2, Shield, TrendingUp,
  DollarSign, AlertTriangle, CheckCircle, Clock, Users, RefreshCw,
} from 'lucide-react';
import {
  mockKPIs, mockOrg, mockRisks, mockComplianceFrameworks, mockIncidents,
  mockVulnerabilities, mockAssets, mockRegulatoryMetrics, mockMonteCarloResults,
} from '../lib/mockData';

const fmt$ = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K`
  : `$${n}`;

const TODAY = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const TODAY_ISO = new Date().toISOString().slice(0, 10);

type ReportId = 'exec' | 'fair' | 'risk' | 'compliance' | 'vuln' | 'incident' | 'dora' | 'board';

interface Template {
  id: ReportId;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  category: string;
  lastGenerated: string;
  frequency: string;
  sections: string[];
}

const reportTemplates: Template[] = [
  {
    id: 'exec', title: 'Executive Risk Summary', icon: TrendingUp, category: 'Executive',
    description: 'High-level KPIs, risk trend, compliance posture, and board-level metrics.',
    lastGenerated: '2026-05-10', frequency: 'Monthly',
    sections: ['Risk Overview', 'Financial Exposure', 'Compliance Summary', 'Top Risks', 'Incident Summary'],
  },
  {
    id: 'fair', title: 'FAIR Financial Risk Report', icon: DollarSign, category: 'Financial',
    description: 'ALE analysis, Monte Carlo VaR distribution, remediation ROI and treatment investment.',
    lastGenerated: '2026-05-12', frequency: 'Monthly',
    sections: ['Aggregate ALE', 'VaR Percentiles', 'Per-Risk FAIR Analysis', 'Remediation ROI', 'Treatment Budget'],
  },
  {
    id: 'board', title: 'Board & Executive Deck', icon: Users, category: 'Executive',
    description: 'One-page board summary: VaR, DORA/NIS2 status, top financial risks, and mitigation spend.',
    lastGenerated: '2026-05-01', frequency: 'Quarterly',
    sections: ['VaR & ALE Summary', 'DORA Compliance', 'NIS2 Readiness', 'Investment vs Risk Reduction'],
  },
  {
    id: 'risk', title: 'Full Risk Register Report', icon: Shield, category: 'Risk',
    description: 'Complete risk register with FAIR scoring, treatment plans, GRC framework linkage.',
    lastGenerated: '2026-05-12', frequency: 'Weekly',
    sections: ['Risk Register Table', 'Heat Map', 'Treatment Mix', 'Framework Linkage'],
  },
  {
    id: 'compliance', title: 'Compliance Status Report', icon: FileText, category: 'Compliance',
    description: 'Framework-by-framework compliance posture with gap analysis and assessment history.',
    lastGenerated: '2026-05-01', frequency: 'Monthly',
    sections: ['Framework Scores', 'Control Gap Analysis', 'Assessment History', 'Remediation Roadmap'],
  },
  {
    id: 'dora', title: 'DORA / NIS2 Regulatory Report', icon: AlertTriangle, category: 'Regulatory',
    description: 'DORA ICT incident reporting status, RTO/RPO metrics, and NIS2 readiness breakdown.',
    lastGenerated: '2026-05-08', frequency: 'Monthly',
    sections: ['DORA Incident Register', 'RTO/RPO Status', 'NIS2 Gap Assessment', '3rd Party ICT Risk'],
  },
  {
    id: 'vuln', title: 'Vulnerability Management Report', icon: BarChart2, category: 'Technical',
    description: 'Open CVEs, CVSS distribution, remediation SLA tracking, asset exposure.',
    lastGenerated: '2026-05-13', frequency: 'Weekly',
    sections: ['CVE Summary', 'CVSS Distribution', 'SLA Compliance', 'Asset Exposure'],
  },
  {
    id: 'incident', title: 'Incident Response Summary', icon: Calendar, category: 'Operations',
    description: 'MTTR, MTTD, financial impact per incident, DORA reportability, and lessons learned.',
    lastGenerated: '2026-05-12', frequency: 'Weekly',
    sections: ['Incident Overview', 'Financial Impact', 'DORA Reportable Events', 'MTTR / MTTD'],
  },
];

const categoryColors: Record<string, string> = {
  Executive:   'bg-blue-500/15 text-blue-400 border-blue-500/20',
  Financial:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  Risk:        'bg-red-500/15 text-red-400 border-red-500/20',
  Compliance:  'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  Regulatory:  'bg-amber-500/15 text-amber-400 border-amber-500/20',
  Technical:   'bg-orange-500/15 text-orange-400 border-orange-500/20',
  Operations:  'bg-slate-600/40 text-slate-300 border-slate-600',
};

// ── CSV generators ──────────────────────────────────────────────────────────

function generateFAIRCsv() {
  const headers = ['Risk ID', 'Title', 'Category', 'Status', 'Treatment', 'TEF (Likely)', 'Vulnerability %', 'LEF', 'Loss Magnitude (Likely)', 'ALE', 'ALE Min', 'ALE Max', 'Treatment Cost', 'ROI %', 'Framework Tags'];
  const rows = mockRisks.map(r => [
    r.id, `"${r.title}"`, r.category, r.status, r.treatment,
    r.fair.tef_likely, r.fair.vulnerability, r.fair.lef,
    r.fair.lm_likely, r.fair.ale, r.fair.ale_min, r.fair.ale_max,
    r.treatment_cost, r.remediation_roi, `"${r.framework_tags.join('; ')}"`,
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function generateRiskRegisterCsv() {
  const headers = ['ID', 'Title', 'Category', 'Status', 'Inherent', 'Residual', 'ALE', 'Treatment', 'Treatment Cost', 'ROI %', 'Framework Tags', 'Regulatory Reference', 'Owner', 'Review Date'];
  const rows = mockRisks.map(r => [
    r.id, `"${r.title}"`, r.category, r.status, r.inherent_score, r.residual_score,
    r.fair.ale, r.treatment, r.treatment_cost, r.remediation_roi,
    `"${r.framework_tags.join('; ')}"`, `"${r.regulatory_reference}"`, `"${r.owner}"`, r.review_date,
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function generateComplianceCsv() {
  const headers = ['Framework', 'Version', 'Category', 'Score %', 'Compliant', 'Partial', 'Non-Compliant', 'Total Controls'];
  const rows = mockComplianceFrameworks.map(f => [
    f.name, f.version, f.category, f.score, f.controls_compliant, f.controls_partial, f.controls_noncompliant, f.controls_total,
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function generateIncidentCsv() {
  const headers = ['ID', 'Title', 'Type', 'Severity', 'Status', 'Priority', 'DORA Reportable', 'DORA Reported', 'Financial Impact ($)', 'Affected Users', 'Downtime (min)', 'Assigned To', 'Detected At', 'Resolved At'];
  const rows = mockIncidents.map(i => [
    i.id, `"${i.title}"`, i.type, i.severity, i.status, i.priority,
    i.is_dora_reportable ? 'Yes' : 'No', i.dora_reported ? 'Yes' : 'No',
    i.financial_impact_estimate, i.affected_users, i.downtime_minutes,
    `"${i.assigned_to}"`, i.detected_at, i.resolved_at ?? '',
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function generateVulnCsv() {
  const headers = ['CVE ID', 'Title', 'CVSS', 'Severity', 'Status', 'Asset', 'Patch Available', 'Exploit Available', 'Due Date', 'Assigned To'];
  const rows = mockVulnerabilities.map(v => [
    v.cve_id, `"${v.title}"`, v.cvss_score, v.severity, v.status, v.asset,
    v.patch_available ? 'Yes' : 'No', v.exploit_available ? 'Yes' : 'No', v.due_date, `"${v.assigned_to}"`,
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function generateExecCsv() {
  const totalALE = mockRisks.reduce((s, r) => s + r.fair.ale, 0);
  const totalTreatment = mockRisks.reduce((s, r) => s + r.treatment_cost, 0);
  const avgCompliance = Math.round(mockComplianceFrameworks.reduce((s, f) => s + f.score, 0) / mockComplianceFrameworks.length);
  const totalFinancialImpact = mockIncidents.reduce((s, i) => s + i.financial_impact_estimate, 0);
  const rows = [
    ['Metric', 'Value', 'Context'],
    ['Organization', mockOrg.name, mockOrg.industry],
    ['Report Date', TODAY_ISO, ''],
    ['Overall Risk Score', mockOrg.overallRiskScore, '/100'],
    ['Aggregate ALE', totalALE, 'USD - Annualised Loss Expectancy'],
    ['VaR 90th Percentile', mockKPIs.valueAtRisk_90, 'USD - Monte Carlo'],
    ['VaR 95th Percentile', mockKPIs.valueAtRisk_95, 'USD - Monte Carlo'],
    ['Treatment Budget', totalTreatment, 'USD'],
    ['Total Risks', mockKPIs.totalRisks, ''],
    ['Critical Risks', mockKPIs.criticalRisks, ''],
    ['Avg Compliance', `${avgCompliance}%`, 'Across 6 frameworks'],
    ['DORA Readiness', `${mockRegulatoryMetrics.dora.readiness}%`, ''],
    ['NIS2 Readiness', `${mockRegulatoryMetrics.nis2.readiness}%`, ''],
    ['DORA Incidents YTD', mockRegulatoryMetrics.dora.incidents_ytd, `${mockRegulatoryMetrics.dora.incidents_reported} reported`],
    ['Incident Financial Impact', totalFinancialImpact, 'USD YTD'],
    ['Open Incidents', mockKPIs.openIncidents, `${mockKPIs.criticalIncidents} P1`],
  ];
  return rows.map(r => r.join(',')).join('\n');
}

function generateDoraCsv() {
  const doraIncidents = mockIncidents.filter(i => i.is_dora_reportable);
  const headers = ['ID', 'Title', 'Severity', 'Status', 'DORA Reported', 'Financial Impact ($)', 'Affected Users', 'Downtime (min)', 'Detected At'];
  const rows = doraIncidents.map(i => [
    i.id, `"${i.title}"`, i.severity, i.status,
    i.dora_reported ? 'Yes' : 'Pending', i.financial_impact_estimate, i.affected_users, i.downtime_minutes, i.detected_at,
  ]);
  const meta = [
    ['--- DORA Metrics ---'],
    [`Readiness,${mockRegulatoryMetrics.dora.readiness}%`],
    [`RTO Target,${mockRegulatoryMetrics.dora.rto_target_hours}h`],
    [`RTO Actual,${mockRegulatoryMetrics.dora.rto_actual_hours}h`],
    [`RPO Target,${mockRegulatoryMetrics.dora.rpo_target_hours}h`],
    [`RPO Actual,${mockRegulatoryMetrics.dora.rpo_actual_hours}h`],
    [`3rd Party ICT Risks,${mockRegulatoryMetrics.dora.third_party_ict_risks}`],
    [''],
    ['--- NIS2 Metrics ---'],
    [`Readiness,${mockRegulatoryMetrics.nis2.readiness}%`],
    [`Governance,${mockRegulatoryMetrics.nis2.governance_score}%`],
    [`Technical Measures,${mockRegulatoryMetrics.nis2.technical_measures_score}%`],
    [`Supply Chain,${mockRegulatoryMetrics.nis2.supply_chain_score}%`],
    [`Incident Handling,${mockRegulatoryMetrics.nis2.incident_handling_score}%`],
    [''],
    ['--- DORA Reportable Incidents ---'],
    [headers.join(',')],
    ...rows.map(r => [r.join(',')]),
  ];
  return meta.flat().join('\n');
}

function generateBoardCsv() {
  const totalALE = mockRisks.reduce((s, r) => s + r.fair.ale, 0);
  const totalTreatment = mockRisks.reduce((s, r) => s + r.treatment_cost, 0);
  const avgROI = Math.round(mockRisks.filter(r => r.remediation_roi > 0).reduce((s, r) => s + r.remediation_roi, 0) / mockRisks.filter(r => r.remediation_roi > 0).length);
  const rows = [
    ['Board Report — Cyber Risk Financial Summary'],
    [`Organization,${mockOrg.name}`],
    [`Date,${TODAY_ISO}`],
    [''],
    ['FINANCIAL EXPOSURE'],
    [`Aggregate ALE,${fmt$(totalALE)}`],
    ...mockMonteCarloResults.percentiles.map(p => [`VaR ${p.pct}th Percentile,${fmt$(p.value)}`]),
    [`Mean Loss (Monte Carlo),${fmt$(mockMonteCarloResults.mean_loss)}`],
    [''],
    ['INVESTMENT & ROI'],
    [`Total Treatment Budget,${fmt$(totalTreatment)}`],
    [`Average Remediation ROI,${avgROI}%`],
    [''],
    ['REGULATORY POSTURE'],
    [`DORA Readiness,${mockRegulatoryMetrics.dora.readiness}%`],
    [`NIS2 Readiness,${mockRegulatoryMetrics.nis2.readiness}%`],
    [`DORA Incidents YTD,${mockRegulatoryMetrics.dora.incidents_ytd}`],
    [`DORA Incidents Reported,${mockRegulatoryMetrics.dora.incidents_reported}`],
    [''],
    ['TOP 5 FINANCIAL RISKS'],
    ['Title', 'ALE', 'Treatment Cost', 'ROI %', 'Framework'],
    ...[...mockRisks].sort((a, b) => b.fair.ale - a.fair.ale).slice(0, 5).map(r => [
      `"${r.title}"`, fmt$(r.fair.ale), fmt$(r.treatment_cost), `${r.remediation_roi}%`, `"${r.framework_tags.join('; ')}"`,
    ]).map(r => r.join(',')),
  ];
  return rows.map(r => Array.isArray(r) ? r : r).join('\n');
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const csvGenerators: Record<ReportId, () => string> = {
  exec:       generateExecCsv,
  fair:       generateFAIRCsv,
  board:      generateBoardCsv,
  risk:       generateRiskRegisterCsv,
  compliance: generateComplianceCsv,
  dora:       generateDoraCsv,
  vuln:       generateVulnCsv,
  incident:   generateIncidentCsv,
};

export default function Reports() {
  const [generating, setGenerating] = useState<ReportId | null>(null);
  const [toast, setToast]           = useState<string | null>(null);

  const openRisks        = mockRisks.filter(r => r.status === 'Open').length;
  const criticalRisks    = mockRisks.filter(r => r.inherent_score >= 16).length;
  const avgCompliance    = Math.round(mockComplianceFrameworks.reduce((s, f) => s + f.score, 0) / mockComplianceFrameworks.length);
  const totalALE         = mockRisks.reduce((s, r) => s + r.fair.ale, 0);
  const totalTreatment   = mockRisks.reduce((s, r) => s + r.treatment_cost, 0);
  const avgROI           = Math.round(mockRisks.filter(r => r.remediation_roi > 0).reduce((s, r) => s + r.remediation_roi, 0) / mockRisks.filter(r => r.remediation_roi > 0).length);
  const totalFinancial   = mockIncidents.reduce((s, i) => s + i.financial_impact_estimate, 0);
  const openCVEs         = mockVulnerabilities.filter(v => v.status === 'Open').length;
  const criticalCVEs     = mockVulnerabilities.filter(v => v.severity === 'Critical').length;
  const totalAssetValue  = mockAssets.reduce((s, a) => s + ((a as { annual_value?: number }).annual_value ?? 0), 0);
  const doraIncidents    = mockIncidents.filter(i => i.is_dora_reportable);
  const doraReported     = doraIncidents.filter(i => i.dora_reported).length;

  const handleGenerate = async (id: ReportId, title: string) => {
    setGenerating(id);
    await new Promise(r => setTimeout(r, 800)); // simulate generation
    const csv = csvGenerators[id]();
    downloadCsv(csv, `${id}-report-${TODAY_ISO}.csv`);
    setGenerating(null);
    setToast(`"${title}" exported successfully`);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-screen-2xl">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-3 rounded-xl shadow-xl backdrop-blur">
          <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />{toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-slate-100 font-bold text-xl">Reports & Analytics</h2>
          <p className="text-slate-500 text-sm">Export financial risk, compliance, DORA/NIS2, and operational reports</p>
        </div>
      </div>

      {/* Live posture snapshot */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-slate-100 font-bold text-base">{mockOrg.name} — Live Posture Snapshot</h3>
            <p className="text-slate-400 text-sm">{mockOrg.industry} · {TODAY}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
          {[
            { l: 'Risk Score',    v: `${mockOrg.overallRiskScore}/100`, c: 'text-orange-400' },
            { l: 'Aggregate ALE', v: fmt$(totalALE),                    c: 'text-red-400' },
            { l: 'VaR 95th Pct', v: fmt$(mockKPIs.valueAtRisk_95),      c: 'text-red-400' },
            { l: 'Treatment $',  v: fmt$(totalTreatment),               c: 'text-cyan-400' },
            { l: 'Avg ROI',      v: `${avgROI}%`,                       c: 'text-emerald-400' },
            { l: 'Compliance',   v: `${avgCompliance}%`,                c: 'text-blue-400' },
            { l: 'DORA Ready',   v: `${mockRegulatoryMetrics.dora.readiness}%`, c: 'text-amber-400' },
            { l: 'NIS2 Ready',   v: `${mockRegulatoryMetrics.nis2.readiness}%`, c: 'text-amber-400' },
          ].map(s => (
            <div key={s.l} className="bg-slate-900/50 rounded-lg p-3 text-center">
              <p className={`text-lg font-bold tabular-nums ${s.c}`}>{s.v}</p>
              <p className="text-slate-500 text-xs mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Additional context */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-700/40">
          {[
            { l: 'Open Risks', v: `${openRisks}`, sub: `${criticalRisks} critical`, icon: AlertTriangle, c: 'text-red-400' },
            { l: 'Financial Incident Impact', v: fmt$(totalFinancial), sub: 'YTD estimate', icon: DollarSign, c: 'text-orange-400' },
            { l: 'DORA Incidents', v: String(doraIncidents.length), sub: `${doraReported} reported`, icon: Clock, c: 'text-amber-400' },
            { l: 'Open CVEs', v: String(openCVEs), sub: `${criticalCVEs} critical`, icon: Shield, c: 'text-blue-400' },
          ].map(s => (
            <div key={s.l} className="flex items-center gap-3 bg-slate-900/30 rounded-lg px-3 py-2.5">
              <s.icon size={16} className={s.c} />
              <div>
                <p className={`font-bold tabular-nums ${s.c}`}>{s.v}</p>
                <p className="text-slate-500 text-xs">{s.l}</p>
                <p className="text-slate-600 text-xs">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report templates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wider">Report Templates</h3>
          <p className="text-slate-600 text-xs">Click Generate to download CSV with full data</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {reportTemplates.map(rpt => {
            const Icon = rpt.icon;
            const isGenerating = generating === rpt.id;
            return (
              <div key={rpt.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600 transition-colors flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColors[rpt.category] ?? ''}`}>{rpt.category}</span>
                    <h4 className="text-slate-100 font-semibold text-sm mt-1 leading-tight">{rpt.title}</h4>
                  </div>
                </div>
                <p className="text-slate-500 text-xs mb-3 leading-relaxed flex-1">{rpt.description}</p>

                {/* Sections included */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {rpt.sections.map(s => (
                    <span key={s} className="text-xs text-slate-600 bg-slate-800 border border-slate-700/50 px-1.5 py-px rounded">{s}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="text-xs text-slate-600">
                    <span className="text-slate-500">{rpt.frequency}</span> · Last: {rpt.lastGenerated}
                  </div>
                  <button
                    onClick={() => handleGenerate(rpt.id, rpt.title)}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {isGenerating
                      ? <><RefreshCw size={12} className="animate-spin" /> Generating…</>
                      : <><Download size={12} /> Generate</>
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAIR / Financial summary inline */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* VaR distribution */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-slate-100 font-semibold text-sm">Value at Risk — Monte Carlo</h3>
              <p className="text-slate-500 text-xs">{mockMonteCarloResults.simulations.toLocaleString()} simulations · FAIR model</p>
            </div>
            <button onClick={() => handleGenerate('fair', 'FAIR Financial Risk Report')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs transition-colors">
              <Download size={12} /> Export
            </button>
          </div>
          <div className="space-y-2.5">
            {mockMonteCarloResults.percentiles.map(p => {
              const max = mockMonteCarloResults.percentiles[mockMonteCarloResults.percentiles.length - 1].value;
              return (
                <div key={p.pct} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-8 text-right tabular-nums">{p.pct}%</span>
                  <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${p.pct >= 95 ? 'bg-red-500' : p.pct >= 90 ? 'bg-orange-500' : p.pct >= 75 ? 'bg-amber-500' : 'bg-blue-500'}`}
                      style={{ width: `${(p.value / max) * 100}%` }} />
                  </div>
                  <span className={`text-xs font-mono font-semibold w-16 tabular-nums ${p.pct >= 95 ? 'text-red-400' : p.pct >= 90 ? 'text-orange-400' : p.pct >= 75 ? 'text-amber-400' : 'text-blue-400'}`}>
                    {fmt$(p.value)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700/40 flex gap-4 text-xs text-slate-500">
            <span>Mean: <span className="text-slate-300 font-semibold">{fmt$(mockMonteCarloResults.mean_loss)}</span></span>
            <span>Std Dev: <span className="text-slate-300 font-semibold">{fmt$(mockMonteCarloResults.std_dev)}</span></span>
          </div>
        </div>

        {/* Compliance framework scores */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-slate-100 font-semibold text-sm">Compliance Framework Scores</h3>
              <p className="text-slate-500 text-xs">Current posture across {mockComplianceFrameworks.length} active frameworks</p>
            </div>
            <button onClick={() => handleGenerate('compliance', 'Compliance Status Report')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs transition-colors">
              <Download size={12} /> Export
            </button>
          </div>
          <div className="space-y-3">
            {mockComplianceFrameworks.map(fw => (
              <div key={fw.id} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-24 truncate">{fw.name}</span>
                <div className="flex-1 h-3 bg-slate-700/60 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${fw.score >= 80 ? 'bg-emerald-500' : fw.score >= 65 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${fw.score}%` }} />
                </div>
                <span className={`text-xs font-bold w-10 tabular-nums text-right ${fw.score >= 80 ? 'text-emerald-400' : fw.score >= 65 ? 'text-amber-400' : 'text-red-400'}`}>{fw.score}%</span>
                <div className="flex gap-0.5 w-20">
                  <div className="flex-1 h-1 bg-emerald-500 rounded-l-full" style={{ width: `${(fw.controls_compliant / fw.controls_total) * 100}%` }} title={`${fw.controls_compliant} compliant`} />
                  <div className="flex-1 h-1 bg-amber-500" style={{ width: `${(fw.controls_partial / fw.controls_total) * 100}%` }} title={`${fw.controls_partial} partial`} />
                  <div className="flex-1 h-1 bg-red-500 rounded-r-full" style={{ width: `${(fw.controls_noncompliant / fw.controls_total) * 100}%` }} title={`${fw.controls_noncompliant} non-compliant`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DORA / NIS2 summary */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-slate-100 font-semibold text-sm">DORA / NIS2 Regulatory Status</h3>
            <p className="text-slate-500 text-xs">Current readiness and incident reporting posture</p>
          </div>
          <button onClick={() => handleGenerate('dora', 'DORA / NIS2 Regulatory Report')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs transition-colors">
            <Download size={12} /> Export DORA/NIS2 Report
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* DORA */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-slate-300 text-sm font-semibold">DORA</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${mockRegulatoryMetrics.dora.readiness >= 80 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/15 text-amber-400 border-amber-500/20'}`}>{mockRegulatoryMetrics.dora.readiness}%</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { l: 'ICT Incidents YTD', v: mockRegulatoryMetrics.dora.incidents_ytd, c: 'text-amber-400' },
                { l: 'Reported', v: mockRegulatoryMetrics.dora.incidents_reported, c: 'text-emerald-400' },
                { l: 'Pending Report', v: mockRegulatoryMetrics.dora.incidents_pending, c: 'text-red-400' },
                { l: '3rd Party ICT', v: mockRegulatoryMetrics.dora.third_party_ict_risks, c: 'text-orange-400' },
                { l: `RTO: ${mockRegulatoryMetrics.dora.rto_target_hours}h target`, v: `${mockRegulatoryMetrics.dora.rto_actual_hours}h actual`, c: mockRegulatoryMetrics.dora.rto_actual_hours > mockRegulatoryMetrics.dora.rto_target_hours ? 'text-red-400' : 'text-emerald-400' },
                { l: `RPO: ${mockRegulatoryMetrics.dora.rpo_target_hours}h target`, v: `${mockRegulatoryMetrics.dora.rpo_actual_hours}h actual`, c: mockRegulatoryMetrics.dora.rpo_actual_hours > mockRegulatoryMetrics.dora.rpo_target_hours ? 'text-red-400' : 'text-emerald-400' },
              ].map(s => (
                <div key={s.l} className="bg-slate-900/50 rounded-lg p-2.5">
                  <p className={`font-bold tabular-nums ${s.c}`}>{s.v}</p>
                  <p className="text-slate-600 mt-0.5 leading-tight">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* NIS2 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-slate-300 text-sm font-semibold">NIS2</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">{mockRegulatoryMetrics.nis2.readiness}%</span>
            </div>
            <div className="space-y-2">
              {[
                { l: 'Governance', s: mockRegulatoryMetrics.nis2.governance_score, c: 'bg-cyan-500' },
                { l: 'Technical Measures', s: mockRegulatoryMetrics.nis2.technical_measures_score, c: 'bg-blue-500' },
                { l: 'Business Continuity', s: mockRegulatoryMetrics.nis2.business_continuity_score, c: 'bg-amber-500' },
                { l: 'Incident Handling', s: mockRegulatoryMetrics.nis2.incident_handling_score, c: 'bg-emerald-500' },
                { l: 'Supply Chain', s: mockRegulatoryMetrics.nis2.supply_chain_score, c: 'bg-red-500' },
                { l: 'Cryptography', s: mockRegulatoryMetrics.nis2.cryptography_score, c: 'bg-blue-500' },
              ].map(row => (
                <div key={row.l} className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 w-36">{row.l}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${row.c}`} style={{ width: `${row.s}%` }} />
                  </div>
                  <span className="text-slate-300 font-semibold w-8 text-right tabular-nums">{row.s}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Risk distribution */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-100 font-semibold text-sm">Risk Distribution by Category</h3>
          <button onClick={() => handleGenerate('risk', 'Full Risk Register Report')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs transition-colors">
            <Download size={12} /> Export Register
          </button>
        </div>
        <div className="space-y-3">
          {Object.entries(
            mockRisks.reduce((acc, r) => { acc[r.category] = (acc[r.category] ?? 0) + 1; return acc; }, {} as Record<string, number>)
          ).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
            const total = mockRisks.length;
            const ale = mockRisks.filter(r => r.category === cat).reduce((s, r) => s + r.fair.ale, 0);
            const colors: Record<string, string> = { Technical: 'bg-blue-500', Operational: 'bg-amber-500', Compliance: 'bg-emerald-500', Strategic: 'bg-slate-500', Financial: 'bg-red-500' };
            return (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-slate-400 text-sm w-24 flex-shrink-0">{cat}</span>
                <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${colors[cat] ?? 'bg-slate-500'}`} style={{ width: `${(count / total) * 100}%` }} />
                </div>
                <span className="text-slate-400 text-sm tabular-nums w-4">{count}</span>
                <span className="text-red-400 text-xs tabular-nums w-16 text-right">{fmt$(ale)}</span>
              </div>
            );
          })}
        </div>
        <p className="text-slate-600 text-xs mt-3">ALE shown per category</p>
      </div>
    </div>
  );
}
