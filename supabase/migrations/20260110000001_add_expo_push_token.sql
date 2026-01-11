-- Add expo_push_token column to profiles table for push notifications
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- Add index for faster lookups when sending notifications
CREATE INDEX IF NOT EXISTS idx_profiles_expo_push_token ON profiles(expo_push_token) WHERE expo_push_token IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN profiles.expo_push_token IS 'Expo Push Notification token for mobile app notifications';
