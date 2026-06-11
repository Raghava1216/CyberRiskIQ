import { Helmet } from 'react-helmet-async';
import { Container, Row, Col } from 'react-bootstrap';
import ReportRuntime from '../components/reports/Report';
import Chart from '../components/charts/Chart';
import type { PageProps } from '../platform/pageProps';

export default function Risks({ year, refreshCharts }: PageProps) {
  return (
    <Container fluid className="p-2">
      <Helmet title="Risk Register" />
      <Row className="g-0">
        <Col xs={12}>
          <ReportRuntime report="CR_RISK_STATS" yearProp={year} dataCard />
        </Col>
      </Row>
      <Row className="g-0">
        <Col md={4}>
          <Chart chart="CR_RISK_HEATMAP" yearProp={year} refreshCharts={refreshCharts} />
        </Col>
        <Col md={4}>
          <Chart chart="CR_RISK_BY_CATEGORY" yearProp={year} refreshCharts={refreshCharts} />
        </Col>
        <Col md={4}>
          <Chart chart="CR_RISK_BY_TREATMENT" yearProp={year} refreshCharts={refreshCharts} />
        </Col>
      </Row>
      <Row className="g-0">
        <Col xs={12}>
          <ReportRuntime report="CR_RISK_REGISTER" yearProp={year} pivotTable />
        </Col>
      </Row>
      <Row className="g-0">
        <Col xs={12}>
          <ReportRuntime report="CR_RISK_FINANCIAL" yearProp={year} />
        </Col>
      </Row>
    </Container>
  );
}
