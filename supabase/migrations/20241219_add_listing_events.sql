-- Create listing_events table for tracking seller analytics
CREATE TABLE IF NOT EXISTS listing_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'video_play', 'watchlist_add', 'bid_click', 'offer_click', 'share')),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT, -- For tracking anonymous users
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_listing_events_listing_id ON listing_events(listing_id);
CREATE INDEX idx_listing_events_event_type ON listing_events(event_type);
CREATE INDEX idx_listing_events_created_at ON listing_events(created_at);
CREATE INDEX idx_listing_events_listing_event ON listing_events(listing_id, event_type);

-- Enable RLS
ALTER TABLE listing_events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert events (for anonymous tracking)
CREATE POLICY "Anyone can insert listing events"
  ON listing_events
  FOR INSERT
  WITH CHECK (true);

-- Policy: Listing owners can view events for their listings
CREATE POLICY "Listing owners can view their listing events"
  ON listing_events
  FOR SELECT
  USING (
    listing_id IN (
      SELECT id FROM listings WHERE seller_id = auth.uid()
    )
  );

-- Policy: Admins can view all events
CREATE POLICY "Admins can view all listing events"
  ON listing_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );
