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

-- Add email column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
  END IF;
END $$;

-- Update the trigger function to store email in profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, email)
  VALUES (new.id, SPLIT_PART(new.email, '@', 1), null, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;