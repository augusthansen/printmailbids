-- Add avatar_url column to profiles table for company logos
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Comment for documentation
COMMENT ON COLUMN profiles.avatar_url IS 'URL to user/company logo image stored in Supabase Storage';
