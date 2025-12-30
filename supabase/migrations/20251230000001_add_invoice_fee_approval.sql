-- Add columns for packaging/shipping fee workflow
-- This enables sellers to add fees after auction ends, with buyer approval

-- Add packaging details
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS packaging_note TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS packaging_added_at TIMESTAMPTZ;

-- Add shipping details
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS shipping_note TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS shipping_added_at TIMESTAMPTZ;

-- Add fee approval workflow
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS fees_status TEXT DEFAULT 'none'
  CHECK (fees_status IN ('none', 'pending_approval', 'approved', 'rejected', 'disputed'));
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS fees_submitted_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS fees_responded_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS fees_rejection_reason TEXT;

-- Add new notification types for fee workflow
DO $$ BEGIN
  -- Check if we can alter the enum (only works if not in use)
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'fees_added';
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'fees_approved';
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'fees_rejected';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Update invoice status to include awaiting_fees
-- First check current values
DO $$ BEGIN
  ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'awaiting_fees';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN invoices.packaging_amount IS 'Cost for crating, palletizing, or packaging the equipment';
COMMENT ON COLUMN invoices.packaging_note IS 'Seller note explaining packaging fees (visible to buyer)';
COMMENT ON COLUMN invoices.shipping_amount IS 'Cost for shipping/freight to buyer location';
COMMENT ON COLUMN invoices.shipping_note IS 'Seller note explaining shipping fees (visible to buyer)';
COMMENT ON COLUMN invoices.fees_status IS 'Workflow status: none (no fees), pending_approval (waiting for buyer), approved, rejected, disputed';
