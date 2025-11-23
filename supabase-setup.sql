-- Run this SQL in your Supabase SQL Editor to create the game_rooms table

CREATE TABLE IF NOT EXISTS game_rooms (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_rooms_updated_at ON game_rooms(updated_at);

-- Optional: Add a cleanup function to delete old rooms (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM game_rooms
  WHERE updated_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Optional: Set up a cron job to run cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-old-rooms', '0 * * * *', 'SELECT cleanup_old_rooms()');

