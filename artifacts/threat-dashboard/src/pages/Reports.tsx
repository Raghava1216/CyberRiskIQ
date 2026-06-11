import { Helmet } from 'react-helmet-async';
import { Container, Row, Col } from 'react-bootstrap';
import ReportRuntime from '../components/reports/Report';
import FormReportChartLink, { type LinkItem } from '../components/pages/FormReportChartLink';
import SectionHeaderCard from '../components/pages/SectionHeaderCard';
import { faFileLines } from '@fortawesome/free-solid-svg-icons';
import type { PageProps } from '../platform/pageProps';

const reportLinks: LinkItem[] = [
  { title: 'Risk Register', type: 'report', report: 'CR_RISK_REGISTER', privilege: 'CR_VIEW_RISKS' },
  { title: 'Financial Exposure (FAIR)', type: 'report', report: 'CR_RISK_FINANCIAL', privilege: 'CR_VIEW_RISKS' },
  { title: 'Threat Feed', type: 'report', report: 'CR_THREAT_FEED', privilege: 'CR_VIEW_THREATS' },
  { title: 'Vulnerability Register', type: 'report', report: 'CR_VULN_REGISTER', privilege: 'CR_VIEW_VULNERABILITIES' },
  { title: 'Asset Inventory', type: 'report', report: 'CR_ASSET_INVENTORY', privilege: 'CR_VIEW_ASSETS' },
  { title: 'Incident Register', type: 'report', report: 'CR_INCIDENT_REGISTER', privilege: 'CR_VIEW_INCIDENTS' },
  { title: 'Framework Compliance', type: 'report', report: 'CR_COMPLIANCE_FRAMEWORKS', privilege: 'CR_VIEW_COMPLIANCE' },
  { title: 'GRC Control Mapping', type: 'report', report: 'CR_GRC_REGISTRY', privilege: 'CR_VIEW_COMPLIANCE' },
];

export default function Reports({ year }: PageProps) {
  return (
    <Container fluid className="p-2">
      <Helmet title="Reports" />
      <Row className="g-0">
        <Col xs={12}>
          <ReportRuntime report="CR_POSTURE_SNAPSHOT" yearProp={year} dataCard />
        </Col>
      </Row>
      <SectionHeaderCard title="Report Library" icon={faFileLines} right="Generate & export" />
      <Row className="g-0">
        <Col xs={12} className="px-2">
          <FormReportChartLink combinedItems={reportLinks} />
        </Col>
      </Row>
      <Row className="g-0">
        <Col xs={12}>
          <ReportRuntime report="CR_GRC_REGISTRY" yearProp={year} />
        </Col>
      </Row>
    </Container>
  );
}
