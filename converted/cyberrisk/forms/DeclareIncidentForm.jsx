import React, { useState, useRef } from "react";
import { Modal, Button, Row, Col, Form, Card } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faChevronDown,
  faChevronUp,
  faCircleInfo,
  faUpload,
  faFileLines,
  faCircleXmark,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import axios from "src/utils/AxiosInstance";

const INCIDENT_TYPES = [
  "Security Breach", "Data Leak", "Ransomware", "DDoS", "Phishing",
  "Insider Threat", "Malware", "Unauthorized Access", "System Outage",
  "Supply Chain Attack", "Social Engineering", "Physical Security",
];
const SEVERITIES = ["Critical", "High", "Medium", "Low"];
const PRIORITIES = ["P1", "P2", "P3", "P4"];
const STATUSES = ["Open", "Investigating", "Contained", "Resolved", "Closed"];
const ASSIGNEES = [
  "IR Team", "Alice Chen", "Bob Martinez", "Carol Smith", "David Lee",
  "Eva Wilson", "Frank Zhang", "Grace Kim", "Network Team", "Cloud Team",
  "SecOps Team", "CISO Office",
];
const REPORTERS = [
  "EDR Alert", "SIEM Alert", "User Report", "WAF Logs", "AWS GuardDuty",
  "NDR Platform", "Vulnerability Scanner", "Threat Intel Feed", "UEBA Alert",
  "Help Desk", "External Party", "Automated Monitor",
];

const PRIORITY_META = {
  P1: { label: "P1 — Critical", desc: "Severe business impact, immediate response required", color: "#d9534f", bg: "#fff5f5", border: "#fecaca" },
  P2: { label: "P2 — High", desc: "Significant impact, response within 1 hour", color: "#fd7e14", bg: "#fff7ed", border: "#fed7aa" },
  P3: { label: "P3 — Medium", desc: "Moderate impact, response within 4 hours", color: "#f0ad4e", bg: "#fffbeb", border: "#fde68a" },
  P4: { label: "P4 — Low", desc: "Minimal impact, response within 24 hours", color: "#98a2b3", bg: "#f9fafb", border: "#e4e7ec" },
};

const SEV_COLORS = {
  Critical: { color: "#d9534f", bg: "#fff5f5", border: "#fecaca" },
  High: { color: "#fd7e14", bg: "#fff7ed", border: "#fed7aa" },
  Medium: { color: "#f0ad4e", bg: "#fffbeb", border: "#fde68a" },
  Low: { color: "#4BBF73", bg: "#f0fdf4", border: "#bbf7d0" },
};

function LabelLine({ children, required, tooltip }) {
  return (
    <Form.Label className="d-flex align-items-center gap-1 mb-1" style={{ fontSize: "0.78rem", fontWeight: 600, color: "#344054" }}>
      {children}
      {required && <span style={{ color: "#d9534f" }}>*</span>}
      {tooltip && <FontAwesomeIcon icon={faCircleInfo} title={tooltip} style={{ fontSize: 12, color: "#98a2b3" }} />}
    </Form.Label>
  );
}

function Section({ title, open, onToggle, children, accent }) {
  return (
    <Card className="border" style={{ borderRadius: 10, overflow: "hidden", borderColor: accent ? "#fecaca" : "#e4e7ec" }}>
      <button
        type="button"
        onClick={onToggle}
        className="w-100 d-flex align-items-center gap-2 px-3 py-3 border-0 text-start"
        style={{ background: accent ? "#fff5f5" : "#f9fafb", cursor: "pointer" }}
      >
        <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} style={{ fontSize: 13, color: "#667085" }} />
        <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#101828" }}>{title}</span>
      </button>
      {open && <div className="px-3 py-3">{children}</div>}
    </Card>
  );
}

const DeclareIncidentForm = ({ show, onHide, onSaved }) => {
  const { t } = useTranslation("common");
  const [sections, setSections] = useState({ general: true, classification: true, assignment: true, timeline: true, additional: true });
  const [attachments, setAttachments] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "",
    severity: "",
    priority: "",
    status: "Open",
    assigned_to: "",
    reported_by: "",
    detected_at: new Date().toISOString().slice(0, 16),
    resolved_at: "",
    tags: [],
    affected_systems: "",
    affected_users: "",
    initial_vector: "",
  });

  const [errors, setErrors] = useState({});

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const toggle = (s) => setSections((p) => ({ ...p, [s]: !p[s] }));

  const addTag = () => {
    const tg = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (tg && !form.tags.includes(tg)) set("tags", [...form.tags, tg]);
    setTagInput("");
  };
  const removeTag = (tg) => set("tags", form.tags.filter((x) => x !== tg));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = t("Incident title is required");
    if (!form.type) e.type = t("Incident type is required");
    if (!form.severity) e.severity = t("Severity is required");
    if (!form.priority) e.priority = t("Priority is required");
    if (!form.assigned_to) e.assigned_to = t("Assignee is required");
    if (!form.reported_by) e.reported_by = t("Reporter / detection source is required");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const incident = {
      id: `INC-${String(Date.now()).slice(-6)}`,
      title: form.title.trim(),
      type: form.type,
      severity: form.severity,
      priority: form.priority,
      status: form.status,
      assigned_to: form.assigned_to,
      reported_by: form.reported_by,
      detected_at: form.detected_at ? new Date(form.detected_at).toISOString() : new Date().toISOString(),
      resolved_at: form.resolved_at ? new Date(form.resolved_at).toISOString() : undefined,
      financial_impact_estimate: 0,
      is_dora_reportable: false,
      dora_reported: false,
      affected_users: 0,
      downtime_minutes: 0,
      tags: [
        ...form.tags,
        ...(form.affected_systems ? [form.affected_systems.toLowerCase().replace(/\s+/g, "-")] : []),
      ],
    };
    try {
      // HYBRID: persist to the real backend; falls back to a local add on failure.
      const res = await axios.post("/cyberrisk/incidents", incident);
      onSaved && onSaved(res?.data && res.data.id ? res.data : incident);
    } catch (err) {
      console.warn("[cyberrisk] declare incident: using local fallback", err);
      onSaved && onSaved(incident);
    }
  };

  const descLen = form.description.length;
  const selectedPriority = form.priority;

  return (
    <Modal show={show} onHide={onHide} size="xl" scrollable centered>
      <Modal.Header className="d-flex align-items-center justify-content-between" style={{ background: "#fff5f5" }}>
        <div className="d-flex align-items-center gap-2">
          <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 32, height: 32, background: "#fee2e2" }}>
            <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: 15, color: "#d9534f" }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#101828" }}>{t("Declare Incident")}</div>
            <div style={{ fontSize: "0.72rem", color: "#98a2b3" }}>{t("Log and assign a new security incident for immediate response")}</div>
          </div>
        </div>
        <button onClick={onHide} className="btn btn-link p-1" style={{ color: "#98a2b3" }}>
          <FontAwesomeIcon icon={faXmark} style={{ fontSize: 18 }} />
        </button>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="d-flex flex-column gap-3">

            {/* General */}
            <Section title={t("General")} open={sections.general} onToggle={() => toggle("general")} accent>
              <Row className="g-3">
                <Col lg={8}>
                  <div className="d-flex flex-column gap-3">
                    <div>
                      <LabelLine required tooltip={t("A clear, concise title for this incident")}>{t("Incident Title")}</LabelLine>
                      <Form.Control
                        value={form.title}
                        onChange={(e) => set("title", e.target.value)}
                        placeholder={t("e.g. Ransomware Detection on Finance Workstation")}
                        isInvalid={!!errors.title}
                        style={{ fontSize: "0.82rem" }}
                      />
                      {errors.title && <div style={{ color: "#d9534f", fontSize: "0.72rem", marginTop: 4 }}>{errors.title}</div>}
                    </div>

                    <div>
                      <LabelLine tooltip={t("Detailed description of what was observed, how it was detected, and initial impact assessment")}>{t("Description")}</LabelLine>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        value={form.description}
                        onChange={(e) => set("description", e.target.value.slice(0, 4000))}
                        placeholder={t("Describe the incident in detail — what was detected, when, initial indicators, and business impact...")}
                        style={{ fontSize: "0.82rem", resize: "none" }}
                      />
                      <div className="text-end" style={{ fontSize: "0.7rem", color: "#98a2b3" }}>{descLen}/4000</div>
                    </div>

                    <Row className="g-3">
                      <Col xs={6}>
                        <LabelLine required tooltip={t("The category of security incident")}>{t("Incident Type")}</LabelLine>
                        <Form.Select value={form.type} onChange={(e) => set("type", e.target.value)} isInvalid={!!errors.type} style={{ fontSize: "0.82rem" }}>
                          <option value="">{t("Select type")}</option>
                          {INCIDENT_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
                        </Form.Select>
                        {errors.type && <div style={{ color: "#d9534f", fontSize: "0.72rem", marginTop: 4 }}>{errors.type}</div>}
                      </Col>
                      <Col xs={6}>
                        <LabelLine tooltip={t("Initial attack vector or entry point")}>{t("Initial Vector")}</LabelLine>
                        <Form.Control value={form.initial_vector} onChange={(e) => set("initial_vector", e.target.value)} placeholder={t("e.g. Phishing email, VPN exploit")} style={{ fontSize: "0.82rem" }} />
                      </Col>
                    </Row>

                    <Row className="g-3">
                      <Col xs={6}>
                        <LabelLine tooltip={t("Systems or applications directly impacted")}>{t("Affected Systems")}</LabelLine>
                        <Form.Control value={form.affected_systems} onChange={(e) => set("affected_systems", e.target.value)} placeholder={t("e.g. Finance Workstation, ERP")} style={{ fontSize: "0.82rem" }} />
                      </Col>
                      <Col xs={6}>
                        <LabelLine tooltip={t("Number or description of affected users or accounts")}>{t("Affected Users")}</LabelLine>
                        <Form.Control value={form.affected_users} onChange={(e) => set("affected_users", e.target.value)} placeholder={t("e.g. 3 finance staff, all admins")} style={{ fontSize: "0.82rem" }} />
                      </Col>
                    </Row>
                  </div>
                </Col>

                <Col lg={4}>
                  <LabelLine tooltip={t("Current response status of this incident")}>{t("Status")}</LabelLine>
                  <Form.Select value={form.status} onChange={(e) => set("status", e.target.value)} style={{ fontSize: "0.82rem" }}>
                    {STATUSES.map((o) => <option key={o} value={o}>{o}</option>)}
                  </Form.Select>
                </Col>
              </Row>
            </Section>

            {/* Classification & Priority */}
            <Section title={t("Classification & Priority")} open={sections.classification} onToggle={() => toggle("classification")}>
              <div className="mb-3">
                <LabelLine required tooltip={t("Priority determines the response SLA and escalation path")}>{t("Priority")}</LabelLine>
                <Row className="g-2">
                  {PRIORITIES.map((p) => {
                    const meta = PRIORITY_META[p];
                    const active = form.priority === p;
                    return (
                      <Col key={p} xs={6} sm={3}>
                        <button
                          type="button"
                          onClick={() => set("priority", p)}
                          className="w-100 d-flex flex-column gap-1 px-2 py-2 rounded text-start border"
                          style={{ background: active ? meta.bg : "#f9fafb", borderColor: active ? meta.border : "#e4e7ec", cursor: "pointer" }}
                        >
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: active ? meta.color : "#667085" }}>{p}</span>
                          <span style={{ fontSize: "0.7rem", lineHeight: 1.2, color: active ? meta.color : "#98a2b3" }}>{meta.desc}</span>
                        </button>
                      </Col>
                    );
                  })}
                </Row>
                {errors.priority && <div style={{ color: "#d9534f", fontSize: "0.72rem", marginTop: 4 }}>{errors.priority}</div>}
              </div>

              <div className="mb-3">
                <LabelLine required tooltip={t("Business impact severity of this incident")}>{t("Severity")}</LabelLine>
                <Row className="g-2">
                  {SEVERITIES.map((s) => {
                    const cs = SEV_COLORS[s];
                    const active = form.severity === s;
                    return (
                      <Col key={s} xs={3}>
                        <button
                          type="button"
                          onClick={() => set("severity", s)}
                          className="w-100 py-2 rounded border"
                          style={{ background: active ? cs.bg : "#f9fafb", borderColor: active ? cs.border : "#e4e7ec", color: active ? cs.color : "#98a2b3", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}
                        >
                          {s}
                        </button>
                      </Col>
                    );
                  })}
                </Row>
                {errors.severity && <div style={{ color: "#d9534f", fontSize: "0.72rem", marginTop: 4 }}>{errors.severity}</div>}
              </div>

              <div>
                <LabelLine tooltip={t("Tags to categorise and quickly identify this incident")}>{t("Tags")}</LabelLine>
                <div className="d-flex gap-2">
                  <Form.Control
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    placeholder={t("Add tag + Enter")}
                    style={{ fontSize: "0.82rem" }}
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={addTag}>{t("Add")}</Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="d-flex flex-wrap gap-1 mt-2">
                    {form.tags.map((tg) => (
                      <span key={tg} className="d-flex align-items-center gap-1 px-2 py-1 rounded" style={{ background: "#f4f7f9", border: "1px solid #e4e7ec", fontSize: "0.72rem", color: "#667085" }}>
                        {tg}
                        <button type="button" onClick={() => removeTag(tg)} className="btn btn-link p-0" style={{ color: "#98a2b3" }}>
                          <FontAwesomeIcon icon={faXmark} style={{ fontSize: 10 }} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Section>

            {/* Assignment & Detection */}
            <Section title={t("Assignment & Detection")} open={sections.assignment} onToggle={() => toggle("assignment")}>
              <Row className="g-3">
                <Col xs={6}>
                  <LabelLine required tooltip={t("The team or individual leading the incident response")}>{t("Assigned To")}</LabelLine>
                  <Form.Control list="assignee-list" value={form.assigned_to} onChange={(e) => set("assigned_to", e.target.value)} placeholder={t("e.g. IR Team")} isInvalid={!!errors.assigned_to} style={{ fontSize: "0.82rem" }} />
                  <datalist id="assignee-list">
                    {ASSIGNEES.map((a) => <option key={a} value={a} />)}
                  </datalist>
                  {errors.assigned_to && <div style={{ color: "#d9534f", fontSize: "0.72rem", marginTop: 4 }}>{errors.assigned_to}</div>}
                </Col>
                <Col xs={6}>
                  <LabelLine required tooltip={t("How or who detected this incident (e.g. EDR alert, user report)")}>{t("Reported By / Detection Source")}</LabelLine>
                  <Form.Control list="reporter-list" value={form.reported_by} onChange={(e) => set("reported_by", e.target.value)} placeholder={t("e.g. SIEM Alert")} isInvalid={!!errors.reported_by} style={{ fontSize: "0.82rem" }} />
                  <datalist id="reporter-list">
                    {REPORTERS.map((r) => <option key={r} value={r} />)}
                  </datalist>
                  {errors.reported_by && <div style={{ color: "#d9534f", fontSize: "0.72rem", marginTop: 4 }}>{errors.reported_by}</div>}
                </Col>
              </Row>
            </Section>

            {/* Timeline */}
            <Section title={t("Timeline")} open={sections.timeline} onToggle={() => toggle("timeline")}>
              <Row className="g-3">
                <Col xs={6}>
                  <LabelLine required tooltip={t("When the incident was first detected or reported")}>{t("Detection Time")}</LabelLine>
                  <Form.Control type="datetime-local" value={form.detected_at} onChange={(e) => set("detected_at", e.target.value)} style={{ fontSize: "0.82rem" }} />
                </Col>
                <Col xs={6}>
                  <LabelLine tooltip={t("When the incident was fully resolved (leave blank if still open)")}>{t("Resolution Time")}</LabelLine>
                  <Form.Control type="datetime-local" value={form.resolved_at} onChange={(e) => set("resolved_at", e.target.value)} style={{ fontSize: "0.82rem" }} />
                </Col>
              </Row>
            </Section>

            {/* Additional Details */}
            <Section title={t("Additional Details")} open={sections.additional} onToggle={() => toggle("additional")}>
              <LabelLine tooltip={t("Attach evidence, screenshots, PCAP files, or forensic reports")}>{t("Attach File(s)")}</LabelLine>
              <div
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="d-flex align-items-center gap-3 px-3 py-3 rounded"
                style={{ background: "#f9fafb", border: "1px solid #e4e7ec", cursor: "pointer" }}
              >
                <FontAwesomeIcon icon={faUpload} style={{ fontSize: 18, color: "#3B82EC" }} />
                <span style={{ flex: 1, fontSize: "0.82rem", color: "#98a2b3" }}>
                  {attachments.length === 0 ? t("Click to upload evidence files") : `${t("Uploaded")} (${attachments.length})`}
                </span>
              </div>
              <input ref={fileInputRef} type="file" multiple className="d-none" onChange={(e) => { setAttachments((p) => [...p, ...Array.from(e.target.files || [])]); e.target.value = ""; }} />
              {attachments.length > 0 && (
                <div className="mt-2 d-flex flex-column gap-1">
                  {attachments.map((file, i) => (
                    <div key={i} className="d-flex align-items-center gap-2 px-3 py-2 rounded" style={{ background: "#f9fafb", border: "1px solid #e4e7ec" }}>
                      <FontAwesomeIcon icon={faFileLines} style={{ fontSize: 13, color: "#667085" }} />
                      <span style={{ flex: 1, fontSize: "0.75rem", color: "#344054", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
                      <span style={{ fontSize: "0.72rem", color: "#98a2b3" }}>{(file.size / 1024).toFixed(1)} KB</span>
                      <button type="button" onClick={() => setAttachments((p) => p.filter((_, idx) => idx !== i))} className="btn btn-link p-0" style={{ color: "#98a2b3" }}>
                        <FontAwesomeIcon icon={faCircleXmark} style={{ fontSize: 14 }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button type="button" variant="outline-secondary" size="sm" onClick={onHide}>
            <FontAwesomeIcon icon={faXmark} className="me-1" /> {t("Close")}
          </Button>
          <Button type="submit" variant="danger" size="sm">
            <FontAwesomeIcon icon={faTriangleExclamation} className="me-1" /> {t("Declare Incident")}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default DeclareIncidentForm;
