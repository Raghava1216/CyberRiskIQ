import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";

import MockActionBar from "../mock/MockActionBar";
import MockReport from "../mock/MockReport";
import MockChart from "../mock/MockChart";
import { incidents, incidentByStatus, incidentBySeverity } from "../mock/mockData";

// Incidents. Temporary mock data — replace with <FormReportChartLink/> +
// <ReportRuntime/> + <Chart/> (real keys) when metadata exists.
const Incidents = () => {
  return (
    <>
      <Helmet title="CyberRisk IQ — Incidents" />
      <Container fluid className="p-0 m-0">
        <MockActionBar actions={[{ label: "+ Incident" }, { label: "NIS2 Report", variant: "outline-secondary" }]} />
        <Row className="p-0 m-0">
          <MockReport title="Incidents" columns={incidents.columns} rows={incidents.rows} dataCard />
        </Row>
        <Row className="p-0 m-0">
          <Col md={6} className="d-flex">
            <MockChart title="By Status" type="donut" data={incidentByStatus} />
          </Col>
          <Col md={6} className="d-flex">
            <MockChart title="By Severity" type="bar" data={incidentBySeverity} />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Incidents;
