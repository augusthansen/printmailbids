-- Add wire_instructions_requested notification type
-- This is used when a buyer requests wire transfer details from a seller

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'wire_instructions_requested';

-- Also add payment_confirmed and item_delivered if they don't exist (they're in the mobile types but may be missing from DB)
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'payment_confirmed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'item_delivered';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'offer_withdrawn';
