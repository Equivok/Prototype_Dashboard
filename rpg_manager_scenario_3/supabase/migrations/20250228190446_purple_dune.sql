/*
  # Update existing profiles with emails

  1. Changes
    - Updates existing profiles with emails from auth.users
    - Ensures all profiles have their email field populated
*/

-- Update existing profiles with emails from auth.users
DO $$
DECLARE
  auth_user RECORD;
BEGIN
  -- For each user in auth.users
  FOR auth_user IN 
    SELECT id, email FROM auth.users
  LOOP
    -- Update the corresponding profile with the email
    UPDATE public.profiles
    SET email = auth_user.email
    WHERE id = auth_user.id AND (email IS NULL OR email = '');
  END LOOP;
END $$;