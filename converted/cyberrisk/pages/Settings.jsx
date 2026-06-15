import React from "react";
import { Helmet } from "react-helmet-async";
import { Container } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import SettingsForm from "src/components/forms/reactformutils/FormRuntimeEngine";

// Module configuration rendered inline (no off-canvas, no report) — connector
// credentials, FAIR defaults, regulatory scope, notification thresholds.
const Settings = () => {
  const { t } = useTranslation("common");

  return (
    <>
      <Helmet title="CyberRisk IQ — Settings" />
      <Container fluid className="p-0 m-0">
        <SettingsForm formService="cyberrisk_settings" objectId={-1} />
      </Container>
    </>
  );
};

export default Settings;
