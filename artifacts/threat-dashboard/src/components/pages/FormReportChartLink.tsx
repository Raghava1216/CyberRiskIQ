import { Card, Row, Col, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartColumn, faTableList, faEye } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { hasPrivilege } from '../../platform/currentUser';

export interface LinkItem {
  title: string;
  type: 'report' | 'chart';
  report?: string;
  chart?: string;
  privilege?: string;
  onOpen?: (item: LinkItem) => void;
}

interface Props {
  combinedItems: LinkItem[];
}

// Local equivalent of the enterprise FormReportChartLink: quick-access tiles that
// deep-link into a report or chart. In-app these route to /report or /chart; here
// they invoke the provided onOpen handler (e.g. switch the active tab).
export default function FormReportChartLink({ combinedItems }: Props) {
  const { t } = useTranslation('common');
  const items = combinedItems.filter((i) => hasPrivilege(i.privilege));
  if (!items.length) return null;

  return (
    <Row className="g-2 p-0 m-0">
      {items.map((item) => (
        <Col key={item.title} xs={12} sm={6} md={4} lg={3}>
          <Card className="reportChart-cards border-0 h-100" style={{ boxShadow: '0px 0px 2px' }}>
            <Card.Body className="d-flex align-items-center justify-content-between p-2">
              <div className="d-flex align-items-center gap-2">
                <FontAwesomeIcon
                  icon={item.type === 'chart' ? faChartColumn : faTableList}
                  className="text-primary"
                />
                <span className="small fw-semibold text-dark">{t(item.title)}</span>
              </div>
              <Button
                variant="link"
                className="p-0 d-flex align-items-center text-primary"
                onClick={() => item.onOpen?.(item)}
                title={t('View')}
              >
                <FontAwesomeIcon icon={faEye} size="sm" />
              </Button>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
