import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import FormReportChartLink from "src/components/pages/FormReportChartLink";
import ReportRuntime from "src/components/reports/Report";
import Chart from "src/components/charts/Chart";

// Risk register — financially quantified risk scenarios (ALE). The register is
// largely auto-populated from CRQ output; the Risk Manager reviews/approves.
const Risks = ({ year, refreshCharts }) => {
  const { t } = useTranslation("common");

  const forms = [
    { title: t("Risk Scenario"), form: "cyberrisk_risk", privilege: "CR_CREATE_RISK", upload: true },
  ];

  const reports = [
    { title: t("Risk Register"), report: "CR_RPT_RISKS", privilege: "CR_VIEW_RISK" },
    { title: t("Risks Pending Review"), report: "CR_RPT_RISKS_PENDING", privilege: "CR_VIEW_RISK" },
  ];

  const combinedItems = [
    ...forms.map((item) => ({ ...item, type: "form" })),
    ...reports.map((item) => ({ ...item, type: "report" })),
  ];

  return (
    <>
      <Helmet title="CyberRisk IQ — Risk Register" />
      <Container fluid className="p-0 m-0">
        <FormReportChartLink combinedItems={combinedItems} />
        <Row className="p-0 m-0">
          <ReportRuntime report="CR_RPT_RISKS" yearProp={year} dataCard key={refreshCharts} />
        </Row>
        <Row className="p-0 m-0">
          <Col md={6}>
            <Chart chart="CR_CHT_RISK_SEVERITY" yearProp={year} key={refreshCharts} type="risk" />
          </Col>
          <Col md={6}>
            <Chart chart="CR_CHT_ALE_BY_BU" yearProp={year} key={refreshCharts} />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Risks;
