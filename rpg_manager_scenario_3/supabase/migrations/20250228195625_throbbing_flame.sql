-- Add imported_scenarios column to campaigns table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'imported_scenarios'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN imported_scenarios JSONB;
  END IF;
END $$;