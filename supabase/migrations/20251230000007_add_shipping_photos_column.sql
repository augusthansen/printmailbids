-- Add shipping_photos column to invoices table
-- This stores photos taken of the shipment upon arrival (before unloading)

ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS shipping_photos TEXT[] DEFAULT NULL;

COMMENT ON COLUMN invoices.shipping_photos IS 'Array of URLs for shipping photos taken upon arrival';
