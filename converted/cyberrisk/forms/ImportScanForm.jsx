import React, { useState, useRef, useCallback } from "react";
import { Modal, Button, Table, Badge, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faUpload,
  faFileLines,
  faCircleCheck,
  faTriangleExclamation,
  faChevronRight,
  faSpinner,
  faCircleInfo,
  faRotateLeft,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import axios from "src/utils/AxiosInstance";

const SCANNER_TYPES = [
  { id: "nessus", label: "Nessus", ext: ".nessus / .xml", variant: "primary" },
  { id: "qualys", label: "Qualys", ext: ".xml", variant: "warning" },
  { id: "csv", label: "Generic CSV", ext: ".csv", variant: "success" },
  { id: "json", label: "JSON / OpenVAS", ext: ".json", variant: "info" },
];

function cvssToSeverity(score) {
  if (score >= 9) return "Critical";
  if (score >= 7) return "High";
  if (score >= 4) return "Medium";
  return "Low";
}

function dueDateFromSeverity(sev) {
  const days = sev === "Critical" ? 15 : sev === "High" ? 30 : sev === "Medium" ? 60 : 90;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function parseCSV(text) {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row");
  const rawHeaders = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim().toLowerCase());
  const find = (candidates) => {
    for (const c of candidates) {
      const i = rawHeaders.findIndex((h) => h.includes(c));
      if (i !== -1) return i;
    }
    return -1;
  };
  const col = {
    cve: find(["cve"]),
    title: find(["title", "name", "vulnerability", "vuln"]),
    cvss: find(["cvss", "score"]),
    severity: find(["severity", "risk"]),
    asset: find(["asset", "host", "ip", "target"]),
    patch: find(["patch"]),
    exploit: find(["exploit"]),
    date: find(["publish", "date", "found"]),
    assignee: find(["assign", "owner", "team"]),
    status: find(["status", "state"]),
  };
  return lines.slice(1).map((line, i) => {
    const cells = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
    const cvss = parseFloat(cells[col.cvss] ?? "0") || 5.0;
    const sev = cells[col.severity] ?? "";
    const normSev = ["critical", "high", "medium", "low"].includes(sev.toLowerCase())
      ? sev.charAt(0).toUpperCase() + sev.slice(1).toLowerCase()
      : cvssToSeverity(cvss);
    return {
      id: `import-csv-${Date.now()}-${i}`,
      cve_id: cells[col.cve] || `IMPORT-${i + 1}`,
      title: cells[col.title] || `Imported Vulnerability ${i + 1}`,
      cvss_score: Math.min(10, Math.max(0, cvss)),
      severity: normSev,
      status: cells[col.status] || "Open",
      asset: cells[col.asset] || "Unknown",
      patch_available: /true|yes|1/i.test(cells[col.patch] ?? ""),
      exploit_available: /true|yes|1/i.test(cells[col.exploit] ?? ""),
      published_date: cells[col.date] || new Date().toISOString().slice(0, 10),
      due_date: dueDateFromSeverity(normSev),
      assigned_to: cells[col.assignee] || "Unassigned",
    };
  });
}

function parseJSON(text) {
  const data = JSON.parse(text);
  const arr = Array.isArray(data) ? data : (data.vulnerabilities ?? data.results ?? data.findings ?? [data]);
  if (!Array.isArray(arr) || arr.length === 0) throw new Error("No vulnerability records found in JSON");
  return arr.map((item, i) => {
    const cvss = parseFloat(String(item.cvss_score ?? item.cvss ?? item.score ?? item.base_score ?? 5)) || 5;
    const sev = String(item.severity ?? item.risk ?? "");
    const normSev = ["Critical", "High", "Medium", "Low"].includes(sev) ? sev : cvssToSeverity(cvss);
    return {
      id: `import-json-${Date.now()}-${i}`,
      cve_id: String(item.cve_id ?? item.cve ?? item.id ?? `IMPORT-${i + 1}`),
      title: String(item.title ?? item.name ?? item.vulnerability ?? `Imported Vulnerability ${i + 1}`),
      cvss_score: Math.min(10, Math.max(0, cvss)),
      severity: normSev,
      status: String(item.status ?? item.state ?? "Open"),
      asset: String(item.asset ?? item.host ?? item.target ?? item.ip ?? "Unknown"),
      patch_available: Boolean(item.patch_available ?? item.patch ?? false),
      exploit_available: Boolean(item.exploit_available ?? item.exploit ?? false),
      published_date: String(item.published_date ?? item.date ?? new Date().toISOString().slice(0, 10)),
      due_date: dueDateFromSeverity(normSev),
      assigned_to: String(item.assigned_to ?? item.assignee ?? item.owner ?? "Unassigned"),
    };
  });
}

function parseNessusXML(text) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/xml");
  const items = Array.from(doc.querySelectorAll("ReportItem"));
  if (items.length === 0) throw new Error("No ReportItem elements found — is this a valid Nessus file?");
  return items.map((item, i) => {
    const cvss = parseFloat(item.getAttribute("cvss3_base_score") ?? item.getAttribute("cvss_base_score") ?? "0") || 0;
    const numSev = parseInt(item.getAttribute("severity") ?? "0");
    const normSev = numSev >= 4 ? "Critical" : numSev === 3 ? "High" : numSev === 2 ? "Medium" : "Low";
    const cve = item.querySelector("cve")?.textContent ?? "";
    const host = item.closest("ReportHost")?.getAttribute("name") ?? "Unknown";
    return {
      id: `import-nessus-${Date.now()}-${i}`,
      cve_id: cve || `NESSUS-${item.getAttribute("pluginID") ?? i}`,
      title: item.getAttribute("pluginName") ?? `Nessus Finding ${i + 1}`,
      cvss_score: cvss || numSev * 2.5,
      severity: normSev,
      status: "Open",
      asset: host,
      patch_available: (item.querySelector("solution")?.textContent ?? "").length > 5,
      exploit_available: item.querySelector("exploit_available")?.textContent === "true",
      published_date: item.querySelector("vuln_publication_date")?.textContent ?? new Date().toISOString().slice(0, 10),
      due_date: dueDateFromSeverity(normSev),
      assigned_to: "Unassigned",
    };
  });
}

function parseQualysXML(text) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/xml");
  const vulns = Array.from(doc.querySelectorAll("VULN, Vuln, DETECTION"));
  if (vulns.length === 0) throw new Error("No VULN/DETECTION elements found — is this a valid Qualys file?");
  return vulns.map((v, i) => {
    const cvss = parseFloat(v.querySelector("CVSS_FINAL, CVSS3_FINAL, CVSSv3_base")?.textContent ?? "0") || 0;
    const sev = parseInt(v.querySelector("SEVERITY")?.textContent ?? "0");
    const normSev = sev >= 4 ? "Critical" : sev === 3 ? "High" : sev === 2 ? "Medium" : "Low";
    const cve = v.querySelector("CVE_ID_LIST CVE_ID ID, CVE")?.textContent ?? "";
    return {
      id: `import-qualys-${Date.now()}-${i}`,
      cve_id: cve || `QID-${v.querySelector("QID")?.textContent ?? i}`,
      title: v.querySelector("TITLE, Title")?.textContent ?? `Qualys Finding ${i + 1}`,
      cvss_score: cvss || sev * 2,
      severity: normSev,
      status: v.querySelector("STATUS")?.textContent ?? "Open",
      asset: v.querySelector("IP, HOST")?.textContent ?? "Unknown",
      patch_available: (v.querySelector("SOLUTION")?.textContent ?? "").length > 5,
      exploit_available: v.querySelector("EXPLOITABILITY")?.textContent === "Yes",
      published_date: v.querySelector("PUBLISHED_DATETIME")?.textContent?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      due_date: dueDateFromSeverity(normSev),
      assigned_to: "Unassigned",
    };
  });
}

function detectAndParse(filename, content) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "json") return parseJSON(content);
  if (ext === "csv") return parseCSV(content);
  if (ext === "nessus" || (ext === "xml" && content.includes("<NessusClientData"))) return parseNessusXML(content);
  if (ext === "xml" && content.includes("<ASSET_DATA_REPORT")) return parseQualysXML(content);
  if (ext === "xml") {
    try { return parseNessusXML(content); } catch (e) { /* fall through */ }
    return parseQualysXML(content);
  }
  throw new Error(`Unsupported file format: .${ext}. Use .nessus, .xml, .csv, or .json`);
}

function downloadSample(filename) {
  const a = document.createElement("a");
  a.href = `/samples/${filename}`;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

const sevVariant = (s) => ({ Critical: "danger", High: "warning", Medium: "info", Low: "success" }[s] || "secondary");
const cvssColor = (score) => (score >= 9 ? "#d9534f" : score >= 7 ? "#f0ad4e" : score >= 4 ? "#e0a800" : "#4BBF73");

const SAMPLES = [
  { label: "sample-scan.csv", file: "sample-scan.csv", desc: "10 vulns · Generic CSV", tag: "Recommended", variant: "success" },
  { label: "sample-scan.nessus", file: "sample-scan.nessus", desc: "7 vulns · 3 hosts", tag: "Nessus", variant: "primary" },
  { label: "sample-scan-qualys.xml", file: "sample-scan-qualys.xml", desc: "7 vulns · 3 hosts", tag: "Qualys", variant: "warning" },
];

const ImportScanForm = ({ show, onHide, onSaved }) => {
  const { t } = useTranslation("common");
  const [step, setStep] = useState("upload");
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState([]);
  const [parseError, setParseError] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const fileInputRef = useRef(null);

  const processFile = useCallback(async (f) => {
    setFile(f);
    setParsing(true);
    setParseError(null);
    try {
      const text = await f.text();
      const results = detectAndParse(f.name, text);
      setParsed(results);
      setSelected(new Set(results.map((v) => v.id)));
      setStep("preview");
    } catch (err) {
      setParseError(err.message);
    } finally {
      setParsing(false);
    }
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const toggleSelect = (id) =>
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleAll = () =>
    setSelected(selected.size === parsed.length ? new Set() : new Set(parsed.map((v) => v.id)));

  const handleImport = () => {
    const toImport = parsed.filter((v) => selected.has(v.id));
    // HYBRID: persist parsed findings; mock fallback still pushes into UI.
    axios
      .post("/cyberrisk/vulnerabilities/import", { vulnerabilities: toImport })
      .then((res) => {
        onSaved && onSaved(Array.isArray(res?.data) && res.data.length ? res.data : toImport);
      })
      .catch((err) => {
        console.warn("[cyberrisk] import scan: using mock fallback", err);
        onSaved && onSaved(toImport);
      });
    setStep("done");
  };

  const reset = () => { setStep("upload"); setParsed([]); setFile(null); setParseError(null); setSelected(new Set()); };

  const stats = {
    critical: parsed.filter((v) => v.severity === "Critical").length,
    high: parsed.filter((v) => v.severity === "High").length,
    medium: parsed.filter((v) => v.severity === "Medium").length,
    low: parsed.filter((v) => v.severity === "Low").length,
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: "0.95rem", color: "#101828" }} className="fw-semibold d-flex align-items-center gap-2">
          <FontAwesomeIcon icon={faUpload} style={{ color: "#3B82EC" }} />
          {t("Import Scan Results")}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Step indicator */}
        <div className="d-flex align-items-center gap-2 mb-3" style={{ fontSize: "0.78rem" }}>
          {["upload", "preview", "done"].map((s, i) => (
            <span key={s} className="d-flex align-items-center gap-2">
              {i > 0 && <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 11, color: "#98a2b3" }} />}
              <span className="text-capitalize fw-medium" style={{ color: step === s ? "#3B82EC" : "#98a2b3" }}>
                {i + 1}. {s === "upload" ? t("Upload File") : s === "preview" ? t("Review & Select") : t("Done")}
              </span>
            </span>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="d-flex flex-column gap-3">
            <div className="d-flex flex-wrap gap-2">
              {SCANNER_TYPES.map((s) => (
                <div key={s.id} className="rounded text-center p-2 flex-grow-1" style={{ border: "1px solid #e4e7ec", minWidth: 120 }}>
                  <Badge bg={s.variant}>{s.label}</Badge>
                  <p className="mb-0 mt-1" style={{ fontSize: "0.7rem", color: "#98a2b3" }}>{s.ext}</p>
                </div>
              ))}
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="rounded text-center p-5"
              style={{ border: `2px dashed ${dragOver ? "#3B82EC" : "#d0d5dd"}`, background: dragOver ? "rgba(59,130,236,0.05)" : "#fff", cursor: "pointer" }}
            >
              {parsing ? (
                <div className="d-flex flex-column align-items-center gap-2">
                  <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: 30, color: "#3B82EC" }} />
                  <p className="mb-0 fw-medium" style={{ color: "#344054" }}>{t("Parsing")} {file?.name}…</p>
                </div>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUpload} style={{ fontSize: 30, color: "#98a2b3" }} className="mb-2" />
                  <p className="fw-semibold mb-1" style={{ color: "#344054" }}>{t("Drop your scan file here")}</p>
                  <p className="mb-1" style={{ color: "#667085", fontSize: "0.85rem" }}>{t("or click to browse")}</p>
                  <p className="mb-0" style={{ color: "#98a2b3", fontSize: "0.75rem" }}>.nessus · .xml · .csv · .json</p>
                </>
              )}
              <input ref={fileInputRef} type="file" accept=".nessus,.xml,.csv,.json" className="d-none" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
            </div>

            {parseError && (
              <div className="d-flex align-items-start gap-2 rounded p-3" style={{ background: "rgba(217,83,79,0.08)", border: "1px solid rgba(217,83,79,0.2)" }}>
                <FontAwesomeIcon icon={faTriangleExclamation} style={{ color: "#d9534f", marginTop: 2 }} />
                <div>
                  <p className="mb-0 fw-medium" style={{ color: "#b42318" }}>{t("Parse error")}</p>
                  <p className="mb-0" style={{ color: "#d9534f", fontSize: "0.78rem" }}>{parseError}</p>
                </div>
              </div>
            )}

            <div className="rounded p-3" style={{ background: "#f9fafb", border: "1px solid #e4e7ec" }}>
              <p className="mb-2 fw-medium" style={{ fontSize: "0.78rem", color: "#667085" }}>
                <FontAwesomeIcon icon={faCircleInfo} className="me-1" />{t("No scanner file? Download a sample to test the import:")}
              </p>
              <div className="d-flex flex-wrap gap-2">
                {SAMPLES.map((s) => (
                  <Button key={s.file} size="sm" variant={`outline-${s.variant}`} onClick={(e) => { e.stopPropagation(); downloadSample(s.file); }}>
                    <FontAwesomeIcon icon={faFileLines} className="me-1" />{s.label}
                    <span className="ms-1" style={{ fontSize: "0.65rem", opacity: 0.7 }}>· {s.desc}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && (
          <div className="d-flex flex-column gap-3">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className="d-inline-flex align-items-center gap-2 rounded px-3 py-2" style={{ background: "#f9fafb", border: "1px solid #e4e7ec" }}>
                <FontAwesomeIcon icon={faFileLines} style={{ color: "#667085" }} />
                <span style={{ fontSize: "0.85rem", color: "#344054" }}>{file?.name}</span>
              </span>
              <span style={{ fontSize: "0.85rem", color: "#667085" }}>{parsed.length} {t("vulnerabilities found")}</span>
              <div className="d-flex gap-2 ms-auto flex-wrap">
                {stats.critical > 0 && <Badge bg="danger">{stats.critical} {t("Critical")}</Badge>}
                {stats.high > 0 && <Badge bg="warning">{stats.high} {t("High")}</Badge>}
                {stats.medium > 0 && <Badge bg="info">{stats.medium} {t("Medium")}</Badge>}
                {stats.low > 0 && <Badge bg="success">{stats.low} {t("Low")}</Badge>}
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between" style={{ fontSize: "0.78rem", color: "#667085" }}>
              <Form.Check type="checkbox" label={`${selected.size} ${t("of")} ${parsed.length} ${t("selected for import")}`}
                checked={selected.size === parsed.length && parsed.length > 0} onChange={toggleAll} />
              <Button size="sm" variant="link" className="text-decoration-none p-0" onClick={() => { setStep("upload"); setParsed([]); setFile(null); setParseError(null); }}>
                <FontAwesomeIcon icon={faRotateLeft} className="me-1" /> {t("Change file")}
              </Button>
            </div>

            <div className="table-responsive" style={{ maxHeight: 320, overflowY: "auto", border: "1px solid #e4e7ec", borderRadius: 8 }}>
              <Table hover className="mb-0 align-middle" style={{ fontSize: "0.78rem" }}>
                <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={{ width: 32 }} />
                    <th>{t("CVE / Title")}</th>
                    <th>{t("CVSS")}</th>
                    <th>{t("Severity")}</th>
                    <th>{t("Asset")}</th>
                    <th>{t("Due")}</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((v) => (
                    <tr key={v.id} onClick={() => toggleSelect(v.id)} style={{ cursor: "pointer", opacity: selected.has(v.id) ? 1 : 0.45 }}>
                      <td onClick={(e) => e.stopPropagation()}>
                        <Form.Check type="checkbox" checked={selected.has(v.id)} onChange={() => toggleSelect(v.id)} />
                      </td>
                      <td>
                        <div className="fw-medium text-truncate" style={{ maxWidth: 200, color: "#344054" }}>{v.title}</div>
                        <div className="font-monospace" style={{ color: "#98a2b3" }}>{v.cve_id}</div>
                      </td>
                      <td className="fw-bold" style={{ color: cvssColor(v.cvss_score) }}>{v.cvss_score.toFixed(1)}</td>
                      <td><Badge bg={sevVariant(v.severity)}>{v.severity}</Badge></td>
                      <td className="font-monospace" style={{ color: "#667085" }}>{v.asset}</td>
                      <td style={{ color: "#667085" }}>{v.due_date}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === "done" && (
          <div className="d-flex flex-column align-items-center justify-content-center text-center gap-3 py-5">
            <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 64, height: 64, background: "rgba(75,191,115,0.15)" }}>
              <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 30, color: "#4BBF73" }} />
            </div>
            <div>
              <h5 className="fw-bold mb-1" style={{ color: "#101828" }}>{t("Import Complete")}</h5>
              <p className="mb-0" style={{ color: "#667085", fontSize: "0.85rem" }}>
                {selected.size} {selected.size === 1 ? t("vulnerability") : t("vulnerabilities")} {t("added to the register")}
              </p>
            </div>
            <div className="d-flex gap-2 mt-2">
              <Button variant="primary" onClick={onHide}>{t("View Register")}</Button>
              <Button variant="outline-secondary" onClick={reset}>{t("Import Another")}</Button>
            </div>
          </div>
        )}
      </Modal.Body>

      {step !== "done" && (
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide}>
            <FontAwesomeIcon icon={faXmark} className="me-1" /> {t("Cancel")}
          </Button>
          {step === "preview" && (
            <Button variant="primary" onClick={handleImport} disabled={selected.size === 0}>
              <FontAwesomeIcon icon={faUpload} className="me-1" />
              {t("Import")} {selected.size} {selected.size === 1 ? t("Finding") : t("Findings")}
            </Button>
          )}
        </Modal.Footer>
      )}
    </Modal>
  );
};

export default ImportScanForm;
