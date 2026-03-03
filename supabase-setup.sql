-- Run this SQL in your Supabase SQL Editor to create the game_rooms table

CREATE TABLE IF NOT EXISTS game_rooms (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_rooms_updated_at ON game_rooms(updated_at);

-- Enable Realtime for instant game state updates (no polling)
-- Run this in Supabase Dashboard: Database → Publications → supabase_realtime → add game_rooms
-- Or run this SQL (may error if already added - that's fine):
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;

-- RLS: Required for Realtime. Realtime uses your anon key and respects RLS.
-- Without a SELECT policy, clients won't receive change events.
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access (required for Realtime to broadcast changes to clients)
-- If policy exists: DROP POLICY "Allow anonymous read for Realtime" ON game_rooms; first
CREATE POLICY "Allow anonymous read for Realtime"
  ON game_rooms FOR SELECT
  TO anon
  USING (true);

-- Full payload for UPDATE (required for Realtime to send the full new row)
ALTER TABLE game_rooms REPLICA IDENTITY FULL;

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

-- Mobile Legends heroes cache (run: npm run sync-cards to populate)
CREATE TABLE IF NOT EXISTS mobile_legends_heroes (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mobile_legends_heroes_id ON mobile_legends_heroes(id);

