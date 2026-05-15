import { supabase } from './supabase';
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

// ── Assessment results ────────────────────────────────────────────────────────

export async function fetchResults(assessment_id: string): Promise<AssessmentResult[]> {
  const { data, error } = await supabase
    .from('assessment_results')
    .select('*, control:compliance_controls(*)')
    .eq('assessment_id', assessment_id);
  if (error) throw error;
  return (data ?? []) as AssessmentResult[];
}

// ── Create assessment + bulk result rows ──────────────────────────────────────

export async function createAssessment(
  form: RunAssessmentForm,
  controls: ComplianceControl[]
): Promise<string> {
  const { data: assessment, error: aErr } = await supabase
    .from('compliance_assessments')
    .insert({
      framework_id: form.framework_id,
      assessed_by: form.assessed_by,
      notes: form.notes || null,
      status: 'in_progress',
    })
    .select('id')
    .single();
  if (aErr || !assessment) throw aErr ?? new Error('Failed to create assessment');

  const rows = controls.map((c) => ({
    assessment_id: assessment.id,
    control_id: c.id,
    status: 'not_reviewed' as const,
  }));

  const { error: rErr } = await supabase.from('assessment_results').insert(rows);
  if (rErr) throw rErr;

  return assessment.id;
}

// ── Update a single result ────────────────────────────────────────────────────

export async function updateResult(
  result_id: string,
  patch: {
    status: ControlResultStatus;
    score?: number | null;
    notes?: string;
    evidence?: string;
    reviewed_by?: string;
  }
): Promise<void> {
  const { error } = await supabase
    .from('assessment_results')
    .update({ ...patch, reviewed_at: new Date().toISOString() })
    .eq('id', result_id);
  if (error) throw error;
}

// ── Complete an assessment ────────────────────────────────────────────────────

export async function completeAssessment(assessment_id: string): Promise<number> {
  const { data: rows } = await supabase
    .from('assessment_results')
    .select('status,score')
    .eq('assessment_id', assessment_id)
    .neq('status', 'not_applicable');

  const applicable = rows ?? [];
  const totalScore = applicable.reduce((sum, r) => {
    if (r.status === 'compliant')    return sum + (r.score ?? 100);
    if (r.status === 'partial')      return sum + (r.score ?? 50);
    if (r.status === 'noncompliant') return sum + (r.score ?? 0);
    return sum;
  }, 0);
  const overall = applicable.length > 0 ? Math.round(totalScore / applicable.length) : 0;

  const { error } = await supabase
    .from('compliance_assessments')
    .update({ status: 'completed', overall_score: overall, completed_at: new Date().toISOString() })
    .eq('id', assessment_id);
  if (error) throw error;

  // Also update the framework aggregate score
  const { data: assessment } = await supabase
    .from('compliance_assessments')
    .select('framework_id')
    .eq('id', assessment_id)
    .maybeSingle();

  if (assessment) {
    const compliant    = applicable.filter(r => r.status === 'compliant').length;
    const partial      = applicable.filter(r => r.status === 'partial').length;
    const noncompliant = applicable.filter(r => r.status === 'noncompliant').length;
    await supabase
      .from('compliance_frameworks')
      .update({
        score: overall,
        controls_compliant: compliant,
        controls_partial: partial,
        controls_noncompliant: noncompliant,
      })
      .eq('id', assessment.framework_id);
  }

  return overall;
}
