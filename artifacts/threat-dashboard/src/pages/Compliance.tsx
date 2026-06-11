import { Helmet } from 'react-helmet-async';
import { Container, Row, Col } from 'react-bootstrap';
import ReportRuntime from '../components/reports/Report';
import Chart from '../components/charts/Chart';
import type { PageProps } from '../platform/pageProps';

export default function Compliance({ year, refreshCharts }: PageProps) {
  return (
    <Container fluid className="p-2">
      <Helmet title="Compliance" />
      <Row className="g-0">
        <Col xs={12}>
          <ReportRuntime report="CR_COMPLIANCE_STATS" yearProp={year} dataCard />
        </Col>
      </Row>
      <Row className="g-0">
        <Col xs={12}>
          <Chart chart="CR_COMPLIANCE_SCORES" yearProp={year} refreshCharts={refreshCharts} height={300} />
        </Col>
      </Row>
      <Row className="g-0">
        <Col xs={12}>
          <ReportRuntime report="CR_COMPLIANCE_FRAMEWORKS" yearProp={year} />
        </Col>
      </Row>
      <Row className="g-0">
        <Col xs={12}>
          <ReportRuntime report="CR_GRC_REGISTRY" yearProp={year} />
        </Col>
      </Row>
    </Container>
  );
}
