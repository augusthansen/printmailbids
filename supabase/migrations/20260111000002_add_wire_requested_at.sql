-- Add wire_requested_at column to invoices table
-- This tracks when a buyer requested wire transfer instructions from a seller

ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS wire_requested_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN invoices.wire_requested_at IS 'Timestamp when buyer requested wire transfer instructions from seller';
