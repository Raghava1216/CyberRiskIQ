import {
  Grid, AlertOctagon, Zap, Activity, Server,
  Crosshair, AlertCircle, CheckSquare, BarChart2,
  Settings, ChevronRight, Shield,
} from 'react-feather';
import type { NavPage } from '../lib/types';

interface SidebarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  collapsed: boolean;
}

const navItems: { id: NavPage; label: string; icon: React.ElementType; badge?: number }[] = [
  { id: 'dashboard',       label: 'Dashboard',           icon: Grid },
  { id: 'risks',           label: 'Risk Register',        icon: AlertOctagon, badge: 12 },
  { id: 'threats',         label: 'Threat Intelligence',  icon: Zap,          badge: 6  },
  { id: 'vulnerabilities', label: 'Vulnerabilities',      icon: Activity,     badge: 4  },
  { id: 'assets',          label: 'Asset Inventory',      icon: Server },
  { id: 'ioc',             label: 'IOC Register',         icon: Crosshair,    badge: 12 },
  { id: 'incidents',       label: 'Incidents',            icon: AlertCircle,  badge: 7  },
  { id: 'compliance',      label: 'Compliance',           icon: CheckSquare },
  { id: 'reports',         label: 'Reports',              icon: BarChart2 },
  { id: 'settings',        label: 'Settings',             icon: Settings },
  { id: 'wazuh',           label: 'Wazuh SIEM',           icon: Shield },
];

export default function Sidebar({ activePage, onNavigate, collapsed }: SidebarProps) {
  return (
    <>
      <style>{`
        .pg-sidebar { font-family:'Poppins',sans-serif; background:#fff; border-right:1px solid #e4e7ec; min-height:100vh; display:flex; flex-direction:column; transition:width 0.25s; }
        .pg-sidebar-wide { width:220px; }
        .pg-sidebar-narrow { width:60px; }
        .pg-logo-area { display:flex; align-items:center; gap:10px; padding:18px 16px; border-bottom:1px solid #e4e7ec; }
        .pg-logo-icon { width:34px; height:34px; background:#3B82EC; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .pg-logo-title { font-size:0.85rem; font-weight:700; color:#101828; line-height:1.2; }
        .pg-logo-sub { font-size:0.68rem; color:#667085; }
        .pg-nav { flex:1; padding:12px 8px; }
        .pg-nav-btn { width:100%; display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px; border:none; background:transparent; cursor:pointer; font-family:'Poppins',sans-serif; font-size:0.8rem; font-weight:500; color:#667085; transition:background 0.15s,color 0.15s; text-align:left; margin-bottom:2px; position:relative; }
        .pg-nav-btn:hover { background:#f4f7f9; color:#101828; }
        .pg-nav-btn.active { background:#EBF2FD; color:#3B82EC; font-weight:600; }
        .pg-nav-btn .pg-badge { font-size:0.65rem; padding:1px 6px; border-radius:999px; background:#fee2e2; color:#d9534f; font-weight:600; margin-left:auto; flex-shrink:0; }
        .pg-nav-btn.active .pg-badge { background:#dbeafe; color:#3B82EC; }
        .pg-sidebar-footer { padding:14px; border-top:1px solid #e4e7ec; }
        .pg-avatar { width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg,#3B82EC,#1659c7); display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.7rem; font-weight:700; flex-shrink:0; }
        .pg-dot-badge { position:absolute; top:4px; right:4px; width:7px; height:7px; background:#d9534f; border-radius:50%; border:2px solid #fff; }
      `}</style>

      <aside className={`pg-sidebar ${collapsed ? 'pg-sidebar-narrow' : 'pg-sidebar-wide'}`}>
        <div className="pg-logo-area" style={collapsed ? { justifyContent: 'center', padding: '18px 0' } : {}}>
          <div className="pg-logo-icon">
            <Shield size={16} color="#fff" />
          </div>
          {!collapsed && (
            <div>
              <div className="pg-logo-title">CyberRisk IQ</div>
              <div className="pg-logo-sub">by ReGoRisC · ProGReC</div>
            </div>
          )}
        </div>

        <nav className="pg-nav">
          {navItems.map(item => {
            const Icon   = item.icon;
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`pg-nav-btn${active ? ' active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={16} style={{ flexShrink: 0, color: active ? '#3B82EC' : '#667085' }} />
                {!collapsed && (
                  <>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                    {item.badge !== undefined && <span className="pg-badge">{item.badge}</span>}
                    {active && <ChevronRight size={13} color="#3B82EC" />}
                  </>
                )}
                {collapsed && item.badge !== undefined && <span className="pg-dot-badge" />}
              </button>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="pg-sidebar-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="pg-avatar">AC</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#344054', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Admin Console</div>
                <div style={{ fontSize: '0.7rem', color: '#667085', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Acme Financial Corp</div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
