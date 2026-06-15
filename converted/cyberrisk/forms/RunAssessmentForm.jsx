import React, { useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePlay,
  faCircleInfo,
  faShieldHalved,
  faLock,
  faCreditCard,
  faFileLines,
  faHeartPulse,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

const ASSESSORS = [
  "Alice Chen", "Bob Martinez", "Carol Smith", "David Lee", "Eva Wilson",
  "Frank Zhang", "Grace Kim", "CISO Office", "SecOps Team", "Compliance Team",
  "External Auditor", "GRC Analyst",
];

const categoryStyle = (cat) => {
  if (cat === "Security") return { bg: "#eff6ff", color: "#3B82EC", border: "#bfdbfe" };
  if (cat === "Privacy") return { bg: "#f0fdf4", color: "#4BBF73", border: "#bbf7d0" };
  if (cat === "Industry") return { bg: "#fffbeb", color: "#f0ad4e", border: "#fde68a" };
  return { bg: "#f9fafb", color: "#6c757d", border: "#e4e7ec" };
};

const fwIcon = (name) => {
  if (name.includes("NIST")) return faShieldHalved;
  if (name.includes("ISO")) return faLock;
  if (name.includes("PCI")) return faCreditCard;
  if (name.includes("GDPR")) return faGlobe;
  if (name.includes("HIPAA")) return faHeartPulse;
  return faFileLines;
};

const scoreColor = (s) => (s >= 80 ? "#4BBF73" : s >= 60 ? "#f0ad4e" : "#d9534f");

const RunAssessmentForm = ({ show, onHide, frameworks = [], preselectedId, onStart }) => {
  const { t } = useTranslation("common");
  const [selectedId, setSelectedId] = useState(preselectedId || "");
  const [assessedBy, setAssessedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  const selected = frameworks.find((f) => f.id === selectedId);

  const validate = () => {
    const e = {};
    if (!selectedId) e.framework = t("Select a framework to assess");
    if (!assessedBy.trim()) e.assessedBy = t("Assessor name is required");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleStart = async () => {
    if (!validate()) return;
    setLoading(true);
    setError(null);
    try {
      await onStart({ framework_id: selectedId, assessed_by: assessedBy.trim(), notes: notes.trim() });
    } catch (e) {
      setError(e?.message || String(e));
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: "1rem", fontWeight: 700, color: "#101828" }}>
          <FontAwesomeIcon icon={faCirclePlay} style={{ fontSize: 15, color: "#3B82EC", marginRight: 8 }} />
          {t("Run Compliance Assessment")}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* How it works banner */}
        <div className="d-flex align-items-start gap-2 rounded mb-4 p-3" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
          <FontAwesomeIcon icon={faCircleInfo} style={{ fontSize: 14, color: "#3B82EC", marginTop: 2 }} />
          <p style={{ fontSize: "0.78rem", color: "#475467", margin: 0, lineHeight: 1.5 }}>
            {t("An assessment creates a snapshot of your compliance posture for one framework. After starting, a review panel opens where you mark each control as Compliant, Partial, or Non-Compliant, add evidence and notes, then complete to compute your score.")}
          </p>
        </div>

        {/* Framework selector */}
        <Form.Label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#344054" }}>
          {t("Select Framework")} <span style={{ color: "#d9534f" }}>*</span>
        </Form.Label>
        <div className="d-flex flex-column gap-2 mb-1">
          {frameworks.map((fw) => {
            const active = selectedId === fw.id;
            const cs = categoryStyle(fw.category);
            return (
              <button
                key={fw.id}
                type="button"
                onClick={() => { setSelectedId(fw.id); setErrors((e) => ({ ...e, framework: "" })); }}
                className="w-100 d-flex align-items-center gap-3 px-3 py-3 rounded text-start"
                style={{ border: active ? "1px solid #3B82EC" : "1px solid #e4e7ec", background: active ? "#f8faff" : "#fff" }}
              >
                <span
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 16, height: 16, border: active ? "5px solid #3B82EC" : "2px solid #d0d5dd" }}
                />
                <span className="rounded d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 32, height: 32, background: active ? "#eff6ff" : "#f4f7f9" }}>
                  <FontAwesomeIcon icon={fwIcon(fw.name)} style={{ fontSize: 14, color: active ? "#3B82EC" : "#98a2b3" }} />
                </span>
                <span className="flex-fill" style={{ minWidth: 0 }}>
                  <span className="d-flex align-items-center gap-2 flex-wrap">
                    <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#101828" }}>{fw.name}</span>
                    <span style={{ fontSize: "0.7rem", color: "#98a2b3" }}>v{fw.version}</span>
                    <span style={{ fontSize: "0.68rem", padding: "1px 7px", borderRadius: 6, background: cs.bg, color: cs.color, border: `1px solid ${cs.border}` }}>{fw.category}</span>
                  </span>
                  <span className="d-block" style={{ fontSize: "0.72rem", color: "#98a2b3" }}>{fw.controls_total} {t("controls")}</span>
                </span>
                <span className="text-end flex-shrink-0">
                  <span className="d-block fw-bold" style={{ fontSize: "0.85rem", color: scoreColor(fw.score), fontVariantNumeric: "tabular-nums" }}>{fw.score}%</span>
                  <span style={{ fontSize: "0.7rem", color: "#98a2b3" }}>{t("last score")}</span>
                </span>
              </button>
            );
          })}
        </div>
        {errors.framework && <p style={{ color: "#d9534f", fontSize: "0.75rem" }}>{errors.framework}</p>}

        {/* Assessor + notes */}
        <Row className="g-3 mt-1">
          <Col xs={12} md={6}>
            <Form.Label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#344054" }}>
              {t("Assessed By")} <span style={{ color: "#d9534f" }}>*</span>
            </Form.Label>
            <Form.Control
              value={assessedBy}
              onChange={(e) => { setAssessedBy(e.target.value); setErrors((er) => ({ ...er, assessedBy: "" })); }}
              list="assessor-list"
              placeholder={t("e.g. Alice Chen")}
              isInvalid={!!errors.assessedBy}
            />
            <datalist id="assessor-list">
              {ASSESSORS.map((a) => <option key={a} value={a} />)}
            </datalist>
            <Form.Control.Feedback type="invalid">{errors.assessedBy}</Form.Control.Feedback>
          </Col>
          <Col xs={12} md={6}>
            <Form.Label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#344054" }}>{t("Notes (optional)")}</Form.Label>
            <Form.Control value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("e.g. Annual audit Q2 2026")} />
          </Col>
        </Row>

        {/* Selected framework summary */}
        {selected && (
          <div className="d-flex align-items-center justify-content-between gap-3 rounded mt-3 px-3 py-3" style={{ background: "#f9fafb", border: "1px solid #e4e7ec" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 500, color: "#344054" }}>{selected.name} — {selected.controls_total} {t("controls to review")}</div>
              <div style={{ fontSize: "0.75rem", color: "#98a2b3" }}>
                {t("Current")}: {selected.controls_compliant} {t("compliant")} · {selected.controls_partial} {t("partial")} · {selected.controls_noncompliant} {t("non-compliant")}
              </div>
            </div>
            <div className="fw-bold" style={{ fontSize: "1.4rem", color: scoreColor(selected.score), fontVariantNumeric: "tabular-nums" }}>{selected.score}%</div>
          </div>
        )}

        {error && (
          <div className="rounded mt-3 px-3 py-2" style={{ background: "#fff5f5", border: "1px solid #fecaca", color: "#d9534f", fontSize: "0.82rem" }}>{error}</div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>{t("Cancel")}</Button>
        <Button variant="primary" onClick={handleStart} disabled={loading}>
          <FontAwesomeIcon icon={faCirclePlay} style={{ marginRight: 6 }} />
          {loading ? t("Starting…") : t("Start Assessment")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RunAssessmentForm;
