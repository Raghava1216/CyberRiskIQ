import {
  LayoutDashboard,
  ShieldAlert,
  Zap,
  Bug,
  Server,
  Crosshair,
  AlertCircle,
  CheckSquare,
  BarChart2,
  Settings,
  ChevronRight,
  Shield,
} from 'lucide-react';
import type { NavPage } from '../lib/types';

interface SidebarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  collapsed: boolean;
}

const navItems: { id: NavPage; label: string; icon: React.ElementType; badge?: number }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'risks', label: 'Risk Register', icon: ShieldAlert, badge: 12 },
  { id: 'threats', label: 'Threat Intelligence', icon: Zap, badge: 6 },
  { id: 'vulnerabilities', label: 'Vulnerabilities', icon: Bug, badge: 4 },
  { id: 'assets', label: 'Asset Inventory', icon: Server },
  { id: 'ioc', label: 'IOC Register', icon: Crosshair, badge: 12 },
  { id: 'incidents', label: 'Incidents', icon: AlertCircle, badge: 7 },
  { id: 'compliance', label: 'Compliance', icon: CheckSquare },
  { id: 'reports', label: 'Reports', icon: BarChart2 },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'wazuh', label: 'Wazuh SIEM', icon:  Shield},
];

export default function Sidebar({ activePage, onNavigate, collapsed }: SidebarProps) {
  return (
    <aside
      className={`flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      } min-h-screen`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-800 ${collapsed ? 'justify-center' : ''}`}>
        <div className="flex-shrink-0 w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
          <Shield size={18} className="text-slate-900" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm leading-tight">CyberRisk IQ</p>
            <p className="text-slate-500 text-xs">by Regorisk · ProGReC</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                active
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              <Icon size={18} className={`flex-shrink-0 ${active ? 'text-cyan-400' : ''}`} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                      active ? 'bg-cyan-500/20 text-cyan-300' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {active && <ChevronRight size={14} className="text-cyan-400 flex-shrink-0" />}
                </>
              )}
              {collapsed && item.badge !== undefined && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              AC
            </div>
            <div className="min-w-0">
              <p className="text-slate-300 text-xs font-medium truncate">Admin Console</p>
              <p className="text-slate-500 text-xs truncate">Acme Financial Corp</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
