-- Add video_url column to listings table for YouTube/Vimeo embeds
ALTER TABLE listings ADD COLUMN IF NOT EXISTS video_url TEXT;
