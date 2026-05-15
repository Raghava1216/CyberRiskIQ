import { Shield, Bell, Database, Users, Key, Globe, Save } from 'lucide-react';

const sections = [
  {
    id: 'org',
    icon: Globe,
    title: 'Organization Profile',
    fields: [
      { label: 'Organization Name', value: 'Acme Financial Corp', type: 'text' },
      { label: 'Industry', value: 'Financial Services', type: 'select', opts: ['Financial Services', 'Healthcare', 'Technology', 'Manufacturing', 'Energy', 'Government'] },
      { label: 'Organization Size', value: 'Enterprise', type: 'select', opts: ['SMB', 'Mid-Market', 'Enterprise', 'Global Enterprise'] },
      { label: 'Risk Appetite', value: 'Low', type: 'select', opts: ['Very Low', 'Low', 'Moderate', 'High', 'Very High'] },
    ],
  },
  {
    id: 'risk',
    icon: Shield,
    title: 'Risk Configuration',
    fields: [
      { label: 'Risk Score Methodology', value: 'FAIR', type: 'select', opts: ['FAIR', 'NIST', 'ISO 31000', 'Custom'] },
      { label: 'Risk Acceptance Threshold', value: '6', type: 'number' },
      { label: 'Review Frequency (days)', value: '90', type: 'number' },
      { label: 'Auto-escalation Threshold', value: '15', type: 'number' },
    ],
  },
  {
    id: 'notif',
    icon: Bell,
    title: 'Notification Settings',
    toggles: [
      { label: 'Critical Risk Alerts', description: 'Instant notification for critical risk events', value: true },
      { label: 'New Threat Intelligence', description: 'Alert on new threat feeds and IOCs', value: true },
      { label: 'Incident Declarations', description: 'Notify on new P1/P2 incident creation', value: true },
      { label: 'Compliance Deadlines', description: 'Remind 30 days before assessment due dates', value: false },
      { label: 'Weekly Risk Digest', description: 'Weekly summary email to stakeholders', value: true },
    ],
  },
  {
    id: 'integrations',
    icon: Database,
    title: 'Integrations',
    integrations: [
      { name: 'Splunk SIEM', status: 'Connected', color: 'text-emerald-400 bg-emerald-500/10' },
      { name: 'CrowdStrike EDR', status: 'Connected', color: 'text-emerald-400 bg-emerald-500/10' },
      { name: 'Tenable.io', status: 'Connected', color: 'text-emerald-400 bg-emerald-500/10' },
      { name: 'ServiceNow ITSM', status: 'Configured', color: 'text-amber-400 bg-amber-500/10' },
      { name: 'Microsoft Sentinel', status: 'Not Configured', color: 'text-slate-400 bg-slate-500/10' },
      { name: 'AWS Security Hub', status: 'Not Configured', color: 'text-slate-400 bg-slate-500/10' },
    ],
  },
];

export default function Settings() {
  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-3xl">
      <div>
        <h2 className="text-slate-100 font-bold text-xl">Platform Settings</h2>
        <p className="text-slate-500 text-sm">Configure CyberRisk IQ for your organization</p>
      </div>

      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <div key={section.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700/50">
              <Icon size={18} className="text-cyan-400" />
              <h3 className="text-slate-100 font-semibold">{section.title}</h3>
            </div>
            <div className="p-5">
              {section.fields && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {section.fields.map((f) => (
                    <div key={f.label}>
                      <label className="block text-slate-400 text-xs font-medium mb-1.5">{f.label}</label>
                      {f.type === 'select' ? (
                        <select defaultValue={f.value} className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-cyan-500 cursor-pointer">
                          {f.opts?.map((o) => <option key={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input type={f.type} defaultValue={f.value} className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-cyan-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {section.toggles && (
                <div className="space-y-4">
                  {section.toggles.map((t) => (
                    <div key={t.label} className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-slate-300 text-sm font-medium">{t.label}</p>
                        <p className="text-slate-500 text-xs">{t.description}</p>
                      </div>
                      <button className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${t.value ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${t.value ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {section.integrations && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {section.integrations.map((intg) => (
                    <div key={intg.name} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                      <div className="flex items-center gap-2">
                        <Database size={16} className="text-slate-500" />
                        <span className="text-slate-300 text-sm">{intg.name}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${intg.color}`}>{intg.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* API Keys */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700/50">
          <Key size={18} className="text-cyan-400" />
          <h3 className="text-slate-100 font-semibold">API Keys</h3>
        </div>
        <div className="p-5 space-y-3">
          {[
            { label: 'CyberRisk IQ API Key', key: 'criq_live_sk_••••••••••••••••4a2f', date: 'Created May 1, 2026' },
            { label: 'Threat Feed API Token', key: 'tf_••••••••••••••••9c1d', date: 'Created Apr 15, 2026' },
          ].map((k) => (
            <div key={k.label} className="flex items-center justify-between gap-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
              <div>
                <p className="text-slate-300 text-sm font-medium">{k.label}</p>
                <p className="text-slate-500 text-xs font-mono mt-0.5">{k.key}</p>
                <p className="text-slate-600 text-xs">{k.date}</p>
              </div>
              <button className="text-xs text-red-400 hover:text-red-300 transition-colors flex-shrink-0">Revoke</button>
            </div>
          ))}
          <button className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors">+ Generate new key</button>
        </div>
      </div>

      {/* Users */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <Users size={18} className="text-cyan-400" />
            <h3 className="text-slate-100 font-semibold">Team Members</h3>
          </div>
          <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">Invite User</button>
        </div>
        <div className="divide-y divide-slate-700/30">
          {[
            { name: 'Alice Chen', email: 'alice@acmefinancial.com', role: 'CISO', avatar: 'AC' },
            { name: 'Bob Martinez', email: 'bob@acmefinancial.com', role: 'Risk Analyst', avatar: 'BM' },
            { name: 'Carol Smith', email: 'carol@acmefinancial.com', role: 'SecOps Lead', avatar: 'CS' },
            { name: 'David Lee', email: 'david@acmefinancial.com', role: 'Compliance', avatar: 'DL' },
          ].map((u) => (
            <div key={u.email} className="flex items-center gap-3 px-5 py-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {u.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-300 text-sm font-medium">{u.name}</p>
                <p className="text-slate-600 text-xs">{u.email}</p>
              </div>
              <span className="text-xs bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded">{u.role}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm transition-colors">
          <Save size={16} /> Save Settings
        </button>
      </div>
    </div>
  );
}
