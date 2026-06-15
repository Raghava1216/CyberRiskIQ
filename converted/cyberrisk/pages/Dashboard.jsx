import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";

import MockCards from "../mock/MockCards";
import MockChart from "../mock/MockChart";
import MockReport from "../mock/MockReport";
import CrqOverview from "../Crq/CrqOverview";
import {
  dashboardCards,
  aleByBusinessUnit,
  riskSeverityMix,
  exposureTrend,
  topRisks,
} from "../mock/mockData";

// Executive overview tab. NOTE: rendered with temporary mock data/components so the
// tab loads without backend metadata. Replace MockCards/MockChart/MockReport with
// the real <DashboardCards/> + <Chart/> + <ReportRuntime/> (real keys) when ready.
const Dashboard = () => {
  return (
    <>
      <Helmet title="CyberRisk IQ — Dashboard" />
      <Container fluid className="p-0 m-0">
        <MockCards cards={dashboardCards} />
        <Row className="p-0 m-0">
          <Col md={6} className="d-flex">
            <MockChart title="ALE by Business Unit" type="bar" data={aleByBusinessUnit} />
          </Col>
          <Col md={6} className="d-flex">
            <MockChart title="Risk Severity Mix" type="donut" data={riskSeverityMix} />
          </Col>
        </Row>
        <Row className="p-0 m-0">
          <Col md={6} className="d-flex">
            <MockChart title="Exposure Trend (€M)" type="line" data={exposureTrend} />
          </Col>
          <Col md={6} className="d-flex">
            <MockReport title="Top Financial Risks" columns={topRisks.columns} rows={topRisks.rows} />
          </Col>
        </Row>
        <CrqOverview />
      </Container>
    </>
  );
};

export default Dashboard;
