-- Add featured column to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS featured_at TIMESTAMPTZ;

-- Create index for featured listings
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(is_featured, featured_at DESC) WHERE is_featured = TRUE;
