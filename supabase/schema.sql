-- =============================================
-- PrintMailBids.com Database Schema
-- Version 1.0
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS & PROFILES
-- =============================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verification_document_url TEXT,
  
  -- Seller info
  is_seller BOOLEAN DEFAULT FALSE,
  seller_approved_at TIMESTAMPTZ,
  seller_rating DECIMAL(3,2) DEFAULT 0,
  seller_review_count INTEGER DEFAULT 0,
  seller_terms TEXT, -- Global seller terms that apply to all listings
  default_shipping_info TEXT, -- Default shipping info for all listings

  -- Buyer info
  buyer_rating DECIMAL(3,2) DEFAULT 0,
  buyer_review_count INTEGER DEFAULT 0,
  
  -- Stripe
  stripe_customer_id TEXT,
  stripe_account_id TEXT, -- For sellers (Stripe Connect)
  
  -- Notification preferences
  notify_email BOOLEAN DEFAULT TRUE,
  notify_push BOOLEAN DEFAULT TRUE,
  notify_sms BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User addresses (for shipping, multiple per user)
CREATE TABLE user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT, -- "Main Warehouse", "Office", etc.
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  country TEXT DEFAULT 'US',
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Facility details (for equipment locations)
  has_loading_dock BOOLEAN DEFAULT FALSE,
  has_forklift BOOLEAN DEFAULT FALSE,
  forklift_capacity_lbs INTEGER,
  has_overhead_crane BOOLEAN DEFAULT FALSE,
  crane_capacity_lbs INTEGER,
  ground_level_access BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CATEGORIES
-- =============================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed categories
INSERT INTO categories (name, slug, description, sort_order) VALUES
  ('Mailing & Fulfillment', 'mailing-fulfillment', 'Inserters, folders, mail processing equipment', 1),
  ('Printing', 'printing', 'Offset presses, digital presses, wide format', 2),
  ('Bindery & Finishing', 'bindery-finishing', 'Cutters, folders, binders, laminators', 3),
  ('Packaging', 'packaging', 'Packaging machinery and equipment', 4),
  ('Material Handling', 'material-handling', 'Forklifts, conveyors, pallet jacks', 5),
  ('Prepress', 'prepress', 'Platemakers, proofing, workflow systems', 6),
  ('Parts & Supplies', 'parts-supplies', 'Spare parts, consumables, accessories', 7);

-- =============================================
-- LISTINGS
-- =============================================

-- Equipment status enum
CREATE TYPE equipment_status AS ENUM (
  'in_production',
  'installed_idle', 
  'needs_deinstall',
  'deinstalled',
  'broken_down',
  'palletized',
  'crated'
);

-- Listing type enum
CREATE TYPE listing_type AS ENUM (
  'auction',
  'fixed_price',
  'fixed_price_offers',
  'auction_buy_now'
);

-- Listing status enum
CREATE TYPE listing_status AS ENUM (
  'draft',
  'scheduled',
  'active',
  'ended',
  'sold',
  'cancelled',
  'expired'
);

-- On-site assistance enum
CREATE TYPE onsite_assistance AS ENUM (
  'full_assistance',
  'forklift_available',
  'limited_assistance',
  'no_assistance'
);

-- Deinstall responsibility enum
CREATE TYPE deinstall_responsibility AS ENUM (
  'buyer',
  'seller_included',
  'seller_additional_fee'
);

-- Main listings table
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  seller_terms TEXT, -- Listing-specific seller terms (overrides global)
  shipping_info TEXT, -- Shipping and delivery information

  -- Categorization
  primary_category_id UUID REFERENCES categories(id),
  
  -- Listing type & status
  listing_type listing_type NOT NULL DEFAULT 'auction',
  status listing_status NOT NULL DEFAULT 'draft',
  
  -- Pricing
  starting_price DECIMAL(12,2),
  reserve_price DECIMAL(12,2),
  buy_now_price DECIMAL(12,2),
  fixed_price DECIMAL(12,2),
  current_bid DECIMAL(12,2),
  bid_count INTEGER DEFAULT 0,
  
  -- Make Offer settings
  accept_offers BOOLEAN DEFAULT FALSE,
  auto_accept_price DECIMAL(12,2),
  auto_decline_price DECIMAL(12,2),
  
  -- Auction timing
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  original_end_time TIMESTAMPTZ, -- Before any extensions
  
  -- Equipment details
  make TEXT,
  model TEXT,
  year INTEGER,
  serial_number TEXT,
  condition TEXT,
  hours_count INTEGER,
  
  -- Equipment status & logistics
  equipment_status equipment_status,
  deinstall_responsibility deinstall_responsibility DEFAULT 'buyer',
  deinstall_fee DECIMAL(10,2),
  onsite_assistance onsite_assistance DEFAULT 'no_assistance',
  
  -- Specifications
  weight_lbs INTEGER,
  length_inches INTEGER,
  width_inches INTEGER,
  height_inches INTEGER,
  electrical_requirements TEXT,
  air_requirements_psi INTEGER,
  
  -- Location
  location_id UUID REFERENCES user_addresses(id),
  
  -- Removal terms
  removal_deadline DATE,
  pickup_hours TEXT,
  pickup_notes TEXT,
  
  -- Payment settings
  payment_due_days INTEGER DEFAULT 7,
  accepts_credit_card BOOLEAN DEFAULT TRUE,
  accepts_ach BOOLEAN DEFAULT TRUE,
  accepts_wire BOOLEAN DEFAULT TRUE,
  accepts_check BOOLEAN DEFAULT TRUE,
  
  -- Buyer restrictions
  us_buyers_unrestricted BOOLEAN DEFAULT TRUE,
  us_buyers_verified_only BOOLEAN DEFAULT FALSE,
  us_buyers_approval_required BOOLEAN DEFAULT FALSE,
  intl_buyers_unrestricted BOOLEAN DEFAULT TRUE,
  intl_buyers_verified_only BOOLEAN DEFAULT FALSE,
  intl_buyers_approval_required BOOLEAN DEFAULT FALSE,
  
  -- Internal tracking
  inventory_id TEXT,
  view_count INTEGER DEFAULT 0,
  watch_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- Listing images
CREATE TABLE listing_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listing videos
CREATE TABLE listing_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL, -- Could be YouTube URL or direct upload
  video_type TEXT DEFAULT 'upload', -- 'upload', 'youtube', 'vimeo'
  thumbnail_url TEXT,
  title TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Additional categories for listings (many-to-many)
CREATE TABLE listing_categories (
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (listing_id, category_id)
);

-- Watchlist
CREATE TABLE watchlist (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);

-- =============================================
-- BIDDING
-- =============================================

CREATE TYPE bid_status AS ENUM (
  'active',
  'outbid',
  'winning',
  'won',
  'lost',
  'cancelled'
);

CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  amount DECIMAL(12,2) NOT NULL,
  max_bid DECIMAL(12,2) NOT NULL, -- Proxy bid maximum
  status bid_status DEFAULT 'active',
  
  is_auto_bid BOOLEAN DEFAULT FALSE, -- Was this placed automatically by proxy
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast bid lookups
CREATE INDEX idx_bids_listing_amount ON bids(listing_id, amount DESC);
CREATE INDEX idx_bids_bidder ON bids(bidder_id);

-- =============================================
-- OFFERS (Make Offer system)
-- =============================================

CREATE TYPE offer_status AS ENUM (
  'pending',
  'accepted',
  'declined',
  'countered',
  'expired',
  'withdrawn'
);

CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  amount DECIMAL(12,2) NOT NULL,
  message TEXT,
  status offer_status DEFAULT 'pending',
  
  -- Counter offer tracking
  parent_offer_id UUID REFERENCES offers(id),
  counter_count INTEGER DEFAULT 0,
  
  expires_at TIMESTAMPTZ NOT NULL,
  responded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INVOICES & PAYMENTS
-- =============================================

CREATE TYPE invoice_status AS ENUM (
  'pending',
  'paid',
  'partial',
  'overdue',
  'cancelled',
  'refunded'
);

CREATE TYPE fulfillment_status AS ENUM (
  'awaiting_payment',
  'paid',
  'packaging',
  'ready_for_pickup',
  'shipped',
  'delivered',
  'completed',
  'disputed'
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  
  listing_id UUID NOT NULL REFERENCES listings(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Amounts
  sale_amount DECIMAL(12,2) NOT NULL,
  buyer_premium_percent DECIMAL(4,2) DEFAULT 5.00,
  buyer_premium_amount DECIMAL(12,2) NOT NULL,
  shipping_amount DECIMAL(12,2) DEFAULT 0,
  packaging_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  
  -- Seller payout
  seller_commission_percent DECIMAL(4,2) DEFAULT 8.00,
  seller_commission_amount DECIMAL(12,2) NOT NULL,
  seller_payout_amount DECIMAL(12,2) NOT NULL,
  
  -- Status
  status invoice_status DEFAULT 'pending',
  fulfillment_status fulfillment_status DEFAULT 'awaiting_payment',
  
  -- Payment details
  payment_due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  
  -- Shipping
  shipping_carrier TEXT,
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Stripe
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT, -- For payout to seller
  
  -- Notes
  seller_notes TEXT,
  buyer_notes TEXT,
  internal_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment records
CREATE TYPE payment_method AS ENUM (
  'credit_card',
  'ach',
  'wire',
  'check',
  'escrow'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded'
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  amount DECIMAL(12,2) NOT NULL,
  method payment_method NOT NULL,
  status payment_status DEFAULT 'pending',
  
  -- External references
  stripe_payment_intent_id TEXT,
  escrow_transaction_id TEXT,
  check_number TEXT,
  
  processing_fee DECIMAL(10,2) DEFAULT 0,
  
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seller payouts
CREATE TYPE payout_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  
  amount DECIMAL(12,2) NOT NULL,
  status payout_status DEFAULT 'pending',
  
  stripe_transfer_id TEXT,
  
  estimated_arrival DATE,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SHIPPING QUOTES
-- =============================================

CREATE TYPE shipping_quote_status AS ENUM (
  'requested',
  'quoted',
  'approved',
  'declined',
  'expired'
);

CREATE TABLE shipping_quote_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id),
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Delivery address
  delivery_address_line1 TEXT NOT NULL,
  delivery_address_line2 TEXT,
  delivery_city TEXT NOT NULL,
  delivery_state TEXT NOT NULL,
  delivery_zip TEXT NOT NULL,
  delivery_country TEXT DEFAULT 'US',
  
  status shipping_quote_status DEFAULT 'requested',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shipping_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES shipping_quote_requests(id) ON DELETE CASCADE,
  
  carrier_name TEXT NOT NULL,
  service_level TEXT, -- 'economy', 'standard', 'expedited', 'white_glove'
  amount DECIMAL(10,2) NOT NULL,
  transit_days INTEGER,
  quote_pdf_url TEXT,
  notes TEXT,
  
  is_approved BOOLEAN DEFAULT FALSE,
  expires_at DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SERVICE PROVIDERS (Rigging Network)
-- =============================================

CREATE TABLE service_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  website TEXT,
  logo_url TEXT,
  description TEXT,
  
  -- Services offered
  offers_deinstall BOOLEAN DEFAULT FALSE,
  offers_rigging BOOLEAN DEFAULT FALSE,
  offers_crating BOOLEAN DEFAULT FALSE,
  offers_palletizing BOOLEAN DEFAULT FALSE,
  offers_loading BOOLEAN DEFAULT FALSE,
  offers_freight BOOLEAN DEFAULT FALSE,
  offers_white_glove BOOLEAN DEFAULT FALSE,
  
  -- Service area (simplified - could be more complex)
  service_states TEXT[], -- Array of state codes
  service_radius_miles INTEGER,
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  insurance_verified BOOLEAN DEFAULT FALSE,
  
  -- Stats
  avg_rating DECIMAL(3,2) DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MESSAGES
-- =============================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id),
  invoice_id UUID REFERENCES invoices(id),
  
  participant_1_id UUID NOT NULL REFERENCES profiles(id),
  participant_2_id UUID NOT NULL REFERENCES profiles(id),
  
  last_message_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS
-- =============================================

CREATE TYPE notification_type AS ENUM (
  -- Buyer notifications
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
  
  -- Seller notifications
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

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  
  -- Related entities
  listing_id UUID REFERENCES listings(id),
  invoice_id UUID REFERENCES invoices(id),
  offer_id UUID REFERENCES offers(id),
  bid_id UUID REFERENCES bids(id),
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Delivery tracking
  sent_push BOOLEAN DEFAULT FALSE,
  sent_email BOOLEAN DEFAULT FALSE,
  sent_sms BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- =============================================
-- REVIEWS
-- =============================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewee_id UUID NOT NULL REFERENCES profiles(id),
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  
  -- Review type
  is_buyer_review BOOLEAN NOT NULL, -- true = buyer reviewing seller
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SAVED SEARCHES
-- =============================================

CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  
  -- Search criteria (stored as JSON for flexibility)
  criteria JSONB NOT NULL,
  
  notify_new_listings BOOLEAN DEFAULT TRUE,
  notify_price_drops BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, update own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Listings: Public read for active, owner can manage
CREATE POLICY "Active listings are viewable by everyone" ON listings 
  FOR SELECT USING (status IN ('active', 'ended', 'sold') OR seller_id = auth.uid());
CREATE POLICY "Users can create listings" ON listings 
  FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Users can update own listings" ON listings 
  FOR UPDATE USING (auth.uid() = seller_id);

-- Bids: Public read, authenticated create
CREATE POLICY "Bids are viewable by everyone" ON bids FOR SELECT USING (true);
CREATE POLICY "Authenticated users can bid" ON bids 
  FOR INSERT WITH CHECK (auth.uid() = bidder_id);

-- Offers: Only participants can see
CREATE POLICY "Offer participants can view" ON offers 
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Buyers can create offers" ON offers 
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Participants can update offers" ON offers 
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Invoices: Only participants can see
CREATE POLICY "Invoice participants can view" ON invoices 
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Notifications: Only owner can see
CREATE POLICY "Users can view own notifications" ON notifications 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications 
  FOR UPDATE USING (auth.uid() = user_id);

-- Watchlist: Only owner
CREATE POLICY "Users can manage own watchlist" ON watchlist 
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  year_prefix TEXT;
  next_num INTEGER;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 6) AS INTEGER)), 0) + 1
  INTO next_num
  FROM invoices
  WHERE invoice_number LIKE year_prefix || '-%';
  
  NEW.invoice_number := year_prefix || '-' || LPAD(next_num::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_category ON listings(primary_category_id);
CREATE INDEX idx_listings_end_time ON listings(end_time) WHERE status = 'active';
CREATE INDEX idx_offers_listing ON offers(listing_id);
CREATE INDEX idx_offers_buyer ON offers(buyer_id);
CREATE INDEX idx_invoices_seller ON invoices(seller_id);
CREATE INDEX idx_invoices_buyer ON invoices(buyer_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
