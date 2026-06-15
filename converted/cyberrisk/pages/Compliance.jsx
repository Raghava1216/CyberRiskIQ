import React from "react";
import { Helmet } from "react-helmet-async";
import { Container } from "react-bootstrap";

import MockCards from "../mock/MockCards";
import RegulatoryOverview from "../RegulatoryCompliance/RegulatoryOverview";
import { complianceStatusCards } from "../mock/mockData";

// Compliance tab. Temporary mock data — replace MockCards with the real
// <DashboardCards/>/<ReportRuntime/> and keep RegulatoryOverview once its metadata
// exists.
const Compliance = () => {
  return (
    <>
      <Helmet title="CyberRisk IQ — Compliance" />
      <Container fluid className="p-0 m-0">
        <MockCards cards={complianceStatusCards} />
        <RegulatoryOverview />
      </Container>
    </>
  );
};

export default Compliance;
