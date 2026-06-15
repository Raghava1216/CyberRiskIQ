import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import ReportRuntime from "src/components/reports/Report";
import Chart from "src/components/charts/Chart";

// Composed blast-radius sub-view — given a compromised asset, shows the reachable
// assets (recursive CTE on asset_connections in the backend) and the aggregated
// financial exposure of that reachable set.
const BlastRadiusOverview = ({ year, refreshCharts }) => {
  const { t } = useTranslation("common");

  return (
    <>
      <Helmet title="Blast Radius" />
      <Container fluid className="p-0 m-0">
        <Row className="p-0 m-0">
          <Col md={6}>
            <Chart chart="CR_CHT_BLAST_RADIUS" yearProp={year} refreshCharts={refreshCharts} type="risk" />
          </Col>
          <Col md={6}>
            <Chart chart="CR_CHT_ASSET_CONNECTIVITY" yearProp={year} refreshCharts={refreshCharts} />
          </Col>
        </Row>
        <Row className="p-0 m-0">
          <Col>
            <ReportRuntime report="CR_RPT_BLAST_RADIUS" yearProp={year} key={refreshCharts} />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default BlastRadiusOverview;
