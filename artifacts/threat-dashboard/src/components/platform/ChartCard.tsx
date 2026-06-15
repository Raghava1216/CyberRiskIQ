import { useState } from 'react';
import { Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExpand, faCompress, faListUl } from '@fortawesome/free-solid-svg-icons';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { getChart } from '../../lib/platform/mockReportData';

interface ChartCardProps {
  chart: string;
  height?: number;
}

// Faithful stand-in for the user's backend-bound Chart engine: a reportChart-cards
// Card with a ChartHeader (legend + fullscreen toggles) wrapping the rendered chart.
export default function ChartCard({ chart, height = 240 }: ChartCardProps) {
  const payload = getChart(chart);
  const [showLegend, setShowLegend] = useState(true);
  const [full, setFull] = useState(false);

  const h = full ? 460 : height;

  const renderChart = () => {
    if (payload.kind === 'doughnut') {
      return (
        <ResponsiveContainer width="100%" height={h}>
          <PieChart>
            <Pie data={payload.data} dataKey="value" nameKey={payload.nameKey} cx="50%" cy="50%" innerRadius={Math.round(h * 0.22)} outerRadius={Math.round(h * 0.36)} paddingAngle={2} isAnimationActive={false}>
              {payload.data.map((d, i) => (
                <Cell key={i} fill={(d as { fill?: string }).fill ?? '#293042'} />
              ))}
            </Pie>
            <Tooltip />
            {showLegend && <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />}
          </PieChart>
        </ResponsiveContainer>
      );
    }
    if (payload.kind === 'bar' || payload.kind === 'stacked') {
      return (
        <ResponsiveContainer width="100%" height={h}>
          <BarChart data={payload.data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
            <XAxis dataKey={payload.nameKey} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            {showLegend && <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />}
            {payload.series.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} stackId={payload.kind === 'stacked' ? 'a' : undefined} radius={payload.kind === 'stacked' ? [0, 0, 0, 0] : [3, 3, 0, 0]} isAnimationActive={false} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }
    return (
      <ResponsiveContainer width="100%" height={h}>
        <LineChart data={payload.data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
          <XAxis dataKey={payload.nameKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          {showLegend && <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />}
          {payload.series.map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className="reportChart-cards h-100">
      <Card.Body className="p-2">
        <div className="grc-chart-header d-flex align-items-center justify-content-between mb-1">
          <span className="grc-chart-title">{payload.title}</span>
          <div className="d-flex align-items-center gap-2">
            <FontAwesomeIcon
              icon={faListUl}
              className="grc-chart-action"
              title="Toggle legend"
              onClick={() => setShowLegend((v) => !v)}
            />
            <FontAwesomeIcon
              icon={full ? faCompress : faExpand}
              className="grc-chart-action"
              title={full ? 'Collapse' : 'Expand'}
              onClick={() => setFull((v) => !v)}
            />
          </div>
        </div>
        <div style={{ width: '100%', minHeight: h }}>{renderChart()}</div>
      </Card.Body>
    </Card>
  );
}
