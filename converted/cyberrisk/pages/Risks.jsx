import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";

import MockActionBar from "../mock/MockActionBar";
import MockReport from "../mock/MockReport";
import MockChart from "../mock/MockChart";
import { topRisks, riskSeverityMix, aleByBusinessUnit } from "../mock/mockData";

// Risk register. Temporary mock data — replace with <FormReportChartLink/> +
// <ReportRuntime/> + <Chart/> (real keys) when backend metadata exists.
const Risks = () => {
  return (
    <>
      <Helmet title="CyberRisk IQ — Risk Register" />
      <Container fluid className="p-0 m-0">
        <MockActionBar actions={[{ label: "+ Risk Scenario" }, { label: "Import Risks", variant: "outline-secondary" }]} />
        <Row className="p-0 m-0">
          <MockReport title="Risk Register" columns={topRisks.columns} rows={topRisks.rows} dataCard />
        </Row>
        <Row className="p-0 m-0">
          <Col md={6} className="d-flex">
            <MockChart title="Risk Severity Mix" type="donut" data={riskSeverityMix} />
          </Col>
          <Col md={6} className="d-flex">
            <MockChart title="ALE by Business Unit" type="bar" data={aleByBusinessUnit} />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Risks;
