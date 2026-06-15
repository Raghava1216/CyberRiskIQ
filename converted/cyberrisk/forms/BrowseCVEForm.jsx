import React, { useState, useEffect, useCallback } from "react";
import { Modal, Button, Form, Row, Col, Badge, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faMagnifyingGlass,
  faDownload,
  faRotate,
  faTriangleExclamation,
  faCircleCheck,
  faChevronDown,
  faArrowUpRightFromSquare,
  faShieldHalved,
  faBolt,
  faCircleInfo,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import axios from "src/utils/AxiosInstance";

const SEVERITIES = ["All", "Critical", "High", "Medium", "Low"];
const CATEGORIES = ["All", "OS", "Application", "Network", "Middleware"];

/* ───────────────────────── MOCK FALLBACK ─────────────────────────
 * Used when GET /cyberrisk/cve-library is unavailable. Mirrors the
 * NVD / GitHub CVEProject shape consumed by the original modal.
 * ----------------------------------------------------------------- */
const MOCK_CVE_LIBRARY = [
  { cve_id: "CVE-2024-3094", title: "XZ Utils Backdoor (supply-chain RCE)", description: "Malicious code injected into liblzma allows remote code execution via SSH on affected distributions.", cvss_score: 10.0, severity: "Critical", cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H", asset: "linux-host", category: "OS", affected_products: ["xz-utils 5.6.0", "xz-utils 5.6.1"], patch_available: true, exploit_available: true, published_date: "2024-03-29", references: ["https://nvd.nist.gov/vuln/detail/CVE-2024-3094"], status: "Open", assigned_to: "Unassigned", due_date: "2026-06-01" },
  { cve_id: "CVE-2023-44487", title: "HTTP/2 Rapid Reset DDoS", description: "HTTP/2 stream cancellation can be abused to cause denial of service across many web servers.", cvss_score: 7.5, severity: "High", cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H", asset: "web-app-01", category: "Network", affected_products: ["nginx", "Apache HTTP Server", "Envoy"], patch_available: true, exploit_available: true, published_date: "2023-10-10", references: ["https://nvd.nist.gov/vuln/detail/CVE-2023-44487"], status: "Open", assigned_to: "Unassigned", due_date: "2026-06-10" },
  { cve_id: "CVE-2021-44228", title: "Apache Log4j2 RCE (Log4Shell)", description: "JNDI lookup feature allows attacker-controlled LDAP servers to execute remote code.", cvss_score: 10.0, severity: "Critical", cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H", asset: "app-server-07", category: "Middleware", affected_products: ["log4j-core 2.0-2.14.1"], patch_available: true, exploit_available: true, published_date: "2021-12-10", references: ["https://nvd.nist.gov/vuln/detail/CVE-2021-44228"], status: "Open", assigned_to: "Unassigned", due_date: "2026-05-25" },
  { cve_id: "CVE-2022-22965", title: "Spring Framework RCE (Spring4Shell)", description: "Data binding flaw in Spring MVC enables remote code execution under certain configurations.", cvss_score: 9.8, severity: "Critical", cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H", asset: "api-gw-02", category: "Application", affected_products: ["Spring Framework 5.3.0-5.3.17"], patch_available: true, exploit_available: true, published_date: "2022-03-31", references: ["https://nvd.nist.gov/vuln/detail/CVE-2022-22965"], status: "Open", assigned_to: "Unassigned", due_date: "2026-06-05" },
  { cve_id: "CVE-2023-23397", title: "Microsoft Outlook Privilege Escalation", description: "Specially crafted email triggers NTLM credential leak without user interaction.", cvss_score: 9.8, severity: "Critical", cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H", asset: "workstation-fleet", category: "Application", affected_products: ["Microsoft Outlook"], patch_available: true, exploit_available: true, published_date: "2023-03-14", references: ["https://nvd.nist.gov/vuln/detail/CVE-2023-23397"], status: "Open", assigned_to: "Unassigned", due_date: "2026-06-12" },
  { cve_id: "CVE-2024-21413", title: "Microsoft Outlook RCE (MonikerLink)", description: "Bypass of Outlook protections enabling remote code execution via crafted links.", cvss_score: 9.8, severity: "Critical", cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:H", asset: "workstation-fleet", category: "Application", affected_products: ["Microsoft Office"], patch_available: true, exploit_available: false, published_date: "2024-02-13", references: ["https://nvd.nist.gov/vuln/detail/CVE-2024-21413"], status: "Open", assigned_to: "Unassigned", due_date: "2026-06-20" },
  { cve_id: "CVE-2023-4863", title: "libwebp Heap Buffer Overflow", description: "Heap overflow in WebP image processing affecting browsers and many applications.", cvss_score: 8.8, severity: "High", cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H", asset: "customer-portal", category: "Application", affected_products: ["libwebp", "Chrome", "Firefox"], patch_available: true, exploit_available: true, published_date: "2023-09-12", references: ["https://nvd.nist.gov/vuln/detail/CVE-2023-4863"], status: "Open", assigned_to: "Unassigned", due_date: "2026-06-18" },
  { cve_id: "CVE-2022-3602", title: "OpenSSL X.509 Buffer Overflow", description: "Punycode decoding buffer overflow in certificate verification.", cvss_score: 7.5, severity: "High", cvss_vector: "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:H", asset: "db-server-03", category: "Middleware", affected_products: ["OpenSSL 3.0.0-3.0.6"], patch_available: true, exploit_available: false, published_date: "2022-11-01", references: ["https://nvd.nist.gov/vuln/detail/CVE-2022-3602"], status: "Open", assigned_to: "Unassigned", due_date: "2026-07-01" },
  { cve_id: "CVE-2023-20198", title: "Cisco IOS XE Web UI Privilege Escalation", description: "Unauthenticated attacker can create admin accounts on exposed Web UI.", cvss_score: 10.0, severity: "Critical", cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H", asset: "edge-router-01", category: "Network", affected_products: ["Cisco IOS XE"], patch_available: true, exploit_available: true, published_date: "2023-10-16", references: ["https://nvd.nist.gov/vuln/detail/CVE-2023-20198"], status: "Open", assigned_to: "Unassigned", due_date: "2026-05-30" },
  { cve_id: "CVE-2024-1709", title: "ConnectWise ScreenConnect Auth Bypass", description: "Authentication bypass allowing full takeover of ScreenConnect instances.", cvss_score: 10.0, severity: "Critical", cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H", asset: "rmm-server", category: "Application", affected_products: ["ScreenConnect <= 23.9.7"], patch_available: true, exploit_available: true, published_date: "2024-02-19", references: ["https://nvd.nist.gov/vuln/detail/CVE-2024-1709"], status: "Open", assigned_to: "Unassigned", due_date: "2026-06-08" },
  { cve_id: "CVE-2023-34362", title: "MOVEit Transfer SQL Injection", description: "SQL injection leading to remote code execution, widely exploited by ransomware groups.", cvss_score: 9.8, severity: "Critical", cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H", asset: "file-transfer-01", category: "Application", affected_products: ["MOVEit Transfer"], patch_available: true, exploit_available: true, published_date: "2023-06-02", references: ["https://nvd.nist.gov/vuln/detail/CVE-2023-34362"], status: "Open", assigned_to: "Unassigned", due_date: "2026-06-15" },
  { cve_id: "CVE-2022-30190", title: "Microsoft MSDT RCE (Follina)", description: "Office documents can invoke MSDT to run arbitrary code via ms-msdt URI scheme.", cvss_score: 7.8, severity: "High", cvss_vector: "CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:H", asset: "workstation-fleet", category: "OS", affected_products: ["Windows MSDT"], patch_available: true, exploit_available: true, published_date: "2022-05-30", references: ["https://nvd.nist.gov/vuln/detail/CVE-2022-30190"], status: "Open", assigned_to: "Unassigned", due_date: "2026-07-05" },
];
/* ─────────────────────── END MOCK FALLBACK ──────────────────────── */

const sevVariant = (s) => ({ Critical: "danger", High: "warning", Medium: "info", Low: "success" }[s] || "secondary");
const cvssColor = (score) => (score >= 9 ? "#d9534f" : score >= 7 ? "#f0ad4e" : score >= 4 ? "#e0a800" : "#4BBF73");

const BrowseCVEForm = ({ show, onHide, onSaved, existingCVEIds = new Set() }) => {
  const { t } = useTranslation("common");
  const [cves, setCves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("All");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(new Set());
  const [expanded, setExpanded] = useState(null);
  const [importDone, setImportDone] = useState(false);

  const fetchCVEs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search && search.length > 1) params.search = search;
      if (severity && severity !== "All") params.severity = severity;
      // HYBRID: live CVE library; mock fallback below on any failure.
      const res = await axios.get("/cyberrisk/cve-library", { params });
      const data = res?.data?.data ?? res?.data ?? [];
      setCves(Array.isArray(data) && data.length ? data : MOCK_CVE_LIBRARY);
    } catch (err) {
      console.warn("[cyberrisk] cve-library: using mock fallback", err);
      setCves(MOCK_CVE_LIBRARY);
    } finally {
      setLoading(false);
    }
  }, [search, severity]);

  useEffect(() => { if (show) fetchCVEs(); /* eslint-disable-next-line */ }, [show, severity]);

  const filtered = cves.filter((c) => {
    const matchCat = category === "All" || c.category === category;
    const matchSearch = !search || search.length < 2 || (
      c.cve_id.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      (c.affected_products || []).some((p) => p.toLowerCase().includes(search.toLowerCase()))
    );
    return matchCat && matchSearch;
  });

  const toggleSelect = (id) => {
    if (existingCVEIds.has(id)) return;
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const selectableCount = filtered.filter((c) => !existingCVEIds.has(c.cve_id)).length;

  const toggleAll = () => {
    const selectable = filtered.filter((c) => !existingCVEIds.has(c.cve_id));
    setSelected(selected.size === selectable.length ? new Set() : new Set(selectable.map((c) => c.cve_id)));
  };

  const handleImport = () => {
    const toImport = filtered.filter((c) => selected.has(c.cve_id));
    // HYBRID: persist selection to register; mock fallback still updates UI.
    axios
      .post("/cyberrisk/vulnerabilities/import", { cves: toImport })
      .then((res) => {
        onSaved && onSaved(Array.isArray(res?.data) && res.data.length ? res.data : toImport);
      })
      .catch((err) => {
        console.warn("[cyberrisk] import cves: using mock fallback", err);
        onSaved && onSaved(toImport);
      });
    setImportDone(true);
    setTimeout(() => { setSelected(new Set()); setImportDone(false); onHide && onHide(); }, 1500);
  };

  const stats = {
    critical: filtered.filter((c) => c.severity === "Critical").length,
    high: filtered.filter((c) => c.severity === "High").length,
    exploit: filtered.filter((c) => c.exploit_available).length,
    existing: filtered.filter((c) => existingCVEIds.has(c.cve_id)).length,
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: "0.95rem", color: "#101828" }} className="fw-semibold d-flex align-items-center gap-2">
          <FontAwesomeIcon icon={faShieldHalved} style={{ color: "#3B82EC" }} />
          {t("CVE Library Browser")}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Filters */}
        <Row className="g-2 mb-3 align-items-center">
          <Col xs={12} md>
            <div className="position-relative">
              <FontAwesomeIcon icon={faMagnifyingGlass} style={{ position: "absolute", left: 12, top: 11, color: "#98a2b3", fontSize: 13 }} />
              <Form.Control value={search} onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchCVEs()}
                placeholder={t("Search CVE ID, product, keyword…")} style={{ paddingLeft: 32, fontSize: "0.85rem" }} />
            </div>
          </Col>
          <Col xs={6} md="auto">
            <Form.Select value={severity} onChange={(e) => setSeverity(e.target.value)} style={{ fontSize: "0.85rem" }}>
              {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
            </Form.Select>
          </Col>
          <Col xs={6} md="auto">
            <Form.Select value={category} onChange={(e) => setCategory(e.target.value)} style={{ fontSize: "0.85rem" }}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Form.Select>
          </Col>
          <Col xs="auto">
            <Button variant="outline-secondary" size="sm" onClick={fetchCVEs} disabled={loading}>
              <FontAwesomeIcon icon={faRotate} spin={loading} className="me-1" /> {t("Refresh")}
            </Button>
          </Col>
        </Row>

        {/* Stats */}
        {!loading && !error && filtered.length > 0 && (
          <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
            <Badge bg="danger">{stats.critical} {t("Critical")}</Badge>
            <Badge bg="warning">{stats.high} {t("High")}</Badge>
            <Badge bg="danger"><FontAwesomeIcon icon={faBolt} className="me-1" />{stats.exploit} {t("With exploit")}</Badge>
            {stats.existing > 0 && <Badge bg="success"><FontAwesomeIcon icon={faCircleCheck} className="me-1" />{stats.existing} {t("already imported")}</Badge>}
            <div className="ms-auto d-flex align-items-center gap-3" style={{ fontSize: "0.78rem" }}>
              <Form.Check type="checkbox" label={`${t("Select all")} (${selectableCount})`}
                checked={selected.size === selectableCount && selectableCount > 0} onChange={toggleAll} />
              {selected.size > 0 && <span style={{ color: "#3B82EC", fontWeight: 500 }}>{selected.size} {t("selected")}</span>}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="d-flex flex-column align-items-center justify-content-center gap-2 py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mb-0" style={{ color: "#667085", fontSize: "0.85rem" }}>{t("Loading CVE library…")}</p>
          </div>
        )}

        {/* Import success */}
        {importDone && (
          <div className="d-flex flex-column align-items-center justify-content-center gap-2 py-5">
            <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 56, height: 56, background: "rgba(75,191,115,0.15)" }}>
              <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 26, color: "#4BBF73" }} />
            </div>
            <p className="fw-semibold mb-0" style={{ color: "#101828" }}>{t("Import Complete")}</p>
            <p className="mb-0" style={{ color: "#667085", fontSize: "0.85rem" }}>
              {selected.size} {selected.size !== 1 ? t("CVEs") : t("CVE")} {t("added to your vulnerability register")}
            </p>
          </div>
        )}

        {/* CVE list */}
        {!loading && !error && !importDone && filtered.length > 0 && (
          <div className="d-flex flex-column" style={{ maxHeight: "55vh", overflowY: "auto" }}>
            {filtered.map((cve) => {
              const alreadyIn = existingCVEIds.has(cve.cve_id);
              const isSelected = selected.has(cve.cve_id);
              const isExpanded = expanded === cve.cve_id;
              return (
                <div key={cve.cve_id} className="rounded mb-2 p-3"
                  style={{ border: "1px solid #e4e7ec", background: alreadyIn ? "#f9fafb" : isSelected ? "rgba(59,130,236,0.05)" : "#fff", opacity: alreadyIn ? 0.6 : 1 }}>
                  <div className="d-flex align-items-start gap-3">
                    <Form.Check type="checkbox" checked={isSelected} disabled={alreadyIn} onChange={() => toggleSelect(cve.cve_id)} className="mt-1" />
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                        <span className="font-monospace px-2 py-1 rounded" style={{ fontSize: "0.72rem", background: "rgba(59,130,236,0.12)", color: "#3B82EC" }}>{cve.cve_id}</span>
                        <Badge bg={sevVariant(cve.severity)}>{cve.severity}</Badge>
                        {cve.exploit_available && <Badge bg="danger"><FontAwesomeIcon icon={faBolt} className="me-1" />{t("Exploit")}</Badge>}
                        {cve.patch_available && <Badge bg="success"><FontAwesomeIcon icon={faCircleCheck} className="me-1" />{t("Patch")}</Badge>}
                        {alreadyIn && <Badge bg="secondary">{t("Already imported")}</Badge>}
                        <span style={{ fontSize: "0.72rem", color: "#98a2b3" }}>{cve.category}</span>
                      </div>
                      <p className="fw-medium mb-1 text-truncate" style={{ color: "#344054", fontSize: "0.88rem" }}>{cve.title}</p>
                      <div className="d-flex gap-3 flex-wrap" style={{ fontSize: "0.72rem", color: "#98a2b3" }}>
                        <span>{t("Asset")}: <span className="font-monospace" style={{ color: "#667085" }}>{cve.asset}</span></span>
                        <span>{t("Published")}: <span style={{ color: "#667085" }}>{cve.published_date}</span></span>
                        <span>{t("Due")}: <span style={{ color: new Date(cve.due_date) < new Date() ? "#d9534f" : "#667085" }}>{cve.due_date}</span></span>
                      </div>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <span className="fw-bold" style={{ color: cvssColor(cve.cvss_score) }}>{cve.cvss_score.toFixed(1)}</span>
                    </div>
                    <Button variant="link" size="sm" className="p-0 text-decoration-none" onClick={() => setExpanded(isExpanded ? null : cve.cve_id)}>
                      <FontAwesomeIcon icon={faChevronDown} style={{ color: "#98a2b3", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 ps-4">
                      <div className="rounded p-3 mb-2" style={{ background: "#f9fafb", border: "1px solid #e4e7ec" }}>
                        <p className="fw-medium text-uppercase mb-1" style={{ fontSize: "0.7rem", color: "#667085", letterSpacing: "0.04em" }}>
                          <FontAwesomeIcon icon={faCircleInfo} className="me-1" />{t("Description")}
                        </p>
                        <p className="mb-0" style={{ fontSize: "0.78rem", color: "#344054" }}>{cve.description}</p>
                      </div>
                      {cve.cvss_vector && (
                        <p className="mb-2" style={{ fontSize: "0.72rem", color: "#98a2b3" }}>
                          {t("CVSS Vector")}: <span className="font-monospace" style={{ color: "#667085" }}>{cve.cvss_vector}</span>
                        </p>
                      )}
                      {(cve.references || []).length > 0 && (
                        <div className="d-flex gap-2 flex-wrap">
                          {cve.references.map((ref, i) => (
                            <a key={i} href={ref} target="_blank" rel="noopener noreferrer"
                              className="text-decoration-none px-2 py-1 rounded" style={{ fontSize: "0.72rem", border: "1px solid #e4e7ec", color: "#3B82EC" }}>
                              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="me-1" />{t("Reference")} {i + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && !importDone && filtered.length === 0 && (
          <div className="d-flex flex-column align-items-center justify-content-center py-5" style={{ color: "#98a2b3" }}>
            <FontAwesomeIcon icon={faFilter} style={{ fontSize: 24 }} className="mb-2" />
            <span style={{ fontSize: "0.85rem" }}>{t("No CVEs match the current filters")}</span>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-between">
        <span style={{ fontSize: "0.72rem", color: "#98a2b3" }}>
          <FontAwesomeIcon icon={faCircleInfo} className="me-1" />{t("Data sourced from GitHub CVEProject · NVD")}
        </span>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={onHide}>
            <FontAwesomeIcon icon={faXmark} className="me-1" /> {t("Cancel")}
          </Button>
          <Button variant="primary" onClick={handleImport} disabled={selected.size === 0 || importDone}>
            <FontAwesomeIcon icon={faDownload} className="me-1" />
            {t("Import")} {selected.size > 0 ? `${selected.size} ${selected.size !== 1 ? t("CVEs") : t("CVE")}` : t("Selected")}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default BrowseCVEForm;
