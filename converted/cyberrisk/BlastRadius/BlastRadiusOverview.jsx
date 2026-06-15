import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";

import MockChart from "../mock/MockChart";
import MockReport from "../mock/MockReport";
import { blastRadiusByZone, assetConnectivity, blastRadius } from "../mock/mockData";

// Composed blast-radius sub-view — reachable assets and aggregated financial
// exposure of the reachable set. Rendered with temporary mock data so it loads
// without backend metadata. Replace MockChart/MockReport with the real <Chart/> +
// <ReportRuntime/> (real keys) when ready.
const BlastRadiusOverview = () => {
  return (
    <>
      <Helmet title="Blast Radius" />
      <Container fluid className="p-0 m-0">
        <Row className="p-0 m-0">
          <Col md={6} className="d-flex">
            <MockChart title="Blast Radius by Zone" type="donut" data={blastRadiusByZone} />
          </Col>
          <Col md={6} className="d-flex">
            <MockChart title="Asset Connectivity (hops)" type="bar" data={assetConnectivity} />
          </Col>
        </Row>
        <Row className="p-0 m-0">
          <MockReport title="Blast Radius" columns={blastRadius.columns} rows={blastRadius.rows} dataCard />
        </Row>
      </Container>
    </>
  );
};

export default BlastRadiusOverview;
