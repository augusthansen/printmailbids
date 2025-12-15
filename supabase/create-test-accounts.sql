-- =============================================
-- Create Test Accounts for PrintMailBids
-- =============================================
--
-- This script creates test accounts for development/testing.
-- Run this after setting up your Supabase project.
--
-- Test Accounts:
-- 1. buyer@test.com      - Buyer only (password: testbuyer123)
-- 2. seller@test.com     - Seller only (password: testseller123)
-- 3. both@test.com       - Both buyer & seller (password: testboth123)
-- 4. admin@test.com      - Admin user (password: testadmin123)
-- =============================================

-- First, add is_admin column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- =============================================
-- IMPORTANT: Creating test users in Supabase
-- =============================================
--
-- Supabase auth users must be created through the Auth API or Dashboard.
-- You CANNOT directly insert into auth.users via SQL.
--
-- Option 1: Use Supabase Dashboard
--   1. Go to Authentication > Users
--   2. Click "Add user"
--   3. Create each user with the emails/passwords below
--
-- Option 2: Use the Supabase CLI or API
--   Use supabase.auth.admin.createUser() with service role key
--
-- After creating the auth users, run the SQL below to set up their profiles.
-- =============================================

-- Instructions for creating test users via Supabase Dashboard or API:
--
-- | Email              | Password        | Role          |
-- |--------------------|-----------------|---------------|
-- | buyer@test.com     | testbuyer123    | Buyer only    |
-- | seller@test.com    | testseller123   | Seller only   |
-- | both@test.com      | testboth123     | Buyer+Seller  |
-- | admin@test.com     | testadmin123    | Admin         |

-- =============================================
-- Profile Setup (run after auth users are created)
-- =============================================

-- This function sets up test profiles when users are created
-- It will be triggered by the existing handle_new_user trigger

-- To manually update profiles after user creation, use:

-- Update buyer@test.com profile
UPDATE profiles
SET
  full_name = 'Test Buyer',
  company_name = 'Buyer Test Company',
  is_seller = FALSE,
  is_admin = FALSE,
  is_verified = TRUE,
  verified_at = NOW(),
  buyer_rating = 4.5,
  buyer_review_count = 12
WHERE email = 'buyer@test.com';

-- Update seller@test.com profile
UPDATE profiles
SET
  full_name = 'Test Seller',
  company_name = 'Seller Equipment Co.',
  is_seller = TRUE,
  seller_approved_at = NOW(),
  is_admin = FALSE,
  is_verified = TRUE,
  verified_at = NOW(),
  seller_rating = 4.8,
  seller_review_count = 45
WHERE email = 'seller@test.com';

-- Update both@test.com profile (buyer and seller)
UPDATE profiles
SET
  full_name = 'Test Both User',
  company_name = 'PrintMail Solutions Inc.',
  is_seller = TRUE,
  seller_approved_at = NOW(),
  is_admin = FALSE,
  is_verified = TRUE,
  verified_at = NOW(),
  seller_rating = 4.9,
  seller_review_count = 78,
  buyer_rating = 4.7,
  buyer_review_count = 23
WHERE email = 'both@test.com';

-- Update admin@test.com profile
UPDATE profiles
SET
  full_name = 'Test Admin',
  company_name = 'PrintMailBids Admin',
  is_seller = TRUE,
  seller_approved_at = NOW(),
  is_admin = TRUE,
  is_verified = TRUE,
  verified_at = NOW(),
  seller_rating = 5.0,
  seller_review_count = 0,
  buyer_rating = 5.0,
  buyer_review_count = 0
WHERE email = 'admin@test.com';

-- =============================================
-- Verify the setup
-- =============================================
SELECT
  email,
  full_name,
  company_name,
  is_seller,
  is_admin,
  is_verified,
  CASE
    WHEN is_admin THEN 'Admin'
    WHEN is_seller THEN 'Seller'
    ELSE 'Buyer'
  END as role_display
FROM profiles
WHERE email IN ('buyer@test.com', 'seller@test.com', 'both@test.com', 'admin@test.com');
