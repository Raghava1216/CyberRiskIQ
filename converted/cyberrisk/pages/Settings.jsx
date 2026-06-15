import React from "react";
import { Helmet } from "react-helmet-async";
import { Container, Card, Row, Col, Form, Button } from "react-bootstrap";

// Settings tab. Temporary mock UI so the tab loads without backend metadata.
// Replace this with the real metadata-driven settings form (FormRuntimeEngine /
// the module's settings form) once its form metadata exists. Inputs are inert.
const Settings = () => {
  return (
    <>
      <Helmet title="CyberRisk IQ — Settings" />
      <Container fluid className="p-2 m-0">
        <Card className="shadow-sm">
          <Card.Header className="fw-semibold">CyberRisk IQ Settings (mock)</Card.Header>
          <Card.Body>
            <Form>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Label>Reporting Currency</Form.Label>
                  <Form.Select disabled defaultValue="EUR">
                    <option>EUR</option>
                  </Form.Select>
                </Col>
                <Col md={6}>
                  <Form.Label>Risk Appetite (Annual ALE)</Form.Label>
                  <Form.Control disabled defaultValue="€10,000,000" />
                </Col>
                <Col md={6}>
                  <Form.Label>Monte Carlo Iterations</Form.Label>
                  <Form.Control disabled defaultValue="50,000" />
                </Col>
                <Col md={6}>
                  <Form.Label>Wazuh Integration</Form.Label>
                  <Form.Check type="switch" label="Enabled" checked disabled />
                </Col>
              </Row>
              <div className="mt-3">
                <Button variant="outline-primary" size="sm" disabled>
                  Save Settings
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
};

export default Settings;
