-- Create listings table
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  primary_category_id UUID REFERENCES categories(id),

  -- Listing type and status
  listing_type TEXT NOT NULL DEFAULT 'auction' CHECK (listing_type IN ('auction', 'auction_buy_now', 'fixed_price', 'fixed_price_offers')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'sold', 'ended', 'cancelled')),

  -- Pricing
  starting_price DECIMAL(12,2),
  reserve_price DECIMAL(12,2),
  buy_now_price DECIMAL(12,2),
  fixed_price DECIMAL(12,2),
  current_price DECIMAL(12,2),

  -- Offers
  accept_offers BOOLEAN DEFAULT false,
  auto_accept_price DECIMAL(12,2),
  auto_decline_price DECIMAL(12,2),

  -- Timing
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  original_end_time TIMESTAMPTZ,

  -- Equipment details
  make TEXT,
  model TEXT,
  year INTEGER,
  serial_number TEXT,
  condition TEXT CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'parts')),
  hours_count INTEGER,
  equipment_status TEXT,

  -- Logistics
  onsite_assistance TEXT DEFAULT 'no_assistance',
  weight_lbs INTEGER,
  removal_deadline DATE,
  pickup_notes TEXT,
  location TEXT,

  -- Payment
  payment_due_days INTEGER DEFAULT 7,
  accepts_credit_card BOOLEAN DEFAULT true,
  accepts_ach BOOLEAN DEFAULT true,
  accepts_wire BOOLEAN DEFAULT true,
  accepts_check BOOLEAN DEFAULT false,

  -- Bidding stats
  bid_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  watch_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create listing_images table
CREATE TABLE IF NOT EXISTS listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create categories table if not exists
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (id, name, slug, sort_order, is_active) VALUES
  (gen_random_uuid(), 'Mailing & Fulfillment', 'mailing-fulfillment', 1, true),
  (gen_random_uuid(), 'Printing', 'printing', 2, true),
  (gen_random_uuid(), 'Bindery & Finishing', 'bindery-finishing', 3, true),
  (gen_random_uuid(), 'Packaging', 'packaging', 4, true),
  (gen_random_uuid(), 'Material Handling', 'material-handling', 5, true),
  (gen_random_uuid(), 'Parts & Supplies', 'parts-supplies', 6, true)
ON CONFLICT (slug) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(primary_category_id);
CREATE INDEX IF NOT EXISTS idx_listings_end_time ON listings(end_time);
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON listing_images(listing_id);

-- Enable RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Listings policies
CREATE POLICY "Anyone can view active listings" ON listings
  FOR SELECT USING (status = 'active' OR seller_id = auth.uid());

CREATE POLICY "Sellers can insert their own listings" ON listings
  FOR INSERT WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update their own listings" ON listings
  FOR UPDATE USING (seller_id = auth.uid());

CREATE POLICY "Sellers can delete their own listings" ON listings
  FOR DELETE USING (seller_id = auth.uid());

-- Listing images policies
CREATE POLICY "Anyone can view listing images" ON listing_images
  FOR SELECT USING (true);

CREATE POLICY "Sellers can insert images for their listings" ON listing_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings WHERE listings.id = listing_id AND listings.seller_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can delete images for their listings" ON listing_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM listings WHERE listings.id = listing_id AND listings.seller_id = auth.uid()
    )
  );

-- Categories policies
CREATE POLICY "Anyone can view active categories" ON categories
  FOR SELECT USING (is_active = true);

-- Create storage bucket for listing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for listing images
CREATE POLICY "Anyone can view listing images" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-images');

CREATE POLICY "Authenticated users can upload listing images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'listing-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own listing images" ON storage.objects
  FOR DELETE USING (bucket_id = 'listing-images' AND auth.uid()::text = (storage.foldername(name))[1]);
