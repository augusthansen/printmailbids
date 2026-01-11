-- Create a trigger to automatically create notifications when a new message is sent
-- This notifies the recipient (not the sender) of new messages

-- Function to create notification on new message
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  sender_name TEXT;
  listing_title TEXT;
  conv_listing_id UUID;
BEGIN
  -- Get the conversation details to find the recipient
  SELECT
    CASE
      WHEN c.participant_1_id = NEW.sender_id THEN c.participant_2_id
      ELSE c.participant_1_id
    END,
    c.listing_id
  INTO recipient_id, conv_listing_id
  FROM conversations c
  WHERE c.id = NEW.conversation_id;

  -- Don't create notification if recipient not found
  IF recipient_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get sender name
  SELECT COALESCE(company_name, full_name, 'Someone') INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;

  -- Get listing title if exists
  IF conv_listing_id IS NOT NULL THEN
    SELECT title INTO listing_title
    FROM listings
    WHERE id = conv_listing_id;
  END IF;

  -- Check if user wants message notifications
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = recipient_id
    AND (notify_new_message IS NULL OR notify_new_message = true)
  ) THEN
    -- Create the notification
    INSERT INTO notifications (
      user_id,
      type,
      title,
      body,
      listing_id
    ) VALUES (
      recipient_id,
      'buyer_message',
      'New message from ' || sender_name,
      CASE
        WHEN listing_title IS NOT NULL THEN 'Re: ' || listing_title || ' - ' || LEFT(NEW.content, 100)
        ELSE LEFT(NEW.content, 100)
      END,
      conv_listing_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_new_message_notification ON messages;
CREATE TRIGGER on_new_message_notification
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();
