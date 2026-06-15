import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import FormReportChartLink from "src/components/pages/FormReportChartLink";
import ReportRuntime from "src/components/reports/Report";
import Chart from "src/components/charts/Chart";

// Incidents drive NIS2 24-hour reporting obligations; see RegulatoryCompliance.
const Incidents = ({ year, refreshCharts }) => {
  const { t } = useTranslation("common");

  const forms = [
    { title: t("Incident"), form: "cyberrisk_incident", privilege: "CR_CREATE_INCIDENT", upload: true },
  ];

  const reports = [
    { title: t("Incidents"), report: "CR_RPT_INCIDENTS", privilege: "CR_VIEW_INCIDENT" },
    { title: t("NIS2 Reportable (24h)"), report: "CR_RPT_INCIDENTS_NIS2", privilege: "CR_VIEW_INCIDENT" },
  ];

  const combinedItems = [
    ...forms.map((item) => ({ ...item, type: "form" })),
    ...reports.map((item) => ({ ...item, type: "report" })),
  ];

  return (
    <>
      <Helmet title="CyberRisk IQ — Incidents" />
      <Container fluid className="p-0 m-0">
        <FormReportChartLink combinedItems={combinedItems} />
        <Row className="p-0 m-0">
          <ReportRuntime report="CR_RPT_INCIDENTS" yearProp={year} dataCard key={refreshCharts} />
        </Row>
        <Row className="p-0 m-0">
          <Col md={6}>
            <Chart chart="CR_CHT_INCIDENT_BY_STATUS" yearProp={year} key={refreshCharts} />
          </Col>
          <Col md={6}>
            <Chart chart="CR_CHT_INCIDENT_BY_SEVERITY" yearProp={year} key={refreshCharts} />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Incidents;
