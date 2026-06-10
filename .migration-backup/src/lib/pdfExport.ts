import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  mockKPIs, mockOrg, mockRisks, mockComplianceFrameworks, mockIncidents,
  mockVulnerabilities, mockRegulatoryMetrics, mockMonteCarloResults,
} from './mockData';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt$ = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `$${(n / 1_000).toFixed(0)}K`
  : `$${n}`;

const TODAY = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const TODAY_ISO = new Date().toISOString().slice(0, 10);

// Brand colours
const C = {
  bg:       [15,  23,  42] as [number,number,number],   // slate-900
  card:     [30,  41,  59] as [number,number,number],   // slate-800
  border:   [51,  65,  85] as [number,number,number],   // slate-600
  cyan:     [6,  182, 212] as [number,number,number],   // cyan-500
  white:    [248,250,252]  as [number,number,number],   // slate-50
  muted:    [148,163,184]  as [number,number,number],   // slate-400
  red:      [239, 68,  68] as [number,number,number],
  amber:    [245,158, 11]  as [number,number,number],
  green:    [ 16,185,129]  as [number,number,number],
  orange:   [249,115, 22]  as [number,number,number],
  blue:     [ 59,130,246]  as [number,number,number],
};

// ── Base document factory ─────────────────────────────────────────────────────

function makeDoc(title: string, subtitle: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  // Dark header band
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, W, 38, 'F');

  // Cyan accent bar
  doc.setFillColor(...C.cyan);
  doc.rect(0, 0, 4, 38, 'F');

  // Logo text
  doc.setTextColor(...C.cyan);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('CyberRisk IQ', 10, 13);

  doc.setTextColor(...C.muted);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('by Regorisk · ProGReC', 10, 19);

  // Report title
  doc.setTextColor(...C.white);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 10, 30);

  // Subtitle / org / date
  doc.setTextColor(...C.muted);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${subtitle}  ·  ${mockOrg.name}  ·  ${TODAY}`, 10, 36);

  // Confidential stamp
  doc.setTextColor(...C.muted);
  doc.setFontSize(7);
  doc.text('CONFIDENTIAL', W - 12, 36, { align: 'right' });

  return { doc, y: 46, W };
}

// ── Section heading ───────────────────────────────────────────────────────────

function sectionHead(doc: jsPDF, y: number, text: string, W: number): number {
  doc.setFillColor(...C.card);
  doc.roundedRect(8, y, W - 16, 8, 1, 1, 'F');
  doc.setFillColor(...C.cyan);
  doc.rect(8, y, 2, 8, 'F');
  doc.setTextColor(...C.cyan);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(text.toUpperCase(), 13, y + 5.5);
  return y + 12;
}

// ── KPI grid ──────────────────────────────────────────────────────────────────

function kpiGrid(
  doc: jsPDF,
  y: number,
  W: number,
  items: { label: string; value: string; color?: [number,number,number] }[],
  cols = 4
): number {
  const cellW = (W - 16) / cols;
  const cellH = 14;
  const rows  = Math.ceil(items.length / cols);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx  = r * cols + c;
      if (idx >= items.length) break;
      const item = items[idx];
      const x    = 8 + c * cellW;
      const cy   = y + r * (cellH + 2);

      doc.setFillColor(...C.card);
      doc.roundedRect(x, cy, cellW - 2, cellH, 1, 1, 'F');

      doc.setTextColor(...(item.color ?? C.white));
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(item.value, x + (cellW - 2) / 2, cy + 6, { align: 'center' });

      doc.setTextColor(...C.muted);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text(item.label, x + (cellW - 2) / 2, cy + 11, { align: 'center' });
    }
  }
  return y + rows * (cellH + 2) + 4;
}

// ── Footer on each page ───────────────────────────────────────────────────────

function addFooters(doc: jsPDF) {
  const total = doc.getNumberOfPages();
  const W     = doc.internal.pageSize.getWidth();
  const H     = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...C.border);
    doc.line(8, H - 10, W - 8, H - 10);
    doc.setTextColor(...C.muted);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text('CyberRisk IQ — CONFIDENTIAL', 10, H - 5);
    doc.text(`Page ${i} of ${total}  ·  Generated ${TODAY_ISO}`, W - 10, H - 5, { align: 'right' });
  }
}

// ── Dark autoTable theme ──────────────────────────────────────────────────────

const darkTable = (doc: jsPDF, y: number, head: string[][], body: (string|number)[][], startY = y) => {
  autoTable(doc, {
    startY,
    head,
    body,
    theme: 'plain',
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      textColor: C.white,
      fillColor: C.bg,
      lineColor: C.border,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: C.card,
      textColor: C.cyan,
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: { fillColor: [20, 30, 50] as [number,number,number] },
    margin: { left: 8, right: 8 },
  });
};

// ═════════════════════════════════════════════════════════════════════════════
// REPORT GENERATORS
// ═════════════════════════════════════════════════════════════════════════════

// ── 1. Executive Summary ──────────────────────────────────────────────────────

export function generateExecPDF() {
  const { doc, W } = makeDoc('Executive Risk Summary', 'Monthly Executive Report');
  let y = 46;

  const totalALE       = mockRisks.reduce((s, r) => s + r.fair.ale, 0);
  const totalTreatment = mockRisks.reduce((s, r) => s + r.treatment_cost, 0);
  const avgCompliance  = Math.round(mockComplianceFrameworks.reduce((s, f) => s + f.score, 0) / mockComplianceFrameworks.length);
  const avgROI         = Math.round(mockRisks.filter(r => r.remediation_roi > 0).reduce((s,r)=>s+r.remediation_roi,0) / mockRisks.filter(r=>r.remediation_roi>0).length);

  y = sectionHead(doc, y, 'Key Risk Indicators', W);
  y = kpiGrid(doc, y, W, [
    { label: 'Risk Score',       value: `${mockOrg.overallRiskScore}/100`, color: C.orange },
    { label: 'Aggregate ALE',    value: fmt$(totalALE),                    color: C.red    },
    { label: 'VaR 95th Pct',     value: fmt$(mockKPIs.valueAtRisk_95),     color: C.red    },
    { label: 'Treatment Budget', value: fmt$(totalTreatment),              color: C.cyan   },
    { label: 'Avg ROI',          value: `${avgROI}%`,                      color: C.green  },
    { label: 'Avg Compliance',   value: `${avgCompliance}%`,               color: C.blue   },
    { label: 'DORA Readiness',   value: `${mockRegulatoryMetrics.dora.readiness}%`, color: C.amber },
    { label: 'NIS2 Readiness',   value: `${mockRegulatoryMetrics.nis2.readiness}%`, color: C.amber },
  ]);

  y = sectionHead(doc, y, 'Top Risks by Financial Exposure', W);
  const topRisks = [...mockRisks].sort((a,b)=>b.fair.ale-a.fair.ale).slice(0,8);
  darkTable(doc, y, [['Risk', 'Category', 'Status', 'ALE', 'Treatment Cost', 'ROI %']],
    topRisks.map(r => [r.title, r.category, r.status, fmt$(r.fair.ale), fmt$(r.treatment_cost), `${r.remediation_roi}%`]),
    y
  );
  y = (doc as any).lastAutoTable.finalY + 6;

  y = sectionHead(doc, y, 'Compliance Posture', W);
  darkTable(doc, y, [['Framework', 'Score', 'Compliant', 'Partial', 'Non-Compliant']],
    mockComplianceFrameworks.map(f => [f.name, `${f.score}%`, f.controls_compliant, f.controls_partial, f.controls_noncompliant]),
    y
  );

  addFooters(doc);
  doc.save(`executive-summary-${TODAY_ISO}.pdf`);
}

// ── 2. FAIR Financial Report ──────────────────────────────────────────────────

export function generateFAIRPDF() {
  const { doc, W } = makeDoc('FAIR Financial Risk Report', 'Monte Carlo · ALE · ROI Analysis');
  let y = 46;

  const totalALE = mockRisks.reduce((s, r) => s + r.fair.ale, 0);

  y = sectionHead(doc, y, 'Monte Carlo Value at Risk', W);
  y = kpiGrid(doc, y, W, [
    { label: 'Mean Loss',       value: fmt$(mockMonteCarloResults.mean_loss), color: C.amber },
    { label: 'Std Deviation',   value: fmt$(mockMonteCarloResults.std_dev),   color: C.muted },
    { label: 'Simulations',     value: mockMonteCarloResults.simulations.toLocaleString(), color: C.cyan },
    { label: 'Aggregate ALE',   value: fmt$(totalALE),                        color: C.red   },
  ]);

  darkTable(doc, y, [['Percentile', 'Value at Risk']],
    mockMonteCarloResults.percentiles.map(p => [`${p.pct}th`, fmt$(p.value)]),
    y
  );
  y = (doc as any).lastAutoTable.finalY + 6;

  y = sectionHead(doc, y, 'Per-Risk FAIR Analysis', W);
  darkTable(doc, y,
    [['Risk', 'TEF', 'Vuln %', 'LEF', 'LM (Likely)', 'ALE', 'ALE Min', 'ALE Max', 'ROI %']],
    mockRisks.map(r => [
      r.title.slice(0,30), r.fair.tef_likely, `${r.fair.vulnerability}%`,
      r.fair.lef, fmt$(r.fair.lm_likely), fmt$(r.fair.ale),
      fmt$(r.fair.ale_min), fmt$(r.fair.ale_max), `${r.remediation_roi}%`,
    ]),
    y
  );

  addFooters(doc);
  doc.save(`fair-financial-report-${TODAY_ISO}.pdf`);
}

// ── 3. Risk Register ──────────────────────────────────────────────────────────

export function generateRiskPDF() {
  const { doc, W } = makeDoc('Full Risk Register Report', 'All Risks · FAIR Scores · Treatment Plans');
  let y = 46;

  const open     = mockRisks.filter(r => r.status === 'Open').length;
  const critical = mockRisks.filter(r => r.inherent_score >= 16).length;
  const totalALE = mockRisks.reduce((s,r)=>s+r.fair.ale,0);

  y = sectionHead(doc, y, 'Register Summary', W);
  y = kpiGrid(doc, y, W, [
    { label: 'Total Risks',    value: String(mockRisks.length), color: C.white  },
    { label: 'Open',           value: String(open),             color: C.amber  },
    { label: 'Critical',       value: String(critical),         color: C.red    },
    { label: 'Aggregate ALE',  value: fmt$(totalALE),           color: C.red    },
  ]);

  y = sectionHead(doc, y, 'Risk Register', W);
  darkTable(doc, y,
    [['ID', 'Title', 'Category', 'Status', 'Inherent', 'Residual', 'ALE', 'Treatment', 'Cost', 'ROI']],
    mockRisks.map(r => [
      r.id, r.title.slice(0,28), r.category, r.status,
      r.inherent_score, r.residual_score, fmt$(r.fair.ale),
      r.treatment, fmt$(r.treatment_cost), `${r.remediation_roi}%`,
    ]),
    y
  );

  addFooters(doc);
  doc.save(`risk-register-${TODAY_ISO}.pdf`);
}

// ── 4. Compliance Report ──────────────────────────────────────────────────────

export function generateCompliancePDF() {
  const { doc, W } = makeDoc('Compliance Status Report', 'Framework Scores · Gap Analysis');
  let y = 46;

  const avg = Math.round(mockComplianceFrameworks.reduce((s,f)=>s+f.score,0)/mockComplianceFrameworks.length);
  const totalControls   = mockComplianceFrameworks.reduce((s,f)=>s+f.controls_total,0);
  const totalCompliant  = mockComplianceFrameworks.reduce((s,f)=>s+f.controls_compliant,0);

  y = sectionHead(doc, y, 'Compliance Overview', W);
  y = kpiGrid(doc, y, W, [
    { label: 'Avg Score',        value: `${avg}%`,               color: avg>=80?C.green:avg>=65?C.amber:C.red },
    { label: 'Frameworks',       value: String(mockComplianceFrameworks.length), color: C.white },
    { label: 'Total Controls',   value: String(totalControls),   color: C.white },
    { label: 'Controls Compliant',value:`${totalCompliant}/${totalControls}`, color: C.green },
  ]);

  y = sectionHead(doc, y, 'Framework Scores', W);
  darkTable(doc, y,
    [['Framework', 'Version', 'Category', 'Score', 'Compliant', 'Partial', 'Non-Compliant', 'Total']],
    mockComplianceFrameworks.map(f => [
      f.name, f.version, f.category, `${f.score}%`,
      f.controls_compliant, f.controls_partial, f.controls_noncompliant, f.controls_total,
    ]),
    y
  );

  addFooters(doc);
  doc.save(`compliance-report-${TODAY_ISO}.pdf`);
}

// ── 5. DORA / NIS2 Report ─────────────────────────────────────────────────────

export function generateDORAPDF() {
  const { doc, W } = makeDoc('DORA / NIS2 Regulatory Report', 'ICT Risk · Incident Reporting · Readiness');
  let y = 46;

  const d = mockRegulatoryMetrics.dora;
  const n = mockRegulatoryMetrics.nis2;

  y = sectionHead(doc, y, 'DORA Metrics', W);
  y = kpiGrid(doc, y, W, [
    { label: 'Readiness',         value: `${d.readiness}%`,        color: d.readiness>=80?C.green:C.amber },
    { label: 'Incidents YTD',     value: String(d.incidents_ytd),  color: C.amber },
    { label: 'Reported',          value: String(d.incidents_reported), color: C.green },
    { label: 'Pending',           value: String(d.incidents_pending),  color: C.red   },
    { label: 'RTO Target / Actual',value:`${d.rto_target_hours}h / ${d.rto_actual_hours}h`, color: d.rto_actual_hours>d.rto_target_hours?C.red:C.green },
    { label: 'RPO Target / Actual',value:`${d.rpo_target_hours}h / ${d.rpo_actual_hours}h`, color: d.rpo_actual_hours>d.rpo_target_hours?C.red:C.green },
    { label: '3rd Party ICT',     value: String(d.third_party_ict_risks), color: C.orange },
    { label: 'NIS2 Readiness',    value: `${n.readiness}%`,        color: n.readiness>=80?C.green:C.amber },
  ]);

  y = sectionHead(doc, y, 'DORA Reportable Incidents', W);
  const doraInc = mockIncidents.filter(i => i.is_dora_reportable);
  darkTable(doc, y,
    [['ID', 'Title', 'Severity', 'Status', 'Reported', 'Financial Impact', 'Users', 'Downtime']],
    doraInc.map(i => [
      i.id, i.title.slice(0,30), i.severity, i.status,
      i.dora_reported ? 'Yes' : 'Pending',
      fmt$(i.financial_impact_estimate), i.affected_users, `${i.downtime_minutes}m`,
    ]),
    y
  );
  y = (doc as any).lastAutoTable.finalY + 6;

  y = sectionHead(doc, y, 'NIS2 Domain Scores', W);
  darkTable(doc, y,
    [['Domain', 'Score']],
    [
      ['Governance',          `${n.governance_score}%`],
      ['Technical Measures',  `${n.technical_measures_score}%`],
      ['Business Continuity', `${n.business_continuity_score}%`],
      ['Incident Handling',   `${n.incident_handling_score}%`],
      ['Supply Chain',        `${n.supply_chain_score}%`],
      ['Cryptography',        `${n.cryptography_score}%`],
    ],
    y
  );

  addFooters(doc);
  doc.save(`dora-nis2-report-${TODAY_ISO}.pdf`);
}

// ── 6. Vulnerability Report ───────────────────────────────────────────────────

export function generateVulnPDF() {
  const { doc, W } = makeDoc('Vulnerability Management Report', 'CVE Summary · CVSS · SLA Tracking');
  let y = 46;

  const open     = mockVulnerabilities.filter(v=>v.status==='Open').length;
  const critical = mockVulnerabilities.filter(v=>v.severity==='Critical').length;
  const high     = mockVulnerabilities.filter(v=>v.severity==='High').length;
  const patched  = mockVulnerabilities.filter(v=>v.patch_available).length;

  y = sectionHead(doc, y, 'Vulnerability Overview', W);
  y = kpiGrid(doc, y, W, [
    { label: 'Total CVEs',      value: String(mockVulnerabilities.length), color: C.white },
    { label: 'Open',            value: String(open),     color: C.amber },
    { label: 'Critical',        value: String(critical), color: C.red   },
    { label: 'High',            value: String(high),     color: C.orange},
    { label: 'Patch Available', value: String(patched),  color: C.green },
  ], 5);

  y = sectionHead(doc, y, 'CVE Register', W);
  darkTable(doc, y,
    [['CVE ID', 'Title', 'CVSS', 'Severity', 'Status', 'Asset', 'Patch', 'Exploit', 'Due Date']],
    mockVulnerabilities.map(v => [
      v.cve_id, v.title.slice(0,28), v.cvss_score, v.severity, v.status,
      v.asset, v.patch_available?'Yes':'No', v.exploit_available?'Yes':'No', v.due_date,
    ]),
    y
  );

  addFooters(doc);
  doc.save(`vulnerability-report-${TODAY_ISO}.pdf`);
}

// ── 7. Incident Report ────────────────────────────────────────────────────────

export function generateIncidentPDF() {
  const { doc, W } = makeDoc('Incident Response Summary', 'MTTR · MTTD · DORA Reportable Events');
  let y = 46;

  const totalFinancial = mockIncidents.reduce((s,i)=>s+i.financial_impact_estimate,0);
  const open           = mockIncidents.filter(i=>i.status==='Open'||i.status==='In Progress').length;
  const doraCount      = mockIncidents.filter(i=>i.is_dora_reportable).length;

  y = sectionHead(doc, y, 'Incident Overview', W);
  y = kpiGrid(doc, y, W, [
    { label: 'Total Incidents',    value: String(mockIncidents.length), color: C.white  },
    { label: 'Open',               value: String(open),                 color: C.amber  },
    { label: 'DORA Reportable',    value: String(doraCount),            color: C.orange },
    { label: 'Financial Impact',   value: fmt$(totalFinancial),         color: C.red    },
  ]);

  y = sectionHead(doc, y, 'Incident Register', W);
  darkTable(doc, y,
    [['ID', 'Title', 'Type', 'Severity', 'Status', 'DORA', 'Financial Impact', 'Users', 'Downtime']],
    mockIncidents.map(i => [
      i.id, i.title.slice(0,28), i.type, i.severity, i.status,
      i.is_dora_reportable?'Yes':'No', fmt$(i.financial_impact_estimate),
      i.affected_users, `${i.downtime_minutes}m`,
    ]),
    y
  );

  addFooters(doc);
  doc.save(`incident-report-${TODAY_ISO}.pdf`);
}

// ── 8. Board Deck ─────────────────────────────────────────────────────────────

export function generateBoardPDF() {
  const { doc, W } = makeDoc('Board & Executive Deck', 'Quarterly Cyber Risk Financial Summary');
  let y = 46;

  const totalALE       = mockRisks.reduce((s,r)=>s+r.fair.ale,0);
  const totalTreatment = mockRisks.reduce((s,r)=>s+r.treatment_cost,0);
  const avgROI         = Math.round(mockRisks.filter(r=>r.remediation_roi>0).reduce((s,r)=>s+r.remediation_roi,0)/mockRisks.filter(r=>r.remediation_roi>0).length);

  y = sectionHead(doc, y, 'Board-Level Financial Exposure', W);
  y = kpiGrid(doc, y, W, [
    { label: 'Aggregate ALE',    value: fmt$(totalALE),                  color: C.red   },
    { label: 'VaR 95th Pct',     value: fmt$(mockKPIs.valueAtRisk_95),   color: C.red   },
    { label: 'VaR 90th Pct',     value: fmt$(mockKPIs.valueAtRisk_90),   color: C.orange},
    { label: 'Mean Loss (MC)',    value: fmt$(mockMonteCarloResults.mean_loss), color: C.amber },
    { label: 'Treatment Budget', value: fmt$(totalTreatment),            color: C.cyan  },
    { label: 'Average ROI',      value: `${avgROI}%`,                    color: C.green },
    { label: 'DORA Readiness',   value: `${mockRegulatoryMetrics.dora.readiness}%`, color: C.amber },
    { label: 'NIS2 Readiness',   value: `${mockRegulatoryMetrics.nis2.readiness}%`, color: C.amber },
  ]);

  y = sectionHead(doc, y, 'Top 5 Financial Risks', W);
  const top5 = [...mockRisks].sort((a,b)=>b.fair.ale-a.fair.ale).slice(0,5);
  darkTable(doc, y,
    [['Risk', 'ALE', 'Treatment Cost', 'ROI %', 'Frameworks']],
    top5.map(r => [r.title.slice(0,35), fmt$(r.fair.ale), fmt$(r.treatment_cost), `${r.remediation_roi}%`, r.framework_tags.join(', ')]),
    y
  );
  y = (doc as any).lastAutoTable.finalY + 6;

  y = sectionHead(doc, y, 'Regulatory Posture', W);
  darkTable(doc, y,
    [['Regulation', 'Readiness', 'Key Metric', 'Value']],
    [
      ['DORA', `${mockRegulatoryMetrics.dora.readiness}%`, 'Incidents YTD',  String(mockRegulatoryMetrics.dora.incidents_ytd)],
      ['DORA', `${mockRegulatoryMetrics.dora.readiness}%`, 'RTO Compliance', mockRegulatoryMetrics.dora.rto_actual_hours <= mockRegulatoryMetrics.dora.rto_target_hours ? 'Met' : 'Breached'],
      ['NIS2', `${mockRegulatoryMetrics.nis2.readiness}%`, 'Governance',     `${mockRegulatoryMetrics.nis2.governance_score}%`],
      ['NIS2', `${mockRegulatoryMetrics.nis2.readiness}%`, 'Supply Chain',   `${mockRegulatoryMetrics.nis2.supply_chain_score}%`],
    ],
    y
  );

  addFooters(doc);
  doc.save(`board-deck-${TODAY_ISO}.pdf`);
}

// ── Master export map ─────────────────────────────────────────────────────────

export const pdfGenerators: Record<string, () => void> = {
  exec:       generateExecPDF,
  fair:       generateFAIRPDF,
  board:      generateBoardPDF,
  risk:       generateRiskPDF,
  compliance: generateCompliancePDF,
  dora:       generateDORAPDF,
  vuln:       generateVulnPDF,
  incident:   generateIncidentPDF,
};