import React, { useState, useEffect } from "react";
import { Card, Form, InputGroup, Table, Badge } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMagnifyingGlass,
  faTriangleExclamation,
  faBolt,
  faCircleCheck,
  faBookOpen,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import axios from "src/utils/AxiosInstance";
import ImportScanForm from "src/modules/cyberrisk/forms/ImportScanForm";
import BrowseCVEForm from "src/modules/cyberrisk/forms/BrowseCVEForm";

// ===================== MOCK FALLBACK (remove once backend is live) =====================
// Copied from the original threat-dashboard mock data so the page renders before the
// real `/cyberrisk/vulnerabilities` endpoint exists. Delete this block (and the fallback
// initial-state assignment below) once the endpoint returns data.
const MOCK_VULNERABILITIES = [
  { id: "1", cve_id: "CVE-2026-1234", title: "Remote Code Execution in Apache Struts", cvss_score: 9.8, severity: "Critical", status: "Open", asset: "web-app-01", patch_available: true, exploit_available: true, published_date: "2026-04-28", due_date: "2026-05-15", assigned_to: "SecOps Team" },
  { id: "2", cve_id: "CVE-2025-9876", title: "Authentication Bypass in OpenSSL", cvss_score: 9.1, severity: "Critical", status: "In Progress", asset: "db-server-03", patch_available: true, exploit_available: true, published_date: "2026-03-15", due_date: "2026-05-20", assigned_to: "Alice Chen" },
  { id: "3", cve_id: "CVE-2026-5555", title: "Privilege Escalation in Linux Kernel", cvss_score: 7.8, severity: "High", status: "Open", asset: "app-server-07", patch_available: true, exploit_available: false, published_date: "2026-05-01", due_date: "2026-06-01", assigned_to: "Bob Martinez" },
  { id: "4", cve_id: "CVE-2025-4321", title: "XXE Injection in XML Parser Library", cvss_score: 7.5, severity: "High", status: "Remediated", asset: "api-gw-02", patch_available: true, exploit_available: false, published_date: "2026-02-20", due_date: "2026-04-30", assigned_to: "Carol Smith" },
  { id: "5", cve_id: "CVE-2026-8888", title: "SSRF Vulnerability in REST Framework", cvss_score: 6.5, severity: "Medium", status: "Open", asset: "microservice-09", patch_available: false, exploit_available: false, published_date: "2026-05-05", due_date: "2026-06-15", assigned_to: "David Lee" },
  { id: "6", cve_id: "CVE-2026-2222", title: "Reflected XSS in Customer Portal", cvss_score: 5.4, severity: "Medium", status: "In Progress", asset: "customer-portal", patch_available: true, exploit_available: false, published_date: "2026-04-10", due_date: "2026-05-30", assigned_to: "Eva Wilson" },
];
// ======================================================================================

const SEVERITIES = ["All", "Critical", "High", "Medium", "Low"];
const STATUSES = ["All", "Open", "In Progress", "Remediated", "Accepted", "False Positive"];

const sevVariant = (s) => ({ Critical: "danger", High: "warning", Medium: "info", Low: "success", Open: "danger", "In Progress": "warning", Remediated: "success", Accepted: "secondary", "False Positive": "secondary" }[s] || "secondary");

function CVSSBar({ score }) {
  const color = score >= 9 ? "#d9534f" : score >= 7 ? "#fd7e14" : score >= 4 ? "#f0ad4e" : "#4BBF73";
  return (
    <div className="d-flex align-items-center gap-2">
      <div style={{ width: 72, height: 6, background: "#f0f0f0", borderRadius: 999, overflow: "hidden", flexShrink: 0 }}>
        <div style={{ height: "100%", borderRadius: 999, background: color, width: `${(score / 10) * 100}%` }} />
      </div>
      <span style={{ fontSize: "0.78rem", fontWeight: 700, color, fontVariantNumeric: "tabular-nums", minWidth: 28 }}>{score.toFixed(1)}</span>
    </div>
  );
}

const Vulnerabilities = ({ year, currentUserInfo, refreshCharts, onNavigate }) => {
  const { t } = useTranslation("common");

  // Hybrid data — mock fallback as initial state, axios overrides on success.
  const [vulns, setVulns] = useState(MOCK_VULNERABILITIES);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("All");
  const [status, setStatus] = useState("All");
  const [importOpen, setImportOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 5000); };

  useEffect(() => {
    const logInId = currentUserInfo?.logInId;
    // HYBRID: real backend call — replaces the mock fallback above on success.
    axios
      .get(`/cyberrisk/vulnerabilities/${logInId}?year=${Number(year)}`)
      .then((res) => {
        const d = res?.data;
        const list = Array.isArray(d) ? d : d?.vulnerabilities;
        if (Array.isArray(list) && list.length) setVulns(list);
      })
      .catch((err) => {
        console.warn("[cyberrisk] vulnerabilities: using mock fallback", err);
      });
  }, [year, currentUserInfo, refreshCharts]);

  const existingCVEIds = new Set(vulns.map((v) => v.cve_id));

  const handleScanImport = (newVulns) => {
    const list = Array.isArray(newVulns) ? newVulns : [];
    const newOnes = list.filter((v) => !existingCVEIds.has(v.cve_id));
    setVulns((prev) => [...newOnes, ...prev]);
    showToast(
      newOnes.length > 0
        ? `${newOnes.length} ${t("vulnerabilities imported")} (${list.length - newOnes.length} ${t("duplicates skipped")})`
        : `${t("All")} ${list.length} ${t("vulnerabilities already exist")}`
    );
  };

  const handleCVEImport = (cves) => {
    const list = Array.isArray(cves) ? cves : [];
    const newOnes = list.filter((c) => !existingCVEIds.has(c.cve_id));
    if (newOnes.length === 0) { showToast(t("All selected CVEs already exist"), false); return; }
    const converted = newOnes.map((c) => ({
      id: `cve-lib-${c.cve_id}-${Date.now()}`,
      cve_id: c.cve_id,
      title: c.title,
      cvss_score: c.cvss_score,
      severity: c.severity,
      status: "Open",
      asset: c.asset,
      patch_available: c.patch_available,
      exploit_available: c.exploit_available,
      published_date: c.published_date,
      due_date: c.due_date,
      assigned_to: "Unassigned",
    }));
    setVulns((prev) => [...converted, ...prev]);
    showToast(`${newOnes.length} ${newOnes.length !== 1 ? t("CVEs") : t("CVE")} ${t("added to the register")}`);
  };

  const filtered = vulns.filter((v) =>
    (v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.cve_id.toLowerCase().includes(search.toLowerCase()) ||
      v.asset.toLowerCase().includes(search.toLowerCase())) &&
    (severity === "All" || v.severity === severity) &&
    (status === "All" || v.status === status)
  );

  const stats = {
    critical: vulns.filter((v) => v.severity === "Critical").length,
    high: vulns.filter((v) => v.severity === "High").length,
    withExploit: vulns.filter((v) => v.exploit_available).length,
    withPatch: vulns.filter((v) => v.patch_available).length,
  };

  const statCards = [
    { label: t("Critical CVEs"), value: stats.critical, accent: "#d9534f", cls: "stat-card-danger" },
    { label: t("High CVEs"), value: stats.high, accent: "#fd7e14", cls: "stat-card-warning" },
    { label: t("Exploit Available"), value: stats.withExploit, accent: "#d9534f", cls: "stat-card-danger" },
    { label: t("Patch Available"), value: stats.withPatch, accent: "#4BBF73", cls: "stat-card-success" },
  ];

  return (
    <div className="progrec-page p-4 p-lg-5">
      <ImportScanForm show={importOpen} onHide={() => setImportOpen(false)} onSaved={handleScanImport} />
      <BrowseCVEForm show={browseOpen} onHide={() => setBrowseOpen(false)} onSaved={handleCVEImport} existingCVEIds={existingCVEIds} />

      {toast && (
        <div className={`pg-toast ${toast.ok ? "" : "pg-toast-warning"}`}>
          <FontAwesomeIcon icon={toast.ok ? faCircleCheck : faTriangleExclamation} />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: "#101828" }}>{t("Vulnerability Management")}</h5>
          <span style={{ fontSize: "0.82rem", color: "#667085" }}>{vulns.length} {t("vulnerabilities tracked")}</span>
        </div>
        <div className="d-flex gap-2">
          <button onClick={() => setBrowseOpen(true)} className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2">
            <FontAwesomeIcon icon={faBookOpen} /> {t("Browse CVE Library")}
          </button>
          <button onClick={() => setImportOpen(true)} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2">
            <FontAwesomeIcon icon={faPlus} /> {t("Import Scan")}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="row g-3 mb-4">
        {statCards.map((s) => (
          <div key={s.label} className="col-6 col-md-3">
            <Card className={`border shadow-sm h-100 ${s.cls}`} style={{ borderRadius: 10 }}>
              <Card.Body className="p-3">
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: s.accent, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                <div style={{ fontSize: "0.78rem", color: "#667085" }}>{s.label}</div>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <InputGroup style={{ maxWidth: 320, flex: "1 1 200px" }}>
          <InputGroup.Text className="bg-white border-end-0"><FontAwesomeIcon icon={faMagnifyingGlass} style={{ color: "#98a2b3" }} /></InputGroup.Text>
          <Form.Control value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Search CVE ID, title, asset…")} style={{ fontSize: "0.82rem", borderLeft: 0 }} />
        </InputGroup>
        <Form.Select value={severity} onChange={(e) => setSeverity(e.target.value)} style={{ maxWidth: 130, fontSize: "0.82rem" }}>
          {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
        </Form.Select>
        <Form.Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 160, fontSize: "0.82rem" }}>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </Form.Select>
      </div>

      {/* Table */}
      <Card className="shadow-sm border-0" style={{ borderRadius: 10, overflow: "hidden" }}>
        <div className="table-responsive">
          <Table hover className="mb-0" style={{ fontSize: "0.82rem" }}>
            <thead style={{ background: "#f9fafb" }}>
              <tr>
                {[t("CVE / Title"), t("CVSS"), t("Severity"), t("Status"), t("Asset"), t("Flags"), t("Due Date"), t("Assignee")].map((h) => (
                  <th key={h} className="px-4 py-3 border-bottom fw-semibold" style={{ fontSize: "0.72rem", color: "#98a2b3", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((vuln) => (
                <tr key={vuln.id}>
                  <td className="px-4 py-3" style={{ minWidth: 200 }}>
                    <div style={{ color: "#344054", fontWeight: 500 }}>{vuln.title}</div>
                    <div style={{ color: "#98a2b3", fontSize: "0.72rem", fontFamily: "monospace" }}>{vuln.cve_id}</div>
                  </td>
                  <td className="px-4 py-3" style={{ minWidth: 110 }}><CVSSBar score={vuln.cvss_score} /></td>
                  <td className="px-4 py-3"><Badge bg={sevVariant(vuln.severity)}>{vuln.severity}</Badge></td>
                  <td className="px-4 py-3"><Badge bg={sevVariant(vuln.status)}>{vuln.status}</Badge></td>
                  <td className="px-4 py-3"><span style={{ color: "#667085", fontSize: "0.78rem", fontFamily: "monospace" }}>{vuln.asset}</span></td>
                  <td className="px-4 py-3">
                    <div className="d-flex gap-1 flex-wrap">
                      {vuln.exploit_available && (
                        <span className="d-inline-flex align-items-center gap-1" style={{ fontSize: "0.7rem", background: "#fff5f5", color: "#d9534f", border: "1px solid #fecaca", borderRadius: 4, padding: "1px 6px" }}>
                          <FontAwesomeIcon icon={faBolt} style={{ fontSize: 9 }} /> {t("Exploit")}
                        </span>
                      )}
                      {vuln.patch_available && (
                        <span className="d-inline-flex align-items-center gap-1" style={{ fontSize: "0.7rem", background: "#f0fdf4", color: "#4BBF73", border: "1px solid #bbf7d0", borderRadius: 4, padding: "1px 6px" }}>
                          <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 9 }} /> {t("Patch")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ fontSize: "0.78rem", whiteSpace: "nowrap", color: new Date(vuln.due_date) < new Date() && vuln.status !== "Remediated" ? "#d9534f" : "#98a2b3", fontWeight: new Date(vuln.due_date) < new Date() && vuln.status !== "Remediated" ? 600 : 400 }}>
                      {vuln.due_date}
                    </span>
                  </td>
                  <td className="px-4 py-3"><span style={{ color: "#667085", fontSize: "0.78rem", whiteSpace: "nowrap" }}>{vuln.assigned_to}</span></td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        {filtered.length === 0 && <div className="py-5 text-center" style={{ color: "#98a2b3" }}>{t("No vulnerabilities match the current filters.")}</div>}
      </Card>
    </div>
  );
};

export default Vulnerabilities;
