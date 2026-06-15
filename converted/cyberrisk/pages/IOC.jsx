import React, { useState, useEffect } from "react";
import { Card, Row, Col, Form, InputGroup, Table, Badge, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMagnifyingGlass,
  faDownload,
  faUpload,
  faGlobe,
  faHashtag,
  faLink,
  faEnvelope,
  faFile,
  faHardDrive,
  faKey,
  faCrosshairs,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import axios from "src/utils/AxiosInstance";

import AddIOCForm from "src/modules/cyberrisk/forms/AddIOCForm";
import ImportIOCCSVForm from "src/modules/cyberrisk/forms/ImportIOCCSVForm";

// ===================== MOCK FALLBACK (remove once backend is live) =====================
// Copied verbatim from the original threat-dashboard mock data so the page renders
// before the real `/cyberrisk/ioc/...` endpoint exists. Delete this block and the
// fallback assignment once the endpoint returns data.
const MOCK_IOCS = [
  { id: "1", value: "185.220.101.47", type: "IP", severity: "Critical", status: "Active", confidence: 94, source: "CISA Advisory", threat_actor: "APT29 (Cozy Bear)", tags: ["apt29", "c2", "tor-exit"], description: "Known TOR exit node used by APT29 as C2 infrastructure.", first_seen: "2026-05-10T08:22:00Z", last_seen: "2026-05-13T04:15:00Z", expiry_date: "2026-08-10", related_incident: "INC-0001" },
  { id: "2", value: "malicious-update[.]com", type: "Domain", severity: "Critical", status: "Active", confidence: 91, source: "FBI Flash Alert", threat_actor: "LockBit Group", tags: ["lockbit", "phishing", "delivery"], description: "Malicious domain used to deliver LockBit 3.0 ransomware payload.", first_seen: "2026-05-08T14:30:00Z", last_seen: "2026-05-13T01:00:00Z", expiry_date: "2026-08-08", related_incident: "INC-0002" },
  { id: "3", value: "a3f2c1e4b7d9f0e2...sha256", type: "Hash", severity: "Critical", status: "Active", confidence: 98, source: "VirusTotal", threat_actor: "LockBit Group", tags: ["lockbit", "ransomware", "sha256"], description: "SHA-256 hash of LockBit 3.0 ransomware binary.", first_seen: "2026-05-07T11:00:00Z", last_seen: "2026-05-12T22:00:00Z", expiry_date: "2026-11-07", related_incident: "INC-0002" },
  { id: "4", value: "exfil-c2[.]net", type: "Domain", severity: "High", status: "Active", confidence: 89, source: "NDR Platform", threat_actor: "Unknown", tags: ["exfil", "dns-tunneling", "c2"], description: "Domain receiving DNS-tunneled exfiltration traffic.", first_seen: "2026-05-05T16:40:00Z", last_seen: "2026-05-13T05:10:00Z", expiry_date: "2026-08-05", related_incident: "INC-0004" },
  { id: "5", value: "103.42.87.22", type: "IP", severity: "High", status: "Active", confidence: 72, source: "Internal SIEM", threat_actor: "Unknown", tags: ["credential-stuffing", "banking"], description: "Source IP in credential stuffing attack.", first_seen: "2026-05-11T22:45:00Z", last_seen: "2026-05-13T03:30:00Z", expiry_date: "2026-07-11", related_incident: "INC-0003" },
  { id: "6", value: "c9b4d2a1...npm-backdoor", type: "Hash", severity: "High", status: "Under Review", confidence: 81, source: "Threat Intel Feed", threat_actor: "Unknown", tags: ["supply-chain", "npm", "backdoor"], description: "Hash of malicious npm package with backdoor.", first_seen: "2026-05-09T11:15:00Z", last_seen: "2026-05-12T18:20:00Z", expiry_date: "2026-11-09", related_incident: "INC-0005" },
  { id: "7", value: "https://cdn-malware[.]io/payload/update.exe", type: "URL", severity: "High", status: "Active", confidence: 87, source: "Threat Intel Feed", threat_actor: "FIN7", tags: ["fin7", "downloader", "exe"], description: "Malicious URL hosting FIN7 dropper.", first_seen: "2026-05-06T09:00:00Z", last_seen: "2026-05-11T14:00:00Z", expiry_date: "2026-08-06", related_incident: "" },
  { id: "8", value: "phish@secure-bank-verify[.]com", type: "Email", severity: "Medium", status: "Active", confidence: 76, source: "User Report", threat_actor: "Unknown", tags: ["phishing", "bec", "impersonation"], description: "BEC campaign impersonating executive leadership.", first_seen: "2026-05-12T08:00:00Z", last_seen: "2026-05-12T16:00:00Z", expiry_date: "2026-07-12", related_incident: "INC-0003" },
  { id: "9", value: "91.108.56.177", type: "IP", severity: "Medium", status: "Inactive", confidence: 65, source: "Open Source Intel", threat_actor: "Lazarus Group", tags: ["lazarus", "reconnaissance"], description: "Lazarus Group reconnaissance IP.", first_seen: "2026-04-28T10:00:00Z", last_seen: "2026-05-02T10:00:00Z", expiry_date: "2026-07-28", related_incident: "" },
  { id: "10", value: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\svchost32", type: "Registry", severity: "Medium", status: "Under Review", confidence: 83, source: "EDR Alert", threat_actor: "Unknown", tags: ["persistence", "registry", "edr"], description: "Malicious registry persistence key.", first_seen: "2026-05-13T02:15:00Z", last_seen: "2026-05-13T02:15:00Z", expiry_date: "2026-08-13", related_incident: "INC-0001" },
  { id: "11", value: "loader-dropper.dll", type: "File", severity: "Low", status: "Whitelisted", confidence: 55, source: "Internal SIEM", threat_actor: "Unknown", tags: ["dll", "false-positive", "legacy"], description: "Legacy DLL, confirmed false positive.", first_seen: "2026-05-01T07:00:00Z", last_seen: "2026-05-01T07:00:00Z", expiry_date: "2026-11-01", related_incident: "" },
  { id: "12", value: "198.51.100.42", type: "IP", severity: "Low", status: "Inactive", confidence: 48, source: "Open Source Intel", threat_actor: "Unknown", tags: ["scanner", "low-confidence"], description: "Generic internet scanner, low confidence.", first_seen: "2026-05-03T12:00:00Z", last_seen: "2026-05-03T14:00:00Z", expiry_date: "2026-06-03", related_incident: "" },
];
// ======================================================================================

const TYPES = ["IP", "Domain", "URL", "Hash", "Email", "File", "Registry", "Certificate"];
const SEVERITIES = ["All", "Critical", "High", "Medium", "Low"];
const STATUSES = ["All", "Active", "Inactive", "Under Review", "Whitelisted"];

const typeIcon = (type) => ({
  IP: faGlobe,
  Domain: faGlobe,
  URL: faLink,
  Hash: faHashtag,
  Email: faEnvelope,
  File: faFile,
  Registry: faHardDrive,
  Certificate: faKey,
}[type] || faCrosshairs);

const typeStyle = (type) => ({
  IP: { bg: "#eff6ff", color: "#3B82EC", border: "#bfdbfe" },
  Domain: { bg: "#ecfeff", color: "#0e7490", border: "#a5f3fc" },
  URL: { bg: "#f5f3ff", color: "#6f42c1", border: "#ddd6fe" },
  Hash: { bg: "#fffbeb", color: "#f0ad4e", border: "#fde68a" },
  Email: { bg: "#fdf2f8", color: "#be185d", border: "#fbcfe8" },
  File: { bg: "#fff7ed", color: "#fd7e14", border: "#fed7aa" },
  Registry: { bg: "#f9fafb", color: "#6c757d", border: "#e4e7ec" },
  Certificate: { bg: "#f0fdfa", color: "#0f766e", border: "#99f6e4" },
}[type] || { bg: "#f9fafb", color: "#6c757d", border: "#e4e7ec" });

const sevStyle = (s) => {
  if (s === "Critical") return { bg: "#fff5f5", color: "#d9534f", border: "#fecaca" };
  if (s === "High") return { bg: "#fff7ed", color: "#fd7e14", border: "#fed7aa" };
  if (s === "Medium") return { bg: "#fffbeb", color: "#f0ad4e", border: "#fde68a" };
  if (s === "Low") return { bg: "#f0fdf4", color: "#4BBF73", border: "#bbf7d0" };
  return { bg: "#f9fafb", color: "#6c757d", border: "#e4e7ec" };
};

const statusStyle = (s) => {
  if (s === "Active") return { bg: "#fff5f5", color: "#d9534f", border: "#fecaca" };
  if (s === "Under Review") return { bg: "#fffbeb", color: "#f0ad4e", border: "#fde68a" };
  if (s === "Inactive") return { bg: "#f9fafb", color: "#98a2b3", border: "#e4e7ec" };
  if (s === "Whitelisted") return { bg: "#f0fdf4", color: "#4BBF73", border: "#bbf7d0" };
  return { bg: "#f9fafb", color: "#6c757d", border: "#e4e7ec" };
};

function Chip({ text, style }) {
  return (
    <span style={{ display: "inline-block", fontSize: "0.72rem", padding: "2px 8px", borderRadius: 6, background: style.bg, color: style.color, border: `1px solid ${style.border}`, fontWeight: 500, whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}

function ConfidenceBar({ value }) {
  const color = value >= 80 ? "#4BBF73" : value >= 50 ? "#f0ad4e" : "#d9534f";
  return (
    <div className="d-flex align-items-center gap-2">
      <div style={{ width: 52, height: 6, background: "#f0f0f0", borderRadius: 999, overflow: "hidden", flexShrink: 0 }}>
        <div style={{ height: "100%", borderRadius: 999, background: color, width: `${value}%` }} />
      </div>
      <span style={{ fontSize: "0.72rem", fontWeight: 700, color, fontVariantNumeric: "tabular-nums", minWidth: 28 }}>{value}%</span>
    </div>
  );
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function exportToCSV(iocs) {
  const headers = ["ID", "Value", "Type", "Severity", "Status", "Confidence", "Source", "Threat Actor", "Tags", "First Seen", "Last Seen"];
  const rows = iocs.map((i) => [i.id, `"${i.value.replace(/"/g, '""')}"`, i.type, i.severity, i.status, i.confidence, `"${i.source}"`, `"${i.threat_actor}"`, `"${i.tags.join("; ")}"`, i.first_seen, i.last_seen]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ioc-register-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const IOC = ({ year, currentUserInfo, refreshCharts, onNavigate }) => {
  const { t } = useTranslation("common");

  // Hybrid data — mock fallback as initial state, axios overrides on success.
  // (Ports the original iocStore logic to plain component state.)
  const [iocs, setIocs] = useState(MOCK_IOCS);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sevFilter, setSevFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const privs = (currentUserInfo?.privileges || "").split(",");
  const canEdit = privs.includes("CR_IOC");

  useEffect(() => {
    const logInId = currentUserInfo?.logInId;
    // HYBRID: real backend call — replaces the mock fallback above on success.
    axios
      .get(`/cyberrisk/ioc/${logInId}?year=${Number(year)}`)
      .then((res) => {
        if (Array.isArray(res?.data) && res.data.length) setIocs(res.data);
      })
      .catch((err) => {
        console.warn("[cyberrisk] ioc: using mock fallback", err);
      });
  }, [year, currentUserInfo, refreshCharts]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  // Add one IOC (deduplicated by value) — ports iocStore.add for a single item.
  const handleAdd = (ioc) => {
    setAddOpen(false);
    setIocs((prev) => {
      if (prev.some((i) => i.value === ioc.value)) {
        showToast(`${t("IOC")} "${ioc.value}" ${t("already exists")}`);
        return prev;
      }
      showToast(`${t("IOC")} "${ioc.value}" ${t("added")}`);
      return [ioc, ...prev];
    });
  };

  // Bulk import (deduplicated by value) — ports iocStore.add for an array.
  const handleImport = (newIOCs) => {
    setIocs((prev) => {
      const existing = new Set(prev.map((i) => i.value));
      const toAdd = newIOCs.filter((i) => !existing.has(i.value));
      showToast(`${toAdd.length} ${toAdd.length === 1 ? t("IOC") : t("IOCs")} ${t("imported")} (${newIOCs.length - toAdd.length} ${t("duplicates skipped")})`);
      return [...toAdd, ...prev];
    });
  };

  const handleRemove = (id, value) => {
    setIocs((prev) => prev.filter((i) => i.id !== id));
    showToast(`${t("IOC")} "${value}" ${t("removed")}`);
  };

  const filtered = iocs.filter((i) => {
    const q = search.toLowerCase();
    return (i.value.toLowerCase().includes(q) || i.source.toLowerCase().includes(q) || i.threat_actor.toLowerCase().includes(q) || i.tags.some((tg) => tg.toLowerCase().includes(q))) &&
      (typeFilter === "All" || i.type === typeFilter) &&
      (sevFilter === "All" || i.severity === sevFilter) &&
      (statusFilter === "All" || i.status === statusFilter);
  });

  const stats = {
    total: iocs.length,
    critical: iocs.filter((i) => i.severity === "Critical").length,
    active: iocs.filter((i) => i.status === "Active").length,
    review: iocs.filter((i) => i.status === "Under Review").length,
  };

  const statCards = [
    { label: t("Total IOCs"), value: stats.total, accent: "#3B82EC" },
    { label: t("Critical"), value: stats.critical, accent: "#d9534f" },
    { label: t("Active"), value: stats.active, accent: "#fd7e14" },
    { label: t("Under Review"), value: stats.review, accent: "#f0ad4e" },
  ];

  return (
    <div className="progrec-page p-4 p-lg-5">
      {addOpen && <AddIOCForm show={addOpen} onHide={() => setAddOpen(false)} onSaved={handleAdd} />}
      {importOpen && <ImportIOCCSVForm show={importOpen} onHide={() => setImportOpen(false)} onImported={handleImport} />}
      {toast && <div className="pg-toast"><span className="live-dot" />{toast}</div>}

      {/* Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: "#101828" }}>{t("IOC Register")}</h5>
          <span style={{ fontSize: "0.82rem", color: "#667085" }}>{iocs.length} {t("indicators tracked · Last updated today")}</span>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" className="d-flex align-items-center gap-2" onClick={() => exportToCSV(filtered)}>
            <FontAwesomeIcon icon={faDownload} style={{ fontSize: 13 }} /> {t("Export")} {filtered.length !== iocs.length ? `(${filtered.length})` : ""}
          </Button>
          {canEdit && (
            <>
              <Button variant="outline-secondary" size="sm" className="d-flex align-items-center gap-2" onClick={() => setImportOpen(true)}>
                <FontAwesomeIcon icon={faUpload} style={{ fontSize: 13 }} /> {t("Import CSV")}
              </Button>
              <Button variant="primary" size="sm" className="d-flex align-items-center gap-2" onClick={() => setAddOpen(true)}>
                <FontAwesomeIcon icon={faPlus} style={{ fontSize: 13 }} /> {t("Add IOC")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <Row className="g-3 mb-4">
        {statCards.map((s) => (
          <Col key={s.label} xs={6} md={3}>
            <Card className="border shadow-sm h-100" style={{ borderRadius: 10 }}>
              <Card.Body className="p-3">
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: s.accent, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                <div style={{ fontSize: "0.78rem", color: "#667085" }}>{s.label}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* IOC type distribution grid */}
      <Row className="g-2 mb-4">
        {TYPES.map((tp) => {
          const count = iocs.filter((i) => i.type === tp).length;
          const ts = typeStyle(tp);
          const active = typeFilter === tp;
          return (
            <Col key={tp} xs={3} sm="auto" style={{ flex: "1 1 80px" }}>
              <button
                onClick={() => setTypeFilter(typeFilter === tp ? "All" : tp)}
                className="w-100 d-flex flex-column align-items-center gap-1 p-2 rounded"
                style={{ border: active ? `2px solid ${ts.color}` : "1px solid #e4e7ec", background: active ? ts.bg : "#fff", cursor: "pointer", textAlign: "center" }}
              >
                <FontAwesomeIcon icon={typeIcon(tp)} style={{ fontSize: 16, color: active ? ts.color : "#667085" }} />
                <span style={{ fontSize: "0.72rem", fontWeight: 600, color: active ? ts.color : "#667085" }}>{t(tp)}</span>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: active ? ts.color : "#344054", fontVariantNumeric: "tabular-nums" }}>{count}</span>
              </button>
            </Col>
          );
        })}
      </Row>

      {/* Filters */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <InputGroup style={{ maxWidth: 320, flex: "1 1 200px" }}>
          <InputGroup.Text className="bg-white border-end-0"><FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 13, color: "#98a2b3" }} /></InputGroup.Text>
          <Form.Control value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Search by value, source, actor, or tag…")} style={{ fontSize: "0.82rem", borderLeft: 0 }} />
        </InputGroup>
        <Form.Select value={sevFilter} onChange={(e) => setSevFilter(e.target.value)} style={{ maxWidth: 130, fontSize: "0.82rem" }}>{SEVERITIES.map((o) => <option key={o} value={o}>{t(o)}</option>)}</Form.Select>
        <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: 150, fontSize: "0.82rem" }}>{STATUSES.map((o) => <option key={o} value={o}>{t(o)}</option>)}</Form.Select>
      </div>

      {/* Table */}
      <Card className="shadow-sm border-0" style={{ borderRadius: 10, overflow: "hidden" }}>
        <div className="table-responsive">
          <Table hover className="mb-0" style={{ fontSize: "0.82rem" }}>
            <thead style={{ background: "#f9fafb" }}>
              <tr>
                {["Indicator", "Type", "Severity", "Confidence", "Source", "Threat Actor", "Status", "Last Seen", ""].map((h, i) => (
                  <th key={h || `col-${i}`} className="px-4 py-3 border-bottom fw-semibold" style={{ fontSize: "0.72rem", color: "#98a2b3", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{h ? t(h) : ""}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ioc) => {
                const ts = typeStyle(ioc.type);
                const isNew = !String(ioc.id).startsWith("mock") && Date.now() - new Date(ioc.first_seen).getTime() < 10 * 60 * 1000;
                return (
                  <tr key={ioc.id} className="align-middle">
                    <td className="px-4 py-3" style={{ maxWidth: 260 }}>
                      <div className="d-flex align-items-center gap-2">
                        <div className="d-flex align-items-center justify-content-center rounded flex-shrink-0" style={{ width: 28, height: 28, background: ts.bg, border: `1px solid ${ts.border}` }}>
                          <FontAwesomeIcon icon={typeIcon(ioc.type)} style={{ fontSize: 12, color: ts.color }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div className="d-flex align-items-center gap-1">
                            <span style={{ color: "#344054", fontFamily: "monospace", fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{ioc.value}</span>
                            {isNew && <span style={{ fontSize: "0.65rem", background: "#eff6ff", color: "#3B82EC", border: "1px solid #bfdbfe", borderRadius: 4, padding: "1px 6px", flexShrink: 0 }}>{t("New")}</span>}
                          </div>
                          <div className="d-flex gap-1 mt-1 flex-wrap">
                            {ioc.tags.slice(0, 2).map((tg) => <span key={tg} style={{ fontSize: "0.65rem", background: "#f4f7f9", border: "1px solid #e4e7ec", borderRadius: 4, padding: "1px 5px", color: "#667085" }}>{tg}</span>)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Chip text={t(ioc.type)} style={ts} /></td>
                    <td className="px-4 py-3"><Chip text={t(ioc.severity)} style={sevStyle(ioc.severity)} /></td>
                    <td className="px-4 py-3" style={{ minWidth: 110 }}><ConfidenceBar value={ioc.confidence} /></td>
                    <td className="px-4 py-3"><span style={{ color: "#667085", fontSize: "0.78rem", whiteSpace: "nowrap" }}>{ioc.source}</span></td>
                    <td className="px-4 py-3"><span style={{ color: "#667085", fontSize: "0.78rem", whiteSpace: "nowrap" }}>{ioc.threat_actor}</span></td>
                    <td className="px-4 py-3"><Chip text={t(ioc.status)} style={statusStyle(ioc.status)} /></td>
                    <td className="px-4 py-3"><span style={{ color: "#98a2b3", fontSize: "0.78rem", whiteSpace: "nowrap" }}>{timeAgo(ioc.last_seen)}</span></td>
                    <td className="px-4 py-3">
                      {canEdit && (
                        <button onClick={() => handleRemove(ioc.id, ioc.value)} className="btn btn-sm btn-link p-0 text-danger" style={{ fontSize: "0.72rem" }}>
                          {t("Remove")}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
        {filtered.length === 0 && <div className="py-5 text-center" style={{ color: "#98a2b3" }}>{t("No IOCs match the current filters.")}</div>}
      </Card>
    </div>
  );
};

export default IOC;
