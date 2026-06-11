import { Card, Container, Row } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faPlusCircle, faLineChart } from '@fortawesome/free-solid-svg-icons';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { useTranslation } from 'react-i18next';
import { getPrivileges } from '../../lib/platform/currentUser';

export interface LinkItem {
  title: string;
  type: 'form' | 'report' | 'chart';
  form?: string;
  report?: string;
  chart?: string;
  privilege?: string;
}

interface FormReportChartLinkProps {
  combinedItems: LinkItem[];
  onOpen?: (item: LinkItem) => void;
}

const FormReportChartLink = ({ combinedItems, onOpen }: FormReportChartLinkProps) => {
  const { t } = useTranslation('common');
  const privs = getPrivileges();

  const filterByPrivilege = (items: LinkItem[]) =>
    items.filter((item) => {
      if (!item.privilege) return true;
      const itemPrivileges = item.privilege.split(',').map((p) => p.trim());
      return itemPrivileges.some((p) => privs.includes(p));
    });

  const forms = filterByPrivilege(combinedItems.filter((item) => item.type === 'form'));
  const reports = filterByPrivilege(combinedItems.filter((item) => item.type === 'report'));
  const charts = filterByPrivilege(combinedItems.filter((item) => item.type === 'chart'));

  const renderColumn = (title: string, items: LinkItem[], icon: IconProp) => {
    if (items.length === 0) return null;
    return (
      <div className="column me-4">
        <h5>{t(title)}</h5>
        <div className="d-flex flex-wrap">
          {items.map((item, index) => (
            <div key={index} className="d-flex align-items-center mb-2 me-3 item-container">
              <FontAwesomeIcon icon={icon} size="lg" style={{ color: 'var(--cr-accent, #0E6E63)', marginRight: '0.5rem' }} />
              <span>
                <a
                  href="#"
                  className="fw-bold clickable text-decoration-none"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpen?.(item);
                  }}
                >
                  {t(item.title)}
                </a>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (forms.length === 0 && reports.length === 0 && charts.length === 0) {
    return null;
  }

  return (
    <Container fluid className="p-0 m-0">
      <Card className="reportChart-cards">
        <Card.Body>
          <Row className="d-flex flex-wrap m-0">
            {renderColumn('Forms', forms, faPlusCircle)}
            {renderColumn('Reports', reports, faList)}
            {renderColumn('Charts', charts, faLineChart)}
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default FormReportChartLink;
