import {
  mockRisks, mockThreats, mockThreatActors, mockVulnerabilities,
  mockAssets, mockIOCs, mockIncidents, mockComplianceFrameworks,
  mockGRCRegistry, mockKPIs, mockOrg, mockRegulatoryMetrics,
} from '../lib/mockData';
import type { ReportDef } from './types';
import { formatCurrency } from './format';

// Local inline data for the SIEM feed (the source app fetches this from Wazuh).
const wazuhAlerts = [
  { time: '2026-05-13T05:42:00Z', rule: 'Multiple authentication failures', level: 10, agent: 'web-app-01', mitre: 'T1110' },
  { time: '2026-05-13T05:30:00Z', rule: 'Possible LockBit ransomware behaviour', level: 14, agent: 'fin-ws-22', mitre: 'T1486' },
  { time: '2026-05-13T05:11:00Z', rule: 'Suspicious PowerShell execution', level: 12, agent: 'app-server-07', mitre: 'T1059.001' },
  { time: '2026-05-13T04:58:00Z', rule: 'DNS tunneling detected', level: 11, agent: 'db-server-03', mitre: 'T1071.004' },
  { time: '2026-05-13T04:30:00Z', rule: 'New admin account created', level: 9, agent: 'dc-primary', mitre: 'T1136' },
  { time: '2026-05-13T03:50:00Z', rule: 'Privilege escalation attempt', level: 13, agent: 'app-server-07', mitre: 'T1068' },
];

const ale = (r: typeof mockRisks[number]) => r.fair.ale;

export const reportRegistry: Record<string, ReportDef> = {
  // ── Dashboard ──────────────────────────────────────────────
  CR_DASHBOARD_KPIS: {
    title: 'Risk Posture KPIs',
    columns: [],
    rows: [],
    dataCards: [
      { label: 'Total Risks', value: mockKPIs.totalRisks, sub: `${mockKPIs.criticalRisks} critical`, variant: 'primary' },
      { label: 'Open Incidents', value: mockKPIs.openIncidents, sub: `${mockKPIs.criticalIncidents} critical`, variant: 'danger' },
      { label: 'Aggregate ALE', value: formatCurrency(mockKPIs.totalALE), sub: 'Annualised loss exp.', variant: 'warning' },
      { label: 'Value at Risk (95%)', value: formatCurrency(mockKPIs.valueAtRisk_95), sub: 'Monte Carlo', variant: 'danger' },
      { label: 'Aggregate ROI', value: `${mockKPIs.aggregateROI}%`, sub: 'Treatment efficiency', variant: 'success' },
      { label: 'Vulnerable Assets', value: mockKPIs.vulnerableAssets, sub: `of ${mockKPIs.totalAssets} assets`, variant: 'info' },
      { label: 'Compliance Score', value: `${mockKPIs.complianceScore}%`, sub: 'Weighted average', variant: 'primary' },
      { label: 'NIS2 Readiness', value: `${mockKPIs.nis2ReadinessScore}%`, sub: `DORA incidents: ${mockKPIs.doraIncidents}`, variant: 'secondary' },
    ],
  },
  CR_TOP_RISKS: {
    title: 'Top Risks by Annualised Loss Expectancy',
    columns: [
      { key: 'title', label: 'Risk' },
      { key: 'category', label: 'Category' },
      { key: 'residual_score', label: 'Residual', type: 'bar', max: 25 },
      { key: 'ale', label: 'ALE', type: 'currency', align: 'end' },
      { key: 'treatment', label: 'Treatment', type: 'status' },
      { key: 'owner', label: 'Owner' },
    ],
    rows: [...mockRisks]
      .sort((a, b) => ale(b) - ale(a))
      .slice(0, 5)
      .map((r) => ({ ...r, ale: r.fair.ale })),
  },
  CR_POSTURE_SNAPSHOT: {
    title: 'Live Posture Snapshot',
    columns: [],
    rows: [],
    dataCards: [
      { label: 'Overall Risk Score', value: `${mockOrg.overallRiskScore}/100`, sub: `Trend ${mockOrg.trend}`, variant: 'warning' },
      { label: 'Aggregate ALE', value: formatCurrency(mockKPIs.totalALE), sub: 'Quantified exposure', variant: 'danger' },
      { label: 'Compliance', value: `${mockKPIs.complianceScore}%`, sub: 'Across frameworks', variant: 'primary' },
      { label: 'Open Incidents', value: mockKPIs.openIncidents, sub: `${mockKPIs.doraIncidents} DORA`, variant: 'info' },
    ],
  },
  CR_DORA_METRICS: {
    title: 'DORA Operational Resilience',
    columns: [],
    rows: [],
    dataCards: [
      { label: 'DORA Readiness', value: `${mockRegulatoryMetrics.dora.readiness}%`, variant: 'primary' },
      { label: 'Incidents Reported', value: `${mockRegulatoryMetrics.dora.incidents_reported}/${mockRegulatoryMetrics.dora.incidents_ytd}`, sub: 'YTD', variant: 'warning' },
      { label: 'RTO (actual)', value: `${mockRegulatoryMetrics.dora.rto_actual_hours}h`, sub: `target ${mockRegulatoryMetrics.dora.rto_target_hours}h`, variant: 'danger' },
      { label: 'RPO (actual)', value: `${mockRegulatoryMetrics.dora.rpo_actual_hours}h`, sub: `target ${mockRegulatoryMetrics.dora.rpo_target_hours}h`, variant: 'info' },
    ],
  },

  // ── Risk Register ──────────────────────────────────────────
  CR_RISK_STATS: {
    title: 'Risk Register Summary',
    columns: [],
    rows: [],
    dataCards: [
      { label: 'Aggregate ALE', value: formatCurrency(mockKPIs.totalALE), variant: 'danger' },
      { label: 'Treatment Budget', value: formatCurrency(mockKPIs.totalTreatmentBudget), variant: 'warning' },
      { label: 'Aggregate ROI', value: `${mockKPIs.aggregateROI}%`, variant: 'success' },
      { label: 'Critical Risks', value: mockKPIs.criticalRisks, sub: `of ${mockKPIs.totalRisks}`, variant: 'primary' },
    ],
  },
  CR_RISK_REGISTER: {
    title: 'Risk Register',
    columns: [
      { key: 'title', label: 'Risk' },
      { key: 'category', label: 'Category' },
      { key: 'status', label: 'Status', type: 'status' },
      { key: 'inherent_score', label: 'Inherent', type: 'bar', max: 25 },
      { key: 'residual_score', label: 'Residual', type: 'bar', max: 25 },
      { key: 'ale', label: 'ALE', type: 'currency', align: 'end' },
      { key: 'treatment', label: 'Treatment' },
      { key: 'owner', label: 'Owner' },
    ],
    pivotBy: 'category',
    rows: mockRisks.map((r) => ({ ...r, ale: r.fair.ale })),
  },
  CR_RISK_FINANCIAL: {
    title: 'Quantified Financial Exposure (FAIR)',
    columns: [
      { key: 'title', label: 'Risk' },
      { key: 'ale', label: 'ALE (likely)', type: 'currency', align: 'end' },
      { key: 'aleRange', label: 'ALE range' },
      { key: 'treatment', label: 'Treatment', type: 'status' },
      { key: 'treatment_cost', label: 'Cost', type: 'currency', align: 'end' },
      { key: 'remediation_roi', label: 'ROI %', type: 'number', align: 'end' },
      { key: 'framework_tags', label: 'Frameworks', type: 'tags' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    rows: mockRisks.map((r) => ({
      ...r,
      ale: r.fair.ale,
      aleRange: `${formatCurrency(r.fair.ale_min)} – ${formatCurrency(r.fair.ale_max)}`,
    })),
  },

  // ── Threat Intelligence ────────────────────────────────────
  CR_THREAT_STATS: {
    title: 'Threat Intelligence Summary',
    columns: [],
    rows: [],
    dataCards: [
      { label: 'Active Threats', value: mockThreats.filter((t) => t.status === 'Active').length, variant: 'danger' },
      { label: 'Critical', value: mockThreats.filter((t) => t.severity === 'Critical').length, variant: 'danger' },
      { label: 'Threat Actors', value: mockThreatActors.length, variant: 'warning' },
      { label: 'Threat Alerts', value: mockKPIs.threatAlerts, sub: 'Last 24h', variant: 'info' },
    ],
  },
  CR_THREAT_FEED: {
    title: 'Active Threat Feed',
    columns: [
      { key: 'title', label: 'Threat' },
      { key: 'category', label: 'Category' },
      { key: 'severity', label: 'Severity', type: 'severity' },
      { key: 'status', label: 'Status', type: 'status' },
      { key: 'confidence', label: 'Confidence', type: 'bar', max: 100 },
      { key: 'source', label: 'Source' },
      { key: 'ioc_value', label: 'IOC' },
      { key: 'last_seen', label: 'Last seen', type: 'date' },
    ],
    rows: mockThreats,
  },
  CR_THREAT_ACTORS: {
    title: 'Threat Actor Profiles',
    columns: [
      { key: 'name', label: 'Actor' },
      { key: 'type', label: 'Type' },
      { key: 'sophistication', label: 'Sophistication' },
      { key: 'motivation', label: 'Motivation', type: 'tags' },
      { key: 'target_sectors', label: 'Target Sectors', type: 'tags' },
      { key: 'last_seen', label: 'Last seen', type: 'date' },
    ],
    rows: mockThreatActors,
  },

  // ── Vulnerabilities ────────────────────────────────────────
  CR_VULN_STATS: {
    title: 'Vulnerability Summary',
    columns: [],
    rows: [],
    dataCards: [
      { label: 'Critical', value: mockVulnerabilities.filter((v) => v.severity === 'Critical').length, variant: 'danger' },
      { label: 'High', value: mockVulnerabilities.filter((v) => v.severity === 'High').length, variant: 'warning' },
      { label: 'Exploit Available', value: mockVulnerabilities.filter((v) => v.exploit_available).length, variant: 'danger' },
      { label: 'Patch Available', value: mockVulnerabilities.filter((v) => v.patch_available).length, variant: 'success' },
    ],
  },
  CR_VULN_REGISTER: {
    title: 'Vulnerability Register',
    columns: [
      { key: 'cve_id', label: 'CVE' },
      { key: 'title', label: 'Title' },
      { key: 'cvss_score', label: 'CVSS', type: 'bar', max: 10 },
      { key: 'severity', label: 'Severity', type: 'severity' },
      { key: 'status', label: 'Status', type: 'status' },
      { key: 'asset', label: 'Asset' },
      { key: 'exploit_available', label: 'Exploit', type: 'bool' },
      { key: 'patch_available', label: 'Patch', type: 'bool' },
      { key: 'due_date', label: 'Due', type: 'date' },
      { key: 'assigned_to', label: 'Assignee' },
    ],
    rows: mockVulnerabilities,
  },

  // ── Assets ─────────────────────────────────────────────────
  CR_ASSET_STATS: {
    title: 'Asset Inventory Summary',
    columns: [],
    rows: [],
    dataCards: [
      { label: 'Total Assets', value: mockAssets.length, variant: 'primary' },
      { label: 'Annual Value', value: formatCurrency(mockAssets.reduce((s, a) => s + a.annual_value, 0)), variant: 'success' },
      { label: 'High-Risk Assets', value: mockAssets.filter((a) => a.risk_score >= 70).length, variant: 'danger' },
      { label: 'Open CVEs', value: mockAssets.reduce((s, a) => s + a.open_cve_count, 0), variant: 'warning' },
    ],
  },
  CR_ASSET_INVENTORY: {
    title: 'Asset Inventory',
    columns: [
      { key: 'name', label: 'Asset' },
      { key: 'type', label: 'Type' },
      { key: 'asset_class', label: 'Class' },
      { key: 'criticality', label: 'Criticality', type: 'severity' },
      { key: 'risk_score', label: 'Risk', type: 'bar', max: 100 },
      { key: 'open_cve_count', label: 'Open CVEs', type: 'number', align: 'end' },
      { key: 'data_classification', label: 'Data Class' },
      { key: 'regulatory_scope', label: 'Regulatory', type: 'tags' },
      { key: 'annual_value', label: 'Value', type: 'currency', align: 'end' },
    ],
    pivotBy: 'asset_class',
    rows: mockAssets,
  },

  // ── IOC Register ───────────────────────────────────────────
  CR_IOC_STATS: {
    title: 'IOC Register Summary',
    columns: [],
    rows: [],
    dataCards: [
      { label: 'Total IOCs', value: mockIOCs.length, variant: 'primary' },
      { label: 'Active', value: mockIOCs.filter((i) => i.status === 'Active').length, variant: 'danger' },
      { label: 'Critical', value: mockIOCs.filter((i) => i.severity === 'Critical').length, variant: 'danger' },
      { label: 'Indicator Types', value: new Set(mockIOCs.map((i) => i.type)).size, variant: 'info' },
    ],
  },
  CR_IOC_REGISTER: {
    title: 'Indicators of Compromise',
    columns: [
      { key: 'value', label: 'Indicator' },
      { key: 'type', label: 'Type' },
      { key: 'severity', label: 'Severity', type: 'severity' },
      { key: 'confidence', label: 'Confidence', type: 'bar', max: 100 },
      { key: 'source', label: 'Source' },
      { key: 'threat_actor', label: 'Threat Actor' },
      { key: 'status', label: 'Status', type: 'status' },
      { key: 'last_seen', label: 'Last seen', type: 'date' },
    ],
    rows: mockIOCs,
  },

  // ── Incidents ──────────────────────────────────────────────
  CR_INCIDENT_STATS: {
    title: 'Incident Response Summary',
    columns: [],
    rows: [],
    dataCards: [
      { label: 'Active', value: mockIncidents.filter((i) => !['Resolved', 'Closed'].includes(i.status)).length, variant: 'danger' },
      { label: 'P1 Incidents', value: mockIncidents.filter((i) => i.priority === 'P1').length, variant: 'danger' },
      { label: 'DORA Reportable', value: mockIncidents.filter((i) => i.is_dora_reportable).length, variant: 'warning' },
      { label: 'Resolved', value: mockIncidents.filter((i) => i.status === 'Resolved').length, variant: 'success' },
    ],
  },
  CR_INCIDENT_REGISTER: {
    title: 'Incident Register',
    columns: [
      { key: 'title', label: 'Incident' },
      { key: 'type', label: 'Type' },
      { key: 'severity', label: 'Severity', type: 'severity' },
      { key: 'priority', label: 'Priority', type: 'priority' },
      { key: 'status', label: 'Status', type: 'status' },
      { key: 'assigned_to', label: 'Owner' },
      { key: 'is_dora_reportable', label: 'DORA', type: 'bool' },
      { key: 'financial_impact_estimate', label: 'Impact', type: 'currency', align: 'end' },
      { key: 'detected_at', label: 'Detected', type: 'date' },
    ],
    rows: mockIncidents,
  },

  // ── Compliance ─────────────────────────────────────────────
  CR_COMPLIANCE_STATS: {
    title: 'Compliance Summary',
    columns: [],
    rows: [],
    dataCards: [
      { label: 'Avg Score', value: `${Math.round(mockComplianceFrameworks.reduce((s, f) => s + f.score, 0) / mockComplianceFrameworks.length)}%`, variant: 'primary' },
      { label: 'Frameworks', value: mockComplianceFrameworks.length, variant: 'info' },
      { label: 'Compliant Controls', value: mockComplianceFrameworks.reduce((s, f) => s + f.controls_compliant, 0), variant: 'success' },
      { label: 'Gaps', value: mockComplianceFrameworks.reduce((s, f) => s + f.controls_noncompliant, 0), variant: 'danger' },
    ],
  },
  CR_COMPLIANCE_FRAMEWORKS: {
    title: 'Framework Compliance',
    columns: [
      { key: 'name', label: 'Framework' },
      { key: 'version', label: 'Version' },
      { key: 'category', label: 'Category' },
      { key: 'score', label: 'Score', type: 'bar', max: 100 },
      { key: 'controls_compliant', label: 'Compliant', type: 'number', align: 'end' },
      { key: 'controls_partial', label: 'Partial', type: 'number', align: 'end' },
      { key: 'controls_noncompliant', label: 'Non-compliant', type: 'number', align: 'end' },
    ],
    rows: mockComplianceFrameworks,
  },
  CR_GRC_REGISTRY: {
    title: 'GRC Control Mapping',
    columns: [
      { key: 'risk_title', label: 'Risk' },
      { key: 'framework', label: 'Framework' },
      { key: 'control_ref', label: 'Control' },
      { key: 'requirement', label: 'Requirement' },
      { key: 'treatment', label: 'Treatment' },
      { key: 'status', label: 'Status', type: 'status' },
      { key: 'due_date', label: 'Due', type: 'date' },
    ],
    rows: mockGRCRegistry,
  },

  // ── Wazuh SIEM ─────────────────────────────────────────────
  CR_WAZUH_STATS: {
    title: 'Wazuh SIEM Summary',
    columns: [],
    rows: [],
    dataCards: [
      { label: 'Alerts (24h)', value: wazuhAlerts.length * 214, variant: 'primary' },
      { label: 'High Level (12+)', value: wazuhAlerts.filter((a) => a.level >= 12).length, variant: 'danger' },
      { label: 'Active Agents', value: 38, sub: 'of 41 enrolled', variant: 'success' },
      { label: 'MITRE TTPs', value: new Set(wazuhAlerts.map((a) => a.mitre)).size, variant: 'warning' },
    ],
  },
  CR_WAZUH_ALERTS: {
    title: 'Security Alerts',
    columns: [
      { key: 'time', label: 'Time', type: 'date' },
      { key: 'rule', label: 'Rule' },
      { key: 'level', label: 'Level', type: 'bar', max: 15 },
      { key: 'agent', label: 'Agent' },
      { key: 'mitre', label: 'MITRE' },
    ],
    rows: wazuhAlerts,
  },
};

export function getReport(id: string): ReportDef | undefined {
  return reportRegistry[id];
}
