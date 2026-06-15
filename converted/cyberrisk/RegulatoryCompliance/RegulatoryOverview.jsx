import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";

import MockChart from "../mock/MockChart";
import MockReport from "../mock/MockReport";
import { complianceReadiness, aiActInventory, doraRegister, nis2Obligations } from "../mock/mockData";

// Composed regulatory sub-view — financially quantified registers for DORA, NIS2
// and the EU AI Act. Rendered with temporary mock data so it loads without backend
// metadata. Replace MockChart/MockReport with the real <Chart/> + <ReportRuntime/>
// + <FormReportChartLink/> (real keys) when ready.
const RegulatoryOverview = () => {
  return (
    <>
      <Helmet title="Regulatory Compliance" />
      <Container fluid className="p-0 m-0">
        <Row className="p-0 m-0">
          <Col md={6} className="d-flex">
            <MockChart title="Framework Readiness (%)" type="bar" data={complianceReadiness} />
          </Col>
          <Col md={6} className="d-flex">
            <MockChart title="EU AI Act Inventory" type="donut" data={aiActInventory} />
          </Col>
        </Row>
        <Row className="p-0 m-0">
          <Col md={6} className="d-flex">
            <MockReport title="DORA ICT Risk Register" columns={doraRegister.columns} rows={doraRegister.rows} />
          </Col>
          <Col md={6} className="d-flex">
            <MockReport title="NIS2 Obligations" columns={nis2Obligations.columns} rows={nis2Obligations.rows} />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default RegulatoryOverview;
