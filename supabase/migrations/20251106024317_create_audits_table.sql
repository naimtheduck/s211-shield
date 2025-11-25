/*
  # Create Audits Table (v3 - "Claimable" Flow)
  # This schema is built for the "Anonymous Lead" flow.

  1. Columns:
     - `user_id` is now NULLABLE. This is the key.
       It's empty for an anonymous lead and gets "claimed"
       (filled in) after sign-up.

  2. Security:
     - "anon" users can INSERT new rows (the free scan).
     - "authenticated" (logged-in) users can READ/UPDATE
       rows that match their user_id.
     - This is the secure, low-friction model you want.
*/

-- Drop the old table if it exists, to start fresh
DROP TABLE IF EXISTS public.audits;

-- Create the new, flexible table
CREATE TABLE public.audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- user_id is NULL by default. This is the key to our flow.
  -- It links to auth.users when the user signs up.
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL, 
  
  email text NOT NULL, -- The lead's email
  url text NOT NULL,
  scan_results jsonb DEFAULT '{}'::jsonb,
  checklist_data jsonb DEFAULT '{}'::jsonb,
  is_premium boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

-- ---------------------------------
-- --- (DELETE OLD, INSECURE POLICIES) ---
-- ---------------------------------
DROP POLICY IF EXISTS "Anyone can insert audits" ON audits;
DROP POLICY IF EXISTS "Anyone can read audits by ID" ON audits;
DROP POLICY IF EXISTS "Anyone can update audits" ON audits;
DROP POLICY IF EXISTS "Users can insert their own audit" ON audits;
DROP POLICY IF EXISTS "Users can read their own audits" ON audits;
DROP POLICY IF EXISTS "Users can update their own audits" ON audits;

-- ---------------------------------
-- --- (CREATE NEW, SECURE POLICIES) ---
-- ---------------------------------

-- 1. ANYONE (anon) can create a new anonymous audit.
-- This is for the 'instant-scan' function.
CREATE POLICY "Public can insert new anonymous audits"
  ON audits FOR INSERT
  TO anon -- 'anon' means "public, not logged in"
  WITH CHECK (user_id IS NULL); -- They can only insert if user_id is null

-- 2. AUTHENTICATED users can read their *own* audits.
CREATE POLICY "Users can read their own audits"
  ON audits FOR SELECT
  TO authenticated -- 'authenticated' means "any logged-in user"
  USING (auth.uid() = user_id);

-- 3. AUTHENTICATED users can update their *own* audits.
-- This is for the 'update-checklist' function.
CREATE POLICY "Users can update their own audits"
  ON audits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_audits_user_id ON audits(user_id);
CREATE INDEX IF NOT EXISTS idx_audits_email ON audits(email);


CREATE POLICY "Anonymous users can read anonymous audits"
  ON public.audits
  FOR SELECT
  TO anon
  USING (user_id IS NULL);