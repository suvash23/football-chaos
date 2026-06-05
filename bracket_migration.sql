-- Migration: Add bracket_data column to profiles for bracket builder feature
-- Run this in the Supabase SQL editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bracket_data JSONB;

-- Allow users to update their own bracket data (already covered by the existing UPDATE policy)
-- "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id)
-- No new policy needed since it's on the same profiles table.

-- OPTIONAL: Create index for faster lookups if needed
-- CREATE INDEX IF NOT EXISTS idx_profiles_bracket_data ON profiles USING GIN (bracket_data);
