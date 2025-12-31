-- Add floor dimension columns to listings table for installed equipment footprint
-- These fields help buyers understand the floor space required when equipment is installed

ALTER TABLE listings
ADD COLUMN IF NOT EXISTS floor_length_ft NUMERIC,
ADD COLUMN IF NOT EXISTS floor_width_ft NUMERIC;

-- Add comment for documentation
COMMENT ON COLUMN listings.floor_length_ft IS 'Installed floor length in feet';
COMMENT ON COLUMN listings.floor_width_ft IS 'Installed floor width in feet';
