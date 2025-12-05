-- ============================================
-- FIX: RLS Policies for Availability Table
-- ============================================
-- Problem: availability table doesn't have RLS policies
-- or has overly restrictive policies preventing admin operations
-- Solution: Add proper RLS policies for availability
-- ============================================

-- Enable RLS on availability if not already enabled
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow admin full access to availability" ON public.availability;
DROP POLICY IF EXISTS "Allow public read access to availability" ON public.availability;
DROP POLICY IF EXISTS "Allow doctors to manage own availability" ON public.availability;

-- Allow anyone to read availability (needed for booking system)
CREATE POLICY "Allow public read access to availability"
ON public.availability
FOR SELECT
TO authenticated
USING (is_active = true);

-- Allow admins full access (insert, update, delete)
CREATE POLICY "Allow admin full access to availability"
ON public.availability
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow doctors to manage their own availability
CREATE POLICY "Allow doctors to manage own availability"
ON public.availability
FOR ALL
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM public.doctors WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  doctor_id IN (
    SELECT id FROM public.doctors WHERE user_id = auth.uid()
  )
);

-- Verify policies were created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'availability' 
    AND policyname = 'Allow admin full access to availability'
  ) THEN
    RAISE NOTICE '✓ Admin policy for availability created successfully';
  ELSE
    RAISE WARNING '✗ Admin policy for availability was not created!';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'availability' 
    AND policyname = 'Allow public read access to availability'
  ) THEN
    RAISE NOTICE '✓ Public read policy for availability created successfully';
  ELSE
    RAISE WARNING '✗ Public read policy for availability was not created!';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'availability' 
    AND policyname = 'Allow doctors to manage own availability'
  ) THEN
    RAISE NOTICE '✓ Doctor policy for availability created successfully';
  ELSE
    RAISE WARNING '✗ Doctor policy for availability was not created!';
  END IF;
END $$;

-- ============================================
-- EXPLANATION
-- ============================================
--
-- RLS (Row Level Security) policies for availability:
-- 1. Public READ - Anyone can see active availability (for booking)
-- 2. Admin FULL ACCESS - Admins can manage all availability
-- 3. Doctor OWN ACCESS - Doctors can manage their own schedules
--
-- This allows:
-- - Booking system to check availability
-- - Admins to set/modify any doctor's schedule
-- - Doctors to manage their own schedules (future feature)
--
-- ============================================

RAISE NOTICE '============================================';
RAISE NOTICE 'RLS POLICIES FOR AVAILABILITY FIXED';
RAISE NOTICE '============================================';
RAISE NOTICE 'Admins can now create, update, and delete availability';
RAISE NOTICE 'Doctors can manage their own schedules';
RAISE NOTICE 'All authenticated users can read active availability';
RAISE NOTICE '============================================';
