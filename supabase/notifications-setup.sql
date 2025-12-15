-- =============================================
-- Notifications Table Setup
-- Run this in Supabase SQL Editor
-- =============================================

-- Create notification type enum
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'outbid',
    'auction_ending_soon',
    'auction_won',
    'offer_accepted',
    'offer_declined',
    'offer_countered',
    'offer_expired',
    'shipping_quote_received',
    'item_shipped',
    'payment_reminder',
    'new_listing_saved_search',
    'price_drop',
    'new_bid',
    'reserve_met',
    'auction_ending',
    'auction_ended',
    'new_offer',
    'offer_response_needed',
    'payment_received',
    'shipping_quote_requested',
    'buyer_message',
    'review_received',
    'payout_processed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,

  -- Related entities (optional)
  listing_id UUID,
  invoice_id UUID,
  offer_id UUID,
  bid_id UUID,

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Delivery tracking
  sent_push BOOLEAN DEFAULT FALSE,
  sent_email BOOLEAN DEFAULT FALSE,
  sent_sms BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Allow system to insert notifications (using service role)
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);
