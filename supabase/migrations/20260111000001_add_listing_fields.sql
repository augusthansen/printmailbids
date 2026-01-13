-- Add missing listing columns for mobile app
-- Comprehensive migration to ensure all required columns exist

-- Create enums if they don't exist
DO $$ BEGIN
  CREATE TYPE equipment_status AS ENUM (
    'in_production', 'installed_idle', 'needs_deinstall',
    'deinstalled', 'broken_down', 'palletized', 'crated'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE deinstall_responsibility AS ENUM (
    'buyer', 'seller_included', 'seller_additional_fee'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE onsite_assistance AS ENUM (
    'full_assistance', 'forklift_available', 'limited_assistance', 'no_assistance'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Base schema columns that may be missing
ALTER TABLE listings ADD COLUMN IF NOT EXISTS equipment_status equipment_status;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS deinstall_responsibility deinstall_responsibility DEFAULT 'buyer';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS deinstall_fee DECIMAL(10,2);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS onsite_assistance onsite_assistance DEFAULT 'no_assistance';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS weight_lbs INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS length_inches INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS width_inches INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS height_inches INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS electrical_requirements TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS air_requirements_psi INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES user_addresses(id);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS removal_deadline DATE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS pickup_hours TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS pickup_notes TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS hours_count INTEGER;

-- Equipment Specs (mobile app specific)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS software_version TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS operating_system TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS controller_type TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS number_of_heads INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS max_speed TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS feeder_count INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS output_stacker_count INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS capabilities TEXT[];
ALTER TABLE listings ADD COLUMN IF NOT EXISTS material_types TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS max_material_width TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS max_material_length TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS material_weight TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS power_requirements TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS network_connectivity TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS last_service_date DATE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS included_accessories TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS maintenance_history TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS video_url TEXT;

-- N/A flags for optional sections
ALTER TABLE listings ADD COLUMN IF NOT EXISTS software_na BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS configuration_na BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS capabilities_na BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS dimensions_na BOOLEAN DEFAULT FALSE;

-- Additional logistics fields
ALTER TABLE listings ADD COLUMN IF NOT EXISTS floor_length_ft DECIMAL(10,2);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS floor_width_ft DECIMAL(10,2);

-- Draft step tracking (0-5 for the 6 steps in the mobile wizard)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS draft_step INTEGER DEFAULT 0;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
