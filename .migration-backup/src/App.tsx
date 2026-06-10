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

export default function App() {
  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── Shared IOC state — lifted here so Threats and IOCPage stay in sync ──
  const [iocs, setIocs] = useState<IOC[]>(mockIOCs as IOC[]);

  const addIOCs = (newIOCs: IOC[]) => {
    setIocs(prev => {
      // Deduplicate by id
      const existingIds = new Set(prev.map(i => i.id));
      const unique = newIOCs.filter(i => !existingIds.has(i.id));
      return [...unique, ...prev];
    });
  };

  const addIOC = (ioc: IOC) => addIOCs([ioc]);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':      return <Dashboard onNavigate={setActivePage} />;
      case 'risks':          return <Risks />;
      case 'threats':        return <Threats iocs={iocs} onAddIOC={addIOC} onAddIOCs={addIOCs} />;
      case 'vulnerabilities':return <Vulnerabilities />;
      case 'assets':         return <Assets />;
      case 'ioc':            return <IOCPage iocs={iocs} onAddIOC={addIOC} onAddIOCs={addIOCs} />;
      case 'incidents':      return <Incidents />;
      case 'compliance':     return <Compliance />;
      case 'reports':        return <Reports />;
      case 'settings':       return <Settings />;
      case 'wazuh':          return <WazuhPage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        collapsed={sidebarCollapsed}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activePage={activePage}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
