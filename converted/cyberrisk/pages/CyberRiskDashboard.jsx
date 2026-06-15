import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Container, Tab } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { faShieldHalved } from "@fortawesome/free-solid-svg-icons";

import LandingPagesTitle from "src/components/pages/LandingPagesTitle";
import * as util from "src/components/forms/reactformutils/elements/formutilfunctions";

import Dashboard from "./Dashboard";
import Risks from "./Risks";
import Threats from "./Threats";
import Vulnerabilities from "./Vulnerabilities";
import Assets from "./Assets";
import IOC from "./IOC";
import Incidents from "./Incidents";
import Compliance from "./Compliance";
import Reports from "./Reports";
import Settings from "./Settings";
import Wazuh from "./Wazuh";

const CyberRiskDashboard = () => {
  const { t } = useTranslation("common");

  const privs = util.getCurrentUser().privileges?.split(",") || [];

  const TABS = [
    { key: "dashboard", title: t("Dashboard"), privilege: "CR_DASHBOARD" },
    { key: "risks", title: t("Risk Register"), privilege: "CR_RISK" },
    { key: "threats", title: t("Threats"), privilege: "CR_THREAT" },
    { key: "vulnerabilities", title: t("Vulnerabilities"), privilege: "CR_VULN" },
    { key: "assets", title: t("Assets"), privilege: "CR_ASSET" },
    { key: "ioc", title: t("IOC"), privilege: "CR_IOC" },
    { key: "incidents", title: t("Incidents"), privilege: "CR_INCIDENT" },
    { key: "compliance", title: t("Compliance"), privilege: "CR_COMPLIANCE" },
    { key: "reports", title: t("Reports"), privilege: "CR_REPORTS" },
    { key: "settings", title: t("Settings"), privilege: "CR_SETTINGS" },
    { key: "wazuh", title: t("Wazuh"), privilege: "CR_WAZUH" },
  ].filter((tab) => privs.length === 0 || privs.includes(tab.privilege));

  const canView = (key) => TABS.some((tab) => tab.key === key);

  const [activeTab, setActiveTab] = useState(TABS[0]?.key);
  const [year, setYear] = useState(new Date().getFullYear());
  const [refreshCharts] = useState(0);

  const activeTitle =
    TABS.find((tab) => tab.key === activeTab)?.title || t("CyberRisk IQ");

  return (
    <>
      <Helmet title="CyberRisk IQ" />
      <Container fluid className="p-0 m-0">
        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          <LandingPagesTitle
            title={activeTitle}
            fontawsomeIcon={faShieldHalved}
            tabs={TABS}
            showYearFilter
            updateValue={setActiveTab}
            onYearChange={setYear}
          />
          <Tab.Content>
            {canView("dashboard") && (
              <Tab.Pane eventKey="dashboard">
                <Dashboard year={year} refreshCharts={refreshCharts} />
              </Tab.Pane>
            )}
            {canView("risks") && (
              <Tab.Pane eventKey="risks">
                <Risks year={year} refreshCharts={refreshCharts} />
              </Tab.Pane>
            )}
            {canView("threats") && (
              <Tab.Pane eventKey="threats">
                <Threats year={year} refreshCharts={refreshCharts} />
              </Tab.Pane>
            )}
            {canView("vulnerabilities") && (
              <Tab.Pane eventKey="vulnerabilities">
                <Vulnerabilities year={year} refreshCharts={refreshCharts} />
              </Tab.Pane>
            )}
            {canView("assets") && (
              <Tab.Pane eventKey="assets">
                <Assets year={year} refreshCharts={refreshCharts} />
              </Tab.Pane>
            )}
            {canView("ioc") && (
              <Tab.Pane eventKey="ioc">
                <IOC year={year} refreshCharts={refreshCharts} />
              </Tab.Pane>
            )}
            {canView("incidents") && (
              <Tab.Pane eventKey="incidents">
                <Incidents year={year} refreshCharts={refreshCharts} />
              </Tab.Pane>
            )}
            {canView("compliance") && (
              <Tab.Pane eventKey="compliance">
                <Compliance year={year} refreshCharts={refreshCharts} />
              </Tab.Pane>
            )}
            {canView("reports") && (
              <Tab.Pane eventKey="reports">
                <Reports year={year} refreshCharts={refreshCharts} />
              </Tab.Pane>
            )}
            {canView("settings") && (
              <Tab.Pane eventKey="settings">
                <Settings year={year} refreshCharts={refreshCharts} />
              </Tab.Pane>
            )}
            {canView("wazuh") && (
              <Tab.Pane eventKey="wazuh">
                <Wazuh year={year} refreshCharts={refreshCharts} />
              </Tab.Pane>
            )}
          </Tab.Content>
        </Tab.Container>
      </Container>
    </>
  );
};

export default CyberRiskDashboard;
