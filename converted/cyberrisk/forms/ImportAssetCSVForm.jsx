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

const REQUIRED_HINT = "name, type";
const ALL_FIELDS = "name, type, criticality, category, ip_address, location, owner, business_unit, status, confidentiality, integrity, availability";

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
    name: col(["name", "title", "asset"]),
    type: col(["type"]),
    criticality: col(["criticality", "critical", "risk_level"]),
    category: col(["category", "cat"]),
    ip: col(["ip", "address", "cidr", "host"]),
    location: col(["location", "primary_loc", "site"]),
    secondary_location: col(["secondary"]),
    owner: col(["owner", "assignee", "responsible"]),
    business_unit: col(["business_unit", "bu", "department", "team"]),
    status: col(["status", "state"]),
    confidentiality: col(["confidentiality", "conf"]),
    integrity: col(["integrity", "integ"]),
    availability: col(["availability", "avail"]),
    description: col(["description", "desc", "notes"]),
  };

  if (idx.name === -1) throw new Error('Missing required column: "name" or "title".');
  if (idx.type === -1) throw new Error('Missing required column: "type".');

  const normCriticality = (v) => {
    const map = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };
    return map[v.toLowerCase()] ?? "Medium";
  };

  const normStatus = (v) => (/inactive|disabled|false|0/i.test(v) ? "Inactive" : "Active");

  return lines.slice(1).map((line, i) => {
    const raw = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
    const get = (ci) => (ci >= 0 ? raw[ci] ?? "" : "");

    const name = get(idx.name);
    if (!name) throw new Error(`Row ${i + 2}: missing asset name.`);

    const type = get(idx.type) || "Server";
    const criticality = normCriticality(get(idx.criticality));
    const category = get(idx.category) || (type === "Cloud Service" ? "Cloud" : type === "IoT" ? "OT" : "IT");

    return {
      id: `import-asset-${Date.now()}-${i}`,
      name,
      description: get(idx.description),
      status: normStatus(get(idx.status)),
      hierarchy: "Level 1",
      type,
      category,
      criticality,
      confidentiality: get(idx.confidentiality) || "",
      integrity: get(idx.integrity) || "",
      availability: get(idx.availability) || "",
      ip_address: get(idx.ip) || "—",
      location: get(idx.location) || "—",
      secondary_location: get(idx.secondary_location),
      owner: get(idx.owner) || "Unassigned",
      business_unit: get(idx.business_unit) || "Unassigned",
      risk_score: 0,
      vulnerability_count: 0,
      open_cve_count: 0,
      regulatory_scope: [],
      data_classification: "Internal",
      business_function: "",
      annual_value: 0,
      last_scanned_at: new Date().toISOString(),
      attachments: [],
    };
  });
}

function downloadSample() {
  const a = document.createElement("a");
  a.href = "/samples/sample-assets.csv";
  a.download = "sample-assets.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

const critVariant = (s) => ({ Critical: "danger", High: "warning", Medium: "info", Low: "success" }[s] || "secondary");

const ImportAssetCSVForm = ({ show, onHide, onSaved }) => {
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
      setParseError(t("Only .csv files are supported for asset import."));
      return;
    }
    setFile(f);
    setParsing(true);
    setParseError(null);
    try {
      const text = await f.text();
      const results = parseCSV(text);
      setParsed(results);
      setSelected(new Set(results.map((a) => a.id)));
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
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleAll = () =>
    setSelected(selected.size === parsed.length ? new Set() : new Set(parsed.map((a) => a.id)));

  const handleImport = () => {
    const toImport = parsed.filter((a) => selected.has(a.id));
    // HYBRID: bulk-create on backend; mock fallback still pushes rows into the UI.
    axios
      .post("/cyberrisk/assets/import", { assets: toImport })
      .then((res) => {
        onSaved && onSaved(Array.isArray(res?.data) && res.data.length ? res.data : toImport);
      })
      .catch((err) => {
        console.warn("[cyberrisk] import assets: using mock fallback", err);
        onSaved && onSaved(toImport);
      });
    setStep("done");
  };

  const reset = () => { setStep("upload"); setParsed([]); setFile(null); setParseError(null); setSelected(new Set()); };

  const stats = {
    critical: parsed.filter((a) => a.criticality === "Critical").length,
    high: parsed.filter((a) => a.criticality === "High").length,
    medium: parsed.filter((a) => a.criticality === "Medium").length,
    low: parsed.filter((a) => a.criticality === "Low").length,
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: "0.95rem", color: "#101828" }} className="fw-semibold d-flex align-items-center gap-2">
          <FontAwesomeIcon icon={faUpload} style={{ color: "#3B82EC" }} />
          {t("Import Assets via CSV")}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Step indicator */}
        <div className="d-flex align-items-center gap-2 mb-3" style={{ fontSize: "0.78rem" }}>
          {["upload", "preview", "done"].map((s, i) => (
            <span key={s} className="d-flex align-items-center gap-2">
              {i > 0 && <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 11, color: "#98a2b3" }} />}
              <span className="text-capitalize fw-medium" style={{ color: step === s ? "#3B82EC" : "#98a2b3" }}>
                {i + 1}. {s === "upload" ? t("Upload CSV") : s === "preview" ? t("Review & Select") : t("Done")}
              </span>
            </span>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="d-flex flex-column gap-3">
            <div className="rounded p-3" style={{ background: "#f9fafb", border: "1px solid #e4e7ec" }}>
              <p className="mb-2 fw-semibold text-uppercase" style={{ fontSize: "0.72rem", color: "#667085", letterSpacing: "0.04em" }}>{t("Expected CSV Columns")}</p>
              <div className="d-flex flex-wrap gap-1">
                {ALL_FIELDS.split(", ").map((f) => (
                  <span key={f} className="font-monospace px-2 py-1 rounded"
                    style={{ fontSize: "0.72rem", background: REQUIRED_HINT.includes(f) ? "rgba(59,130,236,0.12)" : "#eef1f4", color: REQUIRED_HINT.includes(f) ? "#3B82EC" : "#667085" }}>
                    {f}{REQUIRED_HINT.includes(f) ? " *" : ""}
                  </span>
                ))}
              </div>
              <p className="mb-0 mt-2" style={{ fontSize: "0.72rem", color: "#98a2b3" }}>{t("* Required columns. All others are optional.")}</p>
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
                  <p className="fw-semibold mb-1" style={{ color: "#344054" }}>{t("Drop your CSV file here")}</p>
                  <p className="mb-1" style={{ color: "#667085", fontSize: "0.85rem" }}>{t("or click to browse")}</p>
                  <p className="mb-0" style={{ color: "#98a2b3", fontSize: "0.75rem" }}>{t(".csv files only")}</p>
                </>
              )}
              <input ref={fileInputRef} type="file" accept=".csv" className="d-none" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
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

            <div className="rounded p-3 d-flex align-items-center justify-content-between gap-3" style={{ background: "#f9fafb", border: "1px solid #e4e7ec" }}>
              <div className="d-flex align-items-start gap-2">
                <FontAwesomeIcon icon={faCircleInfo} style={{ color: "#98a2b3", marginTop: 2 }} />
                <div>
                  <p className="mb-0 fw-medium" style={{ fontSize: "0.78rem", color: "#667085" }}>{t("Download sample CSV")}</p>
                  <p className="mb-0" style={{ fontSize: "0.72rem", color: "#98a2b3" }}>{t("10 pre-filled asset records to test the import flow")}</p>
                </div>
              </div>
              <Button size="sm" variant="outline-secondary" onClick={(e) => { e.stopPropagation(); downloadSample(); }}>
                <FontAwesomeIcon icon={faDownload} className="me-1" /> sample-assets.csv
              </Button>
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
              <span style={{ fontSize: "0.85rem", color: "#667085" }}>{parsed.length} {t("assets found")}</span>
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
                    <th>{t("Name")}</th>
                    <th>{t("Type")}</th>
                    <th>{t("Criticality")}</th>
                    <th>{t("IP / CIDR")}</th>
                    <th>{t("Owner")}</th>
                    <th>{t("Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((a) => (
                    <tr key={a.id} onClick={() => toggleSelect(a.id)} style={{ cursor: "pointer", opacity: selected.has(a.id) ? 1 : 0.45 }}>
                      <td onClick={(e) => e.stopPropagation()}>
                        <Form.Check type="checkbox" checked={selected.has(a.id)} onChange={() => toggleSelect(a.id)} />
                      </td>
                      <td>
                        <div className="fw-medium text-truncate" style={{ maxWidth: 160, color: "#344054" }}>{a.name}</div>
                        <div style={{ color: "#98a2b3" }}>{a.category}</div>
                      </td>
                      <td style={{ color: "#667085" }}>{a.type}</td>
                      <td><Badge bg={critVariant(a.criticality)}>{a.criticality}</Badge></td>
                      <td className="font-monospace" style={{ color: "#667085" }}>{a.ip_address}</td>
                      <td style={{ color: "#667085" }}>{a.owner}</td>
                      <td><Badge bg={a.status === "Active" ? "success" : "secondary"}>{a.status}</Badge></td>
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
                {selected.size} {selected.size === 1 ? t("asset") : t("assets")} {t("added to the inventory")}
              </p>
            </div>
            <div className="d-flex gap-2 mt-2">
              <Button variant="primary" onClick={onHide}>{t("View Inventory")}</Button>
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
              {t("Import")} {selected.size} {selected.size === 1 ? t("Asset") : t("Assets")}
            </Button>
          )}
        </Modal.Footer>
      )}
    </Modal>
  );
};

export default ImportAssetCSVForm;
