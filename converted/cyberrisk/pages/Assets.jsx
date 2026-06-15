import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Row } from "react-bootstrap";

import MockActionBar from "../mock/MockActionBar";
import MockReport from "../mock/MockReport";
import BlastRadiusOverview from "../BlastRadius/BlastRadiusOverview";
import { assets } from "../mock/mockData";

// Asset register. Rendered with temporary mock data so the tab loads without
// backend metadata. Replace MockActionBar/MockReport with <FormReportChartLink/>
// + <ReportRuntime/> (real keys) when ready.
const Assets = () => {
  return (
    <>
      <Helmet title="CyberRisk IQ — Assets" />
      <Container fluid className="p-0 m-0">
        <MockActionBar
          actions={[
            { label: "+ Asset" },
            { label: "+ Asset Connection" },
            { label: "Import Assets", variant: "outline-secondary" },
          ]}
        />
        <Row className="p-0 m-0">
          <MockReport title="Assets" columns={assets.columns} rows={assets.rows} dataCard />
        </Row>
        <BlastRadiusOverview />
      </Container>
    </>
  );
};

export default Assets;
