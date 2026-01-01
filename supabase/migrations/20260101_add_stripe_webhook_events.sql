-- Create stripe_webhook_events table for idempotency tracking
-- This prevents duplicate processing of webhook events

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id ON stripe_webhook_events(event_id);

-- Enable RLS (but only admin can access this table)
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (for webhook processing)
-- No public policies - only accessible via service role key

-- Comment for documentation
COMMENT ON TABLE stripe_webhook_events IS 'Tracks processed Stripe webhook events to prevent duplicate processing';
