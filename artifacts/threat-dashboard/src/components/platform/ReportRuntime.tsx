import { useState } from 'react';
import { Card, Table, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTableList, faTableCells, faDownload } from '@fortawesome/free-solid-svg-icons';
import { getReport, bandFromScore, RISK_COLORS, type ReportColumn } from '../../lib/platform/mockReportData';

interface ReportRuntimeProps {
  report: string;
}

const fmtCurrency = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n}`;

const statusStyle = (status: string): { bg: string; color: string } => {
  switch (status) {
    case 'Mitigate': return { bg: '#eff6ff', color: '#3B82EC' };
    case 'Transfer': return { bg: '#f5f3ff', color: '#7c3aed' };
    case 'Accept': return { bg: '#fff7ed', color: '#c2410c' };
    case 'Effective': return { bg: '#f0fdf4', color: '#15803d' };
    case 'Partial': return { bg: '#fefce8', color: '#a16207' };
    case 'Ineffective': return { bg: '#fef2f2', color: '#b91c1c' };
    default: return { bg: '#f1f3f5', color: '#475467' };
  }
};

// Faithful stand-in for the user's backend-bound ReportRuntime (TanStack data grid):
// a reportChart-cards Card with a report header (title + view toggle + export) and a
// dense, sticky-header table driven by mock report "meta + data".
export default function ReportRuntime({ report }: ReportRuntimeProps) {
  const payload = getReport(report);
  const [tile, setTile] = useState(false);
  const cols = payload.meta.columns.filter((c) => c.visible !== false);

  const renderCell = (col: ReportColumn, row: Record<string, unknown>) => {
    const v = row[col.accessorKey];
    if (col.kind === 'band') {
      const score = Number(v);
      const band = bandFromScore(score);
      return <span className="grc-band" style={{ background: RISK_COLORS[band] }}>{score}</span>;
    }
    if (col.kind === 'currency') return fmtCurrency(Number(v));
    if (col.kind === 'status') {
      const s = statusStyle(String(v));
      return <span className="grc-pill" style={{ background: s.bg, color: s.color }}>{String(v)}</span>;
    }
    if (col.kind === 'progress') {
      const pct = Number(v);
      const variant = pct >= 80 ? 'success' : pct >= 55 ? 'warning' : 'danger';
      return (
        <div className="d-flex align-items-center gap-2" style={{ minWidth: 130 }}>
          <ProgressBar now={pct} variant={variant} style={{ height: 8, flexGrow: 1 }} />
          <span className="text-muted" style={{ fontSize: 11, width: 32 }}>{pct}%</span>
        </div>
      );
    }
    return String(v ?? '');
  };

  return (
    <Card className="reportChart-cards">
      <Card.Body className="p-2">
        <div className="grc-chart-header d-flex align-items-center justify-content-between mb-2">
          <span className="grc-chart-title">
            {payload.meta.title}
            <span className="text-muted ms-2" style={{ fontSize: 11, fontWeight: 400 }}>
              {payload.totalRecords} records
            </span>
          </span>
          <div className="d-flex align-items-center gap-2">
            <FontAwesomeIcon
              icon={tile ? faTableList : faTableCells}
              className="grc-chart-action"
              title={tile ? 'Table view' : 'Tile view'}
              onClick={() => setTile((v) => !v)}
            />
            <FontAwesomeIcon icon={faDownload} className="grc-chart-action" title="Export" />
          </div>
        </div>

        {tile ? (
          <div className="d-flex flex-wrap gap-2">
            {payload.rows.map((row, i) => (
              <Card key={i} className="grc-tile">
                <Card.Body className="p-2">
                  {cols.map((col) => (
                    <div key={col.accessorKey} className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted" style={{ fontSize: 10 }}>{col.header}</span>
                      <span style={{ fontSize: 12 }}>{renderCell(col, row)}</span>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grc-table-wrap">
            <Table hover responsive className="grc-table mb-0" size="sm">
              <thead>
                <tr>
                  {cols.map((col) => (
                    <th key={col.accessorKey} className={`text-${col.align ?? 'start'}`}>{col.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payload.rows.map((row, i) => (
                  <tr key={i}>
                    {cols.map((col) => (
                      <td key={col.accessorKey} className={`text-${col.align ?? 'start'} align-middle`}>
                        {renderCell(col, row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
