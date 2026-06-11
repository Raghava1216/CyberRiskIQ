import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
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
import type { IOC } from './lib/types';
import { mockIOCs } from './lib/mockData';
import { ThemeProvider, useTheme } from './lib/ThemeContext';

function AppInner() {
  const { sidebarDark } = useTheme();
  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [iocs, setIocs] = useState<IOC[]>(mockIOCs as IOC[]);

  const addIOCs = (newIOCs: IOC[]) => {
    setIocs(prev => {
      const existingIds = new Set(prev.map(i => i.id));
      const unique = newIOCs.filter(i => !existingIds.has(i.id));
      return [...unique, ...prev];
    });
  };

  const addIOC = (ioc: IOC) => addIOCs([ioc]);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':       return <Dashboard onNavigate={setActivePage} />;
      case 'risks':           return <Risks />;
      case 'threats':         return <Threats iocs={iocs} onAddIOC={addIOC} onAddIOCs={addIOCs} />;
      case 'vulnerabilities': return <Vulnerabilities />;
      case 'assets':          return <Assets />;
      case 'ioc':             return <IOCPage iocs={iocs} onAddIOC={addIOC} onAddIOCs={addIOCs} />;
      case 'incidents':       return <Incidents />;
      case 'compliance':      return <Compliance />;
      case 'reports':         return <Reports />;
      case 'settings':        return <Settings />;
      case 'wazuh':           return <WazuhPage />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div className={sidebarDark ? 'pg-sidebar-dark' : ''}>
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          collapsed={sidebarCollapsed}
        />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <Header
          activePage={activePage}
          onToggleSidebar={() => setSidebarCollapsed(c => !c)}
        />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {renderPage()}
        </main>
      </div>
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
