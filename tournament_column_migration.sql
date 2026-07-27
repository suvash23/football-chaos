-- Migration: Add tournament column to matches and predictions tables
-- Run this in the Supabase SQL editor

-- 1. Add tournament column to matches table
--    Default is 'wc2026' so all existing World Cup 2026 matches get tagged correctly.
ALTER TABLE matches
    ADD COLUMN IF NOT EXISTS tournament TEXT NOT NULL DEFAULT 'wc2026';

-- 2. Add tournament column to predictions table
--    Mirrors the match's tournament for easy filtering without joins.
ALTER TABLE predictions
    ADD COLUMN IF NOT EXISTS tournament TEXT NOT NULL DEFAULT 'wc2026';

-- 3. (Optional) Add an index for efficient tournament-based queries
CREATE INDEX IF NOT EXISTS idx_matches_tournament    ON matches    (tournament);
CREATE INDEX IF NOT EXISTS idx_predictions_tournament ON predictions (tournament);
