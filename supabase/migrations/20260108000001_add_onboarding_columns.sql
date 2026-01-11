-- Add onboarding tracking columns to profiles table
-- These help track whether new users have completed profile setup

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT false;

-- Mark existing users with complete profiles as having completed onboarding
-- Users who already have a full_name set are considered to have completed onboarding
UPDATE profiles
SET onboarding_completed = true
WHERE full_name IS NOT NULL AND full_name != '';

-- Add comment for documentation
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether the user has completed the new user onboarding flow';
COMMENT ON COLUMN profiles.onboarding_skipped IS 'Whether the user has skipped the onboarding flow (shows reminder on dashboard)';
