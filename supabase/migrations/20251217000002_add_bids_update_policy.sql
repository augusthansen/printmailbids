-- Allow users to update their own bids
CREATE POLICY "Users can update their own bids" ON bids
  FOR UPDATE USING (bidder_id = auth.uid());
