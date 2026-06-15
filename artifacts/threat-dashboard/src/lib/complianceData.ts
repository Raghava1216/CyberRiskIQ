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

// ── Assessment results — two-step fetch ───────────────────────────────────────

export async function fetchResults(assessment_id: string): Promise<AssessmentResult[]> {
  const { data: rows, error } = await supabase
    .from('assessment_results')
    .select('*')
    .eq('assessment_id', assessment_id);
  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  const controlIds = [...new Set(rows.map((r: AssessmentResult) => r.control_id).filter(Boolean))];
  if (controlIds.length === 0) return rows as AssessmentResult[];

  const { data: controls, error: ctrlErr } = await supabase
    .from('compliance_controls')
    .select('*')
    .in('id', controlIds);
  if (ctrlErr) throw ctrlErr;

  const controlMap = new Map((controls ?? []).map((c: ComplianceControl) => [c.id, c]));

  return rows.map((r: AssessmentResult) => ({
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

  const applicable = (rows ?? []) as Pick<AssessmentResult, 'status' | 'score'>[];
  const totalScore = applicable.reduce((sum: number, r) => {
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
      status:        'completed',
      overall_score: overall,
      completed_at:  new Date().toISOString(),
    })
    .eq('id', assessment_id);
  if (updateErr) throw updateErr;

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
        score:                 overall,
        controls_compliant:    compliant,
        controls_partial:      partial,
        controls_noncompliant: noncompliant,
      })
      .eq('id', assessment.framework_id);
    if (fwErr) throw fwErr;
  }

  return overall;
}

// ── AI prompt builder — real market-based evaluation ─────────────────────────

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

  return `You are a senior GRC auditor with 15+ years of experience conducting ${framework} compliance assessments for financial services enterprises.

You are evaluating control "${controlId}: ${title}" in domain "${domain}".

Assessment question: ${assessmentQuestion}

## Your task
Evaluate this control based on REAL-WORLD industry data and current market maturity levels for ${framework} compliance in enterprise financial services organizations. Base your assessment on:
- How this specific control type typically performs across the industry
- Known gaps and challenges organizations face with this control
- Current threat landscape relevance
- Regulatory enforcement history for this control area
- Typical implementation maturity in 2024–2025

## Scoring guidance (use the FULL range — do not cluster)
- 90–100: Fully implemented, tested, documented, with evidence. Rare — only for foundational controls most orgs nail.
- 75–89: Largely compliant with minor gaps. Common for well-understood controls.
- 50–74: Partially implemented — policy exists but gaps in execution, testing, or coverage.
- 25–49: Significant gaps — exists on paper but inadequate implementation.
- 5–24: Non-existent or severely deficient. Common for emerging/complex controls.

## N/A guidance
Mark as not_applicable ONLY if this control genuinely does not apply to a typical financial services enterprise (e.g. a healthcare-specific control in a banking assessment). Most controls DO apply — use not_applicable sparingly.

## Status mapping
- compliant: score 80–100
- partial: score 35–79
- noncompliant: score 5–34
- not_applicable: only if truly irrelevant

Respond ONLY with a single valid JSON object — no markdown fences, no explanation, no text outside the JSON:

{
  "status": "compliant" | "partial" | "noncompliant" | "not_applicable",
  "score": <integer 5–100, reflecting genuine market maturity — NOT 70 by default>,
  "risk_level": "none" | "low" | "medium" | "high" | "critical",
  "finding": "<2–3 sentences grounded in real-world observations specific to ${title} — mention actual evidence types, tools, or gaps typically seen>",
  "remediation": "<2–3 sentences of specific, actionable steps for ${title} — name actual tools, standards, or timeframes>",
  "due_date": "<ISO 8601 date 30–90 days from today proportional to severity, or null if compliant>"
}

Critical rules:
- Score must reflect THIS control's real-world maturity, not a default value
- finding and remediation must be specific to "${title}", not boilerplate
- risk_level must align with score: none/low for compliant, medium for partial, high/critical for noncompliant
- Vary scores meaningfully: some controls score 92, others 18, others 61 — based on reality
- Do NOT output scores like 67, 68, 70, 72 repeatedly — each control has its own realistic score`;
}

// ── Groq API call ─────────────────────────────────────────────────────────────

export async function callGeminiForControl(prompt: string): Promise<{
  status: ControlResultStatus;
  score: number;
  risk_level: string;
  finding: string;
  remediation: string;
  due_date: string | null;
}> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error('VITE_GROQ_API_KEY is not set in your .env file');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a senior GRC auditor. You always respond with a single valid JSON object only — no markdown, no preamble, no explanation outside the JSON. Your assessments are grounded in real-world industry data and vary meaningfully per control.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq API ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error('Empty response from Groq');

  const clean = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Could not parse JSON from Groq response');
  }
}
