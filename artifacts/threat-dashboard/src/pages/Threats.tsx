import { Helmet } from 'react-helmet-async';
import { Container, Row, Col } from 'react-bootstrap';
import ReportRuntime from '../components/reports/Report';
import Chart from '../components/charts/Chart';
import type { PageProps } from '../platform/pageProps';

export default function Threats({ year, refreshCharts }: PageProps) {
  return (
    <Container fluid className="p-2">
      <Helmet title="Threat Intelligence" />
      <Row className="g-0">
        <Col xs={12}>
          <ReportRuntime report="CR_THREAT_STATS" yearProp={year} dataCard />
        </Col>
      </Row>
      <Row className="g-0">
        <Col md={5}>
          <Chart chart="CR_THREAT_BY_SEVERITY" yearProp={year} refreshCharts={refreshCharts} />
        </Col>
        <Col md={7}>
          <Chart chart="CR_THREAT_BY_CATEGORY" yearProp={year} refreshCharts={refreshCharts} />
        </Col>
      </Row>
      <Row className="g-0">
        <Col xs={12}>
          <ReportRuntime report="CR_THREAT_FEED" yearProp={year} />
        </Col>
      </Row>
      <Row className="g-0">
        <Col xs={12}>
          <ReportRuntime report="CR_THREAT_ACTORS" yearProp={year} />
        </Col>
      </Row>
    </Container>
  );
}
