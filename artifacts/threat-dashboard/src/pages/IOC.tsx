import { Helmet } from 'react-helmet-async';
import { Container, Row, Col } from 'react-bootstrap';
import ReportRuntime from '../components/reports/Report';
import Chart from '../components/charts/Chart';
import type { PageProps } from '../platform/pageProps';

export default function IOCPage({ year, refreshCharts }: PageProps) {
  return (
    <Container fluid className="p-2">
      <Helmet title="IOC Register" />
      <Row className="g-0">
        <Col xs={12}>
          <ReportRuntime report="CR_IOC_STATS" yearProp={year} dataCard />
        </Col>
      </Row>
      <Row className="g-0">
        <Col xs={12}>
          <Chart chart="CR_IOC_BY_TYPE" yearProp={year} refreshCharts={refreshCharts} />
        </Col>
      </Row>
      <Row className="g-0">
        <Col xs={12}>
          <ReportRuntime report="CR_IOC_REGISTER" yearProp={year} />
        </Col>
      </Row>
    </Container>
  );
}
