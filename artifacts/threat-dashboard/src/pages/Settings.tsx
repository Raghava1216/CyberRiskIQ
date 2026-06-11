import { Helmet } from 'react-helmet-async';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileShield, faTriangleExclamation, faShieldHalved,
  faUsersGear, faGears, faPlugCircleBolt,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { useTranslation } from 'react-i18next';
import SectionHeaderCard from '../components/pages/SectionHeaderCard';
import type { PageProps } from '../platform/pageProps';

interface AdminItem {
  title: string;
  subtitle: string;
  icon: IconDefinition;
}

const adminItems: AdminItem[] = [
  { title: 'GRC Setup', subtitle: 'Frameworks, controls & mappings', icon: faFileShield },
  { title: 'Risk Assessment Setup', subtitle: 'FAIR & scoring configuration', icon: faTriangleExclamation },
  { title: 'Wazuh Integration', subtitle: 'SIEM agents & alert rules', icon: faShieldHalved },
  { title: 'Users & Privileges', subtitle: 'CR_* role-based access', icon: faUsersGear },
  { title: 'General Settings', subtitle: 'Organisation & appearance', icon: faGears },
  { title: 'Connectors', subtitle: 'Threat intel & data feeds', icon: faPlugCircleBolt },
];

export default function Settings(_props: PageProps) {
  const { t } = useTranslation('common');
  return (
    <Container fluid className="p-2">
      <Helmet title="Admin Setup" />
      <SectionHeaderCard title={t('Administration & Configuration')} icon={faGears} />
      <Row className="g-2 p-2 m-0">
        {adminItems.map((item) => (
          <Col key={item.title} xs={12} sm={6} lg={4}>
            <Card className="reportChart-cards border-0 h-100" style={{ boxShadow: '0px 0px 2px', cursor: 'pointer' }}>
              <Card.Body className="d-flex align-items-center gap-3 p-3">
                <span
                  className="d-flex align-items-center justify-content-center rounded text-primary"
                  style={{ width: 44, height: 44, background: '#eaf1fe', flexShrink: 0 }}
                >
                  <FontAwesomeIcon icon={item.icon} size="lg" />
                </span>
                <div>
                  <div className="fw-semibold text-dark">{t(item.title)}</div>
                  <div className="text-muted small">{t(item.subtitle)}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
