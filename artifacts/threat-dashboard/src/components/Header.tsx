import { Menu, Bell, Search, RefreshCw, Sun, Moon, Layers } from 'react-feather';
import type { NavPage } from '../lib/types';
import { useTheme } from '../lib/ThemeContext';

const pageLabels: Record<NavPage, string> = {
  dashboard:       'Security Dashboard',
  risks:           'Risk Register',
  threats:         'Threat Intelligence',
  vulnerabilities: 'Vulnerability Management',
  assets:          'Asset Inventory',
  ioc:             'IOC Register',
  incidents:       'Incident Response',
  compliance:      'Compliance Management',
  reports:         'Reports & Analytics',
  settings:        'Platform Settings',
  wazuh:           'Wazuh SIEM',
};

interface HeaderProps {
  activePage: NavPage;
  onToggleSidebar: () => void;
}

export default function Header({ activePage, onToggleSidebar }: HeaderProps) {
  const { theme, sidebarDark, toggleTheme, toggleSidebar } = useTheme();

  const now     = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <>
      <style>{`
        .pg-header {
          font-family: 'Poppins', sans-serif;
          background: var(--pg-surface, #fff);
          border-bottom: 1px solid var(--pg-border, #e4e7ec);
          padding: 0 24px; height: 60px;
          display: flex; align-items: center; gap: 10px;
          transition: background 0.2s, border-color 0.2s;
        }
        .pg-header-toggle {
          border: none; background: transparent; cursor: pointer;
          color: var(--pg-text-muted, #667085); padding: 6px; border-radius: 6px;
          display: flex; align-items: center; flex-shrink: 0;
        }
        .pg-header-toggle:hover {
          background: var(--pg-surface-2, #f4f7f9);
          color: var(--pg-text-primary, #101828);
        }
        .pg-header-title {
          font-size: 0.9rem; font-weight: 600;
          color: var(--pg-text-primary, #101828); line-height: 1.2;
        }
        .pg-header-sub {
          font-size: 0.7rem; color: var(--pg-text-subtle, #98a2b3);
        }
        .pg-header-search {
          display: flex; align-items: center; gap: 8px;
          background: var(--pg-surface-2, #f9fafb);
          border: 1px solid var(--pg-border, #e4e7ec);
          border-radius: 8px; padding: 6px 12px; width: 240px;
          transition: background 0.2s, border-color 0.2s;
        }
        .pg-header-search input {
          background: transparent; border: none; outline: none;
          font-size: 0.8rem; color: var(--pg-text-secondary, #344054);
          font-family: 'Poppins', sans-serif; width: 100%;
        }
        .pg-header-search input::placeholder { color: var(--pg-text-subtle, #98a2b3); }
        .pg-header-icon-btn {
          border: none; background: transparent; cursor: pointer;
          color: var(--pg-text-muted, #667085); padding: 6px; border-radius: 6px;
          display: flex; align-items: center; position: relative; flex-shrink: 0;
        }
        .pg-header-icon-btn:hover {
          background: var(--pg-surface-2, #f4f7f9);
          color: var(--pg-text-primary, #101828);
        }
        .pg-header-icon-btn.active-toggle {
          background: var(--pg-surface-2, #f4f7f9);
          color: #3B82EC;
        }
        .pg-header-notif-dot {
          position: absolute; top: 5px; right: 5px;
          width: 7px; height: 7px; background: #d9534f;
          border-radius: 50%; border: 2px solid var(--pg-surface, #fff);
        }
        .pg-header-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: linear-gradient(135deg, #3B82EC, #1659c7);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 0.72rem; font-weight: 700; cursor: pointer;
          flex-shrink: 0;
        }
        .pg-header-user {
          display: flex; align-items: center; gap: 8px;
          padding-left: 14px;
          border-left: 1px solid var(--pg-border, #e4e7ec);
        }
        .pg-header-uname { font-size: 0.78rem; font-weight: 600; color: var(--pg-text-secondary, #344054); }
        .pg-header-urole { font-size: 0.68rem; color: var(--pg-text-subtle, #98a2b3); }
        .pg-theme-divider {
          width: 1px; height: 20px;
          background: var(--pg-border, #e4e7ec);
          flex-shrink: 0;
        }
      `}</style>

      <header className="pg-header">
        <button className="pg-header-toggle" onClick={onToggleSidebar} title="Toggle sidebar">
          <Menu size={20} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="pg-header-title">{pageLabels[activePage] ?? activePage}</div>
          <div className="pg-header-sub">{dateStr} · {timeStr}</div>
        </div>

        <div className="pg-header-search d-none d-md-flex">
          <Search size={15} color="var(--pg-text-subtle, #98a2b3)" />
          <input type="text" placeholder="Search risks, assets, threats…" />
        </div>

        <button className="pg-header-icon-btn" title="Refresh">
          <RefreshCw size={16} />
        </button>

        <button className="pg-header-icon-btn" title="Notifications">
          <Bell size={18} />
          <span className="pg-header-notif-dot" />
        </button>

        <div className="pg-theme-divider d-none d-sm-block" />

        {/* Dark sidebar toggle */}
        <button
          className={`pg-header-icon-btn d-none d-sm-flex${sidebarDark ? ' active-toggle' : ''}`}
          onClick={toggleSidebar}
          title={sidebarDark ? 'Light sidebar' : 'Dark sidebar'}
        >
          <Layers size={16} />
        </button>

        {/* App theme toggle */}
        <button
          className="pg-header-icon-btn d-none d-sm-flex"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} color="#f0ad4e" />}
        </button>

        <div className="pg-theme-divider d-none d-sm-block" />

        <div className="pg-header-user d-none d-sm-flex">
          <div className="pg-header-avatar">SA</div>
          <div>
            <div className="pg-header-uname">System Admin</div>
            <div className="pg-header-urole">Administrator</div>
          </div>
        </div>
      </header>
    </>
  );
}
