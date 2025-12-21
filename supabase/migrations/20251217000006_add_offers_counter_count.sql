-- Add missing counter_count column to offers table
ALTER TABLE offers ADD COLUMN IF NOT EXISTS counter_count INTEGER DEFAULT 0;

-- Also add parent_offer_id if missing
ALTER TABLE offers ADD COLUMN IF NOT EXISTS parent_offer_id UUID REFERENCES offers(id);
