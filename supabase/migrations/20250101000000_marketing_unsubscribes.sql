-- Marketing email unsubscribe list
-- Stores emails that have opted out of marketing communications
-- This is separate from user preferences since these may be non-registered users

CREATE TABLE IF NOT EXISTS marketing_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  unsubscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT, -- e.g., 'seller_outreach', 'newsletter', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick email lookups
CREATE INDEX IF NOT EXISTS idx_marketing_unsubscribes_email ON marketing_unsubscribes(email);

-- RLS policies
ALTER TABLE marketing_unsubscribes ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (no public access)
-- No policies means only service role key works
