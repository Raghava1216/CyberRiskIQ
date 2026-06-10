import { useState } from 'react';
import {
  AlertTriangle, Shield, DollarSign, BarChart2,
  ChevronRight, TrendingUp, CheckCircle, XCircle,
  ArrowUpRight, ArrowDownRight, CircleDot,
} from 'lucide-react';
import {
  mockOrg, mockKPIs, mockRisks, mockIncidents, mockComplianceFrameworks,
  mockRiskTrend, mockRegulatoryMetrics, mockMonteCarloResults, mockTreatmentMix,
} from '../lib/mockData';
import type { NavPage } from '../lib/types';

interface DashboardProps { onNavigate: (p: NavPage) => void }

const fmt$ = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K`
  : `$${n}`;

const severityColor = (s: string) =>
  s === 'Critical' ? 'text-red-400' : s === 'High' ? 'text-orange-400'
  : s === 'Medium' ? 'text-amber-400' : 'text-blue-400';

function ScoreGauge({ score }: { score: number }) {
  const r = 54; const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ * 0.75;
  const color = score <= 40 ? '#10b981' : score <= 65 ? '#f97316' : '#ef4444';
  return (
    <div className="flex items-center justify-center">
      <svg width={140} height={100} viewBox="0 0 140 100">
        <path d="M 16 90 A 54 54 0 0 1 124 90" fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
        <path d="M 16 90 A 54 54 0 0 1 124 90" fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 1s ease' }} />
        <text x="70" y="82" textAnchor="middle" fill={color} fontSize="26" fontWeight="bold">{score}</text>
        <text x="70" y="97" textAnchor="middle" fill="#64748b" fontSize="10">/ 100</text>
      </svg>
    </div>
  );
}

function MiniBar({ month, critical, high, medium, low, maxVal }: {
  month: string; critical: number; high: number; medium: number; low: number; maxVal: number;
}) {
  const total = critical + high + medium + low;
  const scale = maxVal > 0 ? 80 / maxVal : 1;
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className="flex flex-col-reverse gap-px w-full items-center" style={{ height: 84 }}>
        {([
          { v: low, c: 'bg-blue-500/70' }, { v: medium, c: 'bg-amber-500/70' },
          { v: high, c: 'bg-orange-500/70' }, { v: critical, c: 'bg-red-500/80' },
        ] as { v: number; c: string }[]).map(({ v, c }) => v > 0 ? (
          <div key={c} className={`w-full rounded-sm ${c}`} style={{ height: Math.max(2, v * scale) }} />
        ) : null)}
      </div>
      <span className="text-slate-600 text-xs">{month}</span>
      <span className="text-slate-500 text-xs tabular-nums">{total}</span>
    </div>
  );
}

function VaRBar() {
  const { percentiles } = mockMonteCarloResults;
  const max = percentiles[percentiles.length - 1].value;
  return (
    <div className="space-y-2">
      {percentiles.map(p => (
        <div key={p.pct} className="flex items-center gap-3">
          <span className="text-xs text-slate-500 w-8 text-right tabular-nums">{p.pct}%</span>
          <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${
              p.pct >= 95 ? 'bg-red-500' : p.pct >= 90 ? 'bg-orange-500' : p.pct >= 75 ? 'bg-amber-500' : 'bg-blue-500'
            }`} style={{ width: `${(p.value / max) * 100}%` }} />
          </div>
          <span className={`text-xs font-mono font-semibold w-16 tabular-nums ${
            p.pct >= 95 ? 'text-red-400' : p.pct >= 90 ? 'text-orange-400' : p.pct >= 75 ? 'text-amber-400' : 'text-blue-400'
          }`}>{fmt$(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function TreatmentDonut() {
  const colors = ['#06b6d4', '#f59e0b', '#10b981', '#ef4444'];
  const total = mockTreatmentMix.reduce((s, t) => s + t.count, 0);
  let cum = 0;
  const r = 36; const cx = 50; const cy = 50; const circ = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-5">
      <svg width={100} height={100} viewBox="0 0 100 100">
        {mockTreatmentMix.map((t, i) => {
          const frac = t.count / total;
          const offset = circ * (1 - cum);
          const dash = circ * frac;
          cum += frac;
          return (
            <circle key={t.treatment} cx={cx} cy={cy} r={r} fill="none"
              stroke={colors[i]} strokeWidth="14"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="#e2e8f0" fontSize="16" fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#64748b" fontSize="8">risks</text>
      </svg>
      <div className="space-y-1.5">
        {mockTreatmentMix.map((t, i) => (
          <div key={t.treatment} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i] }} />
            <span className="text-slate-400 text-xs">{t.treatment}</span>
            <span className="text-slate-300 text-xs font-semibold ml-auto tabular-nums">{t.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadinessBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-40 truncate">{label}</span>
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%`, transition: 'width 0.8s ease' }} />
      </div>
      <span className="text-xs font-semibold text-slate-300 w-8 tabular-nums text-right">{score}%</span>
    </div>
  );
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'financial' | 'regulatory'>('financial');
  const maxTrend = Math.max(...mockRiskTrend.map(m => m.critical + m.high + m.medium + m.low));

  const totalALE = mockRisks.reduce((s, r) => s + r.fair.ale, 0);
  const totalTreatmentBudget = mockRisks.reduce((s, r) => s + r.treatment_cost, 0);
  const avgROI = mockRisks.filter(r => r.remediation_roi > 0).reduce((s, r) => s + r.remediation_roi, 0)
    / mockRisks.filter(r => r.remediation_roi > 0).length;

  const doraIncidents = mockIncidents.filter(i => i.is_dora_reportable);
  const doraReported  = doraIncidents.filter(i => i.dora_reported).length;
  const totalFinancialImpact = mockIncidents.reduce((s, i) => s + i.financial_impact_estimate, 0);
  const top5Risks = [...mockRisks].sort((a, b) => b.fair.ale - a.fair.ale).slice(0, 5);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-screen-2xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-slate-100 font-bold text-xl">{mockOrg.name} — Security Posture</h2>
          <p className="text-slate-500 text-sm">{mockOrg.industry} · {mockOrg.size} · Risk Appetite: {mockOrg.risk_appetite}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2">
          <CircleDot size={10} className="text-emerald-400 animate-pulse" />
          Live · Updated {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: 'Aggregate ALE', value: fmt$(totalALE), sub: 'Annualised Loss Exp.', icon: DollarSign, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', nav: 'risks' as NavPage },
          { label: 'VaR 95th Pct', value: fmt$(mockKPIs.valueAtRisk_95), sub: 'Monte Carlo', icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', nav: 'risks' as NavPage },
          { label: 'Treatment Budget', value: fmt$(totalTreatmentBudget), sub: 'Total invested', icon: Shield, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', nav: 'risks' as NavPage },
          { label: 'DORA Incidents', value: String(doraIncidents.length), sub: `${doraReported} reported`, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', nav: 'incidents' as NavPage },
          { label: 'NIS2 Readiness', value: `${mockKPIs.nis2ReadinessScore}%`, sub: 'Compliance posture', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', nav: 'compliance' as NavPage },
          { label: 'Avg Remediation ROI', value: `${Math.round(avgROI)}%`, sub: 'Risk reduction return', icon: BarChart2, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', nav: 'risks' as NavPage },
        ].map(k => (
          <button key={k.label} onClick={() => onNavigate(k.nav)}
            className={`text-left rounded-xl border p-4 hover:scale-[1.02] transition-all ${k.bg}`}>
            <div className="flex items-start justify-between mb-2">
              <k.icon size={16} className={k.color} />
              <ArrowUpRight size={12} className="text-slate-600" />
            </div>
            <p className={`text-xl font-bold tabular-nums ${k.color}`}>{k.value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{k.label}</p>
            <p className="text-slate-600 text-xs">{k.sub}</p>
          </button>
        ))}
      </div>

      {/* Row 2: Score + Trend + Treatment Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Overall risk posture */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-slate-300 font-semibold text-sm mb-1">Overall Risk Score</h3>
          <p className="text-slate-500 text-xs mb-4">Composite inherent risk posture</p>
          <ScoreGauge score={mockOrg.overallRiskScore} />
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <ArrowDownRight size={14} className="text-emerald-400" />
            <span className="text-emerald-400 text-sm font-semibold">{Math.abs(mockOrg.trend)}% vs last month</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { l: 'Critical Risks', v: mockKPIs.criticalRisks, c: 'text-red-400' },
              { l: 'Open Risks', v: mockKPIs.totalRisks, c: 'text-orange-400' },
              { l: 'Compliance', v: `${mockKPIs.complianceScore}%`, c: 'text-emerald-400' },
              { l: 'Threat Alerts', v: mockKPIs.threatAlerts, c: 'text-amber-400' },
            ].map(s => (
              <div key={s.l} className="bg-slate-900/50 rounded-lg p-2.5 text-center">
                <p className={`font-bold text-lg tabular-nums ${s.c}`}>{s.v}</p>
                <p className="text-slate-600 text-xs">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Risk trend */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-slate-300 font-semibold text-sm">Risk Trend (7-Month)</h3>
              <p className="text-slate-500 text-xs">Volume by severity level</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {[['bg-red-500/80','Crit'], ['bg-orange-500/70','High'], ['bg-amber-500/70','Med'], ['bg-blue-500/70','Low']].map(([c, l]) => (
                <span key={l} className="flex items-center gap-1 text-slate-500">
                  <span className={`w-2 h-2 rounded-sm inline-block ${c}`} />{l}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-1.5 h-24">
            {mockRiskTrend.map(m => <MiniBar key={m.month} {...m} maxVal={maxTrend} />)}
          </div>
        </div>

        {/* Treatment Mix */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-slate-300 font-semibold text-sm mb-1">Risk Treatment Mix</h3>
          <p className="text-slate-500 text-xs mb-4">How risks are being handled</p>
          <TreatmentDonut />
          <div className="mt-4 pt-4 border-t border-slate-700/40 grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-cyan-400 font-bold tabular-nums">{fmt$(totalTreatmentBudget)}</p>
              <p className="text-slate-600 text-xs">Total Treatment Cost</p>
            </div>
            <div>
              <p className="text-emerald-400 font-bold tabular-nums">{Math.round(avgROI)}%</p>
              <p className="text-slate-600 text-xs">Avg Remediation ROI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Financial/Regulatory tabs + Top Risks */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Financial & Regulatory panel */}
        <div className="xl:col-span-3 bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="flex border-b border-slate-700/50">
            {(['financial', 'regulatory'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-cyan-400 bg-cyan-500/8 border-b-2 border-cyan-500'
                    : 'text-slate-500 hover:text-slate-300'
                }`}>
                {tab === 'financial' ? 'Financial Risk (FAIR / VaR)' : 'DORA / NIS2 Readiness'}
              </button>
            ))}
          </div>

          {activeTab === 'financial' ? (
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { l: 'Aggregate ALE', v: fmt$(totalALE), c: 'text-red-400', sub: 'Expected annual loss' },
                  { l: 'VaR 90th Pct', v: fmt$(mockKPIs.valueAtRisk_90), c: 'text-orange-400', sub: 'Monte Carlo' },
                  { l: 'VaR 95th Pct', v: fmt$(mockKPIs.valueAtRisk_95), c: 'text-red-400', sub: 'Monte Carlo' },
                ].map(s => (
                  <div key={s.l} className="bg-slate-900/60 rounded-lg p-3 text-center">
                    <p className={`text-lg font-bold tabular-nums ${s.c}`}>{s.v}</p>
                    <p className="text-slate-400 text-xs">{s.l}</p>
                    <p className="text-slate-600 text-xs">{s.sub}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">
                  Value at Risk — Monte Carlo Percentiles ({mockMonteCarloResults.simulations.toLocaleString()} simulations)
                </p>
                <VaRBar />
              </div>
              <div className="flex flex-wrap gap-4 text-sm bg-slate-900/40 rounded-lg px-4 py-3">
                <span className="text-slate-500">Mean Loss: <span className="text-slate-300 font-semibold">{fmt$(mockMonteCarloResults.mean_loss)}</span></span>
                <span className="text-slate-500">Std Dev: <span className="text-slate-300 font-semibold">{fmt$(mockMonteCarloResults.std_dev)}</span></span>
                <span className="text-slate-500">Incident Financial Impact: <span className="text-red-400 font-semibold">{fmt$(totalFinancialImpact)}</span></span>
              </div>
            </div>
          ) : (
            <div className="p-5 space-y-5">
              {/* DORA */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-300 text-sm font-semibold">DORA — Digital Operational Resilience Act</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    mockRegulatoryMetrics.dora.readiness >= 80 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' :
                    mockRegulatoryMetrics.dora.readiness >= 60 ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
                    'bg-red-500/15 text-red-400 border-red-500/20'
                  }`}>{mockRegulatoryMetrics.dora.readiness}% Ready</span>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[
                    { l: 'ICT Incidents YTD', v: mockRegulatoryMetrics.dora.incidents_ytd, c: 'text-amber-400' },
                    { l: 'Reported', v: mockRegulatoryMetrics.dora.incidents_reported, c: 'text-emerald-400' },
                    { l: 'Pending', v: mockRegulatoryMetrics.dora.incidents_pending, c: 'text-red-400' },
                    { l: '3rd Party ICT', v: mockRegulatoryMetrics.dora.third_party_ict_risks, c: 'text-orange-400' },
                  ].map(s => (
                    <div key={s.l} className="bg-slate-900/50 rounded-lg p-2 text-center">
                      <p className={`font-bold tabular-nums ${s.c}`}>{s.v}</p>
                      <p className="text-slate-600 text-xs mt-0.5 leading-tight">{s.l}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    { l: 'RTO: Target vs Actual', target: `${mockRegulatoryMetrics.dora.rto_target_hours}h`, actual: `${mockRegulatoryMetrics.dora.rto_actual_hours}h`, ok: mockRegulatoryMetrics.dora.rto_actual_hours <= mockRegulatoryMetrics.dora.rto_target_hours },
                    { l: 'RPO: Target vs Actual', target: `${mockRegulatoryMetrics.dora.rpo_target_hours}h`, actual: `${mockRegulatoryMetrics.dora.rpo_actual_hours}h`, ok: mockRegulatoryMetrics.dora.rpo_actual_hours <= mockRegulatoryMetrics.dora.rpo_target_hours },
                  ].map(s => (
                    <div key={s.l} className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${s.ok ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-red-500/8 border-red-500/20'}`}>
                      {s.ok ? <CheckCircle size={12} className="text-emerald-400" /> : <XCircle size={12} className="text-red-400" />}
                      <span className="text-slate-400">{s.l}:</span>
                      <span className="text-slate-300 font-medium">{s.target}</span>
                      <span className="text-slate-600">/</span>
                      <span className={s.ok ? 'text-emerald-400' : 'text-red-400 font-medium'}>{s.actual}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* NIS2 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-300 text-sm font-semibold">NIS2 — Network & Information Security Directive</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                    {mockRegulatoryMetrics.nis2.readiness}% Ready
                  </span>
                </div>
                <div className="space-y-2">
                  {[
                    { l: 'Governance & Board Oversight', s: mockRegulatoryMetrics.nis2.governance_score, c: 'bg-cyan-500' },
                    { l: 'Technical Security Measures', s: mockRegulatoryMetrics.nis2.technical_measures_score, c: 'bg-blue-500' },
                    { l: 'Business Continuity', s: mockRegulatoryMetrics.nis2.business_continuity_score, c: 'bg-amber-500' },
                    { l: 'Incident Handling', s: mockRegulatoryMetrics.nis2.incident_handling_score, c: 'bg-emerald-500' },
                    { l: 'Supply Chain Security', s: mockRegulatoryMetrics.nis2.supply_chain_score, c: 'bg-red-500' },
                    { l: 'Cryptography & Encryption', s: mockRegulatoryMetrics.nis2.cryptography_score, c: 'bg-blue-500' },
                  ].map(row => <ReadinessBar key={row.l} label={row.l} score={row.s} color={row.c} />)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top 5 Financial Risks */}
        <div className="xl:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
            <div>
              <h3 className="text-slate-100 font-semibold text-sm">Top Financial Risks</h3>
              <p className="text-slate-500 text-xs">Ranked by ALE (FAIR model)</p>
            </div>
            <button onClick={() => onNavigate('risks')} className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-xs">
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-slate-700/30">
            {top5Risks.map((r, i) => (
              <div key={r.id} className="px-5 py-3.5 hover:bg-slate-800/40 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-400 text-xs flex items-center justify-center flex-shrink-0 font-semibold mt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-xs font-medium leading-snug">{r.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-red-400 text-xs font-semibold tabular-nums">{fmt$(r.fair.ale)}</span>
                      <span className="text-slate-600 text-xs">ALE</span>
                      <span className="text-slate-700">·</span>
                      <span className="text-emerald-400 text-xs">{r.remediation_roi}% ROI</span>
                    </div>
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {r.framework_tags.slice(0, 3).map(f => (
                        <span key={f} className="text-xs px-1.5 py-px bg-slate-700/60 text-slate-400 rounded border border-slate-600/40">{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Compliance + Incidents */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
            <div>
              <h3 className="text-slate-100 font-semibold text-sm">Framework Compliance</h3>
              <p className="text-slate-500 text-xs">Active regulatory & security frameworks</p>
            </div>
            <button onClick={() => onNavigate('compliance')} className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-xs">
              Manage <ChevronRight size={12} />
            </button>
          </div>
          <div className="p-5 space-y-3">
            {mockComplianceFrameworks.map(fw => (
              <div key={fw.id} className="flex items-center gap-3">
                <span className="w-24 text-xs text-slate-400 truncate">{fw.name}</span>
                <div className="flex-1 h-2.5 bg-slate-700/60 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${fw.score >= 80 ? 'bg-emerald-500' : fw.score >= 65 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${fw.score}%`, transition: 'width 0.8s ease' }} />
                </div>
                <span className={`text-xs font-bold w-10 tabular-nums text-right ${fw.score >= 80 ? 'text-emerald-400' : fw.score >= 65 ? 'text-amber-400' : 'text-red-400'}`}>{fw.score}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
            <div>
              <h3 className="text-slate-100 font-semibold text-sm">Recent Incidents</h3>
              <p className="text-slate-500 text-xs">Financial impact & DORA reportability</p>
            </div>
            <button onClick={() => onNavigate('incidents')} className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-xs">
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-slate-700/30">
            {mockIncidents.slice(0, 5).map(inc => (
              <div key={inc.id} className="px-5 py-3 hover:bg-slate-800/40 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`text-xs font-medium ${severityColor(inc.severity)}`}>{inc.severity}</span>
                      {inc.is_dora_reportable && (
                        <span className={`text-xs px-1.5 py-px rounded border ${
                          inc.dora_reported
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>DORA {inc.dora_reported ? 'Reported' : 'Pending'}</span>
                      )}
                    </div>
                    <p className="text-slate-300 text-xs truncate">{inc.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{inc.type} · {inc.status}</p>
                  </div>
                  {inc.financial_impact_estimate > 0 && (
                    <span className="text-red-400 text-xs font-semibold tabular-nums flex-shrink-0">{fmt$(inc.financial_impact_estimate)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
