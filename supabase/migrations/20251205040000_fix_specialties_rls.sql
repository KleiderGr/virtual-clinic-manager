-- ============================================
-- FIX: RLS Policies for Admin Tables
-- ============================================
-- Problem: Admin tables (specialties, etc.) don't have RLS policies
-- or have overly restrictive policies preventing updates
-- Solution: Add proper RLS policies for admin operations
-- ============================================

-- Enable RLS on specialties if not already enabled
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow admin full access to specialties" ON public.specialties;
DROP POLICY IF EXISTS "Allow public read access to specialties" ON public.specialties;

-- Allow anyone to read specialties (needed for doctor selection, etc.)
CREATE POLICY "Allow public read access to specialties"
ON public.specialties
FOR SELECT
TO authenticated
USING (true);

-- Allow admins full access (insert, update, delete)
CREATE POLICY "Allow admin full access to specialties"
ON public.specialties
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Verify policies were created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'specialties' 
    AND policyname = 'Allow admin full access to specialties'
  ) THEN
    RAISE NOTICE '✓ Admin policy for specialties created successfully';
  ELSE
    RAISE WARNING '✗ Admin policy for specialties was not created!';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'specialties' 
    AND policyname = 'Allow public read access to specialties'
  ) THEN
    RAISE NOTICE '✓ Public read policy for specialties created successfully';
  ELSE
    RAISE WARNING '✗ Public read policy for specialties was not created!';
  END IF;
END $$;

-- ============================================
-- EXPLANATION
-- ============================================
--
-- RLS (Row Level Security) was either:
-- 1. Not enabled on specialties table, OR
-- 2. Had overly restrictive policies
--
-- This caused UPDATE/INSERT/DELETE to fail with:
-- "Cannot coerce the result to a single JSON object"
-- "The result contains 0 rows"
--
-- NEW POLICIES:
-- - SELECT: Anyone authenticated can read specialties
-- - INSERT/UPDATE/DELETE: Only admins (uses has_role function)
--
-- ============================================

RAISE NOTICE '============================================';
RAISE NOTICE 'RLS POLICIES FOR SPECIALTIES FIXED';
RAISE NOTICE '============================================';
RAISE NOTICE 'Admins can now create, update, and delete specialties';
RAISE NOTICE 'All authenticated users can read specialties';
RAISE NOTICE '============================================';
