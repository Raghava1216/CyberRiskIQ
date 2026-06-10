import type { Risk } from '../lib/types';

interface RiskMatrixProps {
  risks: Risk[];
}

const COLORS = [
  ['bg-amber-500/20 border-amber-500/30', 'bg-amber-500/20 border-amber-500/30', 'bg-orange-500/20 border-orange-500/30', 'bg-orange-500/20 border-orange-500/30', 'bg-red-500/20 border-red-500/30'],
  ['bg-emerald-500/20 border-emerald-500/30', 'bg-amber-500/20 border-amber-500/30', 'bg-amber-500/20 border-amber-500/30', 'bg-orange-500/20 border-orange-500/30', 'bg-red-500/20 border-red-500/30'],
  ['bg-emerald-500/20 border-emerald-500/30', 'bg-emerald-500/20 border-emerald-500/30', 'bg-amber-500/20 border-amber-500/30', 'bg-orange-500/20 border-orange-500/30', 'bg-red-500/20 border-red-500/30'],
  ['bg-emerald-500/20 border-emerald-500/30', 'bg-emerald-500/20 border-emerald-500/30', 'bg-emerald-500/20 border-emerald-500/30', 'bg-amber-500/20 border-amber-500/30', 'bg-orange-500/20 border-orange-500/30'],
  ['bg-emerald-500/20 border-emerald-500/30', 'bg-emerald-500/20 border-emerald-500/30', 'bg-emerald-500/20 border-emerald-500/30', 'bg-emerald-500/20 border-emerald-500/30', 'bg-amber-500/20 border-amber-500/30'],
];

export default function RiskMatrix({ risks }: RiskMatrixProps) {
  const getCellRisks = (likelihood: number, impact: number) =>
    risks.filter((r) => r.likelihood === likelihood && r.impact === impact);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[320px]">
        {/* Y axis label */}
        <div className="flex items-start gap-2">
          <div className="flex flex-col items-center justify-center w-6 mt-8 mb-4">
            <span className="text-slate-500 text-xs rotate-[-90deg] whitespace-nowrap origin-center" style={{ writingMode: 'vertical-rl' }}>
              LIKELIHOOD →
            </span>
          </div>
          <div className="flex-1">
            <div className="flex gap-1 mb-1 pl-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex-1 text-center text-xs text-slate-500">{i}</div>
              ))}
            </div>
            <div className="grid gap-1" style={{ gridTemplateColumns: '24px repeat(5, 1fr)' }}>
              {[5, 4, 3, 2, 1].map((likelihood) => (
                <>
                  <div key={`l-${likelihood}`} className="flex items-center justify-center text-xs text-slate-500 font-medium">
                    {likelihood}
                  </div>
                  {[1, 2, 3, 4, 5].map((impact) => {
                    const cellRisks = getCellRisks(likelihood, impact);
                    const colorClass = COLORS[5 - likelihood][impact - 1];
                    return (
                      <div
                        key={`${likelihood}-${impact}`}
                        className={`aspect-square rounded border ${colorClass} flex items-center justify-center relative group cursor-default`}
                        title={cellRisks.map((r) => r.title).join(', ')}
                      >
                        {cellRisks.length > 0 && (
                          <span className="text-slate-200 text-xs font-bold">{cellRisks.length}</span>
                        )}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
            <div className="mt-2 text-center text-xs text-slate-500 pl-6">IMPACT →</div>
          </div>
        </div>
        <div className="flex gap-4 mt-3 flex-wrap">
          {[
            { label: 'Low', color: 'bg-emerald-500/30' },
            { label: 'Medium', color: 'bg-amber-500/30' },
            { label: 'High', color: 'bg-orange-500/30' },
            { label: 'Critical', color: 'bg-red-500/30' },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className={`w-3 h-3 rounded ${l.color}`} />
              {l.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
