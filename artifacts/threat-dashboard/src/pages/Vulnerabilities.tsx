import { useState } from 'react';
import { Plus, Search, AlertTriangle, Zap, CheckCircle, BookOpen } from 'react-feather';
import { Card, Form, InputGroup, Table } from 'react-bootstrap';
import { mockVulnerabilities } from '../lib/mockData';
import SeverityBadge from '../components/SeverityBadge';
import ImportScanModal, { type ParsedVuln } from '../components/ImportScanModal';
import BrowseCVEModal, { type CVEEntry } from '../components/BrowseCVEModal';

const SEVERITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];
const STATUSES   = ['All', 'Open', 'In Progress', 'Remediated', 'Accepted', 'False Positive'];

type VulnRow = (typeof mockVulnerabilities)[number] | ParsedVuln;

function CVSSBar({ score }: { score: number }) {
  const color = score >= 9 ? '#d9534f' : score >= 7 ? '#fd7e14' : score >= 4 ? '#f0ad4e' : '#4BBF73';
  return (
    <div className="d-flex align-items-center gap-2">
      <div style={{ width: 72, height: 6, background: '#f0f0f0', borderRadius: 999, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ height: '100%', borderRadius: 999, background: color, width: `${(score / 10) * 100}%` }} />
      </div>
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', minWidth: 28 }}>{score.toFixed(1)}</span>
    </div>
  );
}

export default function Vulnerabilities() {
  const [vulns,      setVulns]      = useState<VulnRow[]>(mockVulnerabilities);
  const [search,     setSearch]     = useState('');
  const [severity,   setSeverity]   = useState('All');
  const [status,     setStatus]     = useState('All');
  const [importOpen, setImportOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 5000);
  };

  const existingCVEIds = new Set(vulns.map(v => v.cve_id));

  const handleScanImport = (newVulns: ParsedVuln[]) => {
    const newOnes = newVulns.filter(v => !existingCVEIds.has(v.cve_id));
    setVulns(prev => [...newOnes, ...prev]);
    showToast(
      newOnes.length > 0
        ? `${newOnes.length} vulnerabilities imported (${newVulns.length - newOnes.length} duplicates skipped)`
        : `All ${newVulns.length} vulnerabilities already exist`
    );
  };

  const handleCVEImport = (cves: CVEEntry[]) => {
    const newOnes = cves.filter(c => !existingCVEIds.has(c.cve_id));
    if (newOnes.length === 0) { showToast('All selected CVEs already exist', false); return; }
    const converted: ParsedVuln[] = newOnes.map(c => ({
      id: `cve-lib-${c.cve_id}-${Date.now()}`, cve_id: c.cve_id, title: c.title,
      cvss_score: c.cvss_score, severity: c.severity as ParsedVuln['severity'],
      status: 'Open', asset: c.asset, patch_available: c.patch_available,
      exploit_available: c.exploit_available, published_date: c.published_date,
      due_date: c.due_date, assigned_to: 'Unassigned',
    }));
    setVulns(prev => [...converted, ...prev]);
    showToast(`${newOnes.length} CVE${newOnes.length !== 1 ? 's' : ''} added to the register`);
  };

  const filtered = vulns.filter(v =>
    (v.title.toLowerCase().includes(search.toLowerCase()) ||
     v.cve_id.toLowerCase().includes(search.toLowerCase()) ||
     v.asset.toLowerCase().includes(search.toLowerCase())) &&
    (severity === 'All' || v.severity === severity) &&
    (status   === 'All' || v.status   === status)
  );

  const stats = {
    critical:    vulns.filter(v => v.severity === 'Critical').length,
    high:        vulns.filter(v => v.severity === 'High').length,
    withExploit: vulns.filter(v => v.exploit_available).length,
    withPatch:   vulns.filter(v => v.patch_available).length,
  };

  return (
    <div className="progrec-page p-4 p-lg-5">
      {importOpen && <ImportScanModal onClose={() => setImportOpen(false)} onImport={handleScanImport} />}
      {browseOpen && <BrowseCVEModal onClose={() => setBrowseOpen(false)} onImport={handleCVEImport} existingCVEIds={existingCVEIds} />}

      {toast && (
        <div className={`pg-toast ${toast.ok ? '' : 'pg-toast-warning'}`}>
          {toast.ok ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: '#101828' }}>Vulnerability Management</h5>
          <span style={{ fontSize: '0.82rem', color: '#667085' }}>{vulns.length} vulnerabilities tracked</span>
        </div>
        <div className="d-flex gap-2">
          <button onClick={() => setBrowseOpen(true)} className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2">
            <BookOpen size={14} /> Browse CVE Library
          </button>
          <button onClick={() => setImportOpen(true)} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2">
            <Plus size={14} /> Import Scan
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Critical CVEs',     value: stats.critical,    accent: '#d9534f', cls: 'stat-card-danger'  },
          { label: 'High CVEs',         value: stats.high,        accent: '#fd7e14', cls: 'stat-card-warning' },
          { label: 'Exploit Available', value: stats.withExploit, accent: '#d9534f', cls: 'stat-card-danger'  },
          { label: 'Patch Available',   value: stats.withPatch,   accent: '#4BBF73', cls: 'stat-card-success' },
        ].map(s => (
          <div key={s.label} className="col-6 col-md-3">
            <Card className={`border shadow-sm h-100 ${s.cls}`} style={{ borderRadius: 10 }}>
              <Card.Body className="p-3">
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.accent, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                <div style={{ fontSize: '0.78rem', color: '#667085' }}>{s.label}</div>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <InputGroup style={{ maxWidth: 320, flex: '1 1 200px' }}>
          <InputGroup.Text className="bg-white border-end-0"><Search size={14} color="#98a2b3" /></InputGroup.Text>
          <Form.Control value={search} onChange={e => setSearch(e.target.value)} placeholder="Search CVE ID, title, asset…" style={{ fontSize: '0.82rem', borderLeft: 0 }} />
        </InputGroup>
        <Form.Select value={severity} onChange={e => setSeverity(e.target.value)} style={{ maxWidth: 130, fontSize: '0.82rem' }}>
          {SEVERITIES.map(s => <option key={s}>{s}</option>)}
        </Form.Select>
        <Form.Select value={status} onChange={e => setStatus(e.target.value)} style={{ maxWidth: 160, fontSize: '0.82rem' }}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </Form.Select>
      </div>

      {/* Table */}
      <Card className="shadow-sm border-0" style={{ borderRadius: 10, overflow: 'hidden' }}>
        <div className="table-responsive">
          <Table hover className="mb-0" style={{ fontSize: '0.82rem' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                {['CVE / Title', 'CVSS', 'Severity', 'Status', 'Asset', 'Flags', 'Due Date', 'Assignee'].map(h => (
                  <th key={h} className="px-4 py-3 border-bottom fw-semibold" style={{ fontSize: '0.72rem', color: '#98a2b3', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(vuln => (
                <tr key={vuln.id}>
                  <td className="px-4 py-3" style={{ minWidth: 200 }}>
                    <div style={{ color: '#344054', fontWeight: 500 }}>{vuln.title}</div>
                    <div style={{ color: '#98a2b3', fontSize: '0.72rem', fontFamily: 'monospace' }}>{vuln.cve_id}</div>
                  </td>
                  <td className="px-4 py-3" style={{ minWidth: 110 }}><CVSSBar score={vuln.cvss_score} /></td>
                  <td className="px-4 py-3"><SeverityBadge level={vuln.severity} /></td>
                  <td className="px-4 py-3"><SeverityBadge level={vuln.status} /></td>
                  <td className="px-4 py-3"><span style={{ color: '#667085', fontSize: '0.78rem', fontFamily: 'monospace' }}>{vuln.asset}</span></td>
                  <td className="px-4 py-3">
                    <div className="d-flex gap-1 flex-wrap">
                      {vuln.exploit_available && (
                        <span className="d-inline-flex align-items-center gap-1" style={{ fontSize: '0.7rem', background: '#fff5f5', color: '#d9534f', border: '1px solid #fecaca', borderRadius: 4, padding: '1px 6px' }}>
                          <Zap size={9} /> Exploit
                        </span>
                      )}
                      {vuln.patch_available && (
                        <span className="d-inline-flex align-items-center gap-1" style={{ fontSize: '0.7rem', background: '#f0fdf4', color: '#4BBF73', border: '1px solid #bbf7d0', borderRadius: 4, padding: '1px 6px' }}>
                          <CheckCircle size={9} /> Patch
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', color: new Date(vuln.due_date) < new Date() && vuln.status !== 'Remediated' ? '#d9534f' : '#98a2b3', fontWeight: new Date(vuln.due_date) < new Date() && vuln.status !== 'Remediated' ? 600 : 400 }}>
                      {vuln.due_date}
                    </span>
                  </td>
                  <td className="px-4 py-3"><span style={{ color: '#667085', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{vuln.assigned_to}</span></td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        {filtered.length === 0 && <div className="py-5 text-center" style={{ color: '#98a2b3' }}>No vulnerabilities match the current filters.</div>}
      </Card>
    </div>
  );
}
