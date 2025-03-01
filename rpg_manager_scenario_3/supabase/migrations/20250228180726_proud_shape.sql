/*
  # Add members column to campaigns table

  1. Changes
    - Add `members` JSONB column to the `campaigns` table to store campaign members
    - This column will store an array of objects with member information
    - Create policy to allow members to view campaigns they are part of
*/

-- Add members column to campaigns table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'members'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN members JSONB;
  END IF;
END $$;

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Members can view campaigns they are part of" ON campaigns;

-- Create policy to allow access to members
CREATE POLICY "Members can view campaigns they are part of"
  ON campaigns
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    (members IS NOT NULL AND members::jsonb @> json_build_array(json_build_object('email', auth.email()))::jsonb)
  );