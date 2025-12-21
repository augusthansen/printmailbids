-- Add is_auto_bid column to bids table if it doesn't exist
ALTER TABLE bids ADD COLUMN IF NOT EXISTS is_auto_bid BOOLEAN DEFAULT FALSE;
