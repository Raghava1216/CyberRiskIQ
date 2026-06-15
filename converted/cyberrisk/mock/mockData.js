// Temporary mock data for the CyberRisk IQ module so every tab renders without a
// live backend. NONE of this hits the network. Replace the mock components with
// the real metadata-driven <ReportRuntime/> + <Chart/> (using your backend keys)
// once the corresponding report/chart/form metadata exists. See CONVERSION_GUIDE.md.

export const eur = (n) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

export const PALETTE = ["#2f6df6", "#13b5b1", "#f5a623", "#e2496b", "#8e63d6", "#5aac44"];

export const SEVERITY_COLORS = {
  Critical: "#e2496b",
  High: "#f5733e",
  Medium: "#f5a623",
  Low: "#5aac44",
};

// ---- Dashboard ----
export const dashboardCards = [
  { title: "Annual Loss Exposure", value: eur(8420000), sub: "P50, current FY" },
  { title: "Open Vulnerabilities", value: "1,284", sub: "312 critical" },
  { title: "Critical Assets", value: "147", sub: "of 2,310 tracked" },
  { title: "Regulatory Obligations", value: "63", sub: "8 overdue" },
];

export const aleByBusinessUnit = [
  { label: "Retail Banking", value: 3120000 },
  { label: "Payments", value: 2240000 },
  { label: "Corporate", value: 1480000 },
  { label: "Wealth", value: 980000 },
  { label: "Shared Services", value: 600000 },
];

export const exposureTrend = [
  { label: "Jan", value: 9.8 },
  { label: "Feb", value: 9.4 },
  { label: "Mar", value: 9.1 },
  { label: "Apr", value: 8.9 },
  { label: "May", value: 8.6 },
  { label: "Jun", value: 8.4 },
];

export const riskSeverityMix = [
  { label: "Critical", value: 12, color: SEVERITY_COLORS.Critical },
  { label: "High", value: 28, color: SEVERITY_COLORS.High },
  { label: "Medium", value: 41, color: SEVERITY_COLORS.Medium },
  { label: "Low", value: 19, color: SEVERITY_COLORS.Low },
];

export const topRisks = {
  columns: [
    { key: "name", label: "Risk Scenario" },
    { key: "bu", label: "Business Unit" },
    { key: "severity", label: "Severity", badge: true },
    { key: "ale", label: "ALE (P50)", money: true, align: "end" },
  ],
  rows: [
    { name: "Ransomware on core banking", bu: "Retail Banking", severity: "Critical", ale: 1820000 },
    { name: "Payment switch outage", bu: "Payments", severity: "Critical", ale: 1240000 },
    { name: "Customer data exfiltration", bu: "Retail Banking", severity: "High", ale: 960000 },
    { name: "Third-party SaaS breach", bu: "Corporate", severity: "High", ale: 720000 },
    { name: "Insider misuse of PII", bu: "Wealth", severity: "Medium", ale: 410000 },
  ],
};

// ---- Assets ----
export const assets = {
  columns: [
    { key: "hostname", label: "Hostname" },
    { key: "ip", label: "IP Address" },
    { key: "type", label: "Type" },
    { key: "dataClass", label: "Data Class" },
    { key: "internet", label: "Internet-Facing", badge: true },
    { key: "ale", label: "ALE (P50)", money: true, align: "end" },
  ],
  rows: [
    { hostname: "core-banking-01", ip: "10.20.4.11", type: "Server", dataClass: "Restricted", internet: "No", ale: 1820000 },
    { hostname: "payment-switch-a", ip: "10.20.6.4", type: "Server", dataClass: "Restricted", internet: "No", ale: 1240000 },
    { hostname: "web-portal-prod", ip: "203.0.113.20", type: "Server", dataClass: "Confidential", internet: "Yes", ale: 680000 },
    { hostname: "vpn-gw-01", ip: "203.0.113.8", type: "Network", dataClass: "Internal", internet: "Yes", ale: 540000 },
    { hostname: "hr-app-01", ip: "10.22.1.30", type: "Server", dataClass: "Confidential", internet: "No", ale: 220000 },
  ],
};

export const blastRadius = {
  columns: [
    { key: "asset", label: "Compromised Asset" },
    { key: "reachable", label: "Reachable Assets", align: "end" },
    { key: "critical", label: "Critical In Path", align: "end" },
    { key: "exposure", label: "Aggregated Exposure", money: true, align: "end" },
  ],
  rows: [
    { asset: "vpn-gw-01", reachable: 184, critical: 9, exposure: 4200000 },
    { asset: "web-portal-prod", reachable: 96, critical: 5, exposure: 2600000 },
    { asset: "core-banking-01", reachable: 42, critical: 7, exposure: 3100000 },
  ],
};

export const assetConnectivity = [
  { label: "1 hop", value: 38 },
  { label: "2 hops", value: 71 },
  { label: "3 hops", value: 124 },
  { label: "4+ hops", value: 57 },
];

export const blastRadiusByZone = [
  { label: "DMZ", value: 96, color: PALETTE[3] },
  { label: "Internal", value: 184, color: PALETTE[0] },
  { label: "Restricted", value: 42, color: PALETTE[1] },
];

// ---- Vulnerabilities ----
export const vulnerabilities = {
  columns: [
    { key: "cve", label: "CVE" },
    { key: "asset", label: "Asset" },
    { key: "severity", label: "Severity", badge: true },
    { key: "cvss", label: "CVSS", align: "end" },
    { key: "ale", label: "Risk-Adjusted ALE", money: true, align: "end" },
  ],
  rows: [
    { cve: "CVE-2025-31200", asset: "web-portal-prod", severity: "Critical", cvss: 9.8, ale: 540000 },
    { cve: "CVE-2025-29812", asset: "vpn-gw-01", severity: "Critical", cvss: 9.1, ale: 480000 },
    { cve: "CVE-2025-21800", asset: "core-banking-01", severity: "High", cvss: 8.2, ale: 260000 },
    { cve: "CVE-2024-49112", asset: "hr-app-01", severity: "Medium", cvss: 6.5, ale: 90000 },
  ],
};

export const vulnsBySeverity = [
  { label: "Critical", value: 312, color: SEVERITY_COLORS.Critical },
  { label: "High", value: 488, color: SEVERITY_COLORS.High },
  { label: "Medium", value: 361, color: SEVERITY_COLORS.Medium },
  { label: "Low", value: 123, color: SEVERITY_COLORS.Low },
];

export const vulnAging = [
  { label: "0-30d", value: 540 },
  { label: "31-60d", value: 388 },
  { label: "61-90d", value: 214 },
  { label: ">90d", value: 142 },
];

// ---- Threats ----
export const threats = {
  columns: [
    { key: "name", label: "Threat" },
    { key: "actor", label: "Actor Type" },
    { key: "ttp", label: "MITRE TTP" },
    { key: "likelihood", label: "Likelihood", badge: true },
  ],
  rows: [
    { name: "Ransomware affiliate", actor: "Cybercrime", ttp: "T1486", likelihood: "High" },
    { name: "Credential phishing", actor: "Cybercrime", ttp: "T1566", likelihood: "High" },
    { name: "Supply-chain compromise", actor: "Nation-state", ttp: "T1195", likelihood: "Medium" },
    { name: "Insider data theft", actor: "Insider", ttp: "T1052", likelihood: "Low" },
  ],
};

// ---- IOC ----
export const iocs = {
  columns: [
    { key: "indicator", label: "Indicator" },
    { key: "type", label: "Type" },
    { key: "confidence", label: "Confidence", badge: true },
    { key: "source", label: "Source" },
  ],
  rows: [
    { indicator: "185.220.101.4", type: "IP", confidence: "High", source: "Wazuh" },
    { indicator: "malicious-update[.]com", type: "Domain", confidence: "High", source: "Threat Feed" },
    { indicator: "a3f9...e21c", type: "SHA-256", confidence: "Medium", source: "Sandbox" },
    { indicator: "invoice_apr.docm", type: "Filename", confidence: "Low", source: "Email GW" },
  ],
};

// ---- Incidents ----
export const incidents = {
  columns: [
    { key: "title", label: "Incident" },
    { key: "severity", label: "Severity", badge: true },
    { key: "status", label: "Status", badge: true },
    { key: "nis2", label: "NIS2 Reportable", badge: true },
  ],
  rows: [
    { title: "Phishing wave - finance dept", severity: "High", status: "Contained", nis2: "Yes" },
    { title: "DDoS on web portal", severity: "Medium", status: "Resolved", nis2: "No" },
    { title: "Unauthorized DB access", severity: "Critical", status: "Investigating", nis2: "Yes" },
  ],
};

export const incidentByStatus = [
  { label: "Investigating", value: 4, color: PALETTE[3] },
  { label: "Contained", value: 7, color: PALETTE[2] },
  { label: "Resolved", value: 22, color: PALETTE[5] },
];

export const incidentBySeverity = [
  { label: "Critical", value: 3, color: SEVERITY_COLORS.Critical },
  { label: "High", value: 9, color: SEVERITY_COLORS.High },
  { label: "Medium", value: 14, color: SEVERITY_COLORS.Medium },
  { label: "Low", value: 7, color: SEVERITY_COLORS.Low },
];

// ---- Compliance / Regulatory ----
export const complianceReadiness = [
  { label: "DORA", value: 78 },
  { label: "NIS2", value: 64 },
  { label: "EU AI Act", value: 41 },
];

export const doraRegister = {
  columns: [
    { key: "ref", label: "Ref" },
    { key: "domain", label: "ICT Risk Domain" },
    { key: "status", label: "Status", badge: true },
    { key: "ale", label: "Residual ALE", money: true, align: "end" },
  ],
  rows: [
    { ref: "DORA-01", domain: "ICT risk management", status: "On Track", ale: 420000 },
    { ref: "DORA-02", domain: "Incident reporting", status: "At Risk", ale: 680000 },
    { ref: "DORA-03", domain: "Resilience testing", status: "On Track", ale: 240000 },
    { ref: "DORA-04", domain: "Third-party risk", status: "Overdue", ale: 910000 },
  ],
};

export const nis2Obligations = {
  columns: [
    { key: "ref", label: "Ref" },
    { key: "obligation", label: "Obligation" },
    { key: "owner", label: "Owner" },
    { key: "status", label: "Status", badge: true },
  ],
  rows: [
    { ref: "NIS2-12", obligation: "24h early warning process", owner: "SOC", status: "On Track" },
    { ref: "NIS2-15", obligation: "Supply-chain security", owner: "Procurement", status: "At Risk" },
    { ref: "NIS2-21", obligation: "Management accountability", owner: "Board", status: "On Track" },
  ],
};

export const aiActInventory = [
  { label: "Prohibited", value: 0, color: SEVERITY_COLORS.Critical },
  { label: "High-risk", value: 6, color: SEVERITY_COLORS.High },
  { label: "Limited", value: 11, color: SEVERITY_COLORS.Medium },
  { label: "Minimal", value: 23, color: SEVERITY_COLORS.Low },
];

export const complianceStatusCards = [
  { title: "DORA Readiness", value: "78%", sub: "4 domains at risk" },
  { title: "NIS2 Obligations", value: "64%", sub: "2 overdue" },
  { title: "EU AI Act Inventory", value: "40 systems", sub: "6 high-risk" },
  { title: "Evidence Items", value: "512", sub: "23 expiring" },
];

// ---- Reports ----
export const boardSummary = {
  columns: [
    { key: "metric", label: "Metric" },
    { key: "value", label: "Value", align: "end" },
    { key: "trend", label: "QoQ", badge: true },
  ],
  rows: [
    { metric: "Total Annual Loss Exposure (P50)", value: eur(8420000), trend: "Down" },
    { metric: "Critical Risks", value: "12", trend: "Down" },
    { metric: "Mean Time to Remediate (critical)", value: "9.4 days", trend: "Flat" },
    { metric: "DORA Readiness", value: "78%", trend: "Up" },
    { metric: "Open NIS2 Obligations", value: "23", trend: "Down" },
  ],
};

// ---- Wazuh ----
export const wazuhCards = [
  { title: "Active Agents", value: "2,184", sub: "97% healthy" },
  { title: "Alerts (24h)", value: "14,920", sub: "63 high severity" },
  { title: "Detections (24h)", value: "208", sub: "12 escalated" },
  { title: "Coverage", value: "94%", sub: "of tracked assets" },
];

export const wazuhAlerts = [
  { label: "Level 12+", value: 63, color: SEVERITY_COLORS.Critical },
  { label: "Level 7-11", value: 410, color: SEVERITY_COLORS.High },
  { label: "Level 4-6", value: 1820, color: SEVERITY_COLORS.Medium },
  { label: "Level 1-3", value: 12627, color: SEVERITY_COLORS.Low },
];

export const wazuhAgentHealth = [
  { label: "Active", value: 2184, color: PALETTE[5] },
  { label: "Disconnected", value: 58, color: PALETTE[2] },
  { label: "Never connected", value: 14, color: PALETTE[3] },
];

export const wazuhTable = {
  columns: [
    { key: "rule", label: "Rule" },
    { key: "agent", label: "Agent" },
    { key: "level", label: "Level", align: "end" },
    { key: "count", label: "Count (24h)", align: "end" },
  ],
  rows: [
    { rule: "Multiple authentication failures", agent: "vpn-gw-01", level: 10, count: 482 },
    { rule: "Possible web attack", agent: "web-portal-prod", level: 12, count: 96 },
    { rule: "File integrity changed", agent: "core-banking-01", level: 7, count: 54 },
  ],
};
