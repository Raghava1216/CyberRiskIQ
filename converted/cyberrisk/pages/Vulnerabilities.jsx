import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import FormReportChartLink from "src/components/pages/FormReportChartLink";
import ReportRuntime from "src/components/reports/Report";
import Chart from "src/components/charts/Chart";

// Vulnerabilities are typically ingested from scanners (Qualys/Tenable) via
// import, then matched to assets and scored financially by the CRQ engine.
const Vulnerabilities = ({ year, refreshCharts }) => {
  const { t } = useTranslation("common");

  const forms = [
    { title: t("Import Scan Results"), form: "cyberrisk_vuln_scan_import", privilege: "CR_CREATE_VULN", upload: true },
    { title: t("Browse CVE"), form: "cyberrisk_cve_browse", privilege: "CR_VIEW_VULN" },
  ];

  const reports = [
    { title: t("Vulnerabilities"), report: "CR_RPT_VULNERABILITIES", privilege: "CR_VIEW_VULN" },
    { title: t("Prioritised by Financial Risk"), report: "CR_RPT_VULNS_BY_ALE", privilege: "CR_VIEW_VULN" },
  ];

  const combinedItems = [
    ...forms.map((item) => ({ ...item, type: "form" })),
    ...reports.map((item) => ({ ...item, type: "report" })),
  ];

  return (
    <>
      <Helmet title="CyberRisk IQ — Vulnerabilities" />
      <Container fluid className="p-0 m-0">
        <FormReportChartLink combinedItems={combinedItems} />
        <Row className="p-0 m-0">
          <ReportRuntime report="CR_RPT_VULNERABILITIES" yearProp={year} dataCard key={refreshCharts} />
        </Row>
        <Row className="p-0 m-0">
          <Col md={6}>
            <Chart chart="CR_CHT_VULN_BY_SEVERITY" yearProp={year} key={refreshCharts} />
          </Col>
          <Col md={6}>
            <Chart chart="CR_CHT_VULN_AGING" yearProp={year} key={refreshCharts} />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Vulnerabilities;
