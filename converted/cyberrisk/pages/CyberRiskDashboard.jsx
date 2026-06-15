import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Container, Tab, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import {
  faGauge,
  faTriangleExclamation,
  faBolt,
  faBug,
  faCrosshairs,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

import LandingPagesTitle from "src/components/pages/LandingPagesTitle";
import DashboardCards from "src/components/pages/DashboardCards";
import FormReportChartLink from "src/components/pages/FormReportChartLink";
import Chart from "src/components/charts/Chart";
import ReportRuntime from "src/components/reports/Report";
import * as util from "src/components/forms/reactformutils/elements/formutilfunctions";

import Dashboard from "src/modules/cyberrisk/pages/Dashboard";
import Risks from "src/modules/cyberrisk/pages/Risks";
import Threats from "src/modules/cyberrisk/pages/Threats";
import Vulnerabilities from "src/modules/cyberrisk/pages/Vulnerabilities";
import Assets from "src/modules/cyberrisk/pages/Assets";
import IOC from "src/modules/cyberrisk/pages/IOC";
import Incidents from "src/modules/cyberrisk/pages/Incidents";
import Compliance from "src/modules/cyberrisk/pages/Compliance";
import Reports from "src/modules/cyberrisk/pages/Reports";
import Settings from "src/modules/cyberrisk/pages/Settings";
import Wazuh from "src/modules/cyberrisk/pages/Wazuh";

const TABS = [
  { title: "Dashboard", key: "dashboard", privilege: "CR_DASHBOARD" },
  { title: "Risk Register", key: "risks", privilege: "CR_RISK" },
  { title: "Threat Intelligence", key: "threats", privilege: "CR_THREAT" },
  { title: "Vulnerabilities", key: "vulnerabilities", privilege: "CR_VULN" },
  { title: "Asset Inventory", key: "assets", privilege: "CR_ASSET" },
  { title: "IOC Register", key: "ioc", privilege: "CR_IOC" },
  { title: "Incidents", key: "incidents", privilege: "CR_INCIDENT" },
  { title: "Compliance", key: "compliance", privilege: "CR_COMPLIANCE" },
  { title: "Reports", key: "reports", privilege: "CR_REPORTS" },
  { title: "Settings", key: "settings", privilege: "CR_SETTINGS" },
  { title: "Wazuh SIEM", key: "wazuh", privilege: "CR_WAZUH" },
];

const CyberRiskDashboard = () => {
  const { t } = useTranslation("common");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [year, setYear] = useState(util.getNormalYear().toString());
  // Bump to force `<Chart>` instances to refetch/redraw.
  const [refreshCharts] = useState(0);

  const baseUser = util.getCurrentUser();
  const currentUserInfo = { ...baseUser, logInId: baseUser?.id };

  const handleSelect = (key) => {
    if (key) setActiveTab(key);
  };

  const activeTitle =
    TABS.find((tabb) => tabb.key === activeTab)?.title ?? "CyberRisk IQ";

  // Quick-access module strip on the Dashboard tab (user's DashboardCards model).
  const moduleCards = [
    {
      title: t("Risks"),
      count: 12,
      icon: faTriangleExclamation,
      createAccess: true,
      viewAccess: true,
      api: "CR_FORM_RISK",
      report: "CR_RPT_RISK_POSTURE",
    },
    {
      title: t("Threats"),
      count: 6,
      icon: faBolt,
      createAccess: true,
      viewAccess: true,
      api: "CR_FORM_THREAT",
      report: "CR_RPT_THREAT_SEV",
    },
    {
      title: t("Vulnerabilities"),
      count: 4,
      icon: faBug,
      viewAccess: true,
      report: "CR_RPT_VULN_TREND",
    },
    {
      title: t("IOCs"),
      count: 12,
      icon: faCrosshairs,
      createAccess: true,
      viewAccess: true,
      api: "CR_FORM_IOC",
      report: "CR_RPT_IOC",
    },
    {
      title: t("Incidents"),
      count: 7,
      icon: faShieldHalved,
      createAccess: true,
      viewAccess: true,
      api: "CR_FORM_INCIDENT",
      report: "CR_RPT_OPEN_INC",
    },
  ];

  // Forms / Reports / Charts quick links (user's FormReportChartLink model).
  const combinedItems = [
    { type: "form", title: t("New Risk"), form: "CR_FORM_RISK", privilege: "CR_RISK" },
    { type: "form", title: t("Declare Incident"), form: "CR_FORM_INCIDENT", privilege: "CR_INCIDENT" },
    { type: "report", title: t("Risk Posture Summary"), report: "CR_RPT_RISK_POSTURE", privilege: "CR_REPORTS" },
    { type: "report", title: t("Open Incidents"), report: "CR_RPT_OPEN_INC", privilege: "CR_REPORTS" },
    { type: "chart", title: t("Vulnerability Trend"), chart: "CR_CHT_VULN_TREND", privilege: "CR_REPORTS" },
    { type: "chart", title: t("Threats by Severity"), chart: "CR_CHT_THREAT_SEV", privilege: "CR_REPORTS" },
  ];

  const pageProps = { year, currentUserInfo, refreshCharts, onNavigate: setActiveTab };

  return (
    <Tab.Container id="cr-menu" activeKey={activeTab} onSelect={handleSelect} transition={false}>
      <Container fluid className="p-0 m-0">
        <Helmet>
          <title>{`CyberRisk IQ — ${activeTitle}`}</title>
        </Helmet>

        <LandingPagesTitle
          title={activeTitle}
          fontawsomeIcon={faGauge}
          tabs={TABS}
          showYearFilter
          updateValue={setActiveTab}
          onYearChange={setYear}
        />

        <Tab.Content>
          <Tab.Pane eventKey="dashboard" unmountOnExit>
            <DashboardCards cardDataArray={moduleCards} year={year} currentUserInfo={currentUserInfo} />

            <Row className="g-2 mb-2 p-2">
              <Col lg={4} md={6}>
                <Chart chart="CR_CHT_RISK_SEVERITY" yearFlag yearProp={year} key={refreshCharts} />
              </Col>
              <Col lg={4} md={6}>
                <Chart chart="CR_CHT_CONTROL_BU" yearFlag yearProp={year} key={refreshCharts} />
              </Col>
              <Col lg={4} md={12}>
                <Chart chart="CR_CHT_LOSS_TREND" yearFlag yearProp={year} key={refreshCharts} />
              </Col>
            </Row>

            <Row className="g-2 mb-3 p-2">
              <Col lg={7}>
                <ReportRuntime report="CR_RPT_TOP_RISKS" yearProp={year} />
              </Col>
              <Col lg={5}>
                <ReportRuntime report="CR_RPT_CONTROL_TESTING" yearProp={year} />
              </Col>
            </Row>

            <Dashboard {...pageProps} />

            <Row className="p-2 m-0">
              <Col md={12}>
                <FormReportChartLink combinedItems={combinedItems} />
              </Col>
            </Row>
          </Tab.Pane>

          <Tab.Pane eventKey="risks" unmountOnExit>
            <Risks {...pageProps} />
          </Tab.Pane>
          <Tab.Pane eventKey="threats" unmountOnExit>
            <Threats {...pageProps} />
          </Tab.Pane>
          <Tab.Pane eventKey="vulnerabilities" unmountOnExit>
            <Vulnerabilities {...pageProps} />
          </Tab.Pane>
          <Tab.Pane eventKey="assets" unmountOnExit>
            <Assets {...pageProps} />
          </Tab.Pane>
          <Tab.Pane eventKey="ioc" unmountOnExit>
            <IOC {...pageProps} />
          </Tab.Pane>
          <Tab.Pane eventKey="incidents" unmountOnExit>
            <Incidents {...pageProps} />
          </Tab.Pane>
          <Tab.Pane eventKey="compliance" unmountOnExit>
            <Compliance {...pageProps} />
          </Tab.Pane>
          <Tab.Pane eventKey="reports" unmountOnExit>
            <Reports {...pageProps} />
          </Tab.Pane>
          <Tab.Pane eventKey="settings" unmountOnExit>
            <Settings {...pageProps} />
          </Tab.Pane>
          <Tab.Pane eventKey="wazuh" unmountOnExit>
            <Wazuh {...pageProps} />
          </Tab.Pane>
        </Tab.Content>
      </Container>
    </Tab.Container>
  );
};

export default CyberRiskDashboard;
