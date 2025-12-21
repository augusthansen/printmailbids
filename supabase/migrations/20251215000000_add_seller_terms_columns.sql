-- Add seller_terms column to profiles table for global seller terms
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS seller_terms TEXT;

-- Add default_shipping_info column to profiles table for global shipping info
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_shipping_info TEXT;

-- Add shipping_info column to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS shipping_info TEXT;

-- Add seller_terms to listings table if it doesn't exist
ALTER TABLE listings ADD COLUMN IF NOT EXISTS seller_terms TEXT;
