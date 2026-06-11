import { Helmet } from 'react-helmet-async';
import { Container, Row, Col } from 'react-bootstrap';
import ReportRuntime from '../components/reports/Report';
import Chart from '../components/charts/Chart';
import SectionHeaderCard from '../components/pages/SectionHeaderCard';
import { faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import type { PageProps } from '../platform/pageProps';

export default function WazuhPage({ year, refreshCharts }: PageProps) {
  return (
    <Container fluid className="p-2">
      <Helmet title="Wazuh SIEM" />
      <SectionHeaderCard
        title="Wazuh SIEM — Detection & Response"
        icon={faShieldHalved}
        right="Connected · agent telemetry"
      />
      <Row className="g-0">
        <Col xs={12}>
          <ReportRuntime report="CR_WAZUH_STATS" yearProp={year} dataCard />
        </Col>
      </Row>
      <Row className="g-0">
        <Col xs={12}>
          <Chart chart="CR_MITRE_TECHNIQUES" yearProp={year} refreshCharts={refreshCharts} height={280} />
        </Col>
      </Row>
      <Row className="g-0">
        <Col xs={12}>
          <ReportRuntime report="CR_WAZUH_ALERTS" yearProp={year} />
        </Col>
      </Row>
    </Container>
  );
}
