/*
  # Add guidance and sort_order to compliance_controls
  Adds two columns needed by the assessment UI.
  Uses IF NOT EXISTS guards for idempotency.
*/
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='compliance_controls' AND column_name='guidance') THEN
    ALTER TABLE compliance_controls ADD COLUMN guidance text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='compliance_controls' AND column_name='sort_order') THEN
    ALTER TABLE compliance_controls ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
  END IF;
END $$;
