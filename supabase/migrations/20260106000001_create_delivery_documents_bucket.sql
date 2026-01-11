-- Create delivery-documents storage bucket for BOL and shipping photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'delivery-documents',
  'delivery-documents',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view delivery documents (they contain invoice IDs so only those with the link can find them)
CREATE POLICY "Public read access for delivery documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'delivery-documents');

-- Allow authenticated users to upload delivery documents
CREATE POLICY "Authenticated users can upload delivery documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'delivery-documents' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their delivery documents
CREATE POLICY "Authenticated users can update delivery documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'delivery-documents' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their delivery documents
CREATE POLICY "Authenticated users can delete delivery documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'delivery-documents' AND auth.role() = 'authenticated');
