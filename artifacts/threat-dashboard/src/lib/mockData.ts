export const mockOrg = {
  name: 'Acme Financial Corp',
  industry: 'Financial Services',
  size: 'Enterprise',
  risk_appetite: 'Low',
  overallRiskScore: 68,
  trend: -4,
};

export const mockKPIs = {
  totalRisks: 142,
  criticalRisks: 12,
  openIncidents: 7,
  criticalIncidents: 2,
  totalAssets: 384,
  vulnerableAssets: 47,
  complianceScore: 76,
  threatAlerts: 23,
  // Financial KPIs
  totalALE: 14_200_000,          // Aggregate Annualised Loss Expectancy
  totalTreatmentBudget: 3_850_000,
  aggregateROI: 268,             // %
  doraIncidents: 3,
  nis2ReadinessScore: 71,
  valueAtRisk_90: 8_400_000,     // 90th percentile VaR (Monte Carlo)
  valueAtRisk_95: 12_100_000,
};

export const mockRisks = [
  {
    id: '1', title: 'Ransomware Attack on Core Banking Systems', category: 'Technical',
    status: 'Open', likelihood: 4, impact: 5, inherent_score: 20, residual_score: 12,
    owner: 'Alice Chen', review_date: '2026-06-15', tags: ['ransomware', 'banking'],
    fair: { tef_min: 0.5, tef_max: 3, tef_likely: 1.2, vulnerability: 72, lm_min: 800_000, lm_max: 8_000_000, lm_likely: 3_200_000, ale: 3_840_000, ale_min: 400_000, ale_max: 5_760_000, lef: 1.2 },
    treatment: 'Mitigate', treatment_cost: 480_000, treatment_status: 'In Progress',
    remediation_roi: 700, financial_impact: 3_840_000,
    framework_tags: ['DORA', 'NIS2', 'NIST CSF'], regulatory_reference: 'DORA Art. 9 / NIS2 Art. 21',
  },
  {
    id: '2', title: 'Third-Party Vendor Data Breach', category: 'Operational',
    status: 'In Treatment', likelihood: 3, impact: 5, inherent_score: 15, residual_score: 8,
    owner: 'Bob Martinez', review_date: '2026-07-01', tags: ['vendor', 'data'],
    fair: { tef_min: 0.3, tef_max: 2, tef_likely: 0.8, vulnerability: 65, lm_min: 500_000, lm_max: 5_000_000, lm_likely: 1_800_000, ale: 1_440_000, ale_min: 150_000, ale_max: 3_250_000, lef: 0.8 },
    treatment: 'Transfer', treatment_cost: 120_000, treatment_status: 'Completed',
    remediation_roi: 1100, financial_impact: 1_440_000,
    framework_tags: ['GDPR', 'ISO 27001', 'NIS2'], regulatory_reference: 'GDPR Art. 28 / NIS2 Art. 21',
  },
  {
    id: '3', title: 'Insider Threat - Privileged Access Abuse', category: 'Operational',
    status: 'Open', likelihood: 3, impact: 4, inherent_score: 12, residual_score: 6,
    owner: 'Carol Smith', review_date: '2026-06-30', tags: ['insider', 'access'],
    fair: { tef_min: 0.2, tef_max: 1.5, tef_likely: 0.6, vulnerability: 55, lm_min: 300_000, lm_max: 3_000_000, lm_likely: 900_000, ale: 540_000, ale_min: 60_000, ale_max: 1_650_000, lef: 0.6 },
    treatment: 'Mitigate', treatment_cost: 95_000, treatment_status: 'Not Started',
    remediation_roi: 468, financial_impact: 540_000,
    framework_tags: ['ISO 27001', 'NIST CSF'], regulatory_reference: 'ISO 27001 A.9.4',
  },
  {
    id: '4', title: 'DDoS Attack on Public Web Services', category: 'Technical',
    status: 'Open', likelihood: 4, impact: 3, inherent_score: 12, residual_score: 9,
    owner: 'David Lee', review_date: '2026-05-30', tags: ['ddos', 'web'],
    fair: { tef_min: 1, tef_max: 8, tef_likely: 3, vulnerability: 45, lm_min: 50_000, lm_max: 800_000, lm_likely: 220_000, ale: 660_000, ale_min: 150_000, ale_max: 3_600_000, lef: 3 },
    treatment: 'Mitigate', treatment_cost: 75_000, treatment_status: 'Completed',
    remediation_roi: 780, financial_impact: 660_000,
    framework_tags: ['DORA', 'NIS2'], regulatory_reference: 'DORA Art. 11',
  },
  {
    id: '5', title: 'Phishing Campaign Targeting Finance Team', category: 'Operational',
    status: 'In Treatment', likelihood: 5, impact: 3, inherent_score: 15, residual_score: 6,
    owner: 'Eva Wilson', review_date: '2026-06-10', tags: ['phishing', 'finance'],
    fair: { tef_min: 2, tef_max: 15, tef_likely: 6, vulnerability: 38, lm_min: 20_000, lm_max: 400_000, lm_likely: 95_000, ale: 570_000, ale_min: 120_000, ale_max: 6_000_000, lef: 6 },
    treatment: 'Mitigate', treatment_cost: 45_000, treatment_status: 'Completed',
    remediation_roi: 1167, financial_impact: 570_000,
    framework_tags: ['NIST CSF', 'ISO 27001'], regulatory_reference: 'NIST CSF PR.AT',
  },
  {
    id: '6', title: 'Unpatched Critical Vulnerabilities in ERP', category: 'Technical',
    status: 'Open', likelihood: 4, impact: 4, inherent_score: 16, residual_score: 10,
    owner: 'Frank Zhang', review_date: '2026-06-05', tags: ['erp', 'patch'],
    fair: { tef_min: 0.5, tef_max: 4, tef_likely: 1.5, vulnerability: 80, lm_min: 200_000, lm_max: 2_000_000, lm_likely: 700_000, ale: 1_050_000, ale_min: 100_000, ale_max: 3_200_000, lef: 1.5 },
    treatment: 'Mitigate', treatment_cost: 55_000, treatment_status: 'In Progress',
    remediation_roi: 1809, financial_impact: 1_050_000,
    framework_tags: ['NIST CSF', 'PCI DSS'], regulatory_reference: 'PCI DSS Req. 6',
  },
  {
    id: '7', title: 'GDPR Non-Compliance - EU Customer Data', category: 'Compliance',
    status: 'In Treatment', likelihood: 3, impact: 4, inherent_score: 12, residual_score: 4,
    owner: 'Grace Kim', review_date: '2026-07-15', tags: ['gdpr', 'compliance'],
    fair: { tef_min: 0.1, tef_max: 1, tef_likely: 0.4, vulnerability: 70, lm_min: 500_000, lm_max: 20_000_000, lm_likely: 4_000_000, ale: 1_600_000, ale_min: 50_000, ale_max: 14_000_000, lef: 0.4 },
    treatment: 'Mitigate', treatment_cost: 220_000, treatment_status: 'In Progress',
    remediation_roi: 627, financial_impact: 1_600_000,
    framework_tags: ['GDPR', 'ISO 27001'], regulatory_reference: 'GDPR Art. 83',
  },
  {
    id: '8', title: 'Cloud Misconfiguration Exposing S3 Buckets', category: 'Technical',
    status: 'Closed', likelihood: 2, impact: 5, inherent_score: 10, residual_score: 2,
    owner: 'Henry Park', review_date: '2026-08-01', tags: ['cloud', 's3'],
    fair: { tef_min: 0.2, tef_max: 2, tef_likely: 0.7, vulnerability: 90, lm_min: 100_000, lm_max: 3_000_000, lm_likely: 800_000, ale: 560_000, ale_min: 20_000, ale_max: 2_700_000, lef: 0.7 },
    treatment: 'Mitigate', treatment_cost: 18_000, treatment_status: 'Completed',
    remediation_roi: 3011, financial_impact: 560_000,
    framework_tags: ['NIST CSF', 'SOC 2'], regulatory_reference: 'SOC 2 CC6.6',
  },
  {
    id: '9', title: 'Business Continuity - Data Center Failure', category: 'Strategic',
    status: 'Accepted', likelihood: 2, impact: 5, inherent_score: 10, residual_score: 8,
    owner: 'Iris Wang', review_date: '2026-09-01', tags: ['bcp', 'dc'],
    fair: { tef_min: 0.05, tef_max: 0.5, tef_likely: 0.15, vulnerability: 60, lm_min: 1_000_000, lm_max: 10_000_000, lm_likely: 3_500_000, ale: 525_000, ale_min: 50_000, ale_max: 5_000_000, lef: 0.15 },
    treatment: 'Accept', treatment_cost: 0, treatment_status: 'Completed',
    remediation_roi: 0, financial_impact: 525_000,
    framework_tags: ['DORA', 'ISO 22301'], regulatory_reference: 'DORA Art. 11 / ISO 22301',
  },
  {
    id: '10', title: 'API Security Gaps in Mobile Banking App', category: 'Technical',
    status: 'Open', likelihood: 3, impact: 4, inherent_score: 12, residual_score: 7,
    owner: 'James Liu', review_date: '2026-06-20', tags: ['api', 'mobile'],
    fair: { tef_min: 0.5, tef_max: 5, tef_likely: 2, vulnerability: 58, lm_min: 100_000, lm_max: 2_000_000, lm_likely: 500_000, ale: 1_000_000, ale_min: 50_000, ale_max: 2_900_000, lef: 2 },
    treatment: 'Mitigate', treatment_cost: 85_000, treatment_status: 'Not Started',
    remediation_roi: 1076, financial_impact: 1_000_000,
    framework_tags: ['PCI DSS', 'NIST CSF'], regulatory_reference: 'PCI DSS Req. 6.4',
  },
];

export const mockThreats = [
  { id: '1', title: 'APT29 Phishing Campaign', category: 'APT', severity: 'Critical', status: 'Active', confidence: 87, source: 'CISA Advisory', ioc_type: 'Domain', ioc_value: 'malicious-update[.]com', first_seen: '2026-05-10T08:22:00Z', last_seen: '2026-05-13T04:15:00Z', tags: ['apt29', 'phishing'] },
  { id: '2', title: 'LockBit 3.0 Ransomware Variant', category: 'Ransomware', severity: 'Critical', status: 'Active', confidence: 94, source: 'FBI Flash Alert', ioc_type: 'Hash', ioc_value: 'a3f2c1e4b7d9f0e2...', first_seen: '2026-05-08T14:30:00Z', last_seen: '2026-05-13T01:00:00Z', tags: ['lockbit', 'ransomware'] },
  { id: '3', title: 'Credential Stuffing Against Banking Portal', category: 'Malware', severity: 'High', status: 'Investigating', confidence: 72, source: 'Internal SIEM', ioc_type: 'IP', ioc_value: '185.220.101.47', first_seen: '2026-05-11T22:45:00Z', last_seen: '2026-05-13T03:30:00Z', tags: ['credential', 'banking'] },
  { id: '4', title: 'Supply Chain Attack via npm Package', category: 'Supply Chain', severity: 'High', status: 'Active', confidence: 81, source: 'Threat Intel Feed', ioc_type: 'Hash', ioc_value: 'c9b4d2a1e6f3...', first_seen: '2026-05-09T11:15:00Z', last_seen: '2026-05-12T18:20:00Z', tags: ['supply-chain', 'npm'] },
  { id: '5', title: 'SQL Injection Attempts on API Gateway', category: 'Phishing', severity: 'Medium', status: 'Investigating', confidence: 65, source: 'WAF Logs', ioc_type: 'IP', ioc_value: '103.42.87.22', first_seen: '2026-05-12T09:00:00Z', last_seen: '2026-05-13T05:10:00Z', tags: ['sqli', 'api'] },
  { id: '6', title: 'Data Exfiltration via DNS Tunneling', category: 'Malware', severity: 'High', status: 'Mitigated', confidence: 89, source: 'NDR Platform', ioc_type: 'Domain', ioc_value: 'exfil-c2[.]net', first_seen: '2026-05-05T16:40:00Z', last_seen: '2026-05-10T08:00:00Z', tags: ['exfil', 'dns'] },
];

export const mockVulnerabilities = [
  { id: '1', cve_id: 'CVE-2026-1234', title: 'Remote Code Execution in Apache Struts', cvss_score: 9.8, severity: 'Critical', status: 'Open', asset: 'web-app-01', patch_available: true, exploit_available: true, published_date: '2026-04-28', due_date: '2026-05-15', assigned_to: 'SecOps Team' },
  { id: '2', cve_id: 'CVE-2025-9876', title: 'Authentication Bypass in OpenSSL', cvss_score: 9.1, severity: 'Critical', status: 'In Progress', asset: 'db-server-03', patch_available: true, exploit_available: true, published_date: '2026-03-15', due_date: '2026-05-20', assigned_to: 'Alice Chen' },
  { id: '3', cve_id: 'CVE-2026-5555', title: 'Privilege Escalation in Linux Kernel', cvss_score: 7.8, severity: 'High', status: 'Open', asset: 'app-server-07', patch_available: true, exploit_available: false, published_date: '2026-05-01', due_date: '2026-06-01', assigned_to: 'Bob Martinez' },
  { id: '4', cve_id: 'CVE-2025-4321', title: 'XXE Injection in XML Parser Library', cvss_score: 7.5, severity: 'High', status: 'Remediated', asset: 'api-gw-02', patch_available: true, exploit_available: false, published_date: '2026-02-20', due_date: '2026-04-30', assigned_to: 'Carol Smith' },
  { id: '5', cve_id: 'CVE-2026-8888', title: 'SSRF Vulnerability in REST Framework', cvss_score: 6.5, severity: 'Medium', status: 'Open', asset: 'microservice-09', patch_available: false, exploit_available: false, published_date: '2026-05-05', due_date: '2026-06-15', assigned_to: 'David Lee' },
  { id: '6', cve_id: 'CVE-2026-2222', title: 'Reflected XSS in Customer Portal', cvss_score: 5.4, severity: 'Medium', status: 'In Progress', asset: 'customer-portal', patch_available: true, exploit_available: false, published_date: '2026-04-10', due_date: '2026-05-30', assigned_to: 'Eva Wilson' },
];

export const mockAssets = [
  {
    id: '1', name: 'Core Banking System', type: 'Application', asset_class: 'Primary',
    category: 'IT', criticality: 'Critical', status: 'Active', ip_address: '10.0.1.100',
    location: 'DC-Primary', owner: 'Banking Ops', risk_score: 85, vulnerability_count: 3,
    open_cve_count: 2, last_scanned_at: '2026-05-12T10:00:00Z',
    regulatory_scope: ['PCI DSS', 'DORA', 'SOC 2'], data_classification: 'Restricted',
    business_function: 'Core Transaction Processing', annual_value: 50_000_000,
  },
  {
    id: '2', name: 'Customer Web Portal', type: 'Application', asset_class: 'Primary',
    category: 'Cloud', criticality: 'High', status: 'Active', ip_address: '10.0.2.50',
    location: 'AWS-US-East', owner: 'Digital Team', risk_score: 72, vulnerability_count: 5,
    open_cve_count: 3, last_scanned_at: '2026-05-12T10:30:00Z',
    regulatory_scope: ['GDPR', 'PCI DSS', 'SOC 2'], data_classification: 'Confidential',
    business_function: 'Customer Self-Service', annual_value: 12_000_000,
  },
  {
    id: '3', name: 'HR Database Server', type: 'Database', asset_class: 'Supporting',
    category: 'IT', criticality: 'High', status: 'Active', ip_address: '10.0.3.20',
    location: 'DC-Primary', owner: 'HR IT', risk_score: 65, vulnerability_count: 2,
    open_cve_count: 1, last_scanned_at: '2026-05-11T14:00:00Z',
    regulatory_scope: ['GDPR', 'ISO 27001'], data_classification: 'Restricted',
    business_function: 'HR & Payroll Data Storage', annual_value: 3_500_000,
  },
  {
    id: '4', name: 'Trading Platform API', type: 'Application', asset_class: 'Primary',
    category: 'IT', criticality: 'Critical', status: 'Active', ip_address: '10.0.1.150',
    location: 'DC-Secondary', owner: 'Trading Ops', risk_score: 78, vulnerability_count: 4,
    open_cve_count: 2, last_scanned_at: '2026-05-12T09:00:00Z',
    regulatory_scope: ['DORA', 'PCI DSS', 'MiFID II'], data_classification: 'Confidential',
    business_function: 'Real-time Trading Execution', annual_value: 28_000_000,
  },
  {
    id: '5', name: 'Enterprise Firewall', type: 'Network', asset_class: 'Supporting',
    category: 'IT', criticality: 'Critical', status: 'Active', ip_address: '192.168.1.1',
    location: 'DC-Primary', owner: 'Network Team', risk_score: 45, vulnerability_count: 1,
    open_cve_count: 0, last_scanned_at: '2026-05-10T16:00:00Z',
    regulatory_scope: ['NIST CSF', 'ISO 27001', 'NIS2'], data_classification: 'Internal',
    business_function: 'Network Perimeter Security', annual_value: 2_000_000,
  },
  {
    id: '6', name: 'Development Workstations (Batch)', type: 'Workstation', asset_class: 'Supporting',
    category: 'IT', criticality: 'Medium', status: 'Active', ip_address: '10.0.5.0/24',
    location: 'HQ Floor 3', owner: 'Engineering', risk_score: 38, vulnerability_count: 8,
    open_cve_count: 5, last_scanned_at: '2026-05-09T11:00:00Z',
    regulatory_scope: ['ISO 27001'], data_classification: 'Internal',
    business_function: 'Software Development', annual_value: 1_200_000,
  },
  {
    id: '7', name: 'Backup Storage Array', type: 'Server', asset_class: 'Supporting',
    category: 'IT', criticality: 'High', status: 'Active', ip_address: '10.0.4.80',
    location: 'DC-Secondary', owner: 'Infra Team', risk_score: 30, vulnerability_count: 0,
    open_cve_count: 0, last_scanned_at: '2026-05-08T08:00:00Z',
    regulatory_scope: ['DORA', 'ISO 22301', 'SOC 2'], data_classification: 'Restricted',
    business_function: 'Business Continuity / DR', annual_value: 5_000_000,
  },
  {
    id: '8', name: 'ATM Network Controller', type: 'IoT', asset_class: 'Primary',
    category: 'OT', criticality: 'Critical', status: 'Active', ip_address: '172.16.10.1',
    location: 'Operations', owner: 'ATM Ops', risk_score: 91, vulnerability_count: 6,
    open_cve_count: 4, last_scanned_at: '2026-05-07T15:00:00Z',
    regulatory_scope: ['PCI DSS', 'DORA', 'NIS2'], data_classification: 'Restricted',
    business_function: 'ATM & Cash Dispensing Network', annual_value: 18_000_000,
  },
];

export const mockIncidents = [
  { id: '1', title: 'Ransomware Detection on Finance Workstation', type: 'Ransomware', severity: 'Critical', status: 'Investigating', priority: 'P1', assigned_to: 'IR Team', reported_by: 'EDR Alert', detected_at: '2026-05-13T02:15:00Z', tags: ['ransomware', 'finance'], is_dora_reportable: true, dora_reported: false, financial_impact_estimate: 1_200_000, affected_users: 0, downtime_minutes: 180 },
  { id: '2', title: 'Unauthorized Access to Customer Database', type: 'Security Breach', severity: 'High', status: 'Contained', priority: 'P1', assigned_to: 'Alice Chen', reported_by: 'SIEM Alert', detected_at: '2026-05-12T18:30:00Z', tags: ['unauthorized', 'database'], is_dora_reportable: true, dora_reported: true, financial_impact_estimate: 480_000, affected_users: 12500, downtime_minutes: 45 },
  { id: '3', title: 'Phishing Email - Executive Impersonation', type: 'Phishing', severity: 'High', status: 'Resolved', priority: 'P2', assigned_to: 'Bob Martinez', reported_by: 'User Report', detected_at: '2026-05-12T10:45:00Z', resolved_at: '2026-05-12T14:30:00Z', tags: ['phishing', 'bec'], is_dora_reportable: false, dora_reported: false, financial_impact_estimate: 0, affected_users: 1, downtime_minutes: 0 },
  { id: '4', title: 'DDoS Attack on Trading API', type: 'DDoS', severity: 'High', status: 'Contained', priority: 'P2', assigned_to: 'Network Team', reported_by: 'WAF Logs', detected_at: '2026-05-11T09:20:00Z', tags: ['ddos', 'api'], is_dora_reportable: true, dora_reported: true, financial_impact_estimate: 220_000, affected_users: 0, downtime_minutes: 95 },
  { id: '5', title: 'Data Leak via Misconfigured S3 Bucket', type: 'Data Leak', severity: 'Medium', status: 'Resolved', priority: 'P2', assigned_to: 'Cloud Team', reported_by: 'AWS GuardDuty', detected_at: '2026-05-10T14:00:00Z', resolved_at: '2026-05-11T11:00:00Z', tags: ['s3', 'data-leak'], is_dora_reportable: false, dora_reported: false, financial_impact_estimate: 85_000, affected_users: 340, downtime_minutes: 0 },
  { id: '6', title: 'Suspicious Login Activity - Admin Account', type: 'Security Breach', severity: 'Medium', status: 'Investigating', priority: 'P2', assigned_to: 'Carol Smith', reported_by: 'UEBA Alert', detected_at: '2026-05-13T05:00:00Z', tags: ['login', 'admin'], is_dora_reportable: false, dora_reported: false, financial_impact_estimate: 0, affected_users: 0, downtime_minutes: 0 },
];

export const mockComplianceFrameworks = [
  { id: '1', name: 'NIST CSF', version: '2.0', category: 'Security', score: 82, controls_total: 108, controls_compliant: 88, controls_partial: 14, controls_noncompliant: 6 },
  { id: '2', name: 'ISO 27001', version: '2022', category: 'Security', score: 74, controls_total: 93, controls_compliant: 69, controls_partial: 18, controls_noncompliant: 6 },
  { id: '3', name: 'SOC 2 Type II', version: '2017', category: 'Security', score: 88, controls_total: 64, controls_compliant: 56, controls_partial: 6, controls_noncompliant: 2 },
  { id: '4', name: 'PCI DSS', version: '4.0', category: 'Industry', score: 71, controls_total: 78, controls_compliant: 55, controls_partial: 15, controls_noncompliant: 8 },
  { id: '5', name: 'GDPR', version: '2018', category: 'Privacy', score: 79, controls_total: 42, controls_compliant: 33, controls_partial: 7, controls_noncompliant: 2 },
  { id: '6', name: 'HIPAA', version: '1996', category: 'Industry', score: 65, controls_total: 54, controls_compliant: 35, controls_partial: 13, controls_noncompliant: 6 },
];

// DORA & NIS2 regulatory metrics
export const mockRegulatoryMetrics = {
  dora: {
    readiness: 68,
    incidents_ytd: 3,
    incidents_reported: 2,
    incidents_pending: 1,
    rto_target_hours: 4,
    rto_actual_hours: 6.5,
    rpo_target_hours: 1,
    rpo_actual_hours: 2.2,
    third_party_ict_risks: 8,
    third_party_reviewed: 5,
    threat_intel_sharing: true,
    last_dr_test: '2026-03-15',
  },
  nis2: {
    readiness: 71,
    gap_areas: ['Supply Chain Security', 'Incident Reporting SLA', 'Board-level Reporting'],
    governance_score: 78,
    technical_measures_score: 74,
    business_continuity_score: 65,
    incident_handling_score: 70,
    supply_chain_score: 58,
    cryptography_score: 82,
  },
};

// Monte Carlo simulation results for VaR
export const mockMonteCarloResults = {
  percentiles: [
    { pct: 50, value: 4_100_000 },
    { pct: 75, value: 6_800_000 },
    { pct: 90, value: 8_400_000 },
    { pct: 95, value: 12_100_000 },
    { pct: 99, value: 21_500_000 },
  ],
  simulations: 10_000,
  mean_loss: 4_350_000,
  std_dev: 3_200_000,
  // Distribution histogram buckets (USD millions)
  histogram: [
    { range: '0-1M', count: 2100 },
    { range: '1-2M', count: 2450 },
    { range: '2-4M', count: 2800 },
    { range: '4-6M', count: 1400 },
    { range: '6-8M', count: 700 },
    { range: '8-12M', count: 390 },
    { range: '12-20M', count: 130 },
    { range: '20M+', count: 30 },
  ],
};

// GRC Registry: mapping between risk, framework, control, and treatment
export const mockGRCRegistry = [
  { risk_id: '1', risk_title: 'Ransomware Attack', framework: 'DORA', control_ref: 'Art. 9', requirement: 'ICT Risk Management', treatment: 'Mitigate', status: 'In Progress', due_date: '2026-07-01' },
  { risk_id: '1', risk_title: 'Ransomware Attack', framework: 'NIS2', control_ref: 'Art. 21', requirement: 'Cybersecurity Risk Measures', treatment: 'Mitigate', status: 'In Progress', due_date: '2026-07-01' },
  { risk_id: '2', risk_title: 'Third-Party Vendor Breach', framework: 'GDPR', control_ref: 'Art. 28', requirement: 'Data Processor Agreements', treatment: 'Transfer', status: 'Completed', due_date: '2026-05-01' },
  { risk_id: '2', risk_title: 'Third-Party Vendor Breach', framework: 'NIS2', control_ref: 'Art. 21', requirement: 'Supply Chain Security', treatment: 'Transfer', status: 'Completed', due_date: '2026-05-01' },
  { risk_id: '4', risk_title: 'DDoS on Web Services', framework: 'DORA', control_ref: 'Art. 11', requirement: 'Business Continuity & Availability', treatment: 'Mitigate', status: 'Completed', due_date: '2026-04-15' },
  { risk_id: '7', risk_title: 'GDPR Non-Compliance', framework: 'GDPR', control_ref: 'Art. 83', requirement: 'Supervisory Authority Fines', treatment: 'Mitigate', status: 'In Progress', due_date: '2026-08-01' },
  { risk_id: '9', risk_title: 'Data Center Failure', framework: 'DORA', control_ref: 'Art. 11', requirement: 'Business Continuity Planning', treatment: 'Accept', status: 'Accepted', due_date: '2026-09-01' },
];

// Treatment mix for dashboard
export const mockTreatmentMix = [
  { treatment: 'Mitigate', count: 7, percentage: 70, budget: 3_098_000 },
  { treatment: 'Transfer', count: 1, percentage: 10, budget: 120_000 },
  { treatment: 'Accept',   count: 1, percentage: 10, budget: 0 },
  { treatment: 'Avoid',    count: 1, percentage: 10, budget: 632_000 },
];

export const mockRiskTrend = [
  { month: 'Nov', critical: 22, high: 45, medium: 65, low: 38 },
  { month: 'Dec', critical: 25, high: 50, medium: 68, low: 35 },
  { month: 'Jan', critical: 28, high: 54, medium: 72, low: 28 },
  { month: 'Feb', critical: 21, high: 44, medium: 63, low: 26 },
  { month: 'Mar', critical: 17, high: 37, medium: 55, low: 24 },
  { month: 'Apr', critical: 14, high: 31, medium: 49, low: 24 },
  { month: 'May', critical: 12, high: 28, medium: 44, low: 22 },
];

export const mockIOCs = [
  { id: '1', value: '185.220.101.47', type: 'IP', severity: 'Critical', status: 'Active', confidence: 94, source: 'CISA Advisory', threat_actor: 'APT29 (Cozy Bear)', tags: ['apt29', 'c2', 'tor-exit'], description: 'Known TOR exit node used by APT29 as C2 infrastructure.', first_seen: '2026-05-10T08:22:00Z', last_seen: '2026-05-13T04:15:00Z', expiry_date: '2026-08-10', related_incident: 'INC-0001' },
  { id: '2', value: 'malicious-update[.]com', type: 'Domain', severity: 'Critical', status: 'Active', confidence: 91, source: 'FBI Flash Alert', threat_actor: 'LockBit Group', tags: ['lockbit', 'phishing', 'delivery'], description: 'Malicious domain used to deliver LockBit 3.0 ransomware payload.', first_seen: '2026-05-08T14:30:00Z', last_seen: '2026-05-13T01:00:00Z', expiry_date: '2026-08-08', related_incident: 'INC-0002' },
  { id: '3', value: 'a3f2c1e4b7d9f0e2...sha256', type: 'Hash', severity: 'Critical', status: 'Active', confidence: 98, source: 'VirusTotal', threat_actor: 'LockBit Group', tags: ['lockbit', 'ransomware', 'sha256'], description: 'SHA-256 hash of LockBit 3.0 ransomware binary.', first_seen: '2026-05-07T11:00:00Z', last_seen: '2026-05-12T22:00:00Z', expiry_date: '2026-11-07', related_incident: 'INC-0002' },
  { id: '4', value: 'exfil-c2[.]net', type: 'Domain', severity: 'High', status: 'Active', confidence: 89, source: 'NDR Platform', threat_actor: 'Unknown', tags: ['exfil', 'dns-tunneling', 'c2'], description: 'Domain receiving DNS-tunneled exfiltration traffic.', first_seen: '2026-05-05T16:40:00Z', last_seen: '2026-05-13T05:10:00Z', expiry_date: '2026-08-05', related_incident: 'INC-0004' },
  { id: '5', value: '103.42.87.22', type: 'IP', severity: 'High', status: 'Active', confidence: 72, source: 'Internal SIEM', threat_actor: 'Unknown', tags: ['credential-stuffing', 'banking'], description: 'Source IP in credential stuffing attack.', first_seen: '2026-05-11T22:45:00Z', last_seen: '2026-05-13T03:30:00Z', expiry_date: '2026-07-11', related_incident: 'INC-0003' },
  { id: '6', value: 'c9b4d2a1...npm-backdoor', type: 'Hash', severity: 'High', status: 'Under Review', confidence: 81, source: 'Threat Intel Feed', threat_actor: 'Unknown', tags: ['supply-chain', 'npm', 'backdoor'], description: 'Hash of malicious npm package with backdoor.', first_seen: '2026-05-09T11:15:00Z', last_seen: '2026-05-12T18:20:00Z', expiry_date: '2026-11-09', related_incident: 'INC-0005' },
  { id: '7', value: 'https://cdn-malware[.]io/payload/update.exe', type: 'URL', severity: 'High', status: 'Active', confidence: 87, source: 'Threat Intel Feed', threat_actor: 'FIN7', tags: ['fin7', 'downloader', 'exe'], description: 'Malicious URL hosting FIN7 dropper.', first_seen: '2026-05-06T09:00:00Z', last_seen: '2026-05-11T14:00:00Z', expiry_date: '2026-08-06', related_incident: '' },
  { id: '8', value: 'phish@secure-bank-verify[.]com', type: 'Email', severity: 'Medium', status: 'Active', confidence: 76, source: 'User Report', threat_actor: 'Unknown', tags: ['phishing', 'bec', 'impersonation'], description: 'BEC campaign impersonating executive leadership.', first_seen: '2026-05-12T08:00:00Z', last_seen: '2026-05-12T16:00:00Z', expiry_date: '2026-07-12', related_incident: 'INC-0003' },
  { id: '9', value: '91.108.56.177', type: 'IP', severity: 'Medium', status: 'Inactive', confidence: 65, source: 'Open Source Intel', threat_actor: 'Lazarus Group', tags: ['lazarus', 'reconnaissance'], description: 'Lazarus Group reconnaissance IP.', first_seen: '2026-04-28T10:00:00Z', last_seen: '2026-05-02T10:00:00Z', expiry_date: '2026-07-28', related_incident: '' },
  { id: '10', value: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\svchost32', type: 'Registry', severity: 'Medium', status: 'Under Review', confidence: 83, source: 'EDR Alert', threat_actor: 'Unknown', tags: ['persistence', 'registry', 'edr'], description: 'Malicious registry persistence key.', first_seen: '2026-05-13T02:15:00Z', last_seen: '2026-05-13T02:15:00Z', expiry_date: '2026-08-13', related_incident: 'INC-0001' },
  { id: '11', value: 'loader-dropper.dll', type: 'File', severity: 'Low', status: 'Whitelisted', confidence: 55, source: 'Internal SIEM', threat_actor: 'Unknown', tags: ['dll', 'false-positive', 'legacy'], description: 'Legacy DLL, confirmed false positive.', first_seen: '2026-05-01T07:00:00Z', last_seen: '2026-05-01T07:00:00Z', expiry_date: '2026-11-01', related_incident: '' },
  { id: '12', value: '198.51.100.42', type: 'IP', severity: 'Low', status: 'Inactive', confidence: 48, source: 'Open Source Intel', threat_actor: 'Unknown', tags: ['scanner', 'low-confidence'], description: 'Generic internet scanner, low confidence.', first_seen: '2026-05-03T12:00:00Z', last_seen: '2026-05-03T14:00:00Z', expiry_date: '2026-06-03', related_incident: '' },
];

export const mockThreatActors = [
  { id: '1', name: 'APT29 (Cozy Bear)', type: 'Nation-State', sophistication: 'Expert', motivation: ['Espionage', 'Data Theft'], target_sectors: ['Finance', 'Government', 'Defense'], active: true, last_seen: '2026-05-13' },
  { id: '2', name: 'LockBit Group', type: 'Cybercriminal', sophistication: 'High', motivation: ['Financial Gain'], target_sectors: ['Finance', 'Healthcare', 'Manufacturing'], active: true, last_seen: '2026-05-12' },
  { id: '3', name: 'Lazarus Group', type: 'Nation-State', sophistication: 'Expert', motivation: ['Financial Gain', 'Espionage'], target_sectors: ['Finance', 'Cryptocurrency'], active: true, last_seen: '2026-05-10' },
  { id: '4', name: 'FIN7', type: 'Cybercriminal', sophistication: 'High', motivation: ['Financial Gain'], target_sectors: ['Retail', 'Finance', 'Hospitality'], active: true, last_seen: '2026-05-08' },
];
