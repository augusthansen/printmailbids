-- Fix conversations foreign key to listings table
-- This ensures Supabase PostgREST can detect the relationship for automatic joins

-- First, drop the existing constraint if it exists (to make this idempotent)
DO $$
BEGIN
  -- Check if the constraint exists and drop it
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'conversations_listing_id_fkey'
  ) THEN
    ALTER TABLE conversations DROP CONSTRAINT conversations_listing_id_fkey;
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Re-add the foreign key with a proper name that PostgREST can detect
ALTER TABLE conversations
ADD CONSTRAINT conversations_listing_id_fkey
FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL;

-- Also ensure the invoice_id FK exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'conversations_invoice_id_fkey'
  ) THEN
    ALTER TABLE conversations DROP CONSTRAINT conversations_invoice_id_fkey;
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE conversations
ADD CONSTRAINT conversations_invoice_id_fkey
FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;

-- Notify PostgREST to refresh its schema cache
NOTIFY pgrst, 'reload schema';
