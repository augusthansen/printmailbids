-- =============================================
-- PrintMailBids.com - Ensure Complete Schema
-- This migration ensures all tables and columns exist
-- =============================================

-- Enable necessary extensions (with schema specification)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- =============================================
-- ENUMS (create if not exist)
-- =============================================

DO $$ BEGIN
  CREATE TYPE equipment_status AS ENUM (
    'in_production', 'installed_idle', 'needs_deinstall',
    'deinstalled', 'broken_down', 'palletized', 'crated'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE listing_type AS ENUM (
    'auction', 'fixed_price', 'fixed_price_offers', 'auction_buy_now'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM (
    'draft', 'scheduled', 'active', 'ended', 'sold', 'cancelled', 'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE onsite_assistance AS ENUM (
    'full_assistance', 'forklift_available', 'limited_assistance', 'no_assistance'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE deinstall_responsibility AS ENUM (
    'buyer', 'seller_included', 'seller_additional_fee'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE bid_status AS ENUM (
    'active', 'outbid', 'winning', 'won', 'lost', 'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE offer_status AS ENUM (
    'pending', 'accepted', 'declined', 'countered', 'expired', 'withdrawn'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM (
    'pending', 'paid', 'partial', 'overdue', 'cancelled', 'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE fulfillment_status AS ENUM (
    'awaiting_payment', 'paid', 'packaging', 'ready_for_pickup',
    'shipped', 'delivered', 'completed', 'disputed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'credit_card', 'ach', 'wire', 'check', 'escrow'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'pending', 'processing', 'completed', 'failed', 'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payout_status AS ENUM (
    'pending', 'processing', 'completed', 'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE shipping_quote_status AS ENUM (
    'requested', 'quoted', 'approved', 'declined', 'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'outbid', 'auction_ending_soon', 'auction_won', 'offer_accepted',
    'offer_declined', 'offer_countered', 'offer_expired', 'shipping_quote_received',
    'item_shipped', 'payment_reminder', 'new_listing_saved_search', 'price_drop',
    'new_bid', 'reserve_met', 'auction_ending', 'auction_ended', 'new_offer',
    'offer_response_needed', 'payment_received', 'shipping_quote_requested',
    'buyer_message', 'review_received', 'payout_processed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- TABLES (create if not exist)
-- =============================================

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verification_document_url TEXT,
  is_seller BOOLEAN DEFAULT FALSE,
  seller_approved_at TIMESTAMPTZ,
  seller_rating DECIMAL(3,2) DEFAULT 0,
  seller_review_count INTEGER DEFAULT 0,
  seller_terms TEXT,
  default_shipping_info TEXT,
  buyer_rating DECIMAL(3,2) DEFAULT 0,
  buyer_review_count INTEGER DEFAULT 0,
  stripe_customer_id TEXT,
  stripe_account_id TEXT,
  notify_email BOOLEAN DEFAULT TRUE,
  notify_push BOOLEAN DEFAULT TRUE,
  notify_sms BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User addresses
CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  country TEXT DEFAULT 'US',
  is_default BOOLEAN DEFAULT FALSE,
  has_loading_dock BOOLEAN DEFAULT FALSE,
  has_forklift BOOLEAN DEFAULT FALSE,
  forklift_capacity_lbs INTEGER,
  has_overhead_crane BOOLEAN DEFAULT FALSE,
  crane_capacity_lbs INTEGER,
  ground_level_access BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories if not exist
INSERT INTO categories (name, slug, description, sort_order)
SELECT * FROM (VALUES
  ('Mailing & Fulfillment', 'mailing-fulfillment', 'Inserters, folders, mail processing equipment', 1),
  ('Printing', 'printing', 'Offset presses, digital presses, wide format', 2),
  ('Bindery & Finishing', 'bindery-finishing', 'Cutters, folders, binders, laminators', 3),
  ('Packaging', 'packaging', 'Packaging machinery and equipment', 4),
  ('Material Handling', 'material-handling', 'Forklifts, conveyors, pallet jacks', 5),
  ('Prepress', 'prepress', 'Platemakers, proofing, workflow systems', 6),
  ('Parts & Supplies', 'parts-supplies', 'Spare parts, consumables, accessories', 7)
) AS v(name, slug, description, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);

-- Listings
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  seller_terms TEXT,
  shipping_info TEXT,
  primary_category_id UUID REFERENCES categories(id),
  listing_type listing_type NOT NULL DEFAULT 'auction',
  status listing_status NOT NULL DEFAULT 'draft',
  starting_price DECIMAL(12,2),
  reserve_price DECIMAL(12,2),
  buy_now_price DECIMAL(12,2),
  fixed_price DECIMAL(12,2),
  current_bid DECIMAL(12,2),
  bid_count INTEGER DEFAULT 0,
  accept_offers BOOLEAN DEFAULT FALSE,
  auto_accept_price DECIMAL(12,2),
  auto_decline_price DECIMAL(12,2),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  original_end_time TIMESTAMPTZ,
  make TEXT,
  model TEXT,
  year INTEGER,
  serial_number TEXT,
  condition TEXT,
  hours_count INTEGER,
  equipment_status equipment_status,
  deinstall_responsibility deinstall_responsibility DEFAULT 'buyer',
  deinstall_fee DECIMAL(10,2),
  onsite_assistance onsite_assistance DEFAULT 'no_assistance',
  weight_lbs INTEGER,
  length_inches INTEGER,
  width_inches INTEGER,
  height_inches INTEGER,
  electrical_requirements TEXT,
  air_requirements_psi INTEGER,
  location_id UUID REFERENCES user_addresses(id),
  removal_deadline DATE,
  pickup_hours TEXT,
  pickup_notes TEXT,
  payment_due_days INTEGER DEFAULT 7,
  accepts_credit_card BOOLEAN DEFAULT TRUE,
  accepts_ach BOOLEAN DEFAULT TRUE,
  accepts_wire BOOLEAN DEFAULT TRUE,
  accepts_check BOOLEAN DEFAULT TRUE,
  us_buyers_unrestricted BOOLEAN DEFAULT TRUE,
  us_buyers_verified_only BOOLEAN DEFAULT FALSE,
  us_buyers_approval_required BOOLEAN DEFAULT FALSE,
  intl_buyers_unrestricted BOOLEAN DEFAULT TRUE,
  intl_buyers_verified_only BOOLEAN DEFAULT FALSE,
  intl_buyers_approval_required BOOLEAN DEFAULT FALSE,
  inventory_id TEXT,
  view_count INTEGER DEFAULT 0,
  watch_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- Listing images
CREATE TABLE IF NOT EXISTS listing_images (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listing videos
CREATE TABLE IF NOT EXISTS listing_videos (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  video_type TEXT DEFAULT 'upload',
  thumbnail_url TEXT,
  title TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listing categories junction
CREATE TABLE IF NOT EXISTS listing_categories (
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (listing_id, category_id)
);

-- Watchlist
CREATE TABLE IF NOT EXISTS watchlist (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);

-- Bids
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  max_bid DECIMAL(12,2) NOT NULL,
  status bid_status DEFAULT 'active',
  is_auto_bid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offers
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  message TEXT,
  status offer_status DEFAULT 'pending',
  parent_offer_id UUID REFERENCES offers(id),
  counter_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  listing_id UUID NOT NULL REFERENCES listings(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  sale_amount DECIMAL(12,2) NOT NULL,
  buyer_premium_percent DECIMAL(4,2) DEFAULT 5.00,
  buyer_premium_amount DECIMAL(12,2) NOT NULL,
  shipping_amount DECIMAL(12,2) DEFAULT 0,
  packaging_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  seller_commission_percent DECIMAL(4,2) DEFAULT 8.00,
  seller_commission_amount DECIMAL(12,2) NOT NULL,
  seller_payout_amount DECIMAL(12,2) NOT NULL,
  status invoice_status DEFAULT 'pending',
  fulfillment_status fulfillment_status DEFAULT 'awaiting_payment',
  payment_due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  shipping_carrier TEXT,
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  seller_notes TEXT,
  buyer_notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  method payment_method NOT NULL,
  status payment_status DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  escrow_transaction_id TEXT,
  check_number TEXT,
  processing_fee DECIMAL(10,2) DEFAULT 0,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payouts
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  amount DECIMAL(12,2) NOT NULL,
  status payout_status DEFAULT 'pending',
  stripe_transfer_id TEXT,
  estimated_arrival DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipping quote requests
CREATE TABLE IF NOT EXISTS shipping_quote_requests (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id),
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),
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

-- Shipping quotes
CREATE TABLE IF NOT EXISTS shipping_quotes (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES shipping_quote_requests(id) ON DELETE CASCADE,
  carrier_name TEXT NOT NULL,
  service_level TEXT,
  amount DECIMAL(10,2) NOT NULL,
  transit_days INTEGER,
  quote_pdf_url TEXT,
  notes TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  expires_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service providers
CREATE TABLE IF NOT EXISTS service_providers (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  website TEXT,
  logo_url TEXT,
  description TEXT,
  offers_deinstall BOOLEAN DEFAULT FALSE,
  offers_rigging BOOLEAN DEFAULT FALSE,
  offers_crating BOOLEAN DEFAULT FALSE,
  offers_palletizing BOOLEAN DEFAULT FALSE,
  offers_loading BOOLEAN DEFAULT FALSE,
  offers_freight BOOLEAN DEFAULT FALSE,
  offers_white_glove BOOLEAN DEFAULT FALSE,
  service_states TEXT[],
  service_radius_miles INTEGER,
  is_verified BOOLEAN DEFAULT FALSE,
  insurance_verified BOOLEAN DEFAULT FALSE,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id),
  invoice_id UUID REFERENCES invoices(id),
  participant_1_id UUID NOT NULL REFERENCES profiles(id),
  participant_2_id UUID NOT NULL REFERENCES profiles(id),
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  listing_id UUID REFERENCES listings(id),
  invoice_id UUID REFERENCES invoices(id),
  offer_id UUID REFERENCES offers(id),
  bid_id UUID REFERENCES bids(id),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  sent_push BOOLEAN DEFAULT FALSE,
  sent_email BOOLEAN DEFAULT FALSE,
  sent_sms BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewee_id UUID NOT NULL REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  is_buyer_review BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved searches
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  criteria JSONB NOT NULL,
  notify_new_listings BOOLEAN DEFAULT TRUE,
  notify_price_drops BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ADD MISSING COLUMNS (if tables exist but columns don't)
-- =============================================

-- Profiles columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS seller_terms TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_shipping_info TEXT;

-- Listings columns
ALTER TABLE listings ADD COLUMN IF NOT EXISTS seller_terms TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS shipping_info TEXT;

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_bids_listing_amount ON bids(listing_id, amount DESC);
CREATE INDEX IF NOT EXISTS idx_bids_bidder ON bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(primary_category_id);
CREATE INDEX IF NOT EXISTS idx_listings_end_time ON listings(end_time) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_offers_listing ON offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer ON offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_seller ON invoices(seller_id);
CREATE INDEX IF NOT EXISTS idx_invoices_buyer ON invoices(buyer_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

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

-- Drop existing policies before recreating (to avoid errors)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Active listings are viewable by everyone" ON listings;
DROP POLICY IF EXISTS "Users can create listings" ON listings;
DROP POLICY IF EXISTS "Users can update own listings" ON listings;
DROP POLICY IF EXISTS "Bids are viewable by everyone" ON bids;
DROP POLICY IF EXISTS "Authenticated users can bid" ON bids;
DROP POLICY IF EXISTS "Offer participants can view" ON offers;
DROP POLICY IF EXISTS "Buyers can create offers" ON offers;
DROP POLICY IF EXISTS "Participants can update offers" ON offers;
DROP POLICY IF EXISTS "Invoice participants can view" ON invoices;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can manage own watchlist" ON watchlist;
DROP POLICY IF EXISTS "Listing images are viewable by everyone" ON listing_images;
DROP POLICY IF EXISTS "Sellers can manage listing images" ON listing_images;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Listings policies
CREATE POLICY "Active listings are viewable by everyone" ON listings
  FOR SELECT USING (status IN ('active', 'ended', 'sold') OR seller_id = auth.uid());
CREATE POLICY "Users can create listings" ON listings
  FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Users can update own listings" ON listings
  FOR UPDATE USING (auth.uid() = seller_id);

-- Listing images policies
CREATE POLICY "Listing images are viewable by everyone" ON listing_images FOR SELECT USING (true);
CREATE POLICY "Sellers can manage listing images" ON listing_images
  FOR ALL USING (
    EXISTS (SELECT 1 FROM listings WHERE listings.id = listing_images.listing_id AND listings.seller_id = auth.uid())
  );

-- Bids policies
CREATE POLICY "Bids are viewable by everyone" ON bids FOR SELECT USING (true);
CREATE POLICY "Authenticated users can bid" ON bids
  FOR INSERT WITH CHECK (auth.uid() = bidder_id);

-- Offers policies
CREATE POLICY "Offer participants can view" ON offers
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Buyers can create offers" ON offers
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Participants can update offers" ON offers
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Invoice policies
CREATE POLICY "Invoice participants can view" ON invoices
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Notification policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Watchlist policies
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

-- Apply triggers (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
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

DROP TRIGGER IF EXISTS set_invoice_number ON invoices;
CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();
