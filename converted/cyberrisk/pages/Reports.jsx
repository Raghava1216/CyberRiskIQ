import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Row } from "react-bootstrap";

import MockActionBar from "../mock/MockActionBar";
import MockReport from "../mock/MockReport";
import { boardSummary } from "../mock/mockData";

// Reports tab. Temporary mock data — replace with <FormReportChartLink/> +
// <ReportRuntime/> (real keys) when metadata exists.
const Reports = () => {
  return (
    <>
      <Helmet title="CyberRisk IQ — Reports" />
      <Container fluid className="p-0 m-0">
        <MockActionBar
          actions={[
            { label: "Board Summary (PDF)" },
            { label: "DORA Register", variant: "outline-secondary" },
            { label: "NIS2 Report", variant: "outline-secondary" },
          ]}
        />
        <Row className="p-0 m-0">
          <MockReport title="Board Risk Summary" columns={boardSummary.columns} rows={boardSummary.rows} dataCard />
        </Row>
      </Container>
    </>
  );
};

export default Reports;
