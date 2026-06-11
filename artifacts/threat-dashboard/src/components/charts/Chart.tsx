import { Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  RadialBarChart, RadialBar,
} from 'recharts';
import { getChart } from '../../platform/charts';
import type { ChartDef } from '../../platform/types';
import { CHART_COLORS } from '../../platform/format';

interface ChartProps {
  chart: string;
  yearProp?: number;
  refreshCharts?: boolean;
  type?: string;
  height?: number;
}

const AXIS = { fontSize: 11, fill: '#667085' };

function gaugeColor(v: number) {
  return v >= 75 ? '#d9534f' : v >= 50 ? '#f0ad4e' : v >= 25 ? '#3B82EC' : '#22c55e';
}

function ChartBody({ def, height }: { def: ChartDef; height: number }) {
  switch (def.type) {
    case 'bar':
    case 'stackedBar':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={def.data} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f3" />
            <XAxis dataKey={def.xKey} tick={AXIS} />
            <YAxis tick={AXIS} allowDecimals={false} />
            <Tooltip />
            {(def.series?.length ?? 0) > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {def.series?.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={s.color}
                stackId={def.type === 'stackedBar' ? 'a' : undefined}
                radius={def.type === 'stackedBar' ? undefined : [3, 3, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    case 'horizontalBar':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart layout="vertical" data={def.data} margin={{ top: 4, right: 16, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef0f3" />
            <XAxis type="number" tick={AXIS} />
            <YAxis type="category" dataKey="name" tick={AXIS} width={110} />
            <Tooltip />
            <Bar dataKey={def.valueKey ?? 'value'} fill={def.colors?.[0] ?? '#3B82EC'} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    case 'line':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={def.data} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
            <XAxis dataKey={def.xKey} tick={AXIS} />
            <YAxis tick={AXIS} />
            <Tooltip />
            {def.series?.map((s) => <Line key={s.key} dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={false} />)}
          </LineChart>
        </ResponsiveContainer>
      );
    case 'area':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={def.data} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
            <XAxis dataKey={def.xKey} tick={AXIS} />
            <YAxis tick={AXIS} />
            <Tooltip />
            {def.series?.map((s) => <Area key={s.key} dataKey={s.key} name={s.label} stroke={s.color} fill={s.color} fillOpacity={0.18} />)}
          </AreaChart>
        </ResponsiveContainer>
      );
    case 'pie':
    case 'donut':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={def.data}
              dataKey={def.valueKey ?? 'value'}
              nameKey={def.nameKey ?? 'name'}
              cx="50%"
              cy="50%"
              innerRadius={def.type === 'donut' ? '55%' : 0}
              outerRadius="80%"
              paddingAngle={2}
            >
              {def.data.map((_, i) => (
                <Cell key={i} fill={(def.colors ?? CHART_COLORS)[i % (def.colors ?? CHART_COLORS).length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      );
    case 'gauge': {
      const value = def.gaugeValue ?? 0;
      const max = def.gaugeMax ?? 100;
      const color = gaugeColor((value / max) * 100);
      return (
        <div style={{ position: 'relative', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="68%"
              outerRadius="100%"
              barSize={16}
              data={[{ name: 'score', value, fill: color }]}
              startAngle={210}
              endAngle={-30}
            >
              <RadialBar background dataKey="value" cornerRadius={8} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '1.9rem', fontWeight: 700, color }}>{value}</div>
            <div className="text-muted small">/ {max}</div>
          </div>
        </div>
      );
    }
    case 'heatmap': {
      const xs = def.xLabels ?? [];
      const ys = def.yLabels ?? [];
      const cellCount = (x: number, y: number) =>
        def.data.filter((d) => Number(d.x) === x && Number(d.y) === y).length;
      const cellColor = (x: number, y: number, count: number) => {
        if (count === 0) return '#f4f6f8';
        const sev = x * y; // likelihood × impact
        const base = sev >= 16 ? '#d9534f' : sev >= 9 ? '#f0ad4e' : sev >= 4 ? '#eab308' : '#22c55e';
        return base;
      };
      return (
        <div style={{ height, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {[...ys].reverse().map((yLabel) => {
            const y = Number(yLabel);
            return (
              <div key={yLabel} className="d-flex align-items-center" style={{ gap: 4, marginBottom: 4 }}>
                <span className="text-muted small" style={{ width: 16, textAlign: 'center' }}>{yLabel}</span>
                {xs.map((xLabel) => {
                  const x = Number(xLabel);
                  const count = cellCount(x, y);
                  return (
                    <div
                      key={xLabel}
                      title={`Likelihood ${x} × Impact ${y}: ${count} risk(s)`}
                      style={{
                        flex: 1, height: 30, borderRadius: 4, background: cellColor(x, y, count),
                        color: count ? '#fff' : '#aeb6c2', fontSize: 12, fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {count || ''}
                    </div>
                  );
                })}
              </div>
            );
          })}
          <div className="d-flex align-items-center" style={{ gap: 4, marginTop: 2 }}>
            <span style={{ width: 16 }} />
            {xs.map((x) => <span key={x} className="text-muted small flex-fill text-center">{x}</span>)}
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}

export default function Chart({ chart, height = 260 }: ChartProps) {
  const { t } = useTranslation('common');
  const def = getChart(chart);

  if (!def) {
    return (
      <Card className="reportChart-cards border-0 m-2" style={{ boxShadow: '0px 0px 2px' }}>
        <Card.Body className="text-muted small">{t('Chart')} <code>{chart}</code> {t('not found')}</Card.Body>
      </Card>
    );
  }

  return (
    <Card className="reportChart-cards border-0 m-2 h-100" style={{ boxShadow: '0px 0px 2px' }}>
      <Card.Header className="cr-card-header">{t(def.title)}</Card.Header>
      <Card.Body className="p-2">
        <ChartBody def={def} height={def.height ?? height} />
      </Card.Body>
    </Card>
  );
}
