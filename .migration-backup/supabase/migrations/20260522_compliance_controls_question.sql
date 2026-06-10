-- Add question column to compliance_controls
ALTER TABLE compliance_controls
  ADD COLUMN IF NOT EXISTS question text;

-- Seed sample questions for existing controls
-- (Claude Code will need to run this after the column exists)
UPDATE compliance_controls
SET question = CASE
  WHEN title ILIKE '%data processing%'     THEN 'Do you have documented Data Processing Agreements (DPAs) in place with all third-party processors? Are they reviewed annually?'
  WHEN title ILIKE '%consent%'             THEN 'Is there a documented mechanism to capture, record, and withdraw data subject consent? Is the audit trail retained?'
  WHEN title ILIKE '%data subject%'        THEN 'Can the organisation fulfil data subject access requests within the required 30-day window? Is the process documented and tested?'
  WHEN title ILIKE '%breach%'              THEN 'Is there a documented data breach response procedure? Has it been tested in the last 12 months? Is the 72-hour notification process in place?'
  WHEN title ILIKE '%access control%'      THEN 'Are access controls implemented on a least-privilege basis? Is access reviewed quarterly and revoked promptly on termination?'
  WHEN title ILIKE '%encryption%'          THEN 'Is data encrypted at rest and in transit using current standards (AES-256, TLS 1.2+)? Are encryption keys managed and rotated?'
  WHEN title ILIKE '%incident%'            THEN 'Is there a documented incident response plan? Has it been tested via tabletop exercise in the last 12 months?'
  WHEN title ILIKE '%risk%'               THEN 'Is there a formal risk assessment process? Are risks documented, rated, assigned owners, and reviewed at defined intervals?'
  WHEN title ILIKE '%audit%'              THEN 'Are audit logs enabled for all critical systems? Are they protected from tampering, retained for the required period, and reviewed regularly?'
  WHEN title ILIKE '%vendor%'             THEN 'Are third-party vendors assessed for security and compliance before onboarding? Is there an ongoing monitoring programme?'
  ELSE 'Is this control fully implemented, documented, and operating effectively? Provide evidence of implementation and last review date.'
END
WHERE question IS NULL;