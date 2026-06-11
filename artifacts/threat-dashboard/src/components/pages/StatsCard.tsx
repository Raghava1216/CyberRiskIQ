import { Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface StatsCardProps {
  label: string;
  value: string | number;
  sub?: string;
  variant?: 'primary' | 'danger' | 'warning' | 'success' | 'info' | 'secondary';
  icon?: unknown;
}

export default function StatsCard({ label, value, sub, variant = 'primary', icon }: StatsCardProps) {
  return (
    <Card className={`cr-stat-card border-0 h-100 cr-stat-${variant}`} style={{ boxShadow: '0px 0px 2px' }}>
      <Card.Body className="d-flex align-items-center justify-content-between p-3">
        <div className="min-w-0">
          <div className="cr-stat-value">{value}</div>
          <div className="cr-stat-label">{label}</div>
          {sub && <div className="cr-stat-sub">{sub}</div>}
        </div>
        {icon ? (
          <span className={`cr-stat-icon text-${variant}`}>
            <FontAwesomeIcon icon={icon as IconDefinition} size="lg" />
          </span>
        ) : (
          <span className={`cr-stat-accent bg-${variant}`} />
        )}
      </Card.Body>
    </Card>
  );
}
