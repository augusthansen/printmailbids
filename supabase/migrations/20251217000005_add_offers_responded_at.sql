-- Add missing responded_at column to offers table
ALTER TABLE offers ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;
