import React, { useState, useEffect } from "react";
import { Row, Col, Card, Badge, Button, Form, InputGroup, Table, ProgressBar } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMagnifyingGlass,
  faServer,
  faCloud,
  faMicrochip,
  faDesktop,
  faUpload,
  faCircleCheck,
  faTriangleExclamation,
  faShieldHalved,
  faTag,
  faDollarSign,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import axios from "src/utils/AxiosInstance";
import AddAssetForm from "src/modules/cyberrisk/forms/AddAssetForm";
import ImportAssetCSVForm from "src/modules/cyberrisk/forms/ImportAssetCSVForm";

// ===================== MOCK FALLBACK (remove once backend is live) =====================
// Copied from the original threat-dashboard mock data so the page renders before the
// real `/cyberrisk/assets` endpoint exists. Delete this block (and the fallback
// initial-state assignment below) once the endpoint returns data.
const MOCK_ASSETS = [
  { id: "1", name: "Core Banking System", type: "Application", asset_class: "Primary", category: "IT", criticality: "Critical", status: "Active", ip_address: "10.0.1.100", location: "DC-Primary", owner: "Banking Ops", risk_score: 85, vulnerability_count: 3, open_cve_count: 2, last_scanned_at: "2026-05-12T10:00:00Z", regulatory_scope: ["PCI DSS", "DORA", "SOC 2"], data_classification: "Restricted", business_function: "Core Transaction Processing", annual_value: 50000000 },
  { id: "2", name: "Customer Web Portal", type: "Application", asset_class: "Primary", category: "Cloud", criticality: "High", status: "Active", ip_address: "10.0.2.50", location: "AWS-US-East", owner: "Digital Team", risk_score: 72, vulnerability_count: 5, open_cve_count: 3, last_scanned_at: "2026-05-12T10:30:00Z", regulatory_scope: ["GDPR", "PCI DSS", "SOC 2"], data_classification: "Confidential", business_function: "Customer Self-Service", annual_value: 12000000 },
  { id: "3", name: "HR Database Server", type: "Database", asset_class: "Supporting", category: "IT", criticality: "High", status: "Active", ip_address: "10.0.3.20", location: "DC-Primary", owner: "HR IT", risk_score: 65, vulnerability_count: 2, open_cve_count: 1, last_scanned_at: "2026-05-11T14:00:00Z", regulatory_scope: ["GDPR", "ISO 27001"], data_classification: "Restricted", business_function: "HR & Payroll Data Storage", annual_value: 3500000 },
  { id: "4", name: "Trading Platform API", type: "Application", asset_class: "Primary", category: "IT", criticality: "Critical", status: "Active", ip_address: "10.0.1.150", location: "DC-Secondary", owner: "Trading Ops", risk_score: 78, vulnerability_count: 4, open_cve_count: 2, last_scanned_at: "2026-05-12T09:00:00Z", regulatory_scope: ["DORA", "PCI DSS", "MiFID II"], data_classification: "Confidential", business_function: "Real-time Trading Execution", annual_value: 28000000 },
  { id: "5", name: "Enterprise Firewall", type: "Network", asset_class: "Supporting", category: "IT", criticality: "Critical", status: "Active", ip_address: "192.168.1.1", location: "DC-Primary", owner: "Network Team", risk_score: 45, vulnerability_count: 1, open_cve_count: 0, last_scanned_at: "2026-05-10T16:00:00Z", regulatory_scope: ["NIST CSF", "ISO 27001", "NIS2"], data_classification: "Internal", business_function: "Network Perimeter Security", annual_value: 2000000 },
  { id: "6", name: "Development Workstations (Batch)", type: "Workstation", asset_class: "Supporting", category: "IT", criticality: "Medium", status: "Active", ip_address: "10.0.5.0/24", location: "HQ Floor 3", owner: "Engineering", risk_score: 38, vulnerability_count: 8, open_cve_count: 5, last_scanned_at: "2026-05-09T11:00:00Z", regulatory_scope: ["ISO 27001"], data_classification: "Internal", business_function: "Software Development", annual_value: 1200000 },
  { id: "7", name: "Backup Storage Array", type: "Server", asset_class: "Supporting", category: "IT", criticality: "High", status: "Active", ip_address: "10.0.4.80", location: "DC-Secondary", owner: "Infra Team", risk_score: 30, vulnerability_count: 0, open_cve_count: 0, last_scanned_at: "2026-05-08T08:00:00Z", regulatory_scope: ["DORA", "ISO 22301", "SOC 2"], data_classification: "Restricted", business_function: "Business Continuity / DR", annual_value: 5000000 },
  { id: "8", name: "ATM Network Controller", type: "IoT", asset_class: "Primary", category: "OT", criticality: "Critical", status: "Active", ip_address: "172.16.10.1", location: "Operations", owner: "ATM Ops", risk_score: 91, vulnerability_count: 6, open_cve_count: 4, last_scanned_at: "2026-05-07T15:00:00Z", regulatory_scope: ["PCI DSS", "DORA", "NIS2"], data_classification: "Restricted", business_function: "ATM & Cash Dispensing Network", annual_value: 18000000 },
];
// ======================================================================================

const CATEGORIES = ["All", "IT", "OT", "Cloud", "Mobile"];
const CRITICALITIES = ["All", "Critical", "High", "Medium", "Low"];
const CLASSES = ["All", "Primary", "Supporting", "External"];
const REG_SCOPE = ["All", "DORA", "NIS2", "GDPR", "PCI DSS", "SOC 2", "ISO 27001", "MiFID II"];

const typeIcon = (type) => {
  if (type === "Cloud" || type === "Application" || type === "Cloud Service") return faCloud;
  if (type === "IoT") return faMicrochip;
  if (type === "Workstation") return faDesktop;
  return faServer;
};

const critVariant = (c) => {
  if (c === "Critical") return "danger";
  if (c === "High") return "warning";
  if (c === "Medium") return "warning";
  return "success";
};

const critStyle = (c) => {
  if (c === "High") return { backgroundColor: "#fd7e14", color: "#fff" };
  if (c === "Medium") return { backgroundColor: "#f0ad4e", color: "#212529" };
  return {};
};

const critIconStyle = (c) => {
  if (c === "Critical") return { background: "rgba(217,83,79,0.12)", color: "#d9534f" };
  if (c === "High") return { background: "rgba(253,126,20,0.12)", color: "#fd7e14" };
  if (c === "Medium") return { background: "rgba(240,173,78,0.12)", color: "#b07d20" };
  return { background: "#f4f7f9", color: "#6c757d" };
};

const dataClassBadge = (d) => {
  if (d === "Restricted") return { bg: "danger", label: d };
  if (d === "Confidential") return { bg: "warning", label: d };
  if (d === "Internal") return { bg: "secondary", label: d };
  return { bg: "light", label: d };
};

const assetClassStyle = (c) => {
  if (c === "Primary") return { background: "rgba(59,130,236,0.1)", color: "#3B82EC", border: "1px solid rgba(59,130,236,0.3)", fontSize: "0.7rem" };
  if (c === "Supporting") return { background: "rgba(31,155,207,0.1)", color: "#1F9BCF", border: "1px solid rgba(31,155,207,0.3)", fontSize: "0.7rem" };
  return { background: "#f4f7f9", color: "#6c757d", border: "1px solid #dee2e6", fontSize: "0.7rem" };
};

const riskVariant = (score) => {
  if (score >= 80) return "danger";
  if (score >= 60) return "warning";
  if (score >= 40) return "warning";
  return "success";
};

const riskStyle = (score) => {
  if (score >= 60 && score < 80) return { backgroundColor: "#fd7e14" };
  if (score >= 40 && score < 60) return { backgroundColor: "#f0ad4e" };
  return {};
};

const fmt$ = (n) =>
  n >= 1000000 ? `$${(n / 1000000).toFixed(0)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

const Assets = ({ year, currentUserInfo, refreshCharts, onNavigate }) => {
  const { t } = useTranslation("common");

  const timeAgo = (iso) => {
    if (!iso) return t("Never");
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return t("just now");
    if (h < 24) return `${h}${t("h ago")}`;
    return `${Math.floor(h / 24)}${t("d ago")}`;
  };

  // Hybrid data — mock fallback as initial state, axios overrides on success.
  const [assets, setAssets] = useState(MOCK_ASSETS);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [criticality, setCriticality] = useState("All");
  const [assetClass, setAssetClass] = useState("All");
  const [regScope, setRegScope] = useState("All");
  const [view, setView] = useState("grid");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 5000); };

  useEffect(() => {
    const logInId = currentUserInfo?.logInId;
    // HYBRID: real backend call — replaces the mock fallback above on success.
    axios
      .get(`/cyberrisk/assets/${logInId}?year=${Number(year)}`)
      .then((res) => {
        const d = res?.data;
        const list = Array.isArray(d) ? d : d?.assets;
        if (Array.isArray(list) && list.length) setAssets(list);
      })
      .catch((err) => {
        console.warn("[cyberrisk] assets: using mock fallback", err);
      });
  }, [year, currentUserInfo, refreshCharts]);

  const handleAddAsset = (asset) => {
    const full = { ...asset, asset_class: asset.asset_class || "Supporting" };
    setAssets((prev) => [full, ...prev]);
    showToast(`${t("Asset")} "${asset.name}" ${t("added")}`);
  };

  const handleImportAssets = (newAssets) => {
    const list = Array.isArray(newAssets) ? newAssets : [];
    const fullAssets = list.map((a) => ({ ...a, asset_class: a.asset_class || "Supporting" }));
    setAssets((prev) => [...fullAssets, ...prev]);
    showToast(`${list.length} ${t("asset(s) imported")}`);
  };

  const filtered = assets.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = a.name.toLowerCase().includes(q) || (a.owner || "").toLowerCase().includes(q) || (a.ip_address || "").includes(q);
    const matchCat = category === "All" || a.category === category;
    const matchCrit = criticality === "All" || a.criticality === criticality;
    const matchClass = assetClass === "All" || a.asset_class === assetClass;
    const matchReg = regScope === "All" || (a.regulatory_scope ?? []).includes(regScope);
    return matchSearch && matchCat && matchCrit && matchClass && matchReg;
  });

  const stats = {
    total: assets.length,
    critical: assets.filter((a) => a.criticality === "Critical").length,
    highRisk: assets.filter((a) => a.risk_score >= 70).length,
    openCVEs: assets.reduce((s, a) => s + (a.open_cve_count ?? 0), 0),
    totalValue: assets.reduce((s, a) => s + (a.annual_value ?? 0), 0),
  };

  const statCards = [
    { label: t("Total Assets"), value: stats.total, cls: "stat-card-primary", color: "#3B82EC", icon: faServer },
    { label: t("Critical Assets"), value: stats.critical, cls: "stat-card-danger", color: "#d9534f", icon: faTriangleExclamation },
    { label: t("High Risk"), value: stats.highRisk, cls: "stat-card-warning", color: "#fd7e14", icon: faShieldHalved },
    { label: t("Open CVEs"), value: stats.openCVEs, cls: "stat-card-warning", color: "#f0ad4e", icon: faTag },
    { label: t("Total Asset Value"), value: fmt$(stats.totalValue), cls: "stat-card-success", color: "#4BBF73", icon: faDollarSign },
  ];

  return (
    <div className="progrec-page p-3 p-lg-4">
      <AddAssetForm show={addOpen} onHide={() => setAddOpen(false)} onSaved={handleAddAsset} />
      <ImportAssetCSVForm show={importOpen} onHide={() => setImportOpen(false)} onSaved={handleImportAssets} />

      {toast && (
        <div className="pg-toast">
          <FontAwesomeIcon icon={faCircleCheck} style={{ color: "#4BBF73" }} />
          <span>{toast}</span>
        </div>
      )}

      {/* Page header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1">{t("Asset Inventory")}</h4>
          <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
            {assets.length} {t("assets · Regulatory scope · CVE tracking · Business value")}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={() => setImportOpen(true)} className="d-flex align-items-center gap-2">
            <FontAwesomeIcon icon={faUpload} /> {t("Import CSV")}
          </Button>
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)} className="d-flex align-items-center gap-2">
            <FontAwesomeIcon icon={faPlus} /> {t("Add Asset")}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Row className="g-3 mb-4">
        {statCards.map((s) => (
          <Col key={s.label} xs={6} md={4} lg="auto" className="flex-lg-fill">
            <Card className={`shadow-sm border h-100 ${s.cls}`}>
              <Card.Body className="py-3 px-3">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <FontAwesomeIcon icon={s.icon} style={{ color: s.color }} />
                  <span className="fw-bold" style={{ fontSize: "1.3rem", color: s.color }}>{s.value}</span>
                </div>
                <div className="text-muted" style={{ fontSize: "0.78rem" }}>{s.label}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <Row className="g-2 mb-3 align-items-center">
        <Col xs={12} md={4}>
          <InputGroup size="sm">
            <InputGroup.Text className="bg-white border-end-0">
              <FontAwesomeIcon icon={faMagnifyingGlass} style={{ color: "#6c757d" }} />
            </InputGroup.Text>
            <Form.Control value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Search assets, IPs, owners…")} className="border-start-0 ps-0" />
          </InputGroup>
        </Col>
        <Col xs="auto">
          <Form.Select size="sm" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((o) => <option key={`cat-${o}`} value={o}>{o}</option>)}
          </Form.Select>
        </Col>
        <Col xs="auto">
          <Form.Select size="sm" value={criticality} onChange={(e) => setCriticality(e.target.value)}>
            {CRITICALITIES.map((o) => <option key={`crit-${o}`} value={o}>{o}</option>)}
          </Form.Select>
        </Col>
        <Col xs="auto">
          <Form.Select size="sm" value={assetClass} onChange={(e) => setAssetClass(e.target.value)}>
            {CLASSES.map((o) => <option key={`cls-${o}`} value={o}>{o}</option>)}
          </Form.Select>
        </Col>
        <Col xs="auto">
          <Form.Select size="sm" value={regScope} onChange={(e) => setRegScope(e.target.value)}>
            {REG_SCOPE.map((o) => <option key={`reg-${o}`} value={o}>{o}</option>)}
          </Form.Select>
        </Col>
        <Col xs="auto" className="ms-auto">
          <div className="btn-group btn-group-sm">
            <Button variant={view === "grid" ? "primary" : "outline-secondary"} onClick={() => setView("grid")}>{t("Grid")}</Button>
            <Button variant={view === "table" ? "primary" : "outline-secondary"} onClick={() => setView("table")}>{t("Table")}</Button>
          </div>
        </Col>
      </Row>

      {/* Grid view */}
      {view === "grid" && (
        <Row className="g-3">
          {filtered.map((asset) => {
            const dc = dataClassBadge(asset.data_classification ?? "");
            return (
              <Col key={asset.id} md={6} xl={4}>
                <Card className="asset-card shadow-sm h-100" style={{ borderColor: asset.criticality === "Critical" ? "rgba(217,83,79,0.25)" : undefined }}>
                  <Card.Body>
                    <div className="d-flex align-items-start gap-3 mb-3">
                      <div className="d-flex align-items-center justify-content-center rounded flex-shrink-0" style={{ width: 40, height: 40, ...critIconStyle(asset.criticality) }}>
                        <FontAwesomeIcon icon={typeIcon(asset.type)} style={{ fontSize: 18 }} />
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <h6 className="fw-semibold mb-0 text-truncate">{asset.name}</h6>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>{asset.type} · {asset.location}</div>
                      </div>
                      <div className="d-flex flex-column align-items-end gap-1">
                        <Badge bg={critVariant(asset.criticality)} style={critStyle(asset.criticality)}>{asset.criticality}</Badge>
                        {asset.asset_class && <span className="badge rounded-pill" style={assetClassStyle(asset.asset_class)}>{asset.asset_class}</span>}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1" style={{ fontSize: "0.75rem" }}>
                        <span className="text-muted">{t("Risk Score")}</span>
                        <span className="text-muted">{asset.owner}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <ProgressBar now={asset.risk_score} variant={riskVariant(asset.risk_score)} style={{ height: 6, flex: 1, borderRadius: 99, ...riskStyle(asset.risk_score) }} />
                        <span className="fw-bold" style={{ fontSize: "0.78rem", width: 24, textAlign: "right", color: asset.risk_score >= 80 ? "#d9534f" : asset.risk_score >= 60 ? "#fd7e14" : asset.risk_score >= 40 ? "#f0ad4e" : "#4BBF73" }}>{asset.risk_score}</span>
                      </div>
                    </div>

                    <div className="d-flex flex-wrap gap-1 mb-2">
                      {asset.open_cve_count > 0 && <Badge bg="danger" className="fw-semibold">{asset.open_cve_count} {asset.open_cve_count !== 1 ? t("CVEs") : t("CVE")}</Badge>}
                      {asset.vulnerability_count > 0 && <Badge bg="warning" className="fw-normal" style={{ color: "#212529" }}>{asset.vulnerability_count} {t("vulns")}</Badge>}
                      {asset.data_classification && <Badge bg={dc.bg} className="fw-normal" style={dc.bg === "light" ? { color: "#6c757d", border: "1px solid #dee2e6" } : {}}>{dc.label}</Badge>}
                    </div>

                    {(asset.regulatory_scope ?? []).length > 0 && (
                      <div className="d-flex flex-wrap gap-1 mb-2">
                        {(asset.regulatory_scope ?? []).map((r) => (
                          <span key={r} className="badge rounded-pill" style={{ background: "#f4f7f9", color: "#6c757d", border: "1px solid #dee2e6", fontSize: "0.68rem", fontWeight: 400 }}>{r}</span>
                        ))}
                      </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-2" style={{ fontSize: "0.75rem" }}>
                      <span className="text-muted font-monospace">{asset.ip_address}</span>
                      <div className="d-flex align-items-center gap-2">
                        {asset.annual_value > 0 && <span className="fw-medium" style={{ color: "#4BBF73" }}>{fmt$(asset.annual_value)}</span>}
                        <span className="text-muted">{t("Scanned")} {timeAgo(asset.last_scanned_at)}</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
          {filtered.length === 0 && (
            <Col xs={12}>
              <Card className="shadow-sm">
                <Card.Body className="py-5 text-center text-muted">{t("No assets match current filters.")}</Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* Table view */}
      {view === "table" && (
        <Card className="shadow-sm">
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle" style={{ fontSize: "0.83rem" }}>
              <thead className="table-light">
                <tr>
                  {[t("Asset"), t("Type / Class"), t("Criticality"), t("Risk Score"), t("Open CVEs"), t("Data Class"), t("Regulatory Scope"), t("Annual Value"), t("Last Scanned")].map((h) => (
                    <th key={h} className="text-uppercase fw-semibold text-muted px-3 py-2 border-bottom" style={{ fontSize: "0.7rem", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((asset) => {
                  const dc = dataClassBadge(asset.data_classification ?? "");
                  return (
                    <tr key={asset.id} className="border-bottom">
                      <td className="px-3 py-2">
                        <div className="fw-medium">{asset.name}</div>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>{asset.owner} · {asset.location}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-muted">{asset.type}</div>
                        {asset.asset_class && <span className="badge rounded-pill" style={assetClassStyle(asset.asset_class)}>{asset.asset_class}</span>}
                      </td>
                      <td className="px-3 py-2">
                        <Badge bg={critVariant(asset.criticality)} style={critStyle(asset.criticality)}>{asset.criticality}</Badge>
                      </td>
                      <td className="px-3 py-2" style={{ minWidth: 100 }}>
                        <div className="d-flex align-items-center gap-2">
                          <ProgressBar now={asset.risk_score} variant={riskVariant(asset.risk_score)} style={{ height: 6, flex: 1, borderRadius: 99, ...riskStyle(asset.risk_score) }} />
                          <span className="fw-bold" style={{ fontSize: "0.75rem", width: 22, color: asset.risk_score >= 80 ? "#d9534f" : asset.risk_score >= 60 ? "#fd7e14" : asset.risk_score >= 40 ? "#f0ad4e" : "#4BBF73" }}>{asset.risk_score}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={asset.open_cve_count > 0 ? "fw-semibold text-danger" : "text-muted"}>{asset.open_cve_count ?? 0}</span>
                      </td>
                      <td className="px-3 py-2">
                        {asset.data_classification && <Badge bg={dc.bg} className="fw-normal" style={dc.bg === "light" ? { color: "#6c757d", border: "1px solid #dee2e6" } : {}}>{dc.label}</Badge>}
                      </td>
                      <td className="px-3 py-2">
                        <div className="d-flex flex-wrap gap-1">
                          {(asset.regulatory_scope ?? []).map((r) => (
                            <span key={r} className="badge rounded-pill" style={{ background: "#f4f7f9", color: "#6c757d", border: "1px solid #dee2e6", fontSize: "0.68rem", fontWeight: 400 }}>{r}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="fw-medium" style={{ color: asset.annual_value ? "#4BBF73" : "#adb5bd" }}>{asset.annual_value ? fmt$(asset.annual_value) : "—"}</span>
                      </td>
                      <td className="px-3 py-2 text-muted" style={{ whiteSpace: "nowrap" }}>{timeAgo(asset.last_scanned_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
          {filtered.length === 0 && <div className="py-5 text-center text-muted">{t("No assets match current filters.")}</div>}
        </Card>
      )}
    </div>
  );
};

export default Assets;
