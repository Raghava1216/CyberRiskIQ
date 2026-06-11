import { Bell, Search, RefreshCw, Sun, Moon, Shield } from 'react-feather';
import { useTheme } from '../lib/ThemeContext';
import { getCurrentUser } from '../lib/platform/currentUser';

export default function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const user = getCurrentUser();

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      <style>{`
        .cr-topbar {
          font-family: 'Poppins', sans-serif;
          height: 62px;
          background: var(--pg-surface, #fff);
          border-bottom: 1px solid var(--pg-border, #e4e7ec);
          display: flex; align-items: center; gap: 12px;
          padding: 0 20px;
          position: sticky; top: 0; z-index: 1040;
          transition: background 0.2s, border-color 0.2s;
        }
        .cr-brand { display: flex; align-items: center; gap: 10px; }
        .cr-brand-icon {
          width: 34px; height: 34px; background: var(--cr-accent, #0E6E63);
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .cr-brand-title { font-size: 0.9rem; font-weight: 700; color: var(--pg-text-primary, #101828); line-height: 1.15; }
        .cr-brand-sub { font-size: 0.66rem; color: var(--pg-text-subtle, #98a2b3); }
        .cr-topbar-search {
          display: flex; align-items: center; gap: 8px;
          background: var(--pg-surface-2, #f9fafb);
          border: 1px solid var(--pg-border, #e4e7ec);
          border-radius: 8px; padding: 6px 12px; width: 260px;
        }
        .cr-topbar-search input {
          background: transparent; border: none; outline: none;
          font-size: 0.8rem; color: var(--pg-text-secondary, #344054);
          font-family: 'Poppins', sans-serif; width: 100%;
        }
        .cr-icon-btn {
          border: none; background: transparent; cursor: pointer;
          color: var(--pg-text-muted, #667085); padding: 6px; border-radius: 6px;
          display: flex; align-items: center; position: relative;
        }
        .cr-icon-btn:hover { background: var(--pg-surface-2, #f4f7f9); color: var(--pg-text-primary, #101828); }
        .cr-notif-dot {
          position: absolute; top: 5px; right: 5px; width: 7px; height: 7px;
          background: #d9534f; border-radius: 50%; border: 2px solid var(--pg-surface, #fff);
        }
        .cr-divider { width: 1px; height: 22px; background: var(--pg-border, #e4e7ec); }
        .cr-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: linear-gradient(135deg, var(--cr-accent, #0E6E63), #0a4e46);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 0.72rem; font-weight: 700;
        }
        .cr-user { display: flex; align-items: center; gap: 8px; padding-left: 14px; border-left: 1px solid var(--pg-border, #e4e7ec); }
        .cr-uname { font-size: 0.78rem; font-weight: 600; color: var(--pg-text-secondary, #344054); }
        .cr-urole { font-size: 0.68rem; color: var(--pg-text-subtle, #98a2b3); }
      `}</style>

      <header className="cr-topbar">
        <div className="cr-brand">
          <div className="cr-brand-icon">
            <Shield size={18} color="#fff" />
          </div>
          <div>
            <div className="cr-brand-title">CyberRisk IQ</div>
            <div className="cr-brand-sub">by ReGoRisC · ProGReC</div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div className="cr-topbar-search d-none d-lg-flex">
          <Search size={15} color="var(--pg-text-subtle, #98a2b3)" />
          <input type="text" placeholder="Search risks, assets, threats…" />
        </div>

        <button className="cr-icon-btn" title="Refresh">
          <RefreshCw size={16} />
        </button>

        <button className="cr-icon-btn" title="Notifications">
          <Bell size={18} />
          <span className="cr-notif-dot" />
        </button>

        <div className="cr-divider d-none d-sm-block" />

        <button
          className="cr-icon-btn d-none d-sm-flex"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} color="#f0ad4e" />}
        </button>

        <div className="cr-user d-none d-sm-flex">
          <div className="cr-avatar">{user.initials}</div>
          <div>
            <div className="cr-uname">{user.name}</div>
            <div className="cr-urole">{dateStr} · {timeStr}</div>
          </div>
        </div>
      </header>
    </>
  );
}
