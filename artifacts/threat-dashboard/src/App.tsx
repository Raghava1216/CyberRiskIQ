import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container, Tab } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import {
  faGauge,
  faTriangleExclamation,
  faBolt,
  faBug,
  faServer,
  faCrosshairs,
  faFileShield,
  faClipboardCheck,
  faChartLine,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';

import TopBar from './components/TopBar';
import LandingPagesTitle, { type LandingTab } from './components/pages/LandingPagesTitle';
import DashboardCards, { type DashCard } from './components/pages/DashboardCards';
import FormReportChartLink, { type LinkItem } from './components/pages/FormReportChartLink';

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

import type { NavPage } from './lib/types';
import { ThemeProvider } from './lib/ThemeContext';

const TABS: (LandingTab & { key: NavPage })[] = [
  { title: 'Dashboard',           key: 'dashboard',       privilege: 'CR_DASHBOARD' },
  { title: 'Risk Register',       key: 'risks',           privilege: 'CR_RISK' },
  { title: 'Threat Intelligence', key: 'threats',         privilege: 'CR_THREAT' },
  { title: 'Vulnerabilities',     key: 'vulnerabilities', privilege: 'CR_VULN' },
  { title: 'Asset Inventory',     key: 'assets',          privilege: 'CR_ASSET' },
  { title: 'IOC Register',        key: 'ioc',             privilege: 'CR_IOC' },
  { title: 'Incidents',           key: 'incidents',       privilege: 'CR_INCIDENT' },
  { title: 'Compliance',          key: 'compliance',      privilege: 'CR_COMPLIANCE' },
  { title: 'Reports',             key: 'reports',         privilege: 'CR_REPORTS' },
  { title: 'Settings',            key: 'settings',        privilege: 'CR_SETTINGS' },
  { title: 'Wazuh SIEM',          key: 'wazuh',           privilege: 'CR_WAZUH' },
];

function AppInner() {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<NavPage>('dashboard');

  const handleSelect = (key: string | null) => {
    if (key) setActiveTab(key as NavPage);
  };

  const activeTitle = TABS.find((tabb) => tabb.key === activeTab)?.title ?? 'CyberRisk IQ';

  // Quick-access module strip rendered on the Dashboard tab — adopts the
  // user's DashboardCards (#293042) model. View/Create jump to the section
  // where the existing modals and tables live.
  const moduleCards: DashCard[] = [
    { id: 'risks',           title: t('Risks'),           count: 12, icon: faTriangleExclamation, createAccess: true, viewAccess: true },
    { id: 'threats',         title: t('Threats'),         count: 6,  icon: faBolt,                createAccess: true, viewAccess: true },
    { id: 'vulnerabilities', title: t('Vulnerabilities'), count: 4,  icon: faBug,                 viewAccess: true },
    { id: 'ioc',             title: t('IOCs'),            count: 12, icon: faCrosshairs,          createAccess: true, viewAccess: true },
    { id: 'incidents',       title: t('Incidents'),       count: 7,  icon: faShieldHalved,        createAccess: true, viewAccess: true },
  ];

  const handleCardAction = (_action: string, card: DashCard) => {
    if (card.id) setActiveTab(card.id as NavPage);
  };

  // Forms / Reports / Charts quick-links — adopts the user's FormReportChartLink
  // model. These are placeholder slots that route into existing sections; they
  // will later be swapped for the real backend-driven Report/Chart runtimes.
  const quickLinks: LinkItem[] = [
    { title: t('New Risk'),               type: 'form',   form: 'CR_FORM_RISK',          privilege: 'CR_RISK' },
    { title: t('Declare Incident'),       type: 'form',   form: 'CR_FORM_INCIDENT',      privilege: 'CR_INCIDENT' },
    { title: t('Risk Posture Summary'),   type: 'report', report: 'CR_RPT_RISK_POSTURE', privilege: 'CR_REPORTS' },
    { title: t('Open Incidents'),         type: 'report', report: 'CR_RPT_OPEN_INC',     privilege: 'CR_REPORTS' },
    { title: t('Vulnerability Trend'),    type: 'chart',  chart: 'CR_CHT_VULN_TREND',    privilege: 'CR_REPORTS' },
    { title: t('Threats by Severity'),    type: 'chart',  chart: 'CR_CHT_THREAT_SEV',    privilege: 'CR_REPORTS' },
  ];

  const handleOpenLink = (item: LinkItem) => {
    if (item.type === 'form') {
      setActiveTab(item.form === 'CR_FORM_INCIDENT' ? 'incidents' : 'risks');
    } else {
      setActiveTab('reports');
    }
  };

  return (
    <div className="pg-app">
      <Helmet title={`CyberRisk IQ — ${activeTitle}`} />
      <TopBar />

      <Tab.Container id="cr-menu" activeKey={activeTab} onSelect={handleSelect}>
        <Container fluid className="pg-app-body">
          <LandingPagesTitle
            title={activeTitle}
            fontawsomeIcon={faGauge}
            tabs={TABS}
            showYearFilter
          />

          <Tab.Content>
            <Tab.Pane eventKey="dashboard" unmountOnExit>
              <DashboardCards cardDataArray={moduleCards} onAction={handleCardAction} />
              <FormReportChartLink combinedItems={quickLinks} onOpen={handleOpenLink} />
              <Dashboard onNavigate={setActiveTab} />
            </Tab.Pane>
            <Tab.Pane eventKey="risks" unmountOnExit>
              <Risks />
            </Tab.Pane>
            <Tab.Pane eventKey="threats" unmountOnExit>
              <Threats />
            </Tab.Pane>
            <Tab.Pane eventKey="vulnerabilities" unmountOnExit>
              <Vulnerabilities />
            </Tab.Pane>
            <Tab.Pane eventKey="assets" unmountOnExit>
              <Assets />
            </Tab.Pane>
            <Tab.Pane eventKey="ioc" unmountOnExit>
              <IOCPage />
            </Tab.Pane>
            <Tab.Pane eventKey="incidents" unmountOnExit>
              <Incidents />
            </Tab.Pane>
            <Tab.Pane eventKey="compliance" unmountOnExit>
              <Compliance />
            </Tab.Pane>
            <Tab.Pane eventKey="reports" unmountOnExit>
              <Reports />
            </Tab.Pane>
            <Tab.Pane eventKey="settings" unmountOnExit>
              <Settings />
            </Tab.Pane>
            <Tab.Pane eventKey="wazuh" unmountOnExit>
              <WazuhPage />
            </Tab.Pane>
          </Tab.Content>
        </Container>
      </Tab.Container>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
