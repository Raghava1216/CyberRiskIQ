import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";

import MockActionBar from "../mock/MockActionBar";
import MockReport from "../mock/MockReport";
import MockChart from "../mock/MockChart";
import { vulnerabilities, vulnsBySeverity, vulnAging } from "../mock/mockData";

// Vulnerabilities. Temporary mock data — replace with <FormReportChartLink/> +
// <ReportRuntime/> + <Chart/> (real keys) when backend metadata exists.
const Vulnerabilities = () => {
  return (
    <>
      <Helmet title="CyberRisk IQ — Vulnerabilities" />
      <Container fluid className="p-0 m-0">
        <MockActionBar
          actions={[{ label: "Import Scan Results" }, { label: "Browse CVE", variant: "outline-secondary" }]}
        />
        <Row className="p-0 m-0">
          <MockReport title="Vulnerabilities" columns={vulnerabilities.columns} rows={vulnerabilities.rows} dataCard />
        </Row>
        <Row className="p-0 m-0">
          <Col md={6} className="d-flex">
            <MockChart title="By Severity" type="donut" data={vulnsBySeverity} />
          </Col>
          <Col md={6} className="d-flex">
            <MockChart title="Aging" type="bar" data={vulnAging} />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Vulnerabilities;
