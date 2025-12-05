-- ============================================
-- FIX: Doctor Constraints and Foreign Keys
-- ============================================
-- Ensures user_id must exist in profiles and be unique
-- ============================================

-- Drop existing constraint if exists
ALTER TABLE public.doctors 
  DROP CONSTRAINT IF EXISTS doctors_user_id_fkey;

-- Add foreign key constraint to profiles (NOT NULL enforced)
ALTER TABLE public.doctors
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.doctors
  ADD CONSTRAINT doctors_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Add unique constraint (one doctor per user)
ALTER TABLE public.doctors
  DROP CONSTRAINT IF EXISTS doctors_user_id_unique;

ALTER TABLE public.doctors
  ADD CONSTRAINT doctors_user_id_unique 
  UNIQUE (user_id);

-- Verify constraints
DO $$
BEGIN
  -- Check NOT NULL
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns
    WHERE table_name = 'doctors' 
      AND column_name = 'user_id'
      AND is_nullable = 'NO'
  ) THEN
    RAISE NOTICE '✓ user_id is NOT NULL';
  ELSE
    RAISE WARNING '✗ user_id nullable check failed';
  END IF;

  -- Check FK to profiles
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints
    WHERE constraint_name = 'doctors_user_id_fkey'
      AND table_name = 'doctors'
  ) THEN
    RAISE NOTICE '✓ Foreign key to profiles exists';
  ELSE
    RAISE WARNING '✗ Foreign key constraint not found';
  END IF;

  -- Check UNIQUE
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints
    WHERE constraint_name = 'doctors_user_id_unique'
      AND table_name = 'doctors'
  ) THEN
    RAISE NOTICE '✓ Unique constraint on user_id exists';
  ELSE
    RAISE WARNING '✗ Unique constraint not found';
  END IF;
END $$;

RAISE NOTICE '============================================';
RAISE NOTICE 'DOCTOR CONSTRAINTS APPLIED';
RAISE NOTICE '============================================';
RAISE NOTICE 'user_id is now REQUIRED and must exist in profiles';
RAISE NOTICE 'One user can only be assigned to one doctor';
RAISE NOTICE '============================================';
