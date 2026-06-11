import { Helmet } from 'react-helmet-async';
import { Container, Row, Col } from 'react-bootstrap';
import ReportRuntime from '../components/reports/Report';
import Chart from '../components/charts/Chart';
import type { PageProps } from '../platform/pageProps';

export default function Assets({ year, refreshCharts }: PageProps) {
  return (
    <Container fluid className="p-2">
      <Helmet title="Asset Inventory" />
      <Row className="g-0">
        <Col xs={12}>
          <ReportRuntime report="CR_ASSET_STATS" yearProp={year} dataCard />
        </Col>
      </Row>
      <Row className="g-0">
        <Col md={5}>
          <Chart chart="CR_ASSET_BY_CRITICALITY" yearProp={year} refreshCharts={refreshCharts} />
        </Col>
        <Col md={7}>
          <Chart chart="CR_ASSET_BY_CLASS" yearProp={year} refreshCharts={refreshCharts} />
        </Col>
      </Row>
      <Row className="g-0">
        <Col xs={12}>
          <ReportRuntime report="CR_ASSET_INVENTORY" yearProp={year} pivotTable />
        </Col>
      </Row>
    </Container>
  );
}
