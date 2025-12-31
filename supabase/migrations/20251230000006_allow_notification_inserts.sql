-- Allow authenticated users to insert notifications
-- This is needed so users can notify other users (e.g., buyer approving fees notifies seller)

DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;

CREATE POLICY "Users can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Also make sure the RLS is enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
