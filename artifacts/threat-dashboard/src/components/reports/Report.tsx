import { Card, Table, Badge, ProgressBar, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { getReport } from '../../platform/reports';
import type { ReportColumn } from '../../platform/types';
import {
  formatCurrency, formatNumber, formatDate,
  severityVariant, statusVariant, priorityVariant,
} from '../../platform/format';
import StatsCard from '../pages/StatsCard';

interface ReportRuntimeProps {
  report: string;
  yearProp?: number;
  dataCard?: boolean;
  pivotTable?: boolean;
}

function renderCell(col: ReportColumn, value: unknown) {
  switch (col.type) {
    case 'currency':
      return formatCurrency(Number(value));
    case 'number':
      return formatNumber(Number(value));
    case 'percent':
      return `${value}%`;
    case 'date':
      return formatDate(String(value ?? ''));
    case 'severity':
      return <Badge bg={severityVariant(String(value))}>{String(value)}</Badge>;
    case 'status':
      return <Badge bg={statusVariant(String(value))} className="fw-normal">{String(value)}</Badge>;
    case 'priority':
      return <Badge bg={priorityVariant(String(value))}>{String(value)}</Badge>;
    case 'bool':
      return value
        ? <Badge bg="danger-subtle" text="danger">Yes</Badge>
        : <Badge bg="light" text="muted" className="border">No</Badge>;
    case 'tags':
      return (
        <div className="d-flex flex-wrap gap-1">
          {(Array.isArray(value) ? value : []).map((tag) => (
            <Badge key={String(tag)} bg="light" text="dark" className="border fw-normal">{String(tag)}</Badge>
          ))}
        </div>
      );
    case 'bar': {
      const num = Number(value);
      const max = col.max ?? 100;
      const pct = Math.min(100, Math.round((num / max) * 100));
      const variant = pct >= 80 ? 'danger' : pct >= 50 ? 'warning' : pct >= 25 ? 'info' : 'success';
      return (
        <div className="d-flex align-items-center gap-2" style={{ minWidth: 110 }}>
          <ProgressBar now={pct} variant={variant} style={{ height: 6, flex: 1 }} />
          <span className="text-muted small" style={{ width: 34, textAlign: 'right' }}>{num}</span>
        </div>
      );
    }
    default:
      return String(value ?? '—');
  }
}

function DataTable({ columns, rows }: { columns: ReportColumn[]; rows: Record<string, unknown>[] }) {
  return (
    <Table responsive hover className="cr-report-table align-middle mb-0">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} className={`text-${col.align ?? 'start'} text-uppercase`}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {columns.map((col) => (
              <td key={col.key} className={`text-${col.align ?? 'start'}`}>{renderCell(col, row[col.key])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default function ReportRuntime({ report, dataCard, pivotTable }: ReportRuntimeProps) {
  const { t } = useTranslation('common');
  const def = getReport(report);

  if (!def) {
    return (
      <Card className="reportChart-cards border-0 m-2" style={{ boxShadow: '0px 0px 2px' }}>
        <Card.Body className="text-muted small">{t('Report')} <code>{report}</code> {t('not found')}</Card.Body>
      </Card>
    );
  }

  if (dataCard && def.dataCards) {
    return (
      <Card className="reportChart-cards border-0 m-2" style={{ boxShadow: '0px 0px 2px' }}>
        <Card.Body className="p-2">
          <div className="cr-card-title mb-2">{t(def.title)}</div>
          <Row className="g-2">
            {def.dataCards.map((item) => (
              <Col key={item.label} xs={6} md>
                <StatsCard {...item} />
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>
    );
  }

  // Pivot: group rows under their pivot column with a sub-header per group.
  if (pivotTable && def.pivotBy) {
    const groups = new Map<string, Record<string, unknown>[]>();
    for (const row of def.rows) {
      const k = String(row[def.pivotBy] ?? '—');
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(row);
    }
    const cols = def.columns.filter((c) => c.key !== def.pivotBy);
    return (
      <Card className="reportChart-cards border-0 m-2" style={{ boxShadow: '0px 0px 2px' }}>
        <Card.Header className="cr-card-header">{t(def.title)}</Card.Header>
        <Card.Body className="p-0">
          {[...groups.entries()].map(([group, rows]) => (
            <div key={group}>
              <div className="cr-pivot-group px-3 py-2">
                {group} <span className="text-muted">· {rows.length}</span>
              </div>
              <DataTable columns={cols} rows={rows} />
            </div>
          ))}
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="reportChart-cards border-0 m-2" style={{ boxShadow: '0px 0px 2px' }}>
      <Card.Header className="cr-card-header d-flex justify-content-between align-items-center">
        <span>{t(def.title)}</span>
        {def.subtitle && <span className="text-muted small fw-normal">{t(def.subtitle)}</span>}
      </Card.Header>
      <Card.Body className="p-0">
        <DataTable columns={def.columns} rows={def.rows} />
      </Card.Body>
    </Card>
  );
}
