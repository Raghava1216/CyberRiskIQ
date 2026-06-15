import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import FormReportChartLink from "src/components/pages/FormReportChartLink";
import ReportRuntime from "src/components/reports/Report";

const Threats = ({ year, refreshCharts }) => {
  const { t } = useTranslation("common");

  const forms = [
    { title: t("Threat"), form: "cyberrisk_threat", privilege: "CR_CREATE_THREAT", upload: true },
  ];

  const reports = [
    { title: t("Threats"), report: "CR_RPT_THREATS", privilege: "CR_VIEW_THREAT" },
  ];

  const combinedItems = [
    ...forms.map((item) => ({ ...item, type: "form" })),
    ...reports.map((item) => ({ ...item, type: "report" })),
  ];

  return (
    <>
      <Helmet title="CyberRisk IQ — Threats" />
      <Container fluid className="p-0 m-0">
        <FormReportChartLink combinedItems={combinedItems} />
        <Row className="p-0 m-0">
          <ReportRuntime report="CR_RPT_THREATS" yearProp={year} key={refreshCharts} />
        </Row>
      </Container>
    </>
  );
};

export default Threats;
