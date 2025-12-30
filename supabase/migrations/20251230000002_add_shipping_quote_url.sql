-- Add shipping quote URL column to invoices
-- This allows sellers to upload a PDF of the shipping quote for buyer review

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS shipping_quote_url TEXT;

COMMENT ON COLUMN invoices.shipping_quote_url IS 'URL to the uploaded shipping quote PDF document';

-- Create documents storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to the documents bucket
CREATE POLICY "Allow authenticated uploads to documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Allow public read access to documents
CREATE POLICY "Allow public read access to documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Allow authenticated users to update their own documents
CREATE POLICY "Allow authenticated updates to documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to delete documents
CREATE POLICY "Allow authenticated deletes from documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
