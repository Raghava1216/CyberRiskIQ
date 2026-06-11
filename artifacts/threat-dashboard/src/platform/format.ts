export function formatCurrency(n: number): string {
  if (n == null || Number.isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}M`;
  if (abs >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n}`;
}

export function formatNumber(n: number): string {
  if (n == null || Number.isNaN(n)) return '—';
  return n.toLocaleString('en-US');
}

export function formatDate(value: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export type Variant = 'primary' | 'danger' | 'warning' | 'success' | 'info' | 'secondary';

export function severityVariant(sev: string): Variant {
  switch ((sev || '').toLowerCase()) {
    case 'critical': return 'danger';
    case 'high': return 'warning';
    case 'medium': return 'info';
    case 'low': return 'success';
    default: return 'secondary';
  }
}

export function statusVariant(status: string): Variant {
  switch ((status || '').toLowerCase()) {
    case 'open':
    case 'active':
    case 'investigating': return 'danger';
    case 'in progress':
    case 'in treatment':
    case 'under review':
    case 'contained': return 'warning';
    case 'resolved':
    case 'mitigated':
    case 'closed':
    case 'completed': return 'success';
    case 'accepted':
    case 'transferred': return 'info';
    default: return 'secondary';
  }
}

export function priorityVariant(p: string): Variant {
  switch ((p || '').toUpperCase()) {
    case 'P1': return 'danger';
    case 'P2': return 'warning';
    case 'P3': return 'info';
    default: return 'secondary';
  }
}

/** Tally array items by a key, returning chart-ready [{ name, value }] rows. */
export function countBy<T extends Record<string, unknown>>(
  rows: T[],
  key: keyof T,
): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const k = String(row[key] ?? 'Unknown');
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()].map(([name, value]) => ({ name, value }));
}

// Shared categorical palette (brand-led, severity-aware).
export const CHART_COLORS = [
  '#3B82EC', '#d9534f', '#f0ad4e', '#22c55e', '#8b5cf6',
  '#06b6d4', '#ec4899', '#64748b', '#eab308', '#14b8a6',
];

export const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#d9534f',
  High: '#f0ad4e',
  Medium: '#3B82EC',
  Low: '#22c55e',
};
