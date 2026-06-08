-- Wedding Camera Database Setup
-- Run this in your Supabase SQL editor or any Postgres instance

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gcs_filename TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT NOT NULL
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Seed gallery_revealed flag
INSERT INTO settings (key, value)
VALUES ('gallery_revealed', 'false')
ON CONFLICT (key) DO NOTHING;

-- Optional: index for faster queries
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_at ON photos(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_session_id ON photos(session_id);

-- Verify setup
SELECT * FROM settings;
