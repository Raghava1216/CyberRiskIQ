export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
export type StatusType = 'Open' | 'In Progress' | 'In Treatment' | 'Resolved' | 'Closed' | 'Active' | 'Mitigated' | 'Investigating' | 'Contained' | 'Accepted' | 'Transferred';
export type PriorityType = 'P1' | 'P2' | 'P3' | 'P4';
export type TreatmentType = 'Mitigate' | 'Accept' | 'Transfer' | 'Avoid';

export type NavPage =
  | 'dashboard'
  | 'risks'
  | 'threats'
  | 'vulnerabilities'
  | 'assets'
  | 'ioc'
  | 'incidents'
  | 'compliance'
  | 'reports'
  | 'settings'
  | 'wazuh';

export interface IOC {
  id: string;
  value: string;
  type: 'IP' | 'Domain' | 'URL' | 'Hash' | 'Email' | 'File' | 'Registry' | 'Certificate';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Inactive' | 'Under Review' | 'Whitelisted';
  confidence: number;
  source: string;
  threat_actor: string;
  tags: string[];
  description: string;
  first_seen: string;
  last_seen: string;
  expiry_date: string;
  related_incident: string;
}

// FAIR model: Factor Analysis of Information Risk
export interface FAIRScoring {
  // Threat Event Frequency
  tef_min: number;           // min events/year
  tef_max: number;           // max events/year
  tef_likely: number;        // most likely events/year
  // Vulnerability (probability of action resulting in loss)
  vulnerability: number;     // 0-100%
  // Loss Magnitude (USD)
  lm_min: number;
  lm_max: number;
  lm_likely: number;
  // Calculated outputs
  ale: number;               // Annualised Loss Expectancy (USD)
  ale_min: number;
  ale_max: number;
  lef: number;               // Loss Event Frequency (events/year)
}

export interface Risk {
  id: string;
  title: string;
  category: string;
  status: string;
  likelihood: number;
  impact: number;
  inherent_score: number;
  residual_score: number;
  owner: string;
  review_date: string;
  tags: string[];
  // Financial / FAIR fields
  fair: FAIRScoring;
  treatment: TreatmentType;
  treatment_cost: number;       // USD cost to implement treatment
  treatment_status: string;     // Not Started | In Progress | Completed
  remediation_roi: number;      // (risk_reduction_value - treatment_cost) / treatment_cost * 100
  financial_impact: number;     // Expected financial loss if risk materialises (ALE)
  // GRC framework linkage
  framework_tags: string[];     // e.g. ['DORA', 'NIS2', 'NIST CSF']
  regulatory_reference: string; // e.g. 'DORA Art. 9', 'NIS2 Art. 21'
}

export interface Threat {
  id: string;
  title: string;
  category: string;
  severity: SeverityLevel;
  status: string;
  confidence: number;
  source: string;
  ioc_type: string;
  ioc_value: string;
  first_seen: string;
  last_seen: string;
  tags: string[];
}

export interface Vulnerability {
  id: string;
  cve_id: string;
  title: string;
  cvss_score: number;
  severity: SeverityLevel;
  status: string;
  asset: string;
  patch_available: boolean;
  exploit_available: boolean;
  published_date: string;
  due_date: string;
  assigned_to: string;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  asset_class: 'Primary' | 'Supporting' | 'External';
  category: string;
  criticality: string;
  status: string;
  ip_address: string;
  location: string;
  owner: string;
  risk_score: number;
  vulnerability_count: number;
  open_cve_count: number;
  last_scanned_at: string;
  // Regulatory scope
  regulatory_scope: string[];  // e.g. ['PCI DSS', 'DORA', 'GDPR']
  data_classification: 'Public' | 'Internal' | 'Confidential' | 'Restricted';
  // Business context
  business_function: string;
  annual_value: number;        // USD asset business value
}

export interface Incident {
  id: string;
  title: string;
  type: string;
  severity: SeverityLevel;
  status: string;
  priority: PriorityType;
  assigned_to: string;
  reported_by: string;
  detected_at: string;
  resolved_at?: string;
  tags: string[];
  // DORA-specific
  is_dora_reportable: boolean;
  dora_reported: boolean;
  financial_impact_estimate: number;  // USD
  affected_users: number;
  downtime_minutes: number;
}
