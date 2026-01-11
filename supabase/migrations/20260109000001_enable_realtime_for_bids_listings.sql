-- Enable realtime for bids and listings tables
-- This allows mobile and web clients to receive live updates when bids are placed

-- Enable realtime for bids table
ALTER PUBLICATION supabase_realtime ADD TABLE bids;

-- Enable realtime for listings table
ALTER PUBLICATION supabase_realtime ADD TABLE listings;
