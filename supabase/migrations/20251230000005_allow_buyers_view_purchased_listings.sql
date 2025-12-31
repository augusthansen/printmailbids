-- Allow buyers to view listings they have purchased (have an invoice for)
-- This fixes the issue where buyers couldn't see listing titles on their Purchases page

-- Drop the existing policy
DROP POLICY IF EXISTS "Active listings are viewable by everyone" ON listings;

-- Create a new policy that also allows buyers to see their purchased listings
CREATE POLICY "Listings viewable by public or participants" ON listings
  FOR SELECT USING (
    -- Public can see active, ended, or sold listings
    status IN ('active', 'ended', 'sold')
    -- Sellers can see all their own listings (including drafts)
    OR seller_id = auth.uid()
    -- Buyers can see listings they have an invoice for
    OR EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.listing_id = listings.id
      AND invoices.buyer_id = auth.uid()
    )
  );
