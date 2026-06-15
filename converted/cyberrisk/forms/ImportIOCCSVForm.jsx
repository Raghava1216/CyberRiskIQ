import React, { useState, useRef, useCallback } from "react";
import { Modal, Button, Table, Form, Spinner, Badge } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUpload,
  faFileLines,
  faCircleCheck,
  faTriangleExclamation,
  faChevronRight,
  faCircleInfo,
  faRotateLeft,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import axios from "src/utils/AxiosInstance";

// ── CSV parser (ported from the original ImportIOCCSVModal) ──────────────────
function parseCSV(text) {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row.");

  const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim().toLowerCase().replace(/\s+/g, "_"));

  const col = (candidates) => {
    for (const c of candidates) {
      const i = headers.findIndex((h) => h.includes(c));
      if (i !== -1) return i;
    }
    return -1;
  };

  const idx = {
    value: col(["value", "ioc", "indicator", "hash", "ip", "domain", "url"]),
    type: col(["type", "ioc_type", "indicator_type"]),
    severity: col(["severity", "risk", "level"]),
    status: col(["status", "state"]),
    confidence: col(["confidence", "conf", "score"]),
    source: col(["source", "feed", "origin"]),
    threat_actor: col(["threat_actor", "actor", "attribution", "apt"]),
    tags: col(["tags", "labels", "categories"]),
    description: col(["description", "desc", "notes", "summary"]),
    first_seen: col(["first_seen", "first_observed", "detected"]),
    last_seen: col(["last_seen", "last_observed", "updated"]),
    expiry_date: col(["expiry", "expires", "expiry_date", "ttl"]),
    related_incident: col(["incident", "related_incident", "inc_id"]),
  };

  if (idx.value === -1) throw new Error('Missing required column: "value" or "indicator".');
  if (idx.type === -1) throw new Error('Missing required column: "type" or "ioc_type".');

  const validTypes = new Set(["IP", "Domain", "URL", "Hash", "Email", "File", "Registry", "Certificate"]);
  const normType = (v) => {
    const map = {
      ip: "IP", domain: "Domain", url: "URL", hash: "Hash", sha256: "Hash", md5: "Hash",
      email: "Email", file: "File", registry: "Registry", cert: "Certificate", certificate: "Certificate",
    };
    return map[v.toLowerCase()] || (validTypes.has(v) ? v : "IP");
  };
  const normSeverity = (v) => {
    const map = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };
    return map[v.toLowerCase()] || "Medium";
  };
  const normStatus = (v) => {
    const map = { active: "Active", inactive: "Inactive", "under review": "Under Review", whitelisted: "Whitelisted" };
    return map[v.toLowerCase()] || "Active";
  };

  return lines.slice(1).map((line, i) => {
    const raw = [];
    let cur = "";
    let inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === "," && !inQuote) { raw.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    raw.push(cur.trim());

    const get = (ci) => (ci >= 0 ? (raw[ci] || "").replace(/^"|"$/g, "").trim() : "");

    const value = get(idx.value);
    if (!value) throw new Error(`Row ${i + 2}: missing IOC value.`);

    return {
      id: `import-ioc-${Date.now()}-${i}`,
      value,
      type: normType(get(idx.type)),
      severity: normSeverity(get(idx.severity)),
      status: normStatus(get(idx.status)),
      confidence: Math.min(100, Math.max(0, Number(get(idx.confidence)) || 70)),
      source: get(idx.source) || "CSV Import",
      threat_actor: get(idx.threat_actor) || "Unknown",
      tags: get(idx.tags) ? get(idx.tags).split(/[;|]/).map((tg) => tg.trim()).filter(Boolean) : [],
      description: get(idx.description),
      first_seen: get(idx.first_seen) ? new Date(get(idx.first_seen)).toISOString() : new Date().toISOString(),
      last_seen: get(idx.last_seen) ? new Date(get(idx.last_seen)).toISOString() : new Date().toISOString(),
      expiry_date: get(idx.expiry_date),
      related_incident: get(idx.related_incident),
    };
  });
}

function downloadSample() {
  const a = document.createElement("a");
  a.href = "/samples/sample-iocs.csv";
  a.download = "sample-iocs.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

const sevVariant = (s) => ({ Critical: "danger", High: "warning", Medium: "info", Low: "success" }[s] || "secondary");

const ImportIOCCSVForm = ({ show, onHide, onImported }) => {
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
    if (!f.name.endsWith(".csv")) {
      setParseError(t("Only .csv files are supported."));
      return;
    }
    setFile(f);
    setParsing(true);
    setParseError(null);
    try {
      const text = await f.text();
      const results = parseCSV(text);
      setParsed(results);
      setSelected(new Set(results.map((i) => i.id)));
      setStep("preview");
    } catch (err) {
      setParseError(err.message);
    } finally {
      setParsing(false);
    }
  }, [t]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const toggleSelect = (id) =>
    setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const toggleAll = () =>
    setSelected(selected.size === parsed.length ? new Set() : new Set(parsed.map((i) => i.id)));

  const handleImport = async () => {
    const toImport = parsed.filter((i) => selected.has(i.id));
    try {
      // HYBRID: bulk insert via backend — falls back to local import if unavailable.
      await axios.post("/cyberrisk/ioc/import", { iocs: toImport });
    } catch (err) {
      console.warn("[cyberrisk] import IOCs: using local fallback", err);
    }
    onImported && onImported(toImport);
    setStep("done");
  };

  const reset = () => { setStep("upload"); setParsed([]); setFile(null); setParseError(null); setSelected(new Set()); };

  const stats = {
    critical: parsed.filter((i) => i.severity === "Critical").length,
    high: parsed.filter((i) => i.severity === "High").length,
    medium: parsed.filter((i) => i.severity === "Medium").length,
    low: parsed.filter((i) => i.severity === "Low").length,
  };

  const ALL_FIELDS = "value, type, severity, status, confidence, source, threat_actor, tags, first_seen, last_seen, expiry_date, related_incident, description";
  const REQUIRED = "value, type";

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 32, height: 32, background: "#eff6ff" }}>
            <FontAwesomeIcon icon={faUpload} style={{ fontSize: 15, color: "#3B82EC" }} />
          </div>
          <div>
            <Modal.Title style={{ fontSize: "1rem" }}>{t("Import IOCs via CSV")}</Modal.Title>
            <div style={{ fontSize: "0.72rem", color: "#98a2b3" }}>{t("Bulk-add indicators from a comma-separated file")}</div>
          </div>
        </div>
      </Modal.Header>

      {/* Step indicator */}
      <div className="d-flex align-items-center gap-2 px-4 py-2" style={{ background: "#f9fafb", borderBottom: "1px solid #e4e7ec", fontSize: "0.75rem" }}>
        {["upload", "preview", "done"].map((s, i) => (
          <div key={s} className="d-flex align-items-center gap-2">
            {i > 0 && <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 10, color: "#cbd5e1" }} />}
            <span style={{ fontWeight: 500, color: step === s ? "#3B82EC" : "#98a2b3", textTransform: "capitalize" }}>
              {i + 1}. {s === "upload" ? t("Upload CSV") : s === "preview" ? t("Review & Select") : t("Done")}
            </span>
          </div>
        ))}
      </div>

      <Modal.Body>
        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="d-flex flex-column gap-3">
            <div className="rounded p-3" style={{ background: "#f9fafb", border: "1px solid #e4e7ec" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#667085", textTransform: "uppercase", letterSpacing: "0.04em" }}>{t("Expected CSV Columns")}</div>
              <div className="d-flex flex-wrap gap-1 mt-2">
                {ALL_FIELDS.split(", ").map((f) => (
                  <Badge key={f} bg={REQUIRED.includes(f) ? "primary" : "light"} text={REQUIRED.includes(f) ? "light" : "dark"} style={{ fontFamily: "monospace", fontWeight: 400 }}>
                    {f}{REQUIRED.includes(f) ? " *" : ""}
                  </Badge>
                ))}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#98a2b3", marginTop: 6 }}>{t("* Required columns. All others are optional.")}</div>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="rounded text-center p-5"
              style={{ border: `2px dashed ${dragOver ? "#3B82EC" : "#e4e7ec"}`, background: dragOver ? "#eff6ff" : "#fff", cursor: "pointer" }}
            >
              {parsing ? (
                <div className="d-flex flex-column align-items-center gap-3">
                  <Spinner animation="border" variant="primary" />
                  <div style={{ color: "#344054" }}>{t("Parsing")} {file && file.name}…</div>
                </div>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUpload} style={{ fontSize: 30, color: "#cbd5e1" }} />
                  <div className="fw-semibold mt-3" style={{ color: "#344054" }}>{t("Drop your CSV file here")}</div>
                  <div style={{ fontSize: "0.85rem", color: "#98a2b3" }}>{t("or click to browse")}</div>
                  <div style={{ fontSize: "0.72rem", color: "#cbd5e1", marginTop: 6 }}>{t(".csv files only")}</div>
                </>
              )}
              <input ref={fileInputRef} type="file" accept=".csv" className="d-none" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) processFile(f); }} />
            </div>

            {parseError && (
              <div className="d-flex align-items-start gap-3 rounded p-3" style={{ background: "#fff5f5", border: "1px solid #fecaca" }}>
                <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: 15, color: "#d9534f", marginTop: 2 }} />
                <div>
                  <div style={{ color: "#d9534f", fontWeight: 600, fontSize: "0.85rem" }}>{t("Parse error")}</div>
                  <div style={{ color: "#b0b8c4", fontSize: "0.78rem" }}>{parseError}</div>
                </div>
              </div>
            )}

            <div className="d-flex align-items-center justify-content-between gap-3 rounded p-3" style={{ background: "#f9fafb", border: "1px solid #e4e7ec" }}>
              <div className="d-flex align-items-start gap-2">
                <FontAwesomeIcon icon={faCircleInfo} style={{ fontSize: 14, color: "#98a2b3", marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 500, color: "#667085" }}>{t("Download sample CSV")}</div>
                  <div style={{ fontSize: "0.72rem", color: "#98a2b3" }}>{t("10 pre-filled IOC records to test the import flow")}</div>
                </div>
              </div>
              <Button variant="outline-secondary" size="sm" className="d-flex align-items-center gap-2" onClick={(e) => { e.stopPropagation(); downloadSample(); }}>
                <FontAwesomeIcon icon={faDownload} style={{ fontSize: 12 }} /> sample-iocs.csv
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && (
          <div className="d-flex flex-column gap-3">
            <div className="d-flex flex-wrap align-items-center gap-3">
              <div className="d-flex align-items-center gap-2 rounded px-3 py-2" style={{ background: "#f9fafb" }}>
                <FontAwesomeIcon icon={faFileLines} style={{ fontSize: 14, color: "#667085" }} />
                <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{file && file.name}</span>
              </div>
              <span style={{ fontSize: "0.85rem", color: "#98a2b3" }}>{parsed.length} {t("IOCs found")}</span>
              <div className="d-flex gap-2 ms-auto flex-wrap">
                {stats.critical > 0 && <Badge bg="danger">{stats.critical} {t("Critical")}</Badge>}
                {stats.high > 0 && <Badge bg="warning">{stats.high} {t("High")}</Badge>}
                {stats.medium > 0 && <Badge bg="info">{stats.medium} {t("Medium")}</Badge>}
                {stats.low > 0 && <Badge bg="success">{stats.low} {t("Low")}</Badge>}
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between" style={{ fontSize: "0.78rem", color: "#98a2b3" }}>
              <Form.Check
                type="checkbox"
                checked={selected.size === parsed.length}
                onChange={toggleAll}
                label={`${selected.size} ${t("of")} ${parsed.length} ${t("selected for import")}`}
              />
              <Button variant="link" size="sm" className="d-flex align-items-center gap-1 text-decoration-none p-0" onClick={reset}>
                <FontAwesomeIcon icon={faRotateLeft} style={{ fontSize: 11 }} /> {t("Change file")}
              </Button>
            </div>

            <div className="rounded" style={{ border: "1px solid #e4e7ec", overflow: "hidden" }}>
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                <Table hover className="mb-0" style={{ fontSize: "0.78rem" }}>
                  <thead style={{ background: "#f9fafb", position: "sticky", top: 0 }}>
                    <tr>
                      <th style={{ width: 32 }} />
                      <th>{t("Value")}</th>
                      <th>{t("Type")}</th>
                      <th>{t("Severity")}</th>
                      <th>{t("Source")}</th>
                      <th>{t("Confidence")}</th>
                      <th>{t("Status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((ioc) => (
                      <tr key={ioc.id} onClick={() => toggleSelect(ioc.id)} style={{ cursor: "pointer", opacity: selected.has(ioc.id) ? 1 : 0.45 }}>
                        <td onClick={(e) => e.stopPropagation()}>
                          <Form.Check type="checkbox" checked={selected.has(ioc.id)} onChange={() => toggleSelect(ioc.id)} />
                        </td>
                        <td style={{ fontFamily: "monospace", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ioc.value}</td>
                        <td><Badge bg="light" text="dark">{ioc.type}</Badge></td>
                        <td><Badge bg={sevVariant(ioc.severity)}>{ioc.severity}</Badge></td>
                        <td style={{ color: "#667085" }}>{ioc.source}</td>
                        <td style={{ fontWeight: 700, color: ioc.confidence >= 80 ? "#4BBF73" : ioc.confidence >= 50 ? "#f0ad4e" : "#d9534f" }}>{ioc.confidence}%</td>
                        <td><Badge bg={ioc.status === "Active" ? "success" : ioc.status === "Whitelisted" ? "secondary" : "warning"}>{ioc.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === "done" && (
          <div className="d-flex flex-column align-items-center justify-content-center text-center gap-3 py-5">
            <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 64, height: 64, background: "#f0fdf4" }}>
              <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 30, color: "#4BBF73" }} />
            </div>
            <div>
              <h5 className="fw-bold mb-1">{t("Import Complete")}</h5>
              <div style={{ color: "#667085", fontSize: "0.85rem" }}>
                {selected.size} {selected.size === 1 ? t("indicator") : t("indicators")} {t("added to the IOC register")}
              </div>
            </div>
            <div className="d-flex gap-3 mt-2">
              <Button variant="primary" onClick={onHide}>{t("View IOC Register")}</Button>
              <Button variant="outline-secondary" onClick={reset}>{t("Import Another")}</Button>
            </div>
          </div>
        )}
      </Modal.Body>

      {step !== "done" && (
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide}>{t("Cancel")}</Button>
          {step === "preview" && (
            <Button variant="primary" className="d-flex align-items-center gap-2" disabled={selected.size === 0} onClick={handleImport}>
              <FontAwesomeIcon icon={faUpload} style={{ fontSize: 13 }} />
              {t("Import")} {selected.size} {selected.size === 1 ? t("IOC") : t("IOCs")}
            </Button>
          )}
        </Modal.Footer>
      )}
    </Modal>
  );
};

export default ImportIOCCSVForm;
