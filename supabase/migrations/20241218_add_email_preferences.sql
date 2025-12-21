-- Add email digest preferences to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS digest_daily BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS digest_weekly_seller BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS digest_unsubscribe_token TEXT;

-- Create index for unsubscribe token lookups
CREATE INDEX IF NOT EXISTS idx_profiles_unsubscribe_token ON profiles(digest_unsubscribe_token);

-- Update existing profiles with unsubscribe tokens using uuid
UPDATE profiles SET digest_unsubscribe_token = replace(gen_random_uuid()::text, '-', '') WHERE digest_unsubscribe_token IS NULL;
