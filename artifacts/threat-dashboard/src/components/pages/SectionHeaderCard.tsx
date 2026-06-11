import { Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  icon?: IconDefinition;
  right?: ReactNode;
}

// Dark section-header strip (#293042) used by the enterprise landing pages.
export default function SectionHeaderCard({ title, icon, right }: Props) {
  return (
    <Card className="border-0 m-2 cr-section-header" style={{ background: '#293042' }}>
      <Card.Body className="d-flex align-items-center justify-content-between py-2 px-3">
        <div className="d-flex align-items-center gap-2 text-white">
          {icon && <FontAwesomeIcon icon={icon} />}
          <span className="fw-semibold">{title}</span>
        </div>
        {right && <div className="text-white-50 small">{right}</div>}
      </Card.Body>
    </Card>
  );
}
