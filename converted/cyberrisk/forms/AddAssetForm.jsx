import React, { useState, useRef } from "react";
import { Modal, Form, Row, Col, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faUpload,
  faFileLines,
  faCircleXmark,
  faChevronDown,
  faChevronUp,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import axios from "src/utils/AxiosInstance";

const TYPES = ["Application", "Database", "Network", "Server", "Workstation", "IoT", "Mobile", "Cloud Service", "Physical"];
const CRITICALITIES = ["Critical", "High", "Medium", "Low"];
const CIA_OPTIONS = ["High", "Medium", "Low", "Not Applicable"];
const HIERARCHY_OPTIONS = ["Level 1", "Level 2", "Level 3", "Level 4"];
const BUSINESS_UNITS = ["Banking Ops", "Digital Team", "HR IT", "Trading Ops", "Network Team", "Engineering", "Infra Team", "ATM Ops", "Security", "Finance", "Compliance"];
const OWNERS = ["Alice Chen", "Bob Martinez", "Carol Smith", "David Lee", "Eva Wilson", "Frank Zhang", "Grace Kim", "Henry Park", "Iris Wang", "James Liu", "SecOps Team", "Network Team", "IR Team"];

const MAX = 4000;

function FieldLabel({ children, required, tooltip }) {
  return (
    <Form.Label className="d-flex align-items-center gap-1 mb-1" style={{ fontSize: "0.82rem", fontWeight: 500, color: "#344054" }}>
      {children}
      {required && <span className="text-danger">*</span>}
      {tooltip && (
        <span className="position-relative d-inline-flex" style={{ cursor: "help" }}>
          <FontAwesomeIcon icon={faCircleInfo} style={{ fontSize: 13, color: "#98a2b3" }} />
          <span className="pg-field-tip">{tooltip}</span>
        </span>
      )}
    </Form.Label>
  );
}

function PgSelect({ value, onChange, placeholder, options, isInvalid }) {
  return (
    <Form.Select value={value} onChange={(e) => onChange(e.target.value)} isInvalid={isInvalid}
      className="pg-form-control" style={{ fontSize: "0.85rem" }}>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </Form.Select>
  );
}

function SectionHeader({ title, open, onToggle }) {
  return (
    <button type="button" onClick={onToggle}
      className="d-flex align-items-center gap-2 w-100 border-0 bg-transparent px-0 py-0 mb-3"
      style={{ color: "#101828" }}>
      <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>{title}</span>
      <span className="flex-grow-1 mx-2" style={{ height: 1, background: "#e4e7ec" }} />
      <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} style={{ fontSize: 15, color: "#667085" }} />
    </button>
  );
}

const AddAssetForm = ({ show, onHide, onSaved }) => {
  const { t } = useTranslation("common");
  const [sections, setSections] = useState({ general: true, ownership: true, additional: true });
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    scope: "",
    description: "",
    exceptions: "",
    status: true,
    hierarchy: "Level 1",
    type: "",
    criticality: "",
    confidentiality: "",
    integrity: "",
    availability: "",
    ip_address: "",
    location: "",
    secondary_location: "",
    owner: "",
    business_unit: "",
  });
  const [errors, setErrors] = useState({});

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const toggle = (s) => setSections((p) => ({ ...p, [s]: !p[s] }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t("Title is required");
    if (!form.type) e.type = t("Type is required");
    if (!form.business_unit) e.business_unit = t("Business Unit is required");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const asset = {
      id: `asset-${Date.now()}`,
      name: form.name.trim(),
      description: form.description || form.scope,
      status: form.status ? "Active" : "Inactive",
      hierarchy: form.hierarchy,
      type: form.type,
      category: form.type === "Cloud Service" ? "Cloud" : form.type === "IoT" ? "OT" : "IT",
      criticality: form.criticality || "Medium",
      confidentiality: form.confidentiality,
      integrity: form.integrity,
      availability: form.availability,
      ip_address: form.ip_address || "—",
      location: form.location || "—",
      secondary_location: form.secondary_location,
      owner: form.owner || "Unassigned",
      business_unit: form.business_unit,
      risk_score: 0,
      vulnerability_count: 0,
      open_cve_count: 0,
      regulatory_scope: [],
      data_classification: "Internal",
      business_function: "",
      annual_value: 0,
      last_scanned_at: new Date().toISOString(),
      attachments: attachments.map((f) => f.name),
    };
    // HYBRID: persist to backend; mock fallback still updates the UI on failure.
    axios
      .post("/cyberrisk/assets", asset)
      .then((res) => {
        onSaved && onSaved(res?.data && res.data.id ? res.data : asset);
      })
      .catch((err) => {
        console.warn("[cyberrisk] add asset: using mock fallback", err);
        onSaved && onSaved(asset);
      });
    onHide && onHide();
  };

  const handleFileAdd = (e) => {
    const files = Array.from(e.target.files ?? []);
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  };
  const removeAttachment = (i) => setAttachments((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <style>{`
        .pg-form-control { font-size:0.85rem !important;border-color:#d0d5dd !important;border-radius:8px !important;color:#101828 !important; }
        .pg-form-control:focus { border-color:#3B82EC !important;box-shadow:0 0 0 3px rgba(59,130,236,0.12) !important; }
        .pg-form-control::placeholder { color:#98a2b3 !important; }
        .pg-textarea { resize:none;min-height:90px; }
        .pg-char-count { font-size:0.7rem;color:#98a2b3;text-align:right;margin-top:3px; }
        .pg-field-tip { display:none;position:absolute;left:20px;top:0;z-index:200;background:#1d2939;color:#f2f4f7;font-size:0.72rem;border-radius:6px;padding:6px 10px;width:200px;white-space:normal;line-height:1.4; }
        span:hover > .pg-field-tip { display:block; }
        .pg-attach-row { display:flex;align-items:center;gap:10px;border:1px solid #d0d5dd;border-radius:8px;padding:10px 14px;cursor:pointer;background:#fff;transition:border-color 0.15s,background 0.15s; }
        .pg-attach-row:hover { border-color:#3B82EC;background:#f5f8ff; }
        .pg-status-toggle { position:relative;width:44px;height:22px;border-radius:999px;border:none;cursor:pointer;transition:background 0.2s;flex-shrink:0; }
        .pg-status-toggle .knob { position:absolute;top:2px;width:18px;height:18px;background:#fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.2);transition:left 0.2s; }
      `}</style>

      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: "0.95rem", color: "#101828" }} className="fw-semibold">{t("Add Asset")}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* ── General Information ── */}
        <div className="mb-4">
          <SectionHeader title={t("General Information")} open={sections.general} onToggle={() => toggle("general")} />
          {sections.general && (
            <div>
              <Form.Group className="mb-3">
                <FieldLabel required tooltip={t("The name of this asset as it appears in the inventory")}>{t("Title")}</FieldLabel>
                <Form.Control className="pg-form-control" placeholder={t("Title")}
                  value={form.name} onChange={(e) => set("name", e.target.value)} isInvalid={!!errors.name} />
                <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <FieldLabel tooltip={t("Scope or boundary of this asset within the organisation")}>{t("Scope")}</FieldLabel>
                <Form.Control as="textarea" className="pg-form-control pg-textarea" placeholder={t("Scope")}
                  value={form.scope} onChange={(e) => set("scope", e.target.value.slice(0, MAX))} />
                <div className="pg-char-count">{form.scope.length}/{MAX}</div>
              </Form.Group>

              <Row className="g-3 mb-3">
                <Col xs={12} md={7}>
                  <Form.Group>
                    <FieldLabel tooltip={t("What business purpose does this asset serve?")}>{t("Purpose")}</FieldLabel>
                    <Form.Control as="textarea" className="pg-form-control pg-textarea" placeholder={t("Purpose")}
                      value={form.description} onChange={(e) => set("description", e.target.value.slice(0, MAX))} />
                    <div className="pg-char-count">{form.description.length}/{MAX}</div>
                  </Form.Group>
                </Col>
                <Col xs={12} md={5}>
                  <Form.Group className="mb-3">
                    <FieldLabel required tooltip={t("The category of asset (e.g. Application, Database, Network device)")}>{t("Type")}</FieldLabel>
                    <PgSelect value={form.type} onChange={(v) => set("type", v)} placeholder={t("Type")} options={TYPES} isInvalid={!!errors.type} />
                    <Form.Control.Feedback type="invalid">{errors.type}</Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group>
                    <FieldLabel tooltip={t("Overall business criticality rating for this asset")}>{t("Classification")}</FieldLabel>
                    <PgSelect value={form.criticality} onChange={(v) => set("criticality", v)} placeholder={t("Classification")} options={CRITICALITIES} />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <FieldLabel tooltip={t("Any exceptions, known exclusions, or special circumstances for this asset")}>{t("Exceptions")}</FieldLabel>
                <Form.Control as="textarea" className="pg-form-control pg-textarea" placeholder={t("Exceptions")}
                  value={form.exceptions} onChange={(e) => set("exceptions", e.target.value.slice(0, MAX))} />
                <div className="pg-char-count">{form.exceptions.length}/{MAX}</div>
              </Form.Group>

              <Form.Group className="mb-2">
                <FieldLabel tooltip={t("Supporting documents, diagrams, or evidence files for this asset")}>{t("Attachment")}</FieldLabel>
                <div className="pg-attach-row" onClick={() => fileInputRef.current?.click()}>
                  <FontAwesomeIcon icon={faUpload} style={{ fontSize: 18, color: "#3B82EC" }} />
                  <span style={{ flex: 1, fontSize: "0.82rem", color: "#98a2b3" }}>
                    {attachments.length === 0 ? t("Click to upload files") : ""}
                  </span>
                  <span style={{ fontSize: "0.82rem", color: "#667085" }}>{t("Uploaded")} ({attachments.length})</span>
                </div>
                <input ref={fileInputRef} type="file" multiple className="d-none" onChange={handleFileAdd} />
                {attachments.length > 0 && (
                  <div className="mt-2 d-flex flex-column gap-1">
                    {attachments.map((file, i) => (
                      <div key={i} className="d-flex align-items-center gap-2 px-3 py-2 rounded"
                        style={{ background: "#f9fafb", border: "1px solid #e4e7ec", fontSize: "0.8rem" }}>
                        <FontAwesomeIcon icon={faFileLines} style={{ fontSize: 13, color: "#667085" }} />
                        <span className="flex-grow-1 text-truncate" style={{ color: "#344054" }}>{file.name}</span>
                        <span style={{ color: "#98a2b3" }}>{(file.size / 1024).toFixed(1)} KB</span>
                        <button type="button" className="btn p-0 border-0" onClick={() => removeAttachment(i)}>
                          <FontAwesomeIcon icon={faCircleXmark} style={{ fontSize: 14, color: "#fda29b" }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Form.Group>
            </div>
          )}
        </div>

        {/* ── Ownership & Security ── */}
        <div className="mb-2">
          <SectionHeader title={t("Ownership & Security")} open={sections.ownership} onToggle={() => toggle("ownership")} />
          {sections.ownership && (
            <div>
              <Row className="g-3 mb-3">
                <Col xs={12} md={6}>
                  <Form.Group>
                    <FieldLabel required tooltip={t("The business unit responsible for this asset")}>{t("Business Unit")}</FieldLabel>
                    <PgSelect value={form.business_unit} onChange={(v) => set("business_unit", v)}
                      placeholder={t("Business Unit")} options={BUSINESS_UNITS} isInvalid={!!errors.business_unit} />
                    <Form.Control.Feedback type="invalid">{errors.business_unit}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Group>
                    <FieldLabel tooltip={t("The person or team responsible for maintaining this asset")}>{t("Author / Owner")}</FieldLabel>
                    <PgSelect value={form.owner} onChange={(v) => set("owner", v)} placeholder={t("Author / Owner")} options={OWNERS} />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-3 mb-3">
                <Col xs={12} md={4}>
                  <Form.Group>
                    <FieldLabel tooltip={t("Asset hierarchy level within the organisation")}>{t("Hierarchy")}</FieldLabel>
                    <PgSelect value={form.hierarchy} onChange={(v) => set("hierarchy", v)} placeholder={t("Hierarchy")} options={HIERARCHY_OPTIONS} />
                  </Form.Group>
                </Col>
                <Col xs={12} md={4}>
                  <Form.Group>
                    <FieldLabel tooltip={t("Primary physical or logical location of this asset")}>{t("Primary Location")}</FieldLabel>
                    <Form.Control className="pg-form-control" placeholder={t("Primary Location")}
                      value={form.location} onChange={(e) => set("location", e.target.value)} />
                  </Form.Group>
                </Col>
                <Col xs={12} md={4}>
                  <Form.Group>
                    <FieldLabel tooltip={t("IP address or CIDR range of the asset")}>{t("IP / CIDR")}</FieldLabel>
                    <Form.Control className="pg-form-control font-monospace" placeholder="e.g. 10.0.1.100"
                      value={form.ip_address} onChange={(e) => set("ip_address", e.target.value)} />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-3 mb-3">
                {[
                  { key: "confidentiality", label: t("Confidentiality"), tip: t("How sensitive is the data this asset handles?") },
                  { key: "integrity", label: t("Integrity"), tip: t("How critical is the accuracy of this asset's data?") },
                  { key: "availability", label: t("Availability"), tip: t("How critical is continuous availability of this asset?") },
                ].map((f) => (
                  <Col key={f.key} xs={12} md={4}>
                    <Form.Group>
                      <FieldLabel tooltip={f.tip}>{f.label}</FieldLabel>
                      <PgSelect value={form[f.key]} onChange={(v) => set(f.key, v)} placeholder={f.label} options={CIA_OPTIONS} />
                    </Form.Group>
                  </Col>
                ))}
              </Row>

              <Form.Group>
                <FieldLabel tooltip={t("Whether this asset is currently active in the environment")}>{t("Status")}</FieldLabel>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <button type="button" className="pg-status-toggle"
                    style={{ background: form.status ? "#3B82EC" : "#d0d5dd" }}
                    onClick={() => set("status", !form.status)}>
                    <span className="knob" style={{ left: form.status ? 22 : 2 }} />
                  </button>
                  <span style={{ fontSize: "0.82rem", color: form.status ? "#3B82EC" : "#667085", fontWeight: 500 }}>
                    {form.status ? t("Active") : t("Inactive")}
                  </span>
                </div>
              </Form.Group>
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-between" style={{ background: "#f9fafb" }}>
        <div style={{ fontSize: "0.75rem", color: "#98a2b3" }}>
          {t("Fields marked")} <span className="text-danger">*</span> {t("are required")}
        </div>
        <div className="d-flex align-items-center gap-2">
          <Button variant="primary" onClick={handleSubmit}>{t("Save")}</Button>
          <Button variant="outline-secondary" onClick={onHide}>
            <FontAwesomeIcon icon={faXmark} className="me-1" /> {t("Close")}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default AddAssetForm;
