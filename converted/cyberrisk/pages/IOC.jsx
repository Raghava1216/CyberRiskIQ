import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Row } from "react-bootstrap";

import MockActionBar from "../mock/MockActionBar";
import MockReport from "../mock/MockReport";
import { iocs } from "../mock/mockData";

// Indicators of Compromise. Temporary mock data — replace with
// <FormReportChartLink/> + <ReportRuntime/> (real keys) when metadata exists.
const IOC = () => {
  return (
    <>
      <Helmet title="CyberRisk IQ — IOC" />
      <Container fluid className="p-0 m-0">
        <MockActionBar actions={[{ label: "+ Indicator" }, { label: "Import IOC Feed", variant: "outline-secondary" }]} />
        <Row className="p-0 m-0">
          <MockReport title="Indicators of Compromise" columns={iocs.columns} rows={iocs.rows} dataCard />
        </Row>
      </Container>
    </>
  );
};

export default IOC;
