/*
  # Compliance Assessments and Results Tables

  ## New Tables

  ### compliance_assessments
  One row per "Run Assessment" invocation. Tracks who ran it, when, against which
  framework, and its completion status + final score.
  - id, framework_id (FK → compliance_frameworks), status, overall_score,
    assessed_by, started_at, completed_at, notes

  ### assessment_results
  One row per control per assessment run. Stores the reviewer's verdict,
  numeric score, evidence links, and notes for each control.
  - id, assessment_id (FK → compliance_assessments), control_id
    (FK → compliance_controls), status, score, evidence, notes,
    reviewed_by, reviewed_at

  ## Security
  - RLS enabled; permissive policies (no auth yet, ready to tighten)
  - UNIQUE (assessment_id, control_id) enables safe upserts
*/

CREATE TABLE IF NOT EXISTS compliance_assessments (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id  uuid        NOT NULL REFERENCES compliance_frameworks(id) ON DELETE RESTRICT,
  status        text        NOT NULL DEFAULT 'in_progress'
                              CHECK (status IN ('in_progress','completed','cancelled')),
  overall_score numeric(5,2),
  assessed_by   text        NOT NULL DEFAULT '',
  started_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessments_framework
  ON compliance_assessments(framework_id, started_at DESC);

ALTER TABLE compliance_assessments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='compliance_assessments' AND policyname='assessments_select') THEN
    CREATE POLICY "assessments_select" ON compliance_assessments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='compliance_assessments' AND policyname='assessments_insert') THEN
    CREATE POLICY "assessments_insert" ON compliance_assessments FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='compliance_assessments' AND policyname='assessments_update') THEN
    CREATE POLICY "assessments_update" ON compliance_assessments FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS assessment_results (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid        NOT NULL REFERENCES compliance_assessments(id) ON DELETE CASCADE,
  control_id    uuid        NOT NULL REFERENCES compliance_controls(id) ON DELETE RESTRICT,
  status        text        NOT NULL DEFAULT 'not_reviewed'
                              CHECK (status IN ('compliant','partial','noncompliant','not_applicable','not_reviewed')),
  score         integer     CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  evidence      text,
  notes         text,
  reviewed_by   text,
  reviewed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, control_id)
);

CREATE INDEX IF NOT EXISTS idx_results_assessment
  ON assessment_results(assessment_id, status);

ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='assessment_results' AND policyname='results_select') THEN
    CREATE POLICY "results_select" ON assessment_results FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='assessment_results' AND policyname='results_insert') THEN
    CREATE POLICY "results_insert" ON assessment_results FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='assessment_results' AND policyname='results_update') THEN
    CREATE POLICY "results_update" ON assessment_results FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;
