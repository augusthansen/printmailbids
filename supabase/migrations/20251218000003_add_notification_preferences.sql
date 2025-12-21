-- Add notification preference columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_new_bid boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_outbid boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_auction_ending boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_auction_won boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_new_offer boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_offer_response boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_new_message boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_payment_received boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_payment_reminder boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_item_shipped boolean DEFAULT true;
