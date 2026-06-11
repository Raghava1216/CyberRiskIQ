import { Helmet } from 'react-helmet-async';
import { Container, Row, Col } from 'react-bootstrap';
import ReportRuntime from '../components/reports/Report';
import Chart from '../components/charts/Chart';
import type { PageProps } from '../platform/pageProps';

interface DashboardProps extends PageProps {
  onNavigate?: (key: string) => void;
}

export default function Dashboard({ year, refreshCharts }: DashboardProps) {
  return (
    <Container fluid className="p-2">
      <Helmet title="Dashboard" />
      <Row className="g-0">
        <Col xs={12}>
          <ReportRuntime report="CR_DASHBOARD_KPIS" yearProp={year} dataCard />
        </Col>
      </Row>
      <Row className="g-0">
        <Col md={4}>
          <Chart chart="CR_RISK_SCORE_GAUGE" yearProp={year} refreshCharts={refreshCharts} />
        </Col>
        <Col md={8}>
          <Chart chart="CR_RISK_TREND" yearProp={year} refreshCharts={refreshCharts} />
        </Col>
      </Row>
      <Row className="g-0">
        <Col md={4}>
          <Chart chart="CR_TREATMENT_MIX" yearProp={year} refreshCharts={refreshCharts} />
        </Col>
        <Col md={4}>
          <Chart chart="CR_VAR_PERCENTILES" yearProp={year} refreshCharts={refreshCharts} />
        </Col>
        <Col md={4}>
          <Chart chart="CR_LOSS_DISTRIBUTION" yearProp={year} refreshCharts={refreshCharts} />
        </Col>
      </Row>
      <Row className="g-0">
        <Col xs={12}>
          <ReportRuntime report="CR_TOP_RISKS" yearProp={year} />
        </Col>
      </Row>
      <Row className="g-0">
        <Col md={5}>
          <ReportRuntime report="CR_DORA_METRICS" yearProp={year} dataCard />
        </Col>
        <Col md={7}>
          <Chart chart="CR_NIS2_READINESS" yearProp={year} refreshCharts={refreshCharts} />
        </Col>
      </Row>
    </Container>
  );
}
