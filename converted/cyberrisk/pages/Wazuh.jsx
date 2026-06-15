import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";

import MockCards from "../mock/MockCards";
import MockChart from "../mock/MockChart";
import MockReport from "../mock/MockReport";
import { wazuhCards, wazuhAlerts, wazuhAgentHealth, wazuhTable } from "../mock/mockData";

// Wazuh SIEM tab. Temporary mock data so the tab loads without a live Wazuh/backend
// connection. Replace MockCards/MockChart/MockReport with the real
// <DashboardCards/> + <Chart/> + <ReportRuntime/> (real keys) when ready.
const Wazuh = () => {
  return (
    <>
      <Helmet title="CyberRisk IQ — Wazuh" />
      <Container fluid className="p-0 m-0">
        <MockCards cards={wazuhCards} />
        <Row className="p-0 m-0">
          <Col md={6} className="d-flex">
            <MockChart title="Alerts by Level (24h)" type="bar" data={wazuhAlerts} />
          </Col>
          <Col md={6} className="d-flex">
            <MockChart title="Agent Health" type="donut" data={wazuhAgentHealth} />
          </Col>
        </Row>
        <Row className="p-0 m-0">
          <MockReport title="Top Wazuh Rules (24h)" columns={wazuhTable.columns} rows={wazuhTable.rows} dataCard />
        </Row>
      </Container>
    </>
  );
};

export default Wazuh;
