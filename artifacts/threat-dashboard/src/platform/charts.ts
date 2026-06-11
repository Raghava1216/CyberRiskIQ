import {
  mockRisks, mockThreats, mockVulnerabilities, mockAssets, mockIOCs,
  mockIncidents, mockComplianceFrameworks, mockTreatmentMix, mockRiskTrend,
  mockMonteCarloResults, mockRegulatoryMetrics, mockOrg,
} from '../lib/mockData';
import type { ChartDef } from './types';
import { countBy, CHART_COLORS } from './format';

const mitreTechniques = [
  { name: 'T1486 Data Encrypted', value: 42 },
  { name: 'T1110 Brute Force', value: 36 },
  { name: 'T1059 Command/Script', value: 28 },
  { name: 'T1071 App Layer Protocol', value: 21 },
  { name: 'T1068 Priv. Escalation', value: 17 },
  { name: 'T1136 Create Account', value: 11 },
];

export const chartRegistry: Record<string, ChartDef> = {
  // ── Dashboard ──────────────────────────────────────────────
  CR_RISK_SCORE_GAUGE: {
    title: 'Overall Risk Score',
    type: 'gauge',
    data: [],
    gaugeValue: mockOrg.overallRiskScore,
    gaugeMax: 100,
  },
  CR_RISK_TREND: {
    title: 'Risk Trend (7 months)',
    type: 'stackedBar',
    data: mockRiskTrend,
    xKey: 'month',
    series: [
      { key: 'critical', label: 'Critical', color: '#d9534f' },
      { key: 'high', label: 'High', color: '#f0ad4e' },
      { key: 'medium', label: 'Medium', color: '#3B82EC' },
      { key: 'low', label: 'Low', color: '#22c55e' },
    ],
  },
  CR_TREATMENT_MIX: {
    title: 'Risk Treatment Mix',
    type: 'donut',
    data: mockTreatmentMix.map((t) => ({ name: t.treatment, value: t.count })),
    valueKey: 'value',
    nameKey: 'name',
    colors: ['#3B82EC', '#22c55e', '#f0ad4e', '#d9534f'],
  },
  CR_VAR_PERCENTILES: {
    title: 'Value at Risk (Monte Carlo)',
    type: 'horizontalBar',
    data: mockMonteCarloResults.percentiles.map((p) => ({ name: `${p.pct}th`, value: p.value })),
    valueKey: 'value',
    colors: ['#3B82EC'],
  },
  CR_LOSS_DISTRIBUTION: {
    title: 'Simulated Loss Distribution',
    type: 'bar',
    data: mockMonteCarloResults.histogram.map((h) => ({ name: h.range, value: h.count })),
    xKey: 'name',
    series: [{ key: 'value', label: 'Simulations', color: '#8b5cf6' }],
  },
  CR_NIS2_READINESS: {
    title: 'NIS2 Readiness by Domain',
    type: 'horizontalBar',
    data: [
      { name: 'Governance', value: mockRegulatoryMetrics.nis2.governance_score },
      { name: 'Technical', value: mockRegulatoryMetrics.nis2.technical_measures_score },
      { name: 'Business Continuity', value: mockRegulatoryMetrics.nis2.business_continuity_score },
      { name: 'Incident Handling', value: mockRegulatoryMetrics.nis2.incident_handling_score },
      { name: 'Supply Chain', value: mockRegulatoryMetrics.nis2.supply_chain_score },
      { name: 'Cryptography', value: mockRegulatoryMetrics.nis2.cryptography_score },
    ],
    valueKey: 'value',
    colors: ['#06b6d4'],
  },

  // ── Risk Register ──────────────────────────────────────────
  CR_RISK_BY_CATEGORY: {
    title: 'Risks by Category',
    type: 'bar',
    data: countBy(mockRisks, 'category'),
    xKey: 'name',
    series: [{ key: 'value', label: 'Risks', color: '#3B82EC' }],
  },
  CR_RISK_BY_TREATMENT: {
    title: 'Risks by Treatment',
    type: 'donut',
    data: countBy(mockRisks, 'treatment'),
    valueKey: 'value',
    nameKey: 'name',
    colors: CHART_COLORS,
  },
  CR_RISK_HEATMAP: {
    title: 'Risk Heat Map (Likelihood × Impact)',
    type: 'heatmap',
    data: mockRisks.map((r) => ({ x: r.likelihood, y: r.impact, name: r.title })),
    xLabels: ['1', '2', '3', '4', '5'],
    yLabels: ['1', '2', '3', '4', '5'],
  },

  // ── Threats ────────────────────────────────────────────────
  CR_THREAT_BY_SEVERITY: {
    title: 'Threats by Severity',
    type: 'donut',
    data: countBy(mockThreats, 'severity'),
    valueKey: 'value',
    nameKey: 'name',
    colors: ['#d9534f', '#f0ad4e', '#3B82EC', '#22c55e'],
  },
  CR_THREAT_BY_CATEGORY: {
    title: 'Threats by Category',
    type: 'bar',
    data: countBy(mockThreats, 'category'),
    xKey: 'name',
    series: [{ key: 'value', label: 'Threats', color: '#ec4899' }],
  },

  // ── Vulnerabilities ────────────────────────────────────────
  CR_VULN_BY_SEVERITY: {
    title: 'Vulnerabilities by Severity',
    type: 'bar',
    data: countBy(mockVulnerabilities, 'severity'),
    xKey: 'name',
    series: [{ key: 'value', label: 'Vulnerabilities', color: '#d9534f' }],
  },
  CR_VULN_BY_STATUS: {
    title: 'Vulnerabilities by Status',
    type: 'donut',
    data: countBy(mockVulnerabilities, 'status'),
    valueKey: 'value',
    nameKey: 'name',
    colors: CHART_COLORS,
  },

  // ── Assets ─────────────────────────────────────────────────
  CR_ASSET_BY_CRITICALITY: {
    title: 'Assets by Criticality',
    type: 'donut',
    data: countBy(mockAssets, 'criticality'),
    valueKey: 'value',
    nameKey: 'name',
    colors: ['#d9534f', '#f0ad4e', '#3B82EC', '#22c55e'],
  },
  CR_ASSET_BY_CLASS: {
    title: 'Assets by Class',
    type: 'bar',
    data: countBy(mockAssets, 'asset_class'),
    xKey: 'name',
    series: [{ key: 'value', label: 'Assets', color: '#14b8a6' }],
  },

  // ── IOC ────────────────────────────────────────────────────
  CR_IOC_BY_TYPE: {
    title: 'Indicators by Type',
    type: 'bar',
    data: countBy(mockIOCs, 'type'),
    xKey: 'name',
    series: [{ key: 'value', label: 'Indicators', color: '#3B82EC' }],
  },

  // ── Incidents ──────────────────────────────────────────────
  CR_INCIDENT_BY_SEVERITY: {
    title: 'Incidents by Severity',
    type: 'donut',
    data: countBy(mockIncidents, 'severity'),
    valueKey: 'value',
    nameKey: 'name',
    colors: ['#d9534f', '#f0ad4e', '#3B82EC', '#22c55e'],
  },
  CR_INCIDENT_BY_STATUS: {
    title: 'Incidents by Status',
    type: 'bar',
    data: countBy(mockIncidents, 'status'),
    xKey: 'name',
    series: [{ key: 'value', label: 'Incidents', color: '#f0ad4e' }],
  },

  // ── Compliance ─────────────────────────────────────────────
  CR_COMPLIANCE_SCORES: {
    title: 'Framework Compliance Scores',
    type: 'horizontalBar',
    data: mockComplianceFrameworks.map((f) => ({ name: f.name, value: f.score })),
    valueKey: 'value',
    colors: ['#3B82EC'],
  },

  // ── Wazuh ──────────────────────────────────────────────────
  CR_MITRE_TECHNIQUES: {
    title: 'Top MITRE ATT&CK Techniques',
    type: 'horizontalBar',
    data: mitreTechniques,
    valueKey: 'value',
    colors: ['#d9534f'],
  },
};

export function getChart(id: string): ChartDef | undefined {
  return chartRegistry[id];
}
