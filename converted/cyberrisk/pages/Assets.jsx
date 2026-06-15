import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import FormReportChartLink from "src/components/pages/FormReportChartLink";
import ReportRuntime from "src/components/reports/Report";

import BlastRadiusOverview from "../BlastRadius/BlastRadiusOverview";

// Asset register. Create actions + list reports are declared as data and rendered
// by FormReportChartLink; the main grid is a ReportRuntime. All form/report keys
// are CyberRisk IQ placeholders — replace with real backend metadata keys.
const Assets = ({ year, refreshCharts }) => {
  const { t } = useTranslation("common");

  const forms = [
    { title: t("Asset"), form: "cyberrisk_asset", privilege: "CR_CREATE_ASSET", upload: true },
    { title: t("Asset Connection"), form: "cyberrisk_asset_connection", privilege: "CR_CREATE_ASSET", upload: true },
  ];

  const reports = [
    { title: t("Assets"), report: "CR_RPT_ASSETS", privilege: "CR_VIEW_ASSET" },
    { title: t("Internet-Facing Assets"), report: "CR_RPT_ASSETS_INTERNET_FACING", privilege: "CR_VIEW_ASSET" },
  ];

  const combinedItems = [
    ...forms.map((item) => ({ ...item, type: "form" })),
    ...reports.map((item) => ({ ...item, type: "report" })),
  ];

  return (
    <>
      <Helmet title="CyberRisk IQ — Assets" />
      <Container fluid className="p-0 m-0">
        <FormReportChartLink combinedItems={combinedItems} />
        <Row className="p-0 m-0">
          <ReportRuntime report="CR_RPT_ASSETS" yearProp={year} key={refreshCharts} />
        </Row>
        <BlastRadiusOverview year={year} refreshCharts={refreshCharts} />
      </Container>
    </>
  );
};

export default Assets;
