import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container, Tab } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import LandingPagesTitle, { type LandingTab } from './components/pages/LandingPagesTitle';
import { getCurrentUser } from './platform/currentUser';
import type { CurrentUserInfo } from './platform/pageProps';

import Dashboard from './pages/Dashboard';
import Risks from './pages/Risks';
import Threats from './pages/Threats';
import Vulnerabilities from './pages/Vulnerabilities';
import Assets from './pages/Assets';
import IOCPage from './pages/IOC';
import Incidents from './pages/Incidents';
import Compliance from './pages/Compliance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import WazuhPage from './pages/WazuhPage';

export default function App() {
  const { t } = useTranslation('common');

  const currentUserInfo: CurrentUserInfo = {
    logInId: getCurrentUser().id,
    privileges: getCurrentUser().privileges.split(','),
  };

  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [refreshCharts, setRefreshCharts] = useState(false);

  const handleSelected = (key: string | null) => {
    if (key !== null) {
      setActiveTab(key);
      setRefreshCharts((prev) => !prev);
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setRefreshCharts((prev) => !prev);
  };

  const tabs: LandingTab[] = [
    { title: t('Dashboard'), key: 'DASHBOARD', privilege: 'CR_VIEW_DASHBOARD' },
    { title: t('Risk Register'), key: 'RISKS', privilege: 'CR_VIEW_RISKS' },
    { title: t('Threat Intelligence'), key: 'THREATS', privilege: 'CR_VIEW_THREATS' },
    { title: t('Vulnerabilities'), key: 'VULNERABILITIES', privilege: 'CR_VIEW_VULNERABILITIES' },
    { title: t('Asset Inventory'), key: 'ASSETS', privilege: 'CR_VIEW_ASSETS' },
    { title: t('IOC Register'), key: 'IOC', privilege: 'CR_VIEW_IOC' },
    { title: t('Incidents'), key: 'INCIDENTS', privilege: 'CR_VIEW_INCIDENTS' },
    { title: t('Compliance'), key: 'COMPLIANCE', privilege: 'CR_VIEW_COMPLIANCE' },
    { title: t('Reports'), key: 'REPORTS', privilege: 'CR_VIEW_REPORTS' },
    { title: t('Wazuh SIEM'), key: 'WAZUH', privilege: 'CR_VIEW_WAZUH' },
    { title: t('Admin Setup'), key: 'SETTINGS', privilege: 'CR_ADMIN' },
  ];

  const paneProps = { year: selectedYear, currentUserInfo, refreshCharts };

  return (
    <div className="cr-app">
      <Helmet title="CyberRiskIQ" />
      <Container fluid className="p-0 m-0">
        <Tab.Container id="cr-menu" activeKey={activeTab} onSelect={handleSelected}>
          <LandingPagesTitle
            title={t('CyberRiskIQ — Enterprise Risk & Threat Posture')}
            tabs={tabs}
            showYearFilter
            onYearChange={handleYearChange}
          />
          <Tab.Content className="pb-4">
            <Tab.Pane eventKey="DASHBOARD" unmountOnExit><Dashboard {...paneProps} onNavigate={setActiveTab} /></Tab.Pane>
            <Tab.Pane eventKey="RISKS" unmountOnExit><Risks {...paneProps} /></Tab.Pane>
            <Tab.Pane eventKey="THREATS" unmountOnExit><Threats {...paneProps} /></Tab.Pane>
            <Tab.Pane eventKey="VULNERABILITIES" unmountOnExit><Vulnerabilities {...paneProps} /></Tab.Pane>
            <Tab.Pane eventKey="ASSETS" unmountOnExit><Assets {...paneProps} /></Tab.Pane>
            <Tab.Pane eventKey="IOC" unmountOnExit><IOCPage {...paneProps} /></Tab.Pane>
            <Tab.Pane eventKey="INCIDENTS" unmountOnExit><Incidents {...paneProps} /></Tab.Pane>
            <Tab.Pane eventKey="COMPLIANCE" unmountOnExit><Compliance {...paneProps} /></Tab.Pane>
            <Tab.Pane eventKey="REPORTS" unmountOnExit><Reports {...paneProps} /></Tab.Pane>
            <Tab.Pane eventKey="WAZUH" unmountOnExit><WazuhPage {...paneProps} /></Tab.Pane>
            <Tab.Pane eventKey="SETTINGS" unmountOnExit><Settings {...paneProps} /></Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Container>
    </div>
  );
}
