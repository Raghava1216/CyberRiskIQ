import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import FormReportChartLink from "src/components/pages/FormReportChartLink";
import ReportRuntime from "src/components/reports/Report";

const IOC = ({ year, refreshCharts }) => {
  const { t } = useTranslation("common");

  const forms = [
    { title: t("Indicator of Compromise"), form: "cyberrisk_ioc", privilege: "CR_CREATE_IOC", upload: true },
    { title: t("Import IOC Feed"), form: "cyberrisk_ioc_import", privilege: "CR_CREATE_IOC", upload: true },
  ];

  const reports = [
    { title: t("Indicators of Compromise"), report: "CR_RPT_IOC", privilege: "CR_VIEW_IOC" },
  ];

  const combinedItems = [
    ...forms.map((item) => ({ ...item, type: "form" })),
    ...reports.map((item) => ({ ...item, type: "report" })),
  ];

  return (
    <>
      <Helmet title="CyberRisk IQ — IOC" />
      <Container fluid className="p-0 m-0">
        <FormReportChartLink combinedItems={combinedItems} />
        <Row className="p-0 m-0">
          <ReportRuntime report="CR_RPT_IOC" yearProp={year} key={refreshCharts} />
        </Row>
      </Container>
    </>
  );
};

export default IOC;
