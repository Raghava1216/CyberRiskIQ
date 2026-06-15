import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import ReportRuntime from "src/components/reports/Report";
import Chart from "src/components/charts/Chart";
import FormReportChartLink from "src/components/pages/FormReportChartLink";

// Composed regulatory sub-view — live, financially quantified registers for
// DORA, NIS2 and the EU AI Act, plus obligation status and evidence links.
const RegulatoryOverview = ({ year, refreshCharts }) => {
  const { t } = useTranslation("common");

  const reports = [
    { title: t("DORA ICT Risk Register"), report: "CR_RPT_DORA_REGISTER", privilege: "CR_VIEW_COMPLIANCE" },
    { title: t("NIS2 Obligations"), report: "CR_RPT_NIS2_OBLIGATIONS", privilege: "CR_VIEW_COMPLIANCE" },
    { title: t("EU AI Act Inventory"), report: "CR_RPT_AI_ACT_INVENTORY", privilege: "CR_VIEW_COMPLIANCE" },
  ];
  const combinedItems = [...reports.map((item) => ({ ...item, type: "report" }))];

  return (
    <>
      <Helmet title="Regulatory Compliance" />
      <Container fluid className="p-0 m-0">
        <Row className="p-0 m-0">
          <ReportRuntime report="CR_RPT_COMPLIANCE_STATUS" yearProp={year} dataCard key={refreshCharts} />
        </Row>
        <Row className="p-0 m-0">
          <Col md={4}>
            <Chart chart="CR_CHT_DORA_READINESS" yearProp={year} refreshCharts={refreshCharts} />
          </Col>
          <Col md={4}>
            <Chart chart="CR_CHT_NIS2_OBLIGATIONS" yearProp={year} refreshCharts={refreshCharts} />
          </Col>
          <Col md={4}>
            <Chart chart="CR_CHT_AI_ACT_RISK" yearProp={year} refreshCharts={refreshCharts} />
          </Col>
        </Row>
        <Row className="p-0 m-0">
          <Col>
            <ReportRuntime report="CR_RPT_DORA_REGISTER" yearProp={year} />
          </Col>
        </Row>
        <Row className="p-0 m-0">
          <Col>
            <FormReportChartLink combinedItems={combinedItems} />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default RegulatoryOverview;
