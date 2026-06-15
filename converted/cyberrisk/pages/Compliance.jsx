import React from "react";
import { Helmet } from "react-helmet-async";
import { Container } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import FormReportChartLink from "src/components/pages/FormReportChartLink";

import RegulatoryOverview from "../RegulatoryCompliance/RegulatoryOverview";

// Regulatory compliance — DORA, NIS2, EU AI Act. The live, financially quantified
// risk registers and obligation tracking live in the RegulatoryCompliance folder.
const Compliance = ({ year, refreshCharts }) => {
  const { t } = useTranslation("common");

  const forms = [
    { title: t("Compliance Assessment"), form: "cyberrisk_assessment", privilege: "CR_CREATE_COMPLIANCE", upload: true },
  ];

  const reports = [
    { title: t("DORA ICT Risk Register"), report: "CR_RPT_DORA_REGISTER", privilege: "CR_VIEW_COMPLIANCE" },
    { title: t("NIS2 Obligations"), report: "CR_RPT_NIS2_OBLIGATIONS", privilege: "CR_VIEW_COMPLIANCE" },
    { title: t("EU AI Act Inventory"), report: "CR_RPT_AI_ACT_INVENTORY", privilege: "CR_VIEW_COMPLIANCE" },
  ];

  const combinedItems = [
    ...forms.map((item) => ({ ...item, type: "form" })),
    ...reports.map((item) => ({ ...item, type: "report" })),
  ];

  return (
    <>
      <Helmet title="CyberRisk IQ — Compliance" />
      <Container fluid className="p-0 m-0">
        <FormReportChartLink combinedItems={combinedItems} />
        <RegulatoryOverview year={year} refreshCharts={refreshCharts} />
      </Container>
    </>
  );
};

export default Compliance;
