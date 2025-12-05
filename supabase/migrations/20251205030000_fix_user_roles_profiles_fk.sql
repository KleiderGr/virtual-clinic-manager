-- ============================================
-- FIX: User_Roles-Profiles Foreign Key Relationship
-- ============================================
-- Problem: user_roles.user_id references auth.users, but queries try to JOIN with profiles
-- Solution: Change foreign key to reference profiles instead
-- ============================================

-- Step 1: Drop the old foreign key constraint
ALTER TABLE public.user_roles 
  DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Step 2: Add new foreign key to profiles (which has same id as auth.users)
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Step 3: Verify the change
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_roles_user_id_fkey'
      AND table_name = 'user_roles'
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
-- user_roles.user_id → auth.users(id)
-- This caused Supabase to not find the relationship with profiles
--
-- AFTER:
-- user_roles.user_id → profiles(id)
-- Now the JOIN user_roles!inner(role) works correctly with profiles
--
-- This is safe because:
-- 1. profiles.id IS EXACTLY THE SAME as auth.users.id (1:1 relationship)
-- 2. profiles has ON DELETE CASCADE from auth.users
-- 3. So user_roles → profiles → auth.users maintains cascade delete
--
-- ============================================

RAISE NOTICE '============================================';
RAISE NOTICE 'USER_ROLES-PROFILES RELATIONSHIP FIXED';
RAISE NOTICE '============================================';
RAISE NOTICE 'You can now use: user_roles!inner(role) in Supabase queries';
RAISE NOTICE '============================================';
