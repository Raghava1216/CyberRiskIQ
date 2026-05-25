import { supabase } from './supabase';
import { fetchResults, updateResult, completeAssessment, buildAIPrompt } from '../lib/complianceData';
import type {
  ComplianceFramework,
  ComplianceControl,
  ComplianceAssessment,
  AssessmentResult,
  RunAssessmentForm,
  ControlResultStatus,
} from './complianceTypes';

// ── Frameworks ────────────────────────────────────────────────────────────────

export async function fetchFrameworks(): Promise<ComplianceFramework[]> {
  const { data, error } = await supabase
    .from('compliance_frameworks')
    .select('id,name,version,category,score,controls_total,controls_compliant,controls_partial,controls_noncompliant')
    .order('name');
  if (error) throw error;
  return (data ?? []) as ComplianceFramework[];
}

// ── Controls ──────────────────────────────────────────────────────────────────

export async function fetchControls(framework_id: string): Promise<ComplianceControl[]> {
  const { data, error } = await supabase
    .from('compliance_controls')
    .select('*')
    .eq('framework_id', framework_id)
    .order('sort_order');
  if (error) throw error;
  return (data ?? []) as ComplianceControl[];
}

// ── Assessments ───────────────────────────────────────────────────────────────

export async function fetchAssessments(framework_id: string): Promise<ComplianceAssessment[]> {
  const { data, error } = await supabase
    .from('compliance_assessments')
    .select('*')
    .eq('framework_id', framework_id)
    .order('started_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []) as ComplianceAssessment[];
}

export async function fetchAllAssessments(): Promise<ComplianceAssessment[]> {
  const { data, error } = await supabase
    .from('compliance_assessments')
    .select('*')
    .order('started_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ComplianceAssessment[];
}

// ── Assessment results — two-step fetch (avoids FK alias issues) ──────────────

export async function fetchResults(assessment_id: string): Promise<AssessmentResult[]> {
  // Step 1: fetch result rows
  const { data: rows, error } = await supabase
    .from('assessment_results')
    .select('*')
    .eq('assessment_id', assessment_id);
  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  // Step 2: collect unique control ids
  const controlIds = [...new Set(rows.map(r => r.control_id).filter(Boolean))];
  if (controlIds.length === 0) return rows as AssessmentResult[];

  // Step 3: fetch controls by id
  const { data: controls, error: ctrlErr } = await supabase
    .from('compliance_controls')
    .select('*')
    .in('id', controlIds);
  if (ctrlErr) throw ctrlErr;

  // Step 4: manually join
  const controlMap = new Map((controls ?? []).map(c => [c.id, c]));

  return rows.map(r => ({
    ...r,
    control: controlMap.get(r.control_id) ?? null,
  })) as AssessmentResult[];
}

// ── Create assessment + bulk result rows ──────────────────────────────────────

export async function createAssessment(
  form: RunAssessmentForm,
  controls: ComplianceControl[],
): Promise<string> {
  const { data: assessment, error: aErr } = await supabase
    .from('compliance_assessments')
    .insert({
      framework_id: form.framework_id,
      assessed_by:  form.assessed_by,
      notes:        form.notes || null,
      status:       'in_progress',
    })
    .select('id')
    .single();
  if (aErr || !assessment) throw aErr ?? new Error('Failed to create assessment');

  const rows = controls.map(c => ({
    assessment_id: assessment.id,
    control_id:    c.id,
    status:        'not_reviewed' as const,
  }));

  const { error: rErr } = await supabase.from('assessment_results').insert(rows);
  if (rErr) throw rErr;

  return assessment.id;
}

// ── Update a single result ────────────────────────────────────────────────────

export async function updateResult(
  result_id: string,
  patch: {
    status:       ControlResultStatus;
    score?:       number | null;
    notes?:       string;
    evidence?:    string;
    reviewed_by?: string;
  },
): Promise<void> {
  const { error } = await supabase
    .from('assessment_results')
    .update({ ...patch, reviewed_at: new Date().toISOString() })
    .eq('id', result_id);
  if (error) throw error;
}

// ── Complete an assessment ────────────────────────────────────────────────────

export async function completeAssessment(assessment_id: string): Promise<number> {
  const { data: rows, error: rowErr } = await supabase
    .from('assessment_results')
    .select('status,score')
    .eq('assessment_id', assessment_id)
    .neq('status', 'not_applicable');
  if (rowErr) throw rowErr;

  const applicable = rows ?? [];
  const totalScore = applicable.reduce((sum, r) => {
    if (r.status === 'compliant')    return sum + (r.score ?? 100);
    if (r.status === 'partial')      return sum + (r.score ?? 50);
    if (r.status === 'noncompliant') return sum + (r.score ?? 0);
    return sum;
  }, 0);
  const overall = applicable.length > 0
    ? Math.round(totalScore / applicable.length)
    : 0;

  const { error: updateErr } = await supabase
    .from('compliance_assessments')
    .update({
      status:       'completed',
      overall_score: overall,
      completed_at:  new Date().toISOString(),
    })
    .eq('id', assessment_id);
  if (updateErr) throw updateErr;

  // Update the framework aggregate score
  const { data: assessment, error: assErr } = await supabase
    .from('compliance_assessments')
    .select('framework_id')
    .eq('id', assessment_id)
    .maybeSingle();
  if (assErr) throw assErr;

  if (assessment) {
    const compliant    = applicable.filter(r => r.status === 'compliant').length;
    const partial      = applicable.filter(r => r.status === 'partial').length;
    const noncompliant = applicable.filter(r => r.status === 'noncompliant').length;

    const { error: fwErr } = await supabase
      .from('compliance_frameworks')
      .update({
        score:                overall,
        controls_compliant:   compliant,
        controls_partial:     partial,
        controls_noncompliant: noncompliant,
      })
      .eq('id', assessment.framework_id);
    if (fwErr) throw fwErr;
  }

  return overall;
}

// ── AI prompt builder — exported so it can be tested independently ────────────

export function buildAIPrompt(
  framework: string,
  controlId: string,
  title: string,
  domain: string,
  question: string | null,
  guidance: string | null,
): string {
  const assessmentQuestion = question?.trim()
    || guidance?.trim()
    || 'Is this control fully implemented, documented, and operating effectively?';

  return `You are a senior GRC auditor conducting a compliance assessment for ${framework}.

Control ID: ${controlId}
Title: "${title}"
Domain: ${domain}
Assessment question: ${assessmentQuestion}

Assess this control against a typical enterprise environment. Respond ONLY with valid JSON — no markdown, no explanation outside the object:

{
  "status": "compliant" | "partial" | "noncompliant",
  "score": <integer 0–100>,
  "risk_level": "none" | "low" | "medium" | "high" | "critical",
  "finding": "<2–3 sentence factual finding describing what was observed>",
  "remediation": "<2–3 sentence specific actionable remediation with tools or timeframes>",
  "due_date": "<ISO date 30–90 days from today if partial or noncompliant, else null>"
}

Scoring rules:
- 85–100 → compliant · 50–84 → partial · 0–49 → noncompliant
- risk_level: none or low for compliant; medium for partial; high or critical for noncompliant
- finding: realistic enterprise observation referencing specific evidence types
- remediation: concrete steps referencing specific tools or standards`;
}