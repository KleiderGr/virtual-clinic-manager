-- ============================================
-- FIX: Doctors-Profiles Foreign Key Relationship
-- ============================================
-- Problem: doctors.user_id references auth.users, but queries try to JOIN with profiles
-- Solution: Change foreign key to reference profiles instead
-- ============================================

-- Step 1: Drop the old foreign key constraint
ALTER TABLE public.doctors 
  DROP CONSTRAINT IF EXISTS doctors_user_id_fkey;

-- Step 2: Add new foreign key to profiles (which has same id as auth.users)
ALTER TABLE public.doctors
  ADD CONSTRAINT doctors_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Step 3: Verify the change
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'doctors_user_id_fkey'
      AND table_name = 'doctors'
  ) THEN
    RAISE NOTICE '✓ Foreign key successfully updated to reference profiles';
  ELSE
    RAISE WARNING '✗ Foreign key constraint not found!';
  END IF;
END $$;

-- ============================================
-- EXPLANATION
-- ============================================
-- 
-- BEFORE:
-- doctors.user_id → auth.users(id)
-- This caused Supabase to not find the relationship with profiles
--
-- AFTER:
-- doctors.user_id → profiles(id)
-- Now the JOIN profile:profiles(...) works correctly
--
-- This is safe because:
-- 1. profiles.id IS EXACTLY THE SAME as auth.users.id (1:1 relationship)
-- 2. profiles has ON DELETE CASCADE from auth.users
-- 3. So doctors → profiles → auth.users maintains cascade delete
--
-- ============================================

RAISE NOTICE '============================================';
RAISE NOTICE 'DOCTORS-PROFILES RELATIONSHIP FIXED';
RAISE NOTICE '============================================';
RAISE NOTICE 'You can now use: profile:profiles(...) in Supabase queries';
RAISE NOTICE '============================================';
