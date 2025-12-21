-- Add phone verification support

-- Table to store verification codes
CREATE TABLE IF NOT EXISTS phone_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_phone_verification_user_id ON phone_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_verification_expires ON phone_verification_codes(expires_at);

-- RLS policies
ALTER TABLE phone_verification_codes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own verification codes
CREATE POLICY "Users can view own verification codes" ON phone_verification_codes
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own verification codes
CREATE POLICY "Users can create own verification codes" ON phone_verification_codes
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own verification codes
CREATE POLICY "Users can update own verification codes" ON phone_verification_codes
  FOR UPDATE USING (user_id = auth.uid());

-- Add phone_verified_at to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

-- Add verified_phone to store the actual verified phone number
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_phone TEXT;

-- Function to clean up expired verification codes (can be called by a cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM phone_verification_codes
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON TABLE phone_verification_codes IS 'Stores SMS verification codes for phone number verification';
COMMENT ON COLUMN profiles.phone_verified IS 'Whether the user has verified their phone number';
COMMENT ON COLUMN profiles.phone_verified_at IS 'When the phone was verified';
COMMENT ON COLUMN profiles.verified_phone IS 'The actual verified phone number';
