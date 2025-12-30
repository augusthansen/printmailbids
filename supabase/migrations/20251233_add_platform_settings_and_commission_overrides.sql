-- Migration: Add platform settings table and seller commission overrides
-- This enables dynamic commission rates configurable from admin panel

-- Create platform_settings table (singleton table with single row)
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Fee settings
  default_buyer_premium_percent DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
  default_seller_commission_percent DECIMAL(5, 2) NOT NULL DEFAULT 8.00,
  -- Auction settings
  auction_extension_minutes INTEGER NOT NULL DEFAULT 2,
  offer_expiry_hours INTEGER NOT NULL DEFAULT 48,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings (only if table is empty)
INSERT INTO platform_settings (
  default_buyer_premium_percent,
  default_seller_commission_percent,
  auction_extension_minutes,
  offer_expiry_hours
)
SELECT 5.00, 8.00, 2, 48
WHERE NOT EXISTS (SELECT 1 FROM platform_settings);

-- Add custom commission columns to profiles table
-- NULL means use platform defaults; non-NULL means seller has custom rate
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS custom_buyer_premium_percent DECIMAL(5, 2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS custom_seller_commission_percent DECIMAL(5, 2) DEFAULT NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN profiles.custom_buyer_premium_percent IS 'Custom buyer premium for this seller. NULL means use platform default.';
COMMENT ON COLUMN profiles.custom_seller_commission_percent IS 'Custom seller commission for this seller. NULL means use platform default.';

-- Create trigger to update updated_at on platform_settings
CREATE OR REPLACE FUNCTION update_platform_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS platform_settings_updated_at ON platform_settings;
CREATE TRIGGER platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_settings_updated_at();

-- RLS policies for platform_settings
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read platform settings (needed for fee display on public pages)
CREATE POLICY "Anyone can view platform settings"
  ON platform_settings
  FOR SELECT
  USING (true);

-- Only admins can update platform settings
CREATE POLICY "Admins can update platform settings"
  ON platform_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Prevent deletion of platform settings
CREATE POLICY "No one can delete platform settings"
  ON platform_settings
  FOR DELETE
  USING (false);

-- Prevent inserting additional rows (singleton table)
CREATE POLICY "No additional inserts to platform settings"
  ON platform_settings
  FOR INSERT
  WITH CHECK (
    NOT EXISTS (SELECT 1 FROM platform_settings)
  );
