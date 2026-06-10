export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  category: 'Security' | 'Privacy' | 'Industry' | 'Regional';
  score: number;
  controls_total: number;
  controls_compliant: number;
  controls_partial: number;
  controls_noncompliant: number;
}

// Matches the existing compliance_controls DB table schema
/*export interface ComplianceControl {
  id: string;
  framework_id: string;
  framework_name: string;
  control_id: string;   // e.g. "ID.AM-01"
  title: string;
  domain: string;
  status: string;       // current assessed status on this control row
  score: number;
  evidence: string;
  owner: string;
  notes: string;
  guidance: string;
  sort_order: number;
  due_date: string | null;
}*/

export interface ComplianceControl {
  id: string;
  framework_id: string;
  framework_name: string;
  control_id: string;
  title: string;
  domain: string;
  status: string;
  score: number;
  evidence: string;
  owner: string;
  notes: string;
  guidance: string;
  question: string | null;   // ← new
  sort_order: number;
  due_date: string | null;
}

export type AssessmentStatus = 'in_progress' | 'completed' | 'cancelled';

export interface ComplianceAssessment {
  id: string;
  framework_id: string;
  status: AssessmentStatus;
  overall_score: number | null;
  assessed_by: string;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
}

export type ControlResultStatus =
  | 'compliant'
  | 'partial'
  | 'noncompliant'
  | 'not_applicable'
  | 'not_reviewed';

export interface AssessmentResult {
  id: string;
  assessment_id: string;
  control_id: string;   // uuid FK → compliance_controls.id
  status: ControlResultStatus;
  score: number | null;
  evidence: string | null;
  notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  // joined
  control?: ComplianceControl;
}

export interface RunAssessmentForm {
  framework_id: string;
  assessed_by: string;
  notes: string;
}
