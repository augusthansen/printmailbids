-- Update machine details: remove number_of_stations, change piece dimensions to material specs

-- Drop old columns if they exist (we'll keep them for now for backwards compatibility)
-- Just add the new material columns

-- Material Specifications (replacing piece dimensions concept)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS material_na BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS material_types TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS max_material_width TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS max_material_length TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS material_weight TEXT;

-- Comments
COMMENT ON COLUMN listings.material_na IS 'True if material specifications section not applicable';
COMMENT ON COLUMN listings.material_types IS 'Types of materials the equipment can handle (comma-separated)';
COMMENT ON COLUMN listings.max_material_width IS 'Maximum material width the equipment can process';
COMMENT ON COLUMN listings.max_material_length IS 'Maximum material length the equipment can process';
COMMENT ON COLUMN listings.material_weight IS 'Maximum material weight/thickness (e.g., 110 lb cover)';
