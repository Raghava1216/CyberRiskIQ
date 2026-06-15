import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";

import MockChart from "../mock/MockChart";
import MockReport from "../mock/MockReport";
import { aleByBusinessUnit, riskSeverityMix, exposureTrend, topRisks } from "../mock/mockData";

// Composed CRQ sub-view — financial exposure translated from technical risk.
// Rendered with temporary mock data so it loads without backend metadata. Replace
// MockChart/MockReport with the real <Chart/> + <ReportRuntime/> +
// <FormReportChartLink/> (real keys) when ready.
const CrqOverview = () => {
  return (
    <>
      <Helmet title="Cyber Risk Quantification" />
      <Container fluid className="p-0 m-0">
        <Row className="p-0 m-0">
          <Col md={4} className="d-flex">
            <MockChart title="ALE by Business Unit" type="bar" data={aleByBusinessUnit} />
          </Col>
          <Col md={4} className="d-flex">
            <MockChart title="ALE Distribution" type="donut" data={riskSeverityMix} />
          </Col>
          <Col md={4} className="d-flex">
            <MockChart title="Exposure Trend (€M)" type="line" data={exposureTrend} />
          </Col>
        </Row>
        <Row className="p-0 m-0">
          <MockReport title="Top Financial Risks" columns={topRisks.columns} rows={topRisks.rows} dataCard />
        </Row>
      </Container>
    </>
  );
};

export default CrqOverview;
