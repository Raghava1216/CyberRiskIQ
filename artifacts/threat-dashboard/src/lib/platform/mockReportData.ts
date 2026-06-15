// Mock report/chart "meta + data" mirroring the user's GRC application template.
// The real ReportRuntime/Chart engines are backend-bound (axios + react-query);
// these mocks reproduce their SHAPE so the real engines can drop in later.

export type RiskBand = 'veryHigh' | 'high' | 'medium' | 'low' | 'veryLow' | 'na';

export const RISK_COLORS: Record<RiskBand, string> = {
  veryHigh: '#ff4545',
  high: '#ffa534',
  medium: '#ffe234',
  low: '#b7dd29',
  veryLow: '#57e32c',
  na: '#e0e0e0',
};

export function bandFromScore(score: number): RiskBand {
  if (score >= 20) return 'veryHigh';
  if (score >= 15) return 'high';
  if (score >= 9) return 'medium';
  if (score >= 4) return 'low';
  if (score > 0) return 'veryLow';
  return 'na';
}

export interface ReportColumn {
  accessorKey: string;
  header: string;
  visible?: boolean;
  align?: 'start' | 'center' | 'end';
  kind?: 'text' | 'band' | 'currency' | 'status' | 'progress';
}

export interface ReportMeta {
  title: string;
  columns: ReportColumn[];
}

export interface ReportPayload {
  meta: ReportMeta;
  rows: Record<string, unknown>[];
  totalRecords: number;
}

const REPORTS: Record<string, ReportPayload> = {
  CR_RPT_TOP_RISKS: {
    meta: {
      title: 'Top Operational Risks',
      columns: [
        { accessorKey: 'ref', header: 'Ref', align: 'start' },
        { accessorKey: 'risk', header: 'Risk', align: 'start' },
        { accessorKey: 'bu', header: 'Business Unit', align: 'start' },
        { accessorKey: 'owner', header: 'Owner', align: 'start' },
        { accessorKey: 'inherent', header: 'Inherent', kind: 'band', align: 'center' },
        { accessorKey: 'residual', header: 'Residual', kind: 'band', align: 'center' },
        { accessorKey: 'exposure', header: 'Net Exposure', kind: 'currency', align: 'end' },
        { accessorKey: 'status', header: 'Treatment', kind: 'status', align: 'center' },
      ],
    },
    totalRecords: 7,
    rows: [
      { ref: 'R-1042', risk: 'Ransomware via unpatched VPN', bu: 'IT Infrastructure', owner: 'A. Mehra', inherent: 25, residual: 16, exposure: 4200000, status: 'Mitigate' },
      { ref: 'R-1031', risk: 'Third-party data processor breach', bu: 'Procurement', owner: 'L. Okafor', inherent: 20, residual: 12, exposure: 2800000, status: 'Transfer' },
      { ref: 'R-1058', risk: 'Insider exfiltration of PII', bu: 'HR Systems', owner: 'D. Silva', inherent: 16, residual: 9, exposure: 1500000, status: 'Mitigate' },
      { ref: 'R-1067', risk: 'Cloud misconfiguration (S3 exposure)', bu: 'Platform Eng', owner: 'J. Park', inherent: 15, residual: 6, exposure: 900000, status: 'Accept' },
      { ref: 'R-1073', risk: 'Phishing-led credential theft', bu: 'Sales', owner: 'M. Rossi', inherent: 12, residual: 8, exposure: 650000, status: 'Mitigate' },
      { ref: 'R-1080', risk: 'DDoS on customer portal', bu: 'Digital', owner: 'S. Haddad', inherent: 9, residual: 4, exposure: 320000, status: 'Transfer' },
      { ref: 'R-1090', risk: 'Regulatory reporting delay (DORA)', bu: 'Compliance', owner: 'P. Nwosu', inherent: 12, residual: 6, exposure: 540000, status: 'Mitigate' },
    ],
  },
  CR_RPT_CONTROL_TESTING: {
    meta: {
      title: 'Control Testing Status',
      columns: [
        { accessorKey: 'ctrl', header: 'Control', align: 'start' },
        { accessorKey: 'framework', header: 'Framework', align: 'start' },
        { accessorKey: 'owner', header: 'Owner', align: 'start' },
        { accessorKey: 'effectiveness', header: 'Effectiveness', kind: 'progress', align: 'start' },
        { accessorKey: 'result', header: 'Result', kind: 'status', align: 'center' },
      ],
    },
    totalRecords: 6,
    rows: [
      { ctrl: 'AC-2 Account Management', framework: 'NIST CSF', owner: 'IAM Team', effectiveness: 92, result: 'Effective' },
      { ctrl: 'A.8.24 Cryptography', framework: 'ISO 27001', owner: 'Security Eng', effectiveness: 78, result: 'Effective' },
      { ctrl: 'DE.CM Continuous Monitoring', framework: 'NIST CSF', owner: 'SOC', effectiveness: 64, result: 'Partial' },
      { ctrl: 'Art.9 ICT Risk Mgmt', framework: 'DORA', owner: 'Risk Office', effectiveness: 55, result: 'Partial' },
      { ctrl: 'CC6.1 Logical Access', framework: 'SOC 2', owner: 'Platform Eng', effectiveness: 88, result: 'Effective' },
      { ctrl: 'A.5.7 Threat Intel', framework: 'ISO 27001', owner: 'CTI Team', effectiveness: 41, result: 'Ineffective' },
    ],
  },
};

export function getReport(reportId: string): ReportPayload {
  return REPORTS[reportId] ?? REPORTS.CR_RPT_TOP_RISKS;
}

// ── Chart engine mocks ───────────────────────────────────────────────
export type ChartKind = 'doughnut' | 'bar' | 'stacked' | 'line' | 'trend';

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
}

export interface ChartPayload {
  title: string;
  kind: ChartKind;
  data: Record<string, number | string>[];
  series: ChartSeries[];
  nameKey?: string;
}

const CHARTS: Record<string, ChartPayload> = {
  CR_CHT_RISK_SEVERITY: {
    title: 'Residual Risk by Severity',
    kind: 'doughnut',
    nameKey: 'name',
    series: [{ key: 'value', label: 'Risks', color: '#293042' }],
    data: [
      { name: 'Very High', value: 4, fill: RISK_COLORS.veryHigh },
      { name: 'High', value: 9, fill: RISK_COLORS.high },
      { name: 'Medium', value: 14, fill: RISK_COLORS.medium },
      { name: 'Low', value: 18, fill: RISK_COLORS.low },
      { name: 'Very Low', value: 7, fill: RISK_COLORS.veryLow },
    ],
  },
  CR_CHT_CONTROL_BU: {
    title: 'Control Testing by Business Unit',
    kind: 'stacked',
    nameKey: 'bu',
    series: [
      { key: 'effective', label: 'Effective', color: '#57e32c' },
      { key: 'partial', label: 'Partial', color: '#ffca3a' },
      { key: 'ineffective', label: 'Ineffective', color: '#ff595e' },
    ],
    data: [
      { bu: 'IT Infra', effective: 18, partial: 6, ineffective: 2 },
      { bu: 'Platform', effective: 22, partial: 4, ineffective: 1 },
      { bu: 'Compliance', effective: 12, partial: 8, ineffective: 3 },
      { bu: 'HR Systems', effective: 9, partial: 5, ineffective: 4 },
      { bu: 'Procurement', effective: 7, partial: 6, ineffective: 2 },
    ],
  },
  CR_CHT_LOSS_TREND: {
    title: 'Loss Overview (Gross · Recovery · Net)',
    kind: 'line',
    nameKey: 'month',
    series: [
      { key: 'gross', label: 'Gross Loss', color: '#ff595e' },
      { key: 'recovery', label: 'Recovery', color: '#3B82EC' },
      { key: 'net', label: 'Net Loss', color: '#0E6E63' },
    ],
    data: [
      { month: 'Nov', gross: 820, recovery: 300, net: 520 },
      { month: 'Dec', gross: 640, recovery: 280, net: 360 },
      { month: 'Jan', gross: 910, recovery: 410, net: 500 },
      { month: 'Feb', gross: 540, recovery: 250, net: 290 },
      { month: 'Mar', gross: 730, recovery: 380, net: 350 },
      { month: 'Apr', gross: 480, recovery: 220, net: 260 },
      { month: 'May', gross: 610, recovery: 340, net: 270 },
    ],
  },
};

export function getChart(chartId: string): ChartPayload {
  return CHARTS[chartId] ?? CHARTS.CR_CHT_RISK_SEVERITY;
}
