import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import ReportRuntime from "src/components/reports/Report";
import Chart from "src/components/charts/Chart";
import FormReportChartLink from "src/components/pages/FormReportChartLink";

// Composed CRQ sub-view (RiskOverview/ORMIssues pattern) — financial exposure
// translated from technical risk: ALE by business unit, top financial risks,
// and the prioritised "fix these 15 to remove 73% of exposure" report.
const CrqOverview = ({ year, refreshCharts }) => {
  const { t } = useTranslation("common");

  const reports = [
    { title: t("ALE by Business Unit"), report: "CR_RPT_ALE_BY_BU", privilege: "CR_DASHBOARD" },
    { title: t("Top Financial Risks"), report: "CR_RPT_TOP_RISKS", privilege: "CR_DASHBOARD" },
  ];
  const combinedItems = [...reports.map((item) => ({ ...item, type: "report" }))];

  return (
    <>
      <Helmet title="Cyber Risk Quantification" />
      <Container fluid className="p-0 m-0">
        <Row className="p-0 m-0">
          <ReportRuntime report="CR_RPT_ALE_TOTAL" yearProp={year} dataCard key={refreshCharts} />
        </Row>
        <Row className="p-0 m-0">
          <Col md={4}>
            <Chart chart="CR_CHT_ALE_BY_BU" yearProp={year} refreshCharts={refreshCharts} />
          </Col>
          <Col md={4}>
            <Chart chart="CR_CHT_ALE_DISTRIBUTION" yearProp={year} refreshCharts={refreshCharts} />
          </Col>
          <Col md={4}>
            <Chart chart="CR_CHT_RISK_REDUCTION_ROI" yearProp={year} refreshCharts={refreshCharts} type="risk" />
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

export default CrqOverview;
