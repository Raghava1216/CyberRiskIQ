import { Menu, Bell, Search, RefreshCw } from 'lucide-react';
import type { NavPage } from '../lib/types';

const pageLabels: Record<NavPage, string> = {
  dashboard: 'Security Dashboard',
  risks: 'Risk Register',
  threats: 'Threat Intelligence',
  vulnerabilities: 'Vulnerability Management',
  assets: 'Asset Inventory',
  incidents: 'Incident Response',
  compliance: 'Compliance Management',
  reports: 'Reports & Analytics',
  settings: 'Platform Settings',
};

interface HeaderProps {
  activePage: NavPage;
  onToggleSidebar: () => void;
}

export default function Header({ activePage, onToggleSidebar }: HeaderProps) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 lg:px-6 py-3.5 flex items-center gap-4">
      <button
        onClick={onToggleSidebar}
        className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-slate-100 font-semibold text-base truncate">{pageLabels[activePage]}</h1>
        <p className="text-slate-500 text-xs">{dateStr} · {timeStr} UTC</p>
      </div>

      <div className="hidden md:flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 w-64">
        <Search size={16} className="text-slate-500 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search risks, assets, threats..."
          className="bg-transparent text-slate-300 text-sm outline-none w-full placeholder:text-slate-600"
        />
      </div>

      <button className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
        <RefreshCw size={16} />
      </button>

      <button className="relative text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
        <Bell size={20} />
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900" />
      </button>

      <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-800">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
          AC
        </div>
      </div>
    </header>
  );
}
