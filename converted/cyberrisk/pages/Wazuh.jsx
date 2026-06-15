import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import ReportRuntime from "src/components/reports/Report";
import Chart from "src/components/charts/Chart";

// Wazuh SIEM integration — agent health, alerts, and detections feeding the
// asset/vulnerability and IOC pipelines.
const Wazuh = ({ year, refreshCharts }) => {
  const { t } = useTranslation("common");

  return (
    <>
      <Helmet title="CyberRisk IQ — Wazuh" />
      <Container fluid className="p-0 m-0">
        <Row className="p-0 m-0">
          <ReportRuntime report="CR_RPT_WAZUH" yearProp={year} dataCard key={refreshCharts} />
        </Row>
        <Row className="p-0 m-0">
          <Col md={6}>
            <Chart chart="CR_CHT_WAZUH_ALERTS" yearProp={year} key={refreshCharts} />
          </Col>
          <Col md={6}>
            <Chart chart="CR_CHT_WAZUH_AGENT_HEALTH" yearProp={year} key={refreshCharts} />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Wazuh;
