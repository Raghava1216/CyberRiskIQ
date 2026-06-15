import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Row } from "react-bootstrap";

import MockActionBar from "../mock/MockActionBar";
import MockReport from "../mock/MockReport";
import { threats } from "../mock/mockData";

// Threats. Temporary mock data — replace with <FormReportChartLink/> +
// <ReportRuntime/> (real keys) when backend metadata exists.
const Threats = () => {
  return (
    <>
      <Helmet title="CyberRisk IQ — Threats" />
      <Container fluid className="p-0 m-0">
        <MockActionBar actions={[{ label: "+ Threat" }, { label: "Import Threats", variant: "outline-secondary" }]} />
        <Row className="p-0 m-0">
          <MockReport title="Threats" columns={threats.columns} rows={threats.rows} dataCard />
        </Row>
      </Container>
    </>
  );
};

export default Threats;
