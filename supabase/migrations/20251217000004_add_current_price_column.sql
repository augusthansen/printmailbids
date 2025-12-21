-- Add current_price column to match what the application code expects
-- Note: The actual database already has current_price, this migration handles both cases

-- Add current_price column if it doesn't exist
ALTER TABLE listings ADD COLUMN IF NOT EXISTS current_price DECIMAL(12,2);

-- If current_bid exists, copy values to current_price and drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'current_bid'
  ) THEN
    UPDATE listings SET current_price = current_bid WHERE current_price IS NULL AND current_bid IS NOT NULL;
    ALTER TABLE listings DROP COLUMN current_bid;
  END IF;
END $$;
