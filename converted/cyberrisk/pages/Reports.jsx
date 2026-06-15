import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import FormReportChartLink from "src/components/pages/FormReportChartLink";
import ReportRuntime from "src/components/reports/Report";

// Board-ready reporting — one-page exposure summaries and regulatory evidence packs.
const Reports = ({ year, refreshCharts }) => {
  const { t } = useTranslation("common");

  const reports = [
    { title: t("Board Summary"), report: "CR_RPT_BOARD_SUMMARY", privilege: "CR_VIEW_REPORTS" },
    { title: t("Financial Exposure by Business Unit"), report: "CR_RPT_EXPOSURE_BY_BU", privilege: "CR_VIEW_REPORTS" },
    { title: t("Regulatory Evidence Pack"), report: "CR_RPT_REG_EVIDENCE", privilege: "CR_VIEW_REPORTS" },
  ];

  const combinedItems = [...reports.map((item) => ({ ...item, type: "report" }))];

  return (
    <>
      <Helmet title="CyberRisk IQ — Reports" />
      <Container fluid className="p-0 m-0">
        <FormReportChartLink combinedItems={combinedItems} />
        <Row className="p-0 m-0">
          <Col>
            <ReportRuntime report="CR_RPT_BOARD_SUMMARY" yearProp={year} key={refreshCharts} />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Reports;
