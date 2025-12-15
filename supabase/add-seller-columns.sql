-- Add seller-related columns to profiles table
-- Run this in the Supabase SQL Editor

-- Seller rating columns (needed for listing detail page)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS seller_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS seller_review_count INTEGER DEFAULT 0;
