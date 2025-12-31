-- Add delivery confirmation fields to invoices table
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_confirmed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS delivery_condition TEXT CHECK (delivery_condition IN ('good', 'damaged', 'partial')),
ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
ADD COLUMN IF NOT EXISTS delivery_bol_url TEXT,
ADD COLUMN IF NOT EXISTS delivery_damage_photos JSONB DEFAULT '[]';

-- Add comment explaining the JSONB structure
COMMENT ON COLUMN invoices.delivery_damage_photos IS 'JSON array of photo URLs: ["url1", "url2", ...]';
