import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import ReportRuntime from "src/components/reports/Report";
import Chart from "src/components/charts/Chart";
import DashboardCards from "src/components/pages/DashboardCards";
import FormReportChartLink from "src/components/pages/FormReportChartLink";

import CrqOverview from "../Crq/CrqOverview";

// Executive overview tab — total financial exposure (ALE) in EUR, top risks,
// regulatory posture. All chart/report/card keys are CyberRisk IQ placeholders.
const Dashboard = ({ year, refreshCharts }) => {
  const { t } = useTranslation("common");

  const moduleCards = [
    {
      title: t("Annual Loss Exposure"),
      count: 0,
      icon: "faSackDollar",
      api: "dashboardCounts",
      report: "CR_RPT_ALE_TOTAL",
      viewAccess: "CR_DASHBOARD",
    },
    {
      title: t("Open Vulnerabilities"),
      count: 0,
      icon: "faBug",
      api: "dashboardCounts",
      report: "CR_RPT_OPEN_VULNS",
      viewAccess: "CR_VULN",
    },
    {
      title: t("Critical Assets"),
      count: 0,
      icon: "faServer",
      api: "dashboardCounts",
      report: "CR_RPT_CRITICAL_ASSETS",
      viewAccess: "CR_ASSET",
    },
    {
      title: t("Regulatory Obligations"),
      count: 0,
      icon: "faGavel",
      api: "dashboardCounts",
      report: "CR_RPT_REG_OBLIGATIONS",
      viewAccess: "CR_COMPLIANCE",
    },
  ];

  const combinedItems = [
    { type: "report", title: t("Top Financial Risks"), report: "CR_RPT_TOP_RISKS", privilege: "CR_DASHBOARD" },
    { type: "chart", title: t("Exposure Trend"), chart: "CR_CHT_EXPOSURE_TREND", privilege: "CR_DASHBOARD" },
  ];

  return (
    <>
      <Helmet title="CyberRisk IQ — Dashboard" />
      <Container fluid className="p-0 m-0">
        <DashboardCards cardDataArray={moduleCards} year={year} />
        <FormReportChartLink combinedItems={combinedItems} />
        <Row className="p-0 m-0">
          <Col md={6}>
            <Chart chart="CR_CHT_ALE_BY_BU" yearProp={year} key={refreshCharts} />
          </Col>
          <Col md={6}>
            <Chart chart="CR_CHT_RISK_SEVERITY" yearProp={year} key={refreshCharts} type="risk" />
          </Col>
        </Row>
        <Row className="p-0 m-0">
          <ReportRuntime report="CR_RPT_TOP_RISKS" yearProp={year} dataCard />
        </Row>
        <CrqOverview year={year} refreshCharts={refreshCharts} />
      </Container>
    </>
  );
};

export default Dashboard;
