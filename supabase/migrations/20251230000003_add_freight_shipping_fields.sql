-- Add freight shipping fields to invoices table
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS freight_bol_number TEXT,
ADD COLUMN IF NOT EXISTS freight_pro_number TEXT,
ADD COLUMN IF NOT EXISTS freight_class TEXT,
ADD COLUMN IF NOT EXISTS freight_weight_lbs INTEGER,
ADD COLUMN IF NOT EXISTS freight_pickup_date DATE,
ADD COLUMN IF NOT EXISTS freight_estimated_delivery DATE,
ADD COLUMN IF NOT EXISTS freight_pickup_contact JSONB,
ADD COLUMN IF NOT EXISTS freight_delivery_contact JSONB,
ADD COLUMN IF NOT EXISTS freight_special_instructions TEXT;

-- Add comment explaining the JSONB structure
COMMENT ON COLUMN invoices.freight_pickup_contact IS 'JSON: {name, phone, email, company}';
COMMENT ON COLUMN invoices.freight_delivery_contact IS 'JSON: {name, phone, email, company}';
