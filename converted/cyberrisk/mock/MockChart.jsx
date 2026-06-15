import React from "react";
import { Card, Badge } from "react-bootstrap";
import { PALETTE } from "./mockData";

// Temporary mock replacement for <Chart/>. Dependency-free inline SVG/CSS charts
// driven by sample data. Supports type="bar" | "donut" | "line". No network calls.
// Swap back to the real metadata-driven <Chart chart="..." /> when chart metadata
// exists.
const BarChart = ({ data }) => {
  if (!data || data.length === 0) return <EmptyState />;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="d-flex flex-column gap-2">
      {data.map((d, i) => (
        <div key={i}>
          <div className="d-flex justify-content-between small">
            <span>{d.label}</span>
            <span className="text-muted">{d.value.toLocaleString()}</span>
          </div>
          <div style={{ background: "#eef1f6", borderRadius: 4, height: 10 }}>
            <div
              style={{
                width: `${(d.value / max) * 100}%`,
                background: d.color || PALETTE[i % PALETTE.length],
                height: 10,
                borderRadius: 4,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const DonutChart = ({ data }) => {
  if (!data || data.length === 0) return <EmptyState />;
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="d-flex align-items-center gap-3">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <g transform="rotate(-90 80 80)">
          {data.map((d, i) => {
            const fraction = d.value / total;
            const dash = fraction * circumference;
            const seg = (
              <circle
                key={i}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={d.color || PALETTE[i % PALETTE.length]}
                strokeWidth="22"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return seg;
          })}
        </g>
        <text x="80" y="85" textAnchor="middle" fontSize="18" fontWeight="600">
          {total.toLocaleString()}
        </text>
      </svg>
      <div className="d-flex flex-column gap-1 small">
        {data.map((d, i) => (
          <div key={i} className="d-flex align-items-center gap-2">
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: d.color || PALETTE[i % PALETTE.length],
                display: "inline-block",
              }}
            />
            <span>{d.label}</span>
            <span className="text-muted">({d.value.toLocaleString()})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="text-muted small text-center py-4">No data</div>
);

const LineChart = ({ data }) => {
  if (!data || data.length === 0) return <EmptyState />;
  const width = 320;
  const height = 140;
  const pad = 24;
  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / Math.max(data.length - 1, 1);
  const points = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = height - pad - ((d.value - min) / range) * (height - pad * 2);
    return [x, y];
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const area = `${path} L ${points[points.length - 1][0]} ${height - pad} L ${points[0][0]} ${height - pad} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={area} fill="rgba(47,109,246,0.12)" />
      <path d={path} fill="none" stroke={PALETTE[0]} strokeWidth="2.5" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="3" fill={PALETTE[0]} />
          <text x={p[0]} y={height - 6} textAnchor="middle" fontSize="9" fill="#888">
            {data[i].label}
          </text>
        </g>
      ))}
    </svg>
  );
};

const MockChart = ({ title, type = "bar", data = [] }) => {
  return (
    <Card className="m-2 flex-fill shadow-sm">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <span className="fw-semibold">{title}</span>
        <Badge bg="light" text="dark">
          mock
        </Badge>
      </Card.Header>
      <Card.Body>
        {type === "donut" && <DonutChart data={data} />}
        {type === "line" && <LineChart data={data} />}
        {type === "bar" && <BarChart data={data} />}
      </Card.Body>
    </Card>
  );
};

export default MockChart;
