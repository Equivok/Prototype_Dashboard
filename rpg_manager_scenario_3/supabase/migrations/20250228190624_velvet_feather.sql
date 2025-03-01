/*
  # Create function to get all users

  1. New Functions
    - `get_all_users` - A secure function to get user information including emails
*/

-- Create a function to get all users with their emails
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  username TEXT,
  avatar_url TEXT
) SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(p.email, u.email) as email,
    p.username,
    p.avatar_url
  FROM 
    auth.users u
  LEFT JOIN 
    public.profiles p ON u.id = p.id
  WHERE 
    u.email IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;