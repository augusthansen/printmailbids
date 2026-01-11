-- Enable realtime for messages table
-- This allows mobile and web clients to receive live updates when messages are sent

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
