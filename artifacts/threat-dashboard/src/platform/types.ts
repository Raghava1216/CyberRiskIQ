// Local stand-ins for the enterprise GRC "application model" type contracts.
// Reports and charts are addressed by string IDs (CR_* — the CyberRisk module
// prefix, mirroring the in-house RA_* convention) and resolved at runtime from
// the registries in ./reports.ts and ./charts.ts.

export type CellType =
  | 'text'
  | 'number'
  | 'currency'
  | 'percent'
  | 'date'
  | 'severity'
  | 'status'
  | 'priority'
  | 'bar'
  | 'tags'
  | 'bool';

export interface ReportColumn {
  key: string;
  label: string;
  type?: CellType;
  max?: number;
  width?: string;
  align?: 'start' | 'center' | 'end';
}

export interface DataCardItem {
  label: string;
  value: string | number;
  sub?: string;
  variant?: 'primary' | 'danger' | 'warning' | 'success' | 'info' | 'secondary';
  icon?: unknown;
}

export interface ReportDef {
  title: string;
  subtitle?: string;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  /** Column key to group rows by when rendered as a pivot table. */
  pivotBy?: string;
  /** Tiles rendered when the report is consumed with the `dataCard` flag. */
  dataCards?: DataCardItem[];
}

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
}

export type ChartType =
  | 'bar'
  | 'stackedBar'
  | 'horizontalBar'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut'
  | 'gauge'
  | 'heatmap';

export interface ChartDef {
  title: string;
  type: ChartType;
  data: Record<string, unknown>[];
  xKey?: string;
  series?: ChartSeries[];
  valueKey?: string;
  nameKey?: string;
  colors?: string[];
  height?: number;
  /** gauge */
  gaugeValue?: number;
  gaugeMax?: number;
  /** heatmap axes */
  xLabels?: string[];
  yLabels?: string[];
}
