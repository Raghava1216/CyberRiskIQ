import { useState } from 'react';
import { Plus, Search, ChevronDown, Clock, User, CheckCircle2, AlertTriangle } from 'lucide-react';
import { mockIncidents } from '../lib/mockData';
import SeverityBadge from '../components/SeverityBadge';
import DeclareIncidentModal from '../components/DeclareIncidentModal';
import type { Incident } from '../lib/types';

const TYPES = ['All', 'Security Breach', 'Data Leak', 'Ransomware', 'DDoS', 'Phishing', 'Insider Threat', 'Malware', 'Unauthorized Access', 'System Outage', 'Supply Chain Attack', 'Social Engineering', 'Physical Security'];
const STATUSES = ['All', 'Open', 'Investigating', 'Contained', 'Resolved', 'Closed'];
const PRIORITIES = ['All', 'P1', 'P2', 'P3', 'P4'];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function duration(start: string, end?: string) {
  const ms = (end ? new Date(end) : new Date()).getTime() - new Date(start).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents as Incident[]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; id: string } | null>(null);

  const showToast = (msg: string, id: string) => {
    setToast({ msg, id });
    setTimeout(() => setToast(null), 5000);
  };

  const handleDeclare = (incident: Incident) => {
    setIncidents((prev) => [incident, ...prev]);
    setModalOpen(false);
    showToast(`Incident "${incident.title}" declared as ${incident.id}`, incident.id);
  };

  const filtered = incidents.filter((i) => {
    const matchSearch = i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.assigned_to.toLowerCase().includes(search.toLowerCase()) ||
      i.reported_by.toLowerCase().includes(search.toLowerCase());
    const matchType = type === 'All' || i.type === type;
    const matchStatus = status === 'All' || i.status === status;
    const matchPriority = priority === 'All' || i.priority === priority;
    return matchSearch && matchType && matchStatus && matchPriority;
  });

  const stats = {
    open:      incidents.filter((i) => i.status === 'Open' || i.status === 'Investigating').length,
    p1:        incidents.filter((i) => i.priority === 'P1').length,
    contained: incidents.filter((i) => i.status === 'Contained').length,
    resolved:  incidents.filter((i) => i.status === 'Resolved' || i.status === 'Closed').length,
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-screen-2xl relative">
      {modalOpen && (
        <DeclareIncidentModal
          onClose={() => setModalOpen(false)}
          onSubmit={handleDeclare}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 bg-slate-900 border border-red-500/30 text-slate-300 text-sm px-4 py-3 rounded-xl shadow-xl backdrop-blur max-w-sm">
          <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-300">Incident Declared</p>
            <p className="text-slate-400 text-xs mt-0.5">{toast.msg}</p>
            <p className="text-slate-600 text-xs mt-0.5">ID: {toast.id}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-600 hover:text-slate-400 ml-auto flex-shrink-0">
            <CheckCircle2 size={14} />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-slate-100 font-bold text-xl">Incident Response</h2>
          <p className="text-slate-500 text-sm">{incidents.length} incidents tracked</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white font-semibold text-sm transition-colors w-fit"
        >
          <Plus size={16} /> Declare Incident
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Incidents', value: stats.open,      color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
          { label: 'P1 Critical',      value: stats.p1,        color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
          { label: 'Contained',        value: stats.contained, color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Resolved',         value: stats.resolved,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 flex-1">
          <Search size={16} className="text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search incidents, assignees, reporters..."
            className="bg-transparent text-slate-300 text-sm outline-none flex-1 placeholder:text-slate-600"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { val: type,     set: setType,     opts: TYPES },
            { val: status,   set: setStatus,   opts: STATUSES },
            { val: priority, set: setPriority, opts: PRIORITIES },
          ].map((f, i) => (
            <div key={i} className="relative">
              <select
                value={f.val}
                onChange={(e) => f.set(e.target.value)}
                className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 pr-8 outline-none focus:border-cyan-500 cursor-pointer"
              >
                {f.opts.map((o) => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-3 text-slate-500 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((inc) => {
          const isNew = inc.id.startsWith('INC-') && inc.id.length > 6;
          return (
            <div
              key={inc.id}
              className={`bg-slate-800/50 border rounded-xl p-5 hover:border-slate-600 transition-colors ${
                inc.priority === 'P1' && (inc.status === 'Open' || inc.status === 'Investigating')
                  ? 'border-red-500/30'
                  : isNew
                    ? 'border-cyan-500/30'
                    : 'border-slate-700/50'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`mt-0.5 px-2 py-1 rounded text-xs font-bold font-mono flex-shrink-0 ${
                    inc.priority === 'P1' ? 'bg-red-500/20 text-red-400' :
                    inc.priority === 'P2' ? 'bg-orange-500/20 text-orange-400' :
                    inc.priority === 'P3' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>{inc.priority}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-slate-100 font-semibold text-sm">{inc.title}</h3>
                      {isNew && (
                        <span className="text-xs bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 px-1.5 py-px rounded font-medium">
                          New
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <SeverityBadge level={inc.severity} />
                      <SeverityBadge level={inc.status} />
                      <span className="text-xs bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded">{inc.type}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> Detected {timeAgo(inc.detected_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={12} /> {inc.assigned_to}
                      </span>
                      <span className="text-slate-600">
                        via {inc.reported_by}
                      </span>
                      {inc.resolved_at ? (
                        <span className="text-emerald-500">Resolved in {duration(inc.detected_at, inc.resolved_at)}</span>
                      ) : (
                        <span className="text-amber-500">Open for {duration(inc.detected_at)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-slate-600 text-xs font-mono">{inc.id}</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {inc.tags.map((t) => (
                      <span key={t} className="text-xs bg-slate-700/50 text-slate-500 px-1.5 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700/50">
            No incidents match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
