-- Allow authenticated users to update bid-related fields on any listing
-- This is needed because bidders need to update current_price, bid_count, and end_time when placing bids
CREATE POLICY "Users can update listing bid info" ON listings
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
