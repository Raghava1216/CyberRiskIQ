interface SeverityBadgeProps {
  level: string;
  size?: 'sm' | 'md';
}

const config: Record<string, { bg: string; text: string; dot: string }> = {
  Critical: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-500' },
  High: { bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-500' },
  Medium: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-500' },
  Low: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  Informational: { bg: 'bg-sky-500/15', text: 'text-sky-400', dot: 'bg-sky-500' },
  Active: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-500' },
  Investigating: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-500' },
  Mitigated: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  Closed: { bg: 'bg-slate-500/15', text: 'text-slate-400', dot: 'bg-slate-500' },
  Open: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-500' },
  'In Treatment': { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-500' },
  'In Progress': { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-500' },
  Resolved: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  Accepted: { bg: 'bg-slate-500/15', text: 'text-slate-400', dot: 'bg-slate-500' },
  Contained: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-500' },
  Remediated: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-500' },
};

export default function SeverityBadge({ level, size = 'sm' }: SeverityBadgeProps) {
  const c = config[level] ?? { bg: 'bg-slate-500/15', text: 'text-slate-400', dot: 'bg-slate-500' };
  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${c.bg} ${c.text} ${px}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {level}
    </span>
  );
}
