-- Add enhanced machine details columns to listings table

-- Software and System Information
ALTER TABLE listings ADD COLUMN IF NOT EXISTS software_version TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS operating_system TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS controller_type TEXT;

-- Machine Configuration
ALTER TABLE listings ADD COLUMN IF NOT EXISTS number_of_stations INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS number_of_heads INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS max_speed TEXT; -- e.g., "10,000 pieces/hour"
ALTER TABLE listings ADD COLUMN IF NOT EXISTS feeder_count INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS output_stacker_count INTEGER;

-- Capabilities (stored as JSONB array)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS capabilities TEXT[];

-- Dimensions and Technical
ALTER TABLE listings ADD COLUMN IF NOT EXISTS max_piece_length TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS max_piece_width TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS min_piece_length TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS min_piece_width TEXT;

-- N/A flags for sections (when a section doesn't apply to this equipment)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS software_na BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS configuration_na BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS capabilities_na BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS dimensions_na BOOLEAN DEFAULT FALSE;

-- Additional technical specs
ALTER TABLE listings ADD COLUMN IF NOT EXISTS power_requirements TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS network_connectivity TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS included_accessories TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS maintenance_history TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS last_service_date DATE;

-- Comments for documentation
COMMENT ON COLUMN listings.software_version IS 'Software/firmware version installed on the equipment';
COMMENT ON COLUMN listings.operating_system IS 'Operating system (e.g., Windows 10, Linux, Proprietary)';
COMMENT ON COLUMN listings.controller_type IS 'Type of controller (e.g., PLC, PC-based, Proprietary)';
COMMENT ON COLUMN listings.number_of_stations IS 'Number of stations/modules (for inserters, etc.)';
COMMENT ON COLUMN listings.number_of_heads IS 'Number of print heads (for printers)';
COMMENT ON COLUMN listings.max_speed IS 'Maximum operating speed with units';
COMMENT ON COLUMN listings.capabilities IS 'Array of machine capabilities';
COMMENT ON COLUMN listings.software_na IS 'True if software section not applicable';
COMMENT ON COLUMN listings.configuration_na IS 'True if configuration section not applicable';
COMMENT ON COLUMN listings.capabilities_na IS 'True if capabilities section not applicable';
COMMENT ON COLUMN listings.dimensions_na IS 'True if piece dimensions section not applicable';
