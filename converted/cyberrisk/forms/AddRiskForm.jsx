import React, { useState, useRef } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronUp,
  faCircleInfo,
  faUpload,
  faPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import axios from "src/utils/AxiosInstance";

const CATEGORIES = [
  "Strategic", "Operational", "Technical", "Compliance",
  "Financial", "Reputational", "Legal", "Environmental",
];

const TYPES = [
  "Cyber Attack", "Data Breach", "Insider Threat", "Third-Party Risk",
  "Regulatory", "Business Continuity", "Fraud", "Physical Security",
  "Technology Failure", "Human Error",
];

const HIERARCHIES = ["Level 1", "Level 2", "Level 3", "Level 4"];

const BUSINESS_UNITS = [
  "Corporate", "Finance", "Technology", "Operations",
  "Human Resources", "Legal & Compliance", "Sales", "Marketing",
  "Risk Management", "Audit",
];

const OWNERS = [
  "Alice Chen", "Bob Martinez", "Carol Smith", "David Lee",
  "Eva Wilson", "Frank Zhang", "Grace Kim", "Henry Park",
];

const LIKELIHOOD_LABELS = ["", "Rare", "Unlikely", "Possible", "Likely", "Almost Certain"];
const IMPACT_LABELS = ["", "Negligible", "Minor", "Moderate", "Major", "Catastrophic"];

function InfoTip({ text }) {
  return (
    <span title={text} style={{ color: "#98a2b3", cursor: "help", marginLeft: 4 }}>
      <FontAwesomeIcon icon={faCircleInfo} style={{ fontSize: 12 }} />
    </span>
  );
}

function SectionHeader({ title, open, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-100 d-flex align-items-center gap-2 text-start border-0 bg-transparent px-0 mb-2"
    >
      <FontAwesomeIcon
        icon={open ? faChevronDown : faChevronUp}
        style={{ fontSize: 14, color: open ? "#3B82EC" : "#98a2b3" }}
      />
      <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "#101828" }}>{title}</span>
      <span className="flex-fill" style={{ height: 1, background: "#e4e7ec", marginLeft: 8 }} />
    </button>
  );
}

function ScoreCell({ value, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded fw-bold"
      style={{
        width: 32,
        height: 32,
        fontSize: "0.78rem",
        border: selected ? "1px solid #3B82EC" : "1px solid #d0d5dd",
        background: selected ? "#3B82EC" : "#f9fafb",
        color: selected ? "#fff" : "#667085",
        transition: "all 0.12s",
      }}
    >
      {value}
    </button>
  );
}

function RiskScoreMatrix({ likelihood, impact, onLikelihood, onImpact, t }) {
  const score = likelihood * impact;
  const sc =
    score >= 16 ? { color: "#d9534f", bg: "#fff5f5", border: "#fecaca", label: t("Critical") }
    : score >= 10 ? { color: "#fd7e14", bg: "#fff7ed", border: "#fed7aa", label: t("High") }
    : score >= 5 ? { color: "#f0ad4e", bg: "#fffbeb", border: "#fde68a", label: t("Medium") }
    : { color: "#4BBF73", bg: "#f0fdf4", border: "#bbf7d0", label: t("Low") };

  return (
    <Row className="g-3">
      <Col xs={12} sm={6}>
        <Form.Label style={{ fontSize: "0.78rem", color: "#667085" }}>
          {t("Likelihood")} <InfoTip text={t("Probability that the risk event will occur (1=Rare, 5=Almost Certain)")} />
        </Form.Label>
        <div className="d-flex gap-2 mb-1">
          {[1, 2, 3, 4, 5].map((v) => (
            <ScoreCell key={v} value={v} selected={likelihood === v} onClick={() => onLikelihood(v)} />
          ))}
        </div>
        <p style={{ fontSize: "0.75rem", color: "#98a2b3", margin: 0 }}>{t(LIKELIHOOD_LABELS[likelihood])}</p>
      </Col>
      <Col xs={12} sm={6}>
        <Form.Label style={{ fontSize: "0.78rem", color: "#667085" }}>
          {t("Impact")} <InfoTip text={t("Severity of the consequence if the risk materialises (1=Negligible, 5=Catastrophic)")} />
        </Form.Label>
        <div className="d-flex gap-2 mb-1">
          {[1, 2, 3, 4, 5].map((v) => (
            <ScoreCell key={v} value={v} selected={impact === v} onClick={() => onImpact(v)} />
          ))}
        </div>
        <p style={{ fontSize: "0.75rem", color: "#98a2b3", margin: 0 }}>{t(IMPACT_LABELS[impact])}</p>
      </Col>
      <Col xs={12} className="d-flex align-items-center gap-3">
        <span style={{ fontSize: "0.78rem", color: "#98a2b3" }}>{t("Inherent Risk Score")}:</span>
        <span
          className="fw-bold"
          style={{ fontSize: "0.85rem", padding: "4px 12px", borderRadius: 8, border: `1px solid ${sc.border}`, background: sc.bg, color: sc.color }}
        >
          {score} — {sc.label}
        </span>
        <span style={{ fontSize: "0.75rem", color: "#98a2b3" }}>({likelihood} × {impact})</span>
      </Col>
    </Row>
  );
}

const AddRiskForm = ({ show, onHide, onSaved }) => {
  const { t } = useTranslation("common");
  const [sections, setSections] = useState({ general: true, scoring: true, ownership: true, additional: true });
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const initial = {
    title: "",
    description: "",
    category: "",
    type: "",
    status: "Active",
    is_key_risk: false,
    hierarchy: "Level 1",
    business_unit: "",
    owners: [],
    likelihood: 3,
    impact: 3,
    tags: [],
    files: [],
  };

  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const toggleSection = (key) => setSections((s) => ({ ...s, [key]: !s[key] }));

  const toggleOwner = (name) => {
    set("owners", form.owners.includes(name) ? form.owners.filter((o) => o !== name) : [...form.owners, name]);
  };

  const addTag = () => {
    const tg = tagInput.trim();
    if (tg && !form.tags.includes(tg)) {
      set("tags", [...form.tags, tg]);
      setTagInput("");
    }
  };

  const removeTag = (tg) => set("tags", form.tags.filter((x) => x !== tg));

  const handleFiles = (e) => {
    if (e.target.files) set("files", [...form.files, ...Array.from(e.target.files)]);
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = t("Title is required");
    if (!form.category) e.category = t("Category is required");
    if (!form.business_unit) e.business_unit = t("Business Unit is required");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const close = () => {
    setForm(initial);
    setErrors({});
    setTagInput("");
    onHide && onHide();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const payload = { ...form, files: form.files.map((f) => f.name) };
    try {
      // HYBRID: persist via backend; falls back to local-only add on failure.
      await axios.post("/cyberrisk/risks", payload);
    } catch (err) {
      console.warn("[cyberrisk] addRisk: backend unavailable, adding locally", err);
    } finally {
      setSubmitting(false);
    }
    onSaved && onSaved(form);
    close();
  };

  return (
    <Modal show={show} onHide={close} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: "1rem", fontWeight: 700, color: "#101828" }}>{t("Add Risk")}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {/* General */}
          <div className="mb-4">
            <SectionHeader title={t("General")} open={sections.general} onToggle={() => toggleSection("general")} />
            {sections.general && (
              <Row className="g-3">
                <Col xs={12} md={8}>
                  <Form.Label style={{ fontSize: "0.78rem", color: "#667085" }}>
                    {t("Title")} <span style={{ color: "#d9534f" }}>*</span>
                    <InfoTip text={t("A concise name that clearly identifies the risk")} />
                  </Form.Label>
                  <Form.Control
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder={t("Risk title")}
                    isInvalid={!!errors.title}
                  />
                  <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
                </Col>
                <Col xs={12} md={4} className="d-flex flex-column justify-content-end gap-2">
                  <Form.Check
                    type="checkbox"
                    label={t("Active")}
                    checked={form.status === "Active"}
                    onChange={(e) => set("status", e.target.checked ? "Active" : "Inactive")}
                  />
                  <Form.Check
                    type="checkbox"
                    label={t("Key Risk")}
                    checked={form.is_key_risk}
                    onChange={(e) => set("is_key_risk", e.target.checked)}
                  />
                </Col>
                <Col xs={12} md={8}>
                  <Form.Label style={{ fontSize: "0.78rem", color: "#667085" }}>
                    {t("Description")} <InfoTip text={t("Detailed narrative of the risk, its causes and potential consequences")} />
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    maxLength={4000}
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder={t("Description")}
                  />
                  <div className="text-end" style={{ fontSize: "0.7rem", color: "#98a2b3" }}>{form.description.length}/4000</div>
                </Col>
                <Col xs={12} md={4}>
                  <Form.Label style={{ fontSize: "0.78rem", color: "#667085" }}>
                    {t("Hierarchy")} <InfoTip text={t("The organisational level at which this risk is managed")} />
                  </Form.Label>
                  <Form.Select value={form.hierarchy} onChange={(e) => set("hierarchy", e.target.value)}>
                    {HIERARCHIES.map((h) => <option key={h}>{h}</option>)}
                  </Form.Select>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Label style={{ fontSize: "0.78rem", color: "#667085" }}>
                    {t("Category")} <span style={{ color: "#d9534f" }}>*</span>
                    <InfoTip text={t("The risk domain this risk belongs to")} />
                  </Form.Label>
                  <Form.Select value={form.category} onChange={(e) => set("category", e.target.value)} isInvalid={!!errors.category}>
                    <option value="">{t("Select an option")}</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.category}</Form.Control.Feedback>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Label style={{ fontSize: "0.78rem", color: "#667085" }}>
                    {t("Type")} <InfoTip text={t("The specific type of risk event")} />
                  </Form.Label>
                  <Form.Select value={form.type} onChange={(e) => set("type", e.target.value)}>
                    <option value="">{t("Select an option")}</option>
                    {TYPES.map((ty) => <option key={ty}>{ty}</option>)}
                  </Form.Select>
                </Col>
              </Row>
            )}
          </div>

          {/* Risk Scoring */}
          <div className="mb-4">
            <SectionHeader title={t("Risk Scoring")} open={sections.scoring} onToggle={() => toggleSection("scoring")} />
            {sections.scoring && (
              <RiskScoreMatrix
                likelihood={form.likelihood}
                impact={form.impact}
                onLikelihood={(v) => set("likelihood", v)}
                onImpact={(v) => set("impact", v)}
                t={t}
              />
            )}
          </div>

          {/* Ownership and Review */}
          <div className="mb-4">
            <SectionHeader title={t("Ownership and Review")} open={sections.ownership} onToggle={() => toggleSection("ownership")} />
            {sections.ownership && (
              <Row className="g-3">
                <Col xs={12} md={6}>
                  <Form.Label style={{ fontSize: "0.78rem", color: "#667085" }}>
                    {t("Business Unit(s)")} <span style={{ color: "#d9534f" }}>*</span>
                    <InfoTip text={t("The business unit(s) accountable for managing this risk")} />
                  </Form.Label>
                  <Form.Select value={form.business_unit} onChange={(e) => set("business_unit", e.target.value)} isInvalid={!!errors.business_unit}>
                    <option value="">{t("Business Unit")}</option>
                    {BUSINESS_UNITS.map((b) => <option key={b}>{b}</option>)}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.business_unit}</Form.Control.Feedback>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Label style={{ fontSize: "0.78rem", color: "#667085" }}>
                    {t("Owner(s)")} <InfoTip text={t("People responsible for managing and monitoring this risk")} />
                  </Form.Label>
                  <div className="d-flex flex-wrap gap-1 mb-1">
                    {form.owners.map((o) => (
                      <span key={o} className="d-inline-flex align-items-center gap-1" style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: 999, background: "#eff6ff", color: "#3B82EC", border: "1px solid #bfdbfe" }}>
                        {o}
                        <button type="button" onClick={() => toggleOwner(o)} className="border-0 bg-transparent p-0" style={{ color: "#3B82EC" }}>
                          <FontAwesomeIcon icon={faXmark} style={{ fontSize: 10 }} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <Form.Select value="" onChange={(e) => { if (e.target.value) toggleOwner(e.target.value); }}>
                    <option value="">{form.owners.length === 0 ? t("Owner(s)") : t("+ Add")}</option>
                    {OWNERS.filter((o) => !form.owners.includes(o)).map((o) => <option key={o}>{o}</option>)}
                  </Form.Select>
                </Col>
              </Row>
            )}
          </div>

          {/* Additional Details */}
          <div className="mb-2">
            <SectionHeader title={t("Additional Details")} open={sections.additional} onToggle={() => toggleSection("additional")} />
            {sections.additional && (
              <Row className="g-3">
                <Col xs={12}>
                  <Form.Label style={{ fontSize: "0.78rem", color: "#667085" }}>{t("Tags")}</Form.Label>
                  <div className="d-flex flex-wrap gap-1 mb-2">
                    {form.tags.map((tg) => (
                      <span key={tg} className="d-inline-flex align-items-center gap-1" style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: 999, background: "#f4f7f9", color: "#344054", border: "1px solid #e4e7ec" }}>
                        {tg}
                        <button type="button" onClick={() => removeTag(tg)} className="border-0 bg-transparent p-0" style={{ color: "#667085" }}>
                          <FontAwesomeIcon icon={faXmark} style={{ fontSize: 10 }} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="d-flex gap-2">
                    <Form.Control
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                      placeholder={t("Add tag and press Enter")}
                    />
                    <Button variant="outline-secondary" type="button" onClick={addTag}>
                      <FontAwesomeIcon icon={faPlus} />
                    </Button>
                  </div>
                </Col>
                <Col xs={12}>
                  <Form.Label style={{ fontSize: "0.78rem", color: "#667085" }}>
                    {t("Attach File(s)")} <InfoTip text={t("Supporting evidence, policies or documentation related to this risk")} />
                  </Form.Label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    className="w-100 d-flex align-items-center gap-3 rounded px-3 py-3"
                    style={{ background: "#f9fafb", border: "1px dashed #d0d5dd", color: "#667085", fontSize: "0.82rem" }}
                  >
                    <FontAwesomeIcon icon={faUpload} />
                    <span className="text-start flex-fill">
                      {form.files.length > 0
                        ? `${t("Uploaded")} (${form.files.length}) — ${form.files.map((f) => f.name).join(", ")}`
                        : `${t("Uploaded")} (0) — ${t("Click to attach files")}`}
                    </span>
                  </button>
                  <input ref={fileInputRef} type="file" multiple className="d-none" onChange={handleFiles} />
                </Col>
              </Row>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={close}>{t("Close")}</Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? t("Submitting…") : t("Submit")}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddRiskForm;
