import React, { useState, useEffect } from "react";
import { Card, Row, Col } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faFileLines,
  faCalendar,
  faChartColumn,
  faShieldHalved,
  faArrowTrendUp,
  faDollarSign,
  faTriangleExclamation,
  faCircleCheck,
  faClock,
  faUsers,
  faArrowsRotate,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "src/utils/AxiosInstance";

// ===================== MOCK FALLBACK (remove once backend is live) =====================
// Copied verbatim from the original threat-dashboard mock data so the page (and the
// client-side PDF generators below) render before the real `/cyberrisk/reports`
// endpoint exists. Delete this block and the fallback initial-state assignment once
// the endpoint returns data.
const MOCK_ORG = { name: "Acme Financial Corp", industry: "Financial Services", size: "Enterprise", risk_appetite: "Low", overallRiskScore: 68, trend: -4 };
const MOCK_KPIS = { totalRisks: 142, criticalRisks: 12, openIncidents: 7, criticalIncidents: 2, totalAssets: 384, vulnerableAssets: 47, complianceScore: 76, threatAlerts: 23, totalALE: 14200000, totalTreatmentBudget: 3850000, aggregateROI: 268, doraIncidents: 3, nis2ReadinessScore: 71, valueAtRisk_90: 8400000, valueAtRisk_95: 12100000 };
const MOCK_RISKS = [
  { id: "1", title: "Ransomware Attack on Core Banking Systems", category: "Technical", status: "Open", inherent_score: 20, residual_score: 12, fair: { tef_likely: 1.2, vulnerability: 72, lm_likely: 3200000, ale: 3840000, ale_min: 400000, ale_max: 5760000, lef: 1.2 }, treatment: "Mitigate", treatment_cost: 480000, remediation_roi: 700, framework_tags: ["DORA", "NIS2", "NIST CSF"] },
  { id: "2", title: "Third-Party Vendor Data Breach", category: "Operational", status: "In Treatment", inherent_score: 15, residual_score: 8, fair: { tef_likely: 0.8, vulnerability: 65, lm_likely: 1800000, ale: 1440000, ale_min: 150000, ale_max: 3250000, lef: 0.8 }, treatment: "Transfer", treatment_cost: 120000, remediation_roi: 1100, framework_tags: ["GDPR", "ISO 27001", "NIS2"] },
  { id: "3", title: "Insider Threat - Privileged Access Abuse", category: "Operational", status: "Open", inherent_score: 12, residual_score: 6, fair: { tef_likely: 0.6, vulnerability: 55, lm_likely: 900000, ale: 540000, ale_min: 60000, ale_max: 1650000, lef: 0.6 }, treatment: "Mitigate", treatment_cost: 95000, remediation_roi: 468, framework_tags: ["ISO 27001", "NIST CSF"] },
  { id: "4", title: "DDoS Attack on Public Web Services", category: "Technical", status: "Open", inherent_score: 12, residual_score: 9, fair: { tef_likely: 3, vulnerability: 45, lm_likely: 220000, ale: 660000, ale_min: 150000, ale_max: 3600000, lef: 3 }, treatment: "Mitigate", treatment_cost: 75000, remediation_roi: 780, framework_tags: ["DORA", "NIS2"] },
  { id: "5", title: "Phishing Campaign Targeting Finance Team", category: "Operational", status: "In Treatment", inherent_score: 15, residual_score: 6, fair: { tef_likely: 6, vulnerability: 38, lm_likely: 95000, ale: 570000, ale_min: 120000, ale_max: 6000000, lef: 6 }, treatment: "Mitigate", treatment_cost: 45000, remediation_roi: 1167, framework_tags: ["NIST CSF", "ISO 27001"] },
  { id: "6", title: "Unpatched Critical Vulnerabilities in ERP", category: "Technical", status: "Open", inherent_score: 16, residual_score: 10, fair: { tef_likely: 1.5, vulnerability: 80, lm_likely: 700000, ale: 1050000, ale_min: 100000, ale_max: 3200000, lef: 1.5 }, treatment: "Mitigate", treatment_cost: 55000, remediation_roi: 1809, framework_tags: ["NIST CSF", "PCI DSS"] },
  { id: "7", title: "GDPR Non-Compliance - EU Customer Data", category: "Compliance", status: "In Treatment", inherent_score: 12, residual_score: 4, fair: { tef_likely: 0.4, vulnerability: 70, lm_likely: 4000000, ale: 1600000, ale_min: 50000, ale_max: 14000000, lef: 0.4 }, treatment: "Mitigate", treatment_cost: 220000, remediation_roi: 627, framework_tags: ["GDPR", "ISO 27001"] },
  { id: "8", title: "Cloud Misconfiguration Exposing S3 Buckets", category: "Technical", status: "Closed", inherent_score: 10, residual_score: 2, fair: { tef_likely: 0.7, vulnerability: 90, lm_likely: 800000, ale: 560000, ale_min: 20000, ale_max: 2700000, lef: 0.7 }, treatment: "Mitigate", treatment_cost: 18000, remediation_roi: 3011, framework_tags: ["NIST CSF", "SOC 2"] },
  { id: "9", title: "Business Continuity - Data Center Failure", category: "Strategic", status: "Accepted", inherent_score: 10, residual_score: 8, fair: { tef_likely: 0.15, vulnerability: 60, lm_likely: 3500000, ale: 525000, ale_min: 50000, ale_max: 5000000, lef: 0.15 }, treatment: "Accept", treatment_cost: 0, remediation_roi: 0, framework_tags: ["DORA", "ISO 22301"] },
  { id: "10", title: "API Security Gaps in Mobile Banking App", category: "Technical", status: "Open", inherent_score: 12, residual_score: 7, fair: { tef_likely: 2, vulnerability: 58, lm_likely: 500000, ale: 1000000, ale_min: 50000, ale_max: 2900000, lef: 2 }, treatment: "Mitigate", treatment_cost: 85000, remediation_roi: 1076, framework_tags: ["PCI DSS", "NIST CSF"] },
];
const MOCK_FRAMEWORKS = [
  { id: "1", name: "NIST CSF", version: "2.0", category: "Security", score: 82, controls_total: 108, controls_compliant: 88, controls_partial: 14, controls_noncompliant: 6 },
  { id: "2", name: "ISO 27001", version: "2022", category: "Security", score: 74, controls_total: 93, controls_compliant: 69, controls_partial: 18, controls_noncompliant: 6 },
  { id: "3", name: "SOC 2 Type II", version: "2017", category: "Security", score: 88, controls_total: 64, controls_compliant: 56, controls_partial: 6, controls_noncompliant: 2 },
  { id: "4", name: "PCI DSS", version: "4.0", category: "Industry", score: 71, controls_total: 78, controls_compliant: 55, controls_partial: 15, controls_noncompliant: 8 },
  { id: "5", name: "GDPR", version: "2018", category: "Privacy", score: 79, controls_total: 42, controls_compliant: 33, controls_partial: 7, controls_noncompliant: 2 },
  { id: "6", name: "HIPAA", version: "1996", category: "Industry", score: 65, controls_total: 54, controls_compliant: 35, controls_partial: 13, controls_noncompliant: 6 },
];
const MOCK_INCIDENTS = [
  { id: "1", title: "Ransomware Detection on Finance Workstation", type: "Ransomware", severity: "Critical", status: "Investigating", is_dora_reportable: true, dora_reported: false, financial_impact_estimate: 1200000, affected_users: 0, downtime_minutes: 180 },
  { id: "2", title: "Unauthorized Access to Customer Database", type: "Security Breach", severity: "High", status: "Contained", is_dora_reportable: true, dora_reported: true, financial_impact_estimate: 480000, affected_users: 12500, downtime_minutes: 45 },
  { id: "3", title: "Phishing Email - Executive Impersonation", type: "Phishing", severity: "High", status: "Resolved", is_dora_reportable: false, dora_reported: false, financial_impact_estimate: 0, affected_users: 1, downtime_minutes: 0 },
  { id: "4", title: "DDoS Attack on Trading API", type: "DDoS", severity: "High", status: "Contained", is_dora_reportable: true, dora_reported: true, financial_impact_estimate: 220000, affected_users: 0, downtime_minutes: 95 },
  { id: "5", title: "Data Leak via Misconfigured S3 Bucket", type: "Data Leak", severity: "Medium", status: "Resolved", is_dora_reportable: false, dora_reported: false, financial_impact_estimate: 85000, affected_users: 340, downtime_minutes: 0 },
  { id: "6", title: "Suspicious Login Activity - Admin Account", type: "Security Breach", severity: "Medium", status: "Investigating", is_dora_reportable: false, dora_reported: false, financial_impact_estimate: 0, affected_users: 0, downtime_minutes: 0 },
];
const MOCK_VULNERABILITIES = [
  { id: "1", cve_id: "CVE-2026-1234", title: "Remote Code Execution in Apache Struts", cvss_score: 9.8, severity: "Critical", status: "Open", asset: "web-app-01", patch_available: true, exploit_available: true, due_date: "2026-05-15" },
  { id: "2", cve_id: "CVE-2025-9876", title: "Authentication Bypass in OpenSSL", cvss_score: 9.1, severity: "Critical", status: "In Progress", asset: "db-server-03", patch_available: true, exploit_available: true, due_date: "2026-05-20" },
  { id: "3", cve_id: "CVE-2026-5555", title: "Privilege Escalation in Linux Kernel", cvss_score: 7.8, severity: "High", status: "Open", asset: "app-server-07", patch_available: true, exploit_available: false, due_date: "2026-06-01" },
  { id: "4", cve_id: "CVE-2025-4321", title: "XXE Injection in XML Parser Library", cvss_score: 7.5, severity: "High", status: "Remediated", asset: "api-gw-02", patch_available: true, exploit_available: false, due_date: "2026-04-30" },
  { id: "5", cve_id: "CVE-2026-8888", title: "SSRF Vulnerability in REST Framework", cvss_score: 6.5, severity: "Medium", status: "Open", asset: "microservice-09", patch_available: false, exploit_available: false, due_date: "2026-06-15" },
  { id: "6", cve_id: "CVE-2026-2222", title: "Reflected XSS in Customer Portal", cvss_score: 5.4, severity: "Medium", status: "In Progress", asset: "customer-portal", patch_available: true, exploit_available: false, due_date: "2026-05-30" },
];
const MOCK_REGULATORY = {
  dora: { readiness: 68, incidents_ytd: 3, incidents_reported: 2, incidents_pending: 1, rto_target_hours: 4, rto_actual_hours: 6.5, rpo_target_hours: 1, rpo_actual_hours: 2.2, third_party_ict_risks: 8, third_party_reviewed: 5 },
  nis2: { readiness: 71, governance_score: 78, technical_measures_score: 74, business_continuity_score: 65, incident_handling_score: 70, supply_chain_score: 58, cryptography_score: 82 },
};
const MOCK_MONTECARLO = {
  percentiles: [{ pct: 50, value: 4100000 }, { pct: 75, value: 6800000 }, { pct: 90, value: 8400000 }, { pct: 95, value: 12100000 }, { pct: 99, value: 21500000 }],
  simulations: 10000, mean_loss: 4350000, std_dev: 3200000,
};
// ======================================================================================

const fmt$ = (n) =>
  n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M`
  : n >= 1000 ? `$${(n / 1000).toFixed(0)}K`
  : `$${n}`;

const TODAY = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const TODAY_ISO = new Date().toISOString().slice(0, 10);

// ─── client-side PDF helpers (ported from the original lib/pdfExport) ─────────────
const C = {
  bg: [15, 23, 42], card: [30, 41, 59], border: [51, 65, 85], cyan: [6, 182, 212],
  white: [248, 250, 252], muted: [148, 163, 184], red: [239, 68, 68], amber: [245, 158, 11],
  green: [16, 185, 129], orange: [249, 115, 22], blue: [59, 130, 246],
};

function makeDoc(title, subtitle, orgName) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...C.bg); doc.rect(0, 0, W, 38, "F");
  doc.setFillColor(...C.cyan); doc.rect(0, 0, 4, 38, "F");
  doc.setTextColor(...C.cyan); doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text("CyberRisk IQ", 10, 13);
  doc.setTextColor(...C.muted); doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text("by Regorisk · ProGReC", 10, 19);
  doc.setTextColor(...C.white); doc.setFontSize(16); doc.setFont("helvetica", "bold");
  doc.text(title, 10, 30);
  doc.setTextColor(...C.muted); doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text(`${subtitle}  ·  ${orgName}  ·  ${TODAY}`, 10, 36);
  doc.setTextColor(...C.muted); doc.setFontSize(7);
  doc.text("CONFIDENTIAL", W - 12, 36, { align: "right" });
  return { doc, y: 46, W };
}

function sectionHead(doc, y, text, W) {
  doc.setFillColor(...C.card); doc.roundedRect(8, y, W - 16, 8, 1, 1, "F");
  doc.setFillColor(...C.cyan); doc.rect(8, y, 2, 8, "F");
  doc.setTextColor(...C.cyan); doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text(text.toUpperCase(), 13, y + 5.5);
  return y + 12;
}

function kpiGrid(doc, y, W, items, cols = 4) {
  const cellW = (W - 16) / cols;
  const cellH = 14;
  const rows = Math.ceil(items.length / cols);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (idx >= items.length) break;
      const item = items[idx];
      const x = 8 + c * cellW;
      const cy = y + r * (cellH + 2);
      doc.setFillColor(...C.card); doc.roundedRect(x, cy, cellW - 2, cellH, 1, 1, "F");
      doc.setTextColor(...(item.color || C.white)); doc.setFontSize(10); doc.setFont("helvetica", "bold");
      doc.text(item.value, x + (cellW - 2) / 2, cy + 6, { align: "center" });
      doc.setTextColor(...C.muted); doc.setFontSize(6.5); doc.setFont("helvetica", "normal");
      doc.text(item.label, x + (cellW - 2) / 2, cy + 11, { align: "center" });
    }
  }
  return y + rows * (cellH + 2) + 4;
}

function addFooters(doc) {
  const total = doc.getNumberOfPages();
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...C.border); doc.line(8, H - 10, W - 8, H - 10);
    doc.setTextColor(...C.muted); doc.setFontSize(6.5); doc.setFont("helvetica", "normal");
    doc.text("CyberRisk IQ — CONFIDENTIAL", 10, H - 5);
    doc.text(`Page ${i} of ${total}  ·  Generated ${TODAY_ISO}`, W - 10, H - 5, { align: "right" });
  }
}

function darkTable(doc, head, body, startY) {
  autoTable(doc, {
    startY, head, body, theme: "plain",
    styles: { fontSize: 7.5, cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 }, textColor: C.white, fillColor: C.bg, lineColor: C.border, lineWidth: 0.1 },
    headStyles: { fillColor: C.card, textColor: C.cyan, fontStyle: "bold", fontSize: 7.5 },
    alternateRowStyles: { fillColor: [20, 30, 50] },
    margin: { left: 8, right: 8 },
  });
}

// ─── report generators (operate on the page's hybrid data) ───────────────────────
function generateExecPDF(d) {
  const { doc, W } = makeDoc("Executive Risk Summary", "Monthly Executive Report", d.org.name);
  let y = 46;
  const totalALE = d.risks.reduce((s, r) => s + r.fair.ale, 0);
  const totalTreatment = d.risks.reduce((s, r) => s + r.treatment_cost, 0);
  const avgCompliance = Math.round(d.frameworks.reduce((s, f) => s + f.score, 0) / d.frameworks.length);
  const roiList = d.risks.filter((r) => r.remediation_roi > 0);
  const avgROI = Math.round(roiList.reduce((s, r) => s + r.remediation_roi, 0) / roiList.length);
  y = sectionHead(doc, y, "Key Risk Indicators", W);
  y = kpiGrid(doc, y, W, [
    { label: "Risk Score", value: `${d.org.overallRiskScore}/100`, color: C.orange },
    { label: "Aggregate ALE", value: fmt$(totalALE), color: C.red },
    { label: "VaR 95th Pct", value: fmt$(d.kpis.valueAtRisk_95), color: C.red },
    { label: "Treatment Budget", value: fmt$(totalTreatment), color: C.cyan },
    { label: "Avg ROI", value: `${avgROI}%`, color: C.green },
    { label: "Avg Compliance", value: `${avgCompliance}%`, color: C.blue },
    { label: "DORA Readiness", value: `${d.regulatory.dora.readiness}%`, color: C.amber },
    { label: "NIS2 Readiness", value: `${d.regulatory.nis2.readiness}%`, color: C.amber },
  ]);
  y = sectionHead(doc, y, "Top Risks by Financial Exposure", W);
  const topRisks = [...d.risks].sort((a, b) => b.fair.ale - a.fair.ale).slice(0, 8);
  darkTable(doc, [["Risk", "Category", "Status", "ALE", "Treatment Cost", "ROI %"]],
    topRisks.map((r) => [r.title, r.category, r.status, fmt$(r.fair.ale), fmt$(r.treatment_cost), `${r.remediation_roi}%`]), y);
  y = doc.lastAutoTable.finalY + 6;
  y = sectionHead(doc, y, "Compliance Posture", W);
  darkTable(doc, [["Framework", "Score", "Compliant", "Partial", "Non-Compliant"]],
    d.frameworks.map((f) => [f.name, `${f.score}%`, f.controls_compliant, f.controls_partial, f.controls_noncompliant]), y);
  addFooters(doc);
  doc.save(`executive-summary-${TODAY_ISO}.pdf`);
}

function generateFAIRPDF(d) {
  const { doc, W } = makeDoc("FAIR Financial Risk Report", "Monte Carlo · ALE · ROI Analysis", d.org.name);
  let y = 46;
  const totalALE = d.risks.reduce((s, r) => s + r.fair.ale, 0);
  y = sectionHead(doc, y, "Monte Carlo Value at Risk", W);
  y = kpiGrid(doc, y, W, [
    { label: "Mean Loss", value: fmt$(d.monteCarlo.mean_loss), color: C.amber },
    { label: "Std Deviation", value: fmt$(d.monteCarlo.std_dev), color: C.muted },
    { label: "Simulations", value: d.monteCarlo.simulations.toLocaleString(), color: C.cyan },
    { label: "Aggregate ALE", value: fmt$(totalALE), color: C.red },
  ]);
  darkTable(doc, [["Percentile", "Value at Risk"]], d.monteCarlo.percentiles.map((p) => [`${p.pct}th`, fmt$(p.value)]), y);
  y = doc.lastAutoTable.finalY + 6;
  y = sectionHead(doc, y, "Per-Risk FAIR Analysis", W);
  darkTable(doc, [["Risk", "TEF", "Vuln %", "LEF", "LM (Likely)", "ALE", "ALE Min", "ALE Max", "ROI %"]],
    d.risks.map((r) => [r.title.slice(0, 30), r.fair.tef_likely, `${r.fair.vulnerability}%`, r.fair.lef, fmt$(r.fair.lm_likely), fmt$(r.fair.ale), fmt$(r.fair.ale_min), fmt$(r.fair.ale_max), `${r.remediation_roi}%`]), y);
  addFooters(doc);
  doc.save(`fair-financial-report-${TODAY_ISO}.pdf`);
}

function generateRiskPDF(d) {
  const { doc, W } = makeDoc("Full Risk Register Report", "All Risks · FAIR Scores · Treatment Plans", d.org.name);
  let y = 46;
  const open = d.risks.filter((r) => r.status === "Open").length;
  const critical = d.risks.filter((r) => r.inherent_score >= 16).length;
  const totalALE = d.risks.reduce((s, r) => s + r.fair.ale, 0);
  y = sectionHead(doc, y, "Register Summary", W);
  y = kpiGrid(doc, y, W, [
    { label: "Total Risks", value: String(d.risks.length), color: C.white },
    { label: "Open", value: String(open), color: C.amber },
    { label: "Critical", value: String(critical), color: C.red },
    { label: "Aggregate ALE", value: fmt$(totalALE), color: C.red },
  ]);
  y = sectionHead(doc, y, "Risk Register", W);
  darkTable(doc, [["ID", "Title", "Category", "Status", "Inherent", "Residual", "ALE", "Treatment", "Cost", "ROI"]],
    d.risks.map((r) => [r.id, r.title.slice(0, 28), r.category, r.status, r.inherent_score, r.residual_score, fmt$(r.fair.ale), r.treatment, fmt$(r.treatment_cost), `${r.remediation_roi}%`]), y);
  addFooters(doc);
  doc.save(`risk-register-${TODAY_ISO}.pdf`);
}

function generateCompliancePDF(d) {
  const { doc, W } = makeDoc("Compliance Status Report", "Framework Scores · Gap Analysis", d.org.name);
  let y = 46;
  const avg = Math.round(d.frameworks.reduce((s, f) => s + f.score, 0) / d.frameworks.length);
  const totalControls = d.frameworks.reduce((s, f) => s + f.controls_total, 0);
  const totalCompliant = d.frameworks.reduce((s, f) => s + f.controls_compliant, 0);
  y = sectionHead(doc, y, "Compliance Overview", W);
  y = kpiGrid(doc, y, W, [
    { label: "Avg Score", value: `${avg}%`, color: avg >= 80 ? C.green : avg >= 65 ? C.amber : C.red },
    { label: "Frameworks", value: String(d.frameworks.length), color: C.white },
    { label: "Total Controls", value: String(totalControls), color: C.white },
    { label: "Controls Compliant", value: `${totalCompliant}/${totalControls}`, color: C.green },
  ]);
  y = sectionHead(doc, y, "Framework Scores", W);
  darkTable(doc, [["Framework", "Version", "Category", "Score", "Compliant", "Partial", "Non-Compliant", "Total"]],
    d.frameworks.map((f) => [f.name, f.version, f.category, `${f.score}%`, f.controls_compliant, f.controls_partial, f.controls_noncompliant, f.controls_total]), y);
  addFooters(doc);
  doc.save(`compliance-report-${TODAY_ISO}.pdf`);
}

function generateDORAPDF(d) {
  const { doc, W } = makeDoc("DORA / NIS2 Regulatory Report", "ICT Risk · Incident Reporting · Readiness", d.org.name);
  let y = 46;
  const dora = d.regulatory.dora;
  const nis2 = d.regulatory.nis2;
  y = sectionHead(doc, y, "DORA Metrics", W);
  y = kpiGrid(doc, y, W, [
    { label: "Readiness", value: `${dora.readiness}%`, color: dora.readiness >= 80 ? C.green : C.amber },
    { label: "Incidents YTD", value: String(dora.incidents_ytd), color: C.amber },
    { label: "Reported", value: String(dora.incidents_reported), color: C.green },
    { label: "Pending", value: String(dora.incidents_pending), color: C.red },
    { label: "RTO Target / Actual", value: `${dora.rto_target_hours}h / ${dora.rto_actual_hours}h`, color: dora.rto_actual_hours > dora.rto_target_hours ? C.red : C.green },
    { label: "RPO Target / Actual", value: `${dora.rpo_target_hours}h / ${dora.rpo_actual_hours}h`, color: dora.rpo_actual_hours > dora.rpo_target_hours ? C.red : C.green },
    { label: "3rd Party ICT", value: String(dora.third_party_ict_risks), color: C.orange },
    { label: "NIS2 Readiness", value: `${nis2.readiness}%`, color: nis2.readiness >= 80 ? C.green : C.amber },
  ]);
  y = sectionHead(doc, y, "DORA Reportable Incidents", W);
  const doraInc = d.incidents.filter((i) => i.is_dora_reportable);
  darkTable(doc, [["ID", "Title", "Severity", "Status", "Reported", "Financial Impact", "Users", "Downtime"]],
    doraInc.map((i) => [i.id, i.title.slice(0, 30), i.severity, i.status, i.dora_reported ? "Yes" : "Pending", fmt$(i.financial_impact_estimate), i.affected_users, `${i.downtime_minutes}m`]), y);
  y = doc.lastAutoTable.finalY + 6;
  y = sectionHead(doc, y, "NIS2 Domain Scores", W);
  darkTable(doc, [["Domain", "Score"]], [
    ["Governance", `${nis2.governance_score}%`],
    ["Technical Measures", `${nis2.technical_measures_score}%`],
    ["Business Continuity", `${nis2.business_continuity_score}%`],
    ["Incident Handling", `${nis2.incident_handling_score}%`],
    ["Supply Chain", `${nis2.supply_chain_score}%`],
    ["Cryptography", `${nis2.cryptography_score}%`],
  ], y);
  addFooters(doc);
  doc.save(`dora-nis2-report-${TODAY_ISO}.pdf`);
}

function generateVulnPDF(d) {
  const { doc, W } = makeDoc("Vulnerability Management Report", "CVE Summary · CVSS · SLA Tracking", d.org.name);
  let y = 46;
  const open = d.vulnerabilities.filter((v) => v.status === "Open").length;
  const critical = d.vulnerabilities.filter((v) => v.severity === "Critical").length;
  const high = d.vulnerabilities.filter((v) => v.severity === "High").length;
  const patched = d.vulnerabilities.filter((v) => v.patch_available).length;
  y = sectionHead(doc, y, "Vulnerability Overview", W);
  y = kpiGrid(doc, y, W, [
    { label: "Total CVEs", value: String(d.vulnerabilities.length), color: C.white },
    { label: "Open", value: String(open), color: C.amber },
    { label: "Critical", value: String(critical), color: C.red },
    { label: "High", value: String(high), color: C.orange },
    { label: "Patch Available", value: String(patched), color: C.green },
  ], 5);
  y = sectionHead(doc, y, "CVE Register", W);
  darkTable(doc, [["CVE ID", "Title", "CVSS", "Severity", "Status", "Asset", "Patch", "Exploit", "Due Date"]],
    d.vulnerabilities.map((v) => [v.cve_id, v.title.slice(0, 28), v.cvss_score, v.severity, v.status, v.asset, v.patch_available ? "Yes" : "No", v.exploit_available ? "Yes" : "No", v.due_date]), y);
  addFooters(doc);
  doc.save(`vulnerability-report-${TODAY_ISO}.pdf`);
}

function generateIncidentPDF(d) {
  const { doc, W } = makeDoc("Incident Response Summary", "MTTR · MTTD · DORA Reportable Events", d.org.name);
  let y = 46;
  const totalFinancial = d.incidents.reduce((s, i) => s + i.financial_impact_estimate, 0);
  const open = d.incidents.filter((i) => i.status === "Open" || i.status === "In Progress").length;
  const doraCount = d.incidents.filter((i) => i.is_dora_reportable).length;
  y = sectionHead(doc, y, "Incident Overview", W);
  y = kpiGrid(doc, y, W, [
    { label: "Total Incidents", value: String(d.incidents.length), color: C.white },
    { label: "Open", value: String(open), color: C.amber },
    { label: "DORA Reportable", value: String(doraCount), color: C.orange },
    { label: "Financial Impact", value: fmt$(totalFinancial), color: C.red },
  ]);
  y = sectionHead(doc, y, "Incident Register", W);
  darkTable(doc, [["ID", "Title", "Type", "Severity", "Status", "DORA", "Financial Impact", "Users", "Downtime"]],
    d.incidents.map((i) => [i.id, i.title.slice(0, 28), i.type, i.severity, i.status, i.is_dora_reportable ? "Yes" : "No", fmt$(i.financial_impact_estimate), i.affected_users, `${i.downtime_minutes}m`]), y);
  addFooters(doc);
  doc.save(`incident-report-${TODAY_ISO}.pdf`);
}

function generateBoardPDF(d) {
  const { doc, W } = makeDoc("Board & Executive Deck", "Quarterly Cyber Risk Financial Summary", d.org.name);
  let y = 46;
  const totalALE = d.risks.reduce((s, r) => s + r.fair.ale, 0);
  const totalTreatment = d.risks.reduce((s, r) => s + r.treatment_cost, 0);
  const roiList = d.risks.filter((r) => r.remediation_roi > 0);
  const avgROI = Math.round(roiList.reduce((s, r) => s + r.remediation_roi, 0) / roiList.length);
  y = sectionHead(doc, y, "Board-Level Financial Exposure", W);
  y = kpiGrid(doc, y, W, [
    { label: "Aggregate ALE", value: fmt$(totalALE), color: C.red },
    { label: "VaR 95th Pct", value: fmt$(d.kpis.valueAtRisk_95), color: C.red },
    { label: "VaR 90th Pct", value: fmt$(d.kpis.valueAtRisk_90), color: C.orange },
    { label: "Mean Loss (MC)", value: fmt$(d.monteCarlo.mean_loss), color: C.amber },
    { label: "Treatment Budget", value: fmt$(totalTreatment), color: C.cyan },
    { label: "Average ROI", value: `${avgROI}%`, color: C.green },
    { label: "DORA Readiness", value: `${d.regulatory.dora.readiness}%`, color: C.amber },
    { label: "NIS2 Readiness", value: `${d.regulatory.nis2.readiness}%`, color: C.amber },
  ]);
  y = sectionHead(doc, y, "Top 5 Financial Risks", W);
  const top5 = [...d.risks].sort((a, b) => b.fair.ale - a.fair.ale).slice(0, 5);
  darkTable(doc, [["Risk", "ALE", "Treatment Cost", "ROI %", "Frameworks"]],
    top5.map((r) => [r.title.slice(0, 35), fmt$(r.fair.ale), fmt$(r.treatment_cost), `${r.remediation_roi}%`, r.framework_tags.join(", ")]), y);
  y = doc.lastAutoTable.finalY + 6;
  y = sectionHead(doc, y, "Regulatory Posture", W);
  darkTable(doc, [["Regulation", "Readiness", "Key Metric", "Value"]], [
    ["DORA", `${d.regulatory.dora.readiness}%`, "Incidents YTD", String(d.regulatory.dora.incidents_ytd)],
    ["DORA", `${d.regulatory.dora.readiness}%`, "RTO Compliance", d.regulatory.dora.rto_actual_hours <= d.regulatory.dora.rto_target_hours ? "Met" : "Breached"],
    ["NIS2", `${d.regulatory.nis2.readiness}%`, "Governance", `${d.regulatory.nis2.governance_score}%`],
    ["NIS2", `${d.regulatory.nis2.readiness}%`, "Supply Chain", `${d.regulatory.nis2.supply_chain_score}%`],
  ], y);
  addFooters(doc);
  doc.save(`board-deck-${TODAY_ISO}.pdf`);
}

const pdfGenerators = {
  exec: generateExecPDF,
  fair: generateFAIRPDF,
  board: generateBoardPDF,
  risk: generateRiskPDF,
  compliance: generateCompliancePDF,
  dora: generateDORAPDF,
  vuln: generateVulnPDF,
  incident: generateIncidentPDF,
};

const reportTemplates = [
  { id: "exec", title: "Executive Risk Summary", icon: faArrowTrendUp, category: "Executive", lastGenerated: "2026-05-10", frequency: "Monthly", description: "High-level KPIs, risk trend, compliance posture, and board-level metrics.", sections: ["Risk Overview", "Financial Exposure", "Compliance Summary", "Top Risks", "Incident Summary"] },
  { id: "fair", title: "FAIR Financial Risk Report", icon: faDollarSign, category: "Financial", lastGenerated: "2026-05-12", frequency: "Monthly", description: "ALE analysis, Monte Carlo VaR distribution, remediation ROI and treatment investment.", sections: ["Aggregate ALE", "VaR Percentiles", "Per-Risk FAIR Analysis", "Remediation ROI", "Treatment Budget"] },
  { id: "board", title: "Board & Executive Deck", icon: faUsers, category: "Executive", lastGenerated: "2026-05-01", frequency: "Quarterly", description: "One-page board summary: VaR, DORA/NIS2 status, top financial risks, and mitigation spend.", sections: ["VaR & ALE Summary", "DORA Compliance", "NIS2 Readiness", "Investment vs Risk Reduction"] },
  { id: "risk", title: "Full Risk Register Report", icon: faShieldHalved, category: "Risk", lastGenerated: "2026-05-12", frequency: "Weekly", description: "Complete risk register with FAIR scoring, treatment plans, GRC framework linkage.", sections: ["Risk Register Table", "Heat Map", "Treatment Mix", "Framework Linkage"] },
  { id: "compliance", title: "Compliance Status Report", icon: faFileLines, category: "Compliance", lastGenerated: "2026-05-01", frequency: "Monthly", description: "Framework-by-framework compliance posture with gap analysis and assessment history.", sections: ["Framework Scores", "Control Gap Analysis", "Assessment History", "Remediation Roadmap"] },
  { id: "dora", title: "DORA / NIS2 Regulatory Report", icon: faTriangleExclamation, category: "Regulatory", lastGenerated: "2026-05-08", frequency: "Monthly", description: "DORA ICT incident reporting status, RTO/RPO metrics, and NIS2 readiness breakdown.", sections: ["DORA Incident Register", "RTO/RPO Status", "NIS2 Gap Assessment", "3rd Party ICT Risk"] },
  { id: "vuln", title: "Vulnerability Management Report", icon: faChartColumn, category: "Technical", lastGenerated: "2026-05-13", frequency: "Weekly", description: "Open CVEs, CVSS distribution, remediation SLA tracking, asset exposure.", sections: ["CVE Summary", "CVSS Distribution", "SLA Compliance", "Asset Exposure"] },
  { id: "incident", title: "Incident Response Summary", icon: faCalendar, category: "Operations", lastGenerated: "2026-05-12", frequency: "Weekly", description: "MTTR, MTTD, financial impact per incident, DORA reportability, and lessons learned.", sections: ["Incident Overview", "Financial Impact", "DORA Reportable Events", "MTTR / MTTD"] },
];

const categoryStyle = (cat) => {
  if (cat === "Executive") return { bg: "#eff6ff", color: "#3B82EC", border: "#bfdbfe" };
  if (cat === "Financial") return { bg: "#f0fdf4", color: "#4BBF73", border: "#bbf7d0" };
  if (cat === "Risk") return { bg: "#fff5f5", color: "#d9534f", border: "#fecaca" };
  if (cat === "Compliance") return { bg: "#ecfeff", color: "#0e7490", border: "#a5f3fc" };
  if (cat === "Regulatory") return { bg: "#fffbeb", color: "#f0ad4e", border: "#fde68a" };
  if (cat === "Technical") return { bg: "#fff7ed", color: "#fd7e14", border: "#fed7aa" };
  return { bg: "#f9fafb", color: "#6c757d", border: "#e4e7ec" };
};

const Reports = ({ year, currentUserInfo, refreshCharts, onNavigate }) => {
  const { t } = useTranslation("common");
  const [generating, setGenerating] = useState(null);
  const [toast, setToast] = useState(null);

  // Hybrid posture snapshot — mock fallback as initial state, axios overrides on success.
  const [data, setData] = useState({
    org: MOCK_ORG, kpis: MOCK_KPIS, risks: MOCK_RISKS, frameworks: MOCK_FRAMEWORKS,
    incidents: MOCK_INCIDENTS, vulnerabilities: MOCK_VULNERABILITIES,
    regulatory: MOCK_REGULATORY, monteCarlo: MOCK_MONTECARLO,
  });

  useEffect(() => {
    const logInId = currentUserInfo?.logInId;
    // HYBRID: real backend call — replaces the mock fallback above on success.
    axios
      .get(`/cyberrisk/reports/snapshot/${logInId}?year=${Number(year)}`)
      .then((res) => {
        if (res?.data && typeof res.data === "object") setData((prev) => ({ ...prev, ...res.data }));
      })
      .catch((err) => {
        console.warn("[cyberrisk] reports snapshot: using mock fallback", err);
      });
  }, [year, currentUserInfo, refreshCharts]);

  const { org, kpis, risks, frameworks, incidents, vulnerabilities, regulatory, monteCarlo } = data;

  const openRisks = risks.filter((r) => r.status === "Open").length;
  const criticalRisks = risks.filter((r) => r.inherent_score >= 16).length;
  const avgCompliance = Math.round(frameworks.reduce((s, f) => s + f.score, 0) / frameworks.length);
  const totalALE = risks.reduce((s, r) => s + r.fair.ale, 0);
  const totalTreatment = risks.reduce((s, r) => s + r.treatment_cost, 0);
  const roiList = risks.filter((r) => r.remediation_roi > 0);
  const avgROI = Math.round(roiList.reduce((s, r) => s + r.remediation_roi, 0) / roiList.length);
  const totalFinancial = incidents.reduce((s, i) => s + i.financial_impact_estimate, 0);
  const openCVEs = vulnerabilities.filter((v) => v.status === "Open").length;
  const criticalCVEs = vulnerabilities.filter((v) => v.severity === "Critical").length;
  const doraIncidents = incidents.filter((i) => i.is_dora_reportable);
  const doraReported = doraIncidents.filter((i) => i.dora_reported).length;

  const handleGenerate = async (id, title) => {
    setGenerating(id);
    await new Promise((r) => setTimeout(r, 800));
    if (pdfGenerators[id]) pdfGenerators[id](data);
    setGenerating(null);
    setToast(`"${title}" ${t("exported as PDF")}`);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="progrec-page p-4 p-lg-5">
      {toast && (
        <div className="pg-toast">
          <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 14, color: "#4BBF73" }} />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: "#101828" }}>{t("Reports & Analytics")}</h5>
          <span style={{ fontSize: "0.82rem", color: "#667085" }}>{t("Export financial risk, compliance, DORA/NIS2, and operational reports")}</span>
        </div>
      </div>

      {/* Live posture snapshot */}
      <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: 10 }}>
        <Card.Body className="p-4">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#101828" }}>{org.name} — {t("Live Posture Snapshot")}</div>
              <div style={{ fontSize: "0.75rem", color: "#98a2b3" }}>{org.industry} · {TODAY}</div>
            </div>
            <div className="d-flex align-items-center gap-1 px-3 py-1 rounded" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: "0.75rem", color: "#4BBF73" }}>
              <span className="live-dot" style={{ background: "#4BBF73" }} /> {t("Live")}
            </div>
          </div>
          <Row className="g-3 mb-3">
            {[
              { l: t("Risk Score"), v: `${org.overallRiskScore}/100`, c: "#fd7e14" },
              { l: t("Aggregate ALE"), v: fmt$(totalALE), c: "#d9534f" },
              { l: t("VaR 95th Pct"), v: fmt$(kpis.valueAtRisk_95), c: "#d9534f" },
              { l: t("Treatment $"), v: fmt$(totalTreatment), c: "#3B82EC" },
              { l: t("Avg ROI"), v: `${avgROI}%`, c: "#4BBF73" },
              { l: t("Compliance"), v: `${avgCompliance}%`, c: "#3B82EC" },
              { l: t("DORA Ready"), v: `${regulatory.dora.readiness}%`, c: "#f0ad4e" },
              { l: t("NIS2 Ready"), v: `${regulatory.nis2.readiness}%`, c: "#f0ad4e" },
            ].map((s) => (
              <Col key={s.l} xs={6} sm={3} xl={Math.floor(12 / 8)}>
                <div className="text-center p-2 rounded" style={{ background: "#f9fafb", border: "1px solid #e4e7ec" }}>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem", color: s.c, fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
                  <div style={{ fontSize: "0.68rem", color: "#98a2b3" }}>{s.l}</div>
                </div>
              </Col>
            ))}
          </Row>
          <div className="row g-2 pt-3" style={{ borderTop: "1px solid #e4e7ec" }}>
            {[
              { l: t("Open Risks"), v: String(openRisks), sub: `${criticalRisks} ${t("critical")}`, icon: faTriangleExclamation, c: "#d9534f" },
              { l: t("Financial Impact (YTD)"), v: fmt$(totalFinancial), sub: t("Incident estimates"), icon: faDollarSign, c: "#fd7e14" },
              { l: t("DORA Incidents"), v: String(doraIncidents.length), sub: `${doraReported} ${t("reported")}`, icon: faClock, c: "#f0ad4e" },
              { l: t("Open CVEs"), v: String(openCVEs), sub: `${criticalCVEs} ${t("critical")}`, icon: faShieldHalved, c: "#3B82EC" },
            ].map((s) => (
              <div key={s.l} className="col-6 col-md-3">
                <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ background: "#f9fafb", border: "1px solid #e4e7ec" }}>
                  <FontAwesomeIcon icon={s.icon} style={{ fontSize: 15, color: s.c }} />
                  <div>
                    <div style={{ fontWeight: 700, color: s.c, fontVariantNumeric: "tabular-nums", fontSize: "0.9rem" }}>{s.v}</div>
                    <div style={{ fontSize: "0.72rem", color: "#344054" }}>{s.l}</div>
                    <div style={{ fontSize: "0.65rem", color: "#98a2b3" }}>{s.sub}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Report templates */}
      <div className="mb-2 d-flex align-items-center justify-content-between mb-3">
        <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "#98a2b3", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("Report Templates")}</div>
        <div style={{ fontSize: "0.72rem", color: "#98a2b3" }}>{t("Click Generate to download PDF")}</div>
      </div>
      <Row className="g-3 mb-4">
        {reportTemplates.map((rpt) => {
          const isGen = generating === rpt.id;
          const cs = categoryStyle(rpt.category);
          return (
            <Col key={rpt.id} xs={12} sm={6} xl={3}>
              <Card className="h-100 shadow-sm border-0" style={{ borderRadius: 10 }}>
                <Card.Body className="p-4 d-flex flex-column">
                  <div className="d-flex align-items-start gap-3 mb-3">
                    <div className="d-flex align-items-center justify-content-center rounded flex-shrink-0" style={{ width: 36, height: 36, background: "#f4f7f9", border: "1px solid #e4e7ec" }}>
                      <FontAwesomeIcon icon={rpt.icon} style={{ fontSize: 17, color: "#667085" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: "0.68rem", padding: "2px 7px", borderRadius: 20, background: cs.bg, color: cs.color, border: `1px solid ${cs.border}`, fontWeight: 500 }}>{t(rpt.category)}</span>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#101828", marginTop: 6, lineHeight: 1.3 }}>{t(rpt.title)}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "#667085", lineHeight: 1.6, flex: 1 }}>{t(rpt.description)}</p>

                  <div className="d-flex flex-wrap gap-1 mb-3">
                    {rpt.sections.map((s) => (
                      <span key={s} style={{ fontSize: "0.65rem", background: "#f4f7f9", border: "1px solid #e4e7ec", borderRadius: 4, padding: "1px 6px", color: "#667085" }}>{t(s)}</span>
                    ))}
                  </div>

                  <div className="d-flex align-items-center justify-content-between mt-auto">
                    <div style={{ fontSize: "0.72rem", color: "#98a2b3" }}>
                      <span style={{ color: "#667085" }}>{t(rpt.frequency)}</span> · {rpt.lastGenerated}
                    </div>
                    <button onClick={() => handleGenerate(rpt.id, t(rpt.title))} disabled={isGen}
                      className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" style={{ fontSize: "0.75rem" }}>
                      {isGen
                        ? <><FontAwesomeIcon icon={faArrowsRotate} className="spin" style={{ fontSize: 11 }} /> {t("Generating…")}</>
                        : <><FontAwesomeIcon icon={faDownload} style={{ fontSize: 11 }} /> {t("Generate")}</>}
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
            <Card.Header className="bg-white d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: "1px solid #e4e7ec" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#101828" }}>{t("Value at Risk — Monte Carlo")}</div>
                <div style={{ fontSize: "0.72rem", color: "#98a2b3" }}>{monteCarlo.simulations.toLocaleString()} {t("simulations · FAIR model")}</div>
              </div>
              <button onClick={() => handleGenerate("fair", t("FAIR Financial Risk Report"))} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ fontSize: "0.75rem" }}>
                <FontAwesomeIcon icon={faDownload} style={{ fontSize: 11 }} /> {t("Export")}
              </button>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="d-flex flex-column gap-2">
                {monteCarlo.percentiles.map((p) => {
                  const max = monteCarlo.percentiles[monteCarlo.percentiles.length - 1].value;
                  const color = p.pct >= 95 ? "#d9534f" : p.pct >= 90 ? "#fd7e14" : p.pct >= 75 ? "#f0ad4e" : "#3B82EC";
                  return (
                    <div key={p.pct} className="d-flex align-items-center gap-2">
                      <span style={{ fontSize: "0.72rem", color: "#98a2b3", width: 28, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{p.pct}%</span>
                      <div style={{ flex: 1, height: 10, background: "#f0f0f0", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 999, background: color, width: `${(p.value / max) * 100}%` }} />
                      </div>
                      <span style={{ fontSize: "0.72rem", fontFamily: "monospace", fontWeight: 600, color, width: 52 }}>{fmt$(p.value)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="d-flex gap-4 mt-3 pt-3" style={{ borderTop: "1px solid #e4e7ec", fontSize: "0.78rem", color: "#98a2b3" }}>
                <span>{t("Mean")}: <strong style={{ color: "#344054" }}>{fmt$(monteCarlo.mean_loss)}</strong></span>
                <span>{t("Std Dev")}: <strong style={{ color: "#344054" }}>{fmt$(monteCarlo.std_dev)}</strong></span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} xl={6}>
          <Card className="shadow-sm border-0 h-100" style={{ borderRadius: 10 }}>
            <Card.Header className="bg-white d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: "1px solid #e4e7ec" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#101828" }}>{t("Compliance Framework Scores")}</div>
                <div style={{ fontSize: "0.72rem", color: "#98a2b3" }}>{t("Posture across")} {frameworks.length} {t("active frameworks")}</div>
              </div>
              <button onClick={() => handleGenerate("compliance", t("Compliance Status Report"))} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ fontSize: "0.75rem" }}>
                <FontAwesomeIcon icon={faDownload} style={{ fontSize: 11 }} /> {t("Export")}
              </button>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="d-flex flex-column gap-2">
                {frameworks.map((fw) => (
                  <div key={fw.id} className="d-flex align-items-center gap-2">
                    <span style={{ width: 72, fontSize: "0.78rem", color: "#667085", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>{fw.name}</span>
                    <div style={{ flex: 1, height: 10, background: "#f0f0f0", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 999, background: fw.score >= 80 ? "#4BBF73" : fw.score >= 65 ? "#f0ad4e" : "#d9534f", width: `${fw.score}%` }} />
                    </div>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, width: 36, textAlign: "right", color: fw.score >= 80 ? "#4BBF73" : fw.score >= 65 ? "#f0ad4e" : "#d9534f" }}>{fw.score}%</span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reports;
