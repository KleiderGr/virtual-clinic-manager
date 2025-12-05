-- ============================================
-- VALIDATION SCRIPT FOR P0 FIXES
-- ============================================
-- Run this after applying critical fixes to verify everything works
-- ============================================

\echo '=========================================='
\echo 'VALIDATING CRITICAL FIXES (P0)'
\echo '=========================================='

-- 1. CHECK: active and deleted_at columns exist
\echo ''
\echo '1. Checking profiles schema...'
SELECT 
  column_name,
  data_type,
  column_default,
  CASE 
    WHEN column_name IN ('active', 'deleted_at') THEN '✓ OK'
    ELSE ''
  END as validation
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('id', 'email', 'full_name', 'active', 'deleted_at')
ORDER BY
  CASE column_name
    WHEN 'id' THEN 1
    WHEN 'email' THEN 2
    WHEN 'full_name' THEN 3
    WHEN 'active' THEN 4
    WHEN 'deleted_at' THEN 5
  END;

-- Verify count
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'profiles'
    AND column_name IN ('active', 'deleted_at');
  
  IF col_count = 2 THEN
    RAISE NOTICE '✓ PASS: active and deleted_at columns exist';
  ELSE
    RAISE WARNING '✗ FAIL: Missing columns! Found % of 2', col_count;
  END IF;
END $$;

-- 2. CHECK: RLS policies are restrictive
\echo ''
\echo '2. Checking RLS policies on profiles...'
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%auth.uid()%' OR qual LIKE '%has_role%' THEN '✓ Restrictive'
    WHEN qual = 'true' THEN '⚠ Too permissive'
    ELSE '? Unknown'
  END as security_level
FROM pg_policies
WHERE tablename = 'profiles'
  AND schemaname = 'public'
ORDER BY cmd, policyname;

-- Verify no permissive policies
DO $$
DECLARE
  permissive_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO permissive_count
  FROM pg_policies
  WHERE tablename = 'profiles'
    AND schemaname = 'public'
    AND qual = 'true';
  
  IF permissive_count = 0 THEN
    RAISE NOTICE '✓ PASS: No overly permissive policies';
  ELSE
    RAISE WARNING '⚠ WARNING: Found % permissive policies', permissive_count;
  END IF;
END $$;

-- 3. CHECK: create_appointment_safe function exists
\echo ''
\echo '3. Checking create_appointment_safe function...'
SELECT 
  routine_name,
  routine_type,
  data_type as return_type,
  '✓ Function exists' as status
FROM information_schema.routines
WHERE routine_name = 'create_appointment_safe'
  AND routine_schema = 'public';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'create_appointment_safe'
      AND routine_schema = 'public'
  ) THEN
    RAISE NOTICE '✓ PASS: create_appointment_safe function exists';
  ELSE
    RAISE WARNING '✗ FAIL: create_appointment_safe function NOT found!';
  END IF;
END $$;

-- 4. CHECK: Triggers are active
\echo ''
\echo '4. Checking triggers status...'
SELECT 
  tgname as trigger_name,
  tgenabled as status,
  CASE tgenabled
    WHEN 'O' THEN '✓ Enabled'
    WHEN 'D' THEN '✗ Disabled'
    WHEN 'R' THEN '⚠ Replica mode'
    ELSE '? Unknown'
  END as status_text
FROM pg_trigger
WHERE tgname IN ('on_auth_user_created', 'update_profiles_updated_at')
ORDER BY tgname;

DO $$
DECLARE
  disabled_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO disabled_count
  FROM pg_trigger
  WHERE tgname IN ('on_auth_user_created', 'update_profiles_updated_at')
    AND tgenabled != 'O';
  
  IF disabled_count = 0 THEN
    RAISE NOTICE '✓ PASS: All critical triggers are enabled';
  ELSE
    RAISE WARNING '✗ FAIL: % triggers are disabled!', disabled_count;
  END IF;
END $$;

-- 5. CHECK: All existing profiles are active
\echo ''
\echo '5. Checking profile active status...'
SELECT 
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE active = true) as active_profiles,
  COUNT(*) FILTER (WHERE active = false OR active IS NULL) as inactive_profiles
FROM profiles;

DO $$
DECLARE
  inactive_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO inactive_count
  FROM profiles
  WHERE active = false OR active IS NULL;
  
  IF inactive_count = 0 THEN
    RAISE NOTICE '✓ PASS: All profiles are active';
  ELSIF inactive_count < 5 THEN
    RAISE NOTICE '⚠ INFO: % profiles are inactive (expected for soft-deleted users)', inactive_count;
  ELSE
    RAISE WARNING '⚠ WARNING: % profiles are inactive', inactive_count;
  END IF;
END $$;

-- 6. CHECK: Doctors without profiles
\echo ''
\echo '6. Checking doctors without user profiles...'
SELECT 
  d.id,
  d.license_number,
  d.is_active,
  CASE WHEN p.id IS NULL THEN '⚠ No profile' ELSE '✓ Has profile' END as profile_status
FROM doctors d
LEFT JOIN profiles p ON d.user_id = p.id
ORDER BY p.id NULLS FIRST
LIMIT 5;

DO $$
DECLARE
  no_profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO no_profile_count
  FROM doctors d
  LEFT JOIN profiles p ON d.user_id = p.id
  WHERE p.id IS NULL;
  
  IF no_profile_count = 0 THEN
    RAISE NOTICE '✓ PASS: All doctors have user profiles';
  ELSIF no_profile_count <= 3 THEN
    RAISE NOTICE '⚠ INFO: % doctors without profiles (likely from seeder)', no_profile_count;
  ELSE
    RAISE WARNING '⚠ WARNING: % doctors without profiles', no_profile_count;
  END IF;
END $$;

-- 7. SUMMARY
\echo ''
\echo '=========================================='
\echo 'VALIDATION SUMMARY'
\echo '=========================================='

DO $$
DECLARE
  v_active_col BOOLEAN;
  v_deleted_col BOOLEAN;
  v_rpc_function BOOLEAN;
  v_triggers_ok BOOLEAN;
  v_total_score INTEGER := 0;
BEGIN
  -- Check each critical item
  SELECT COUNT(*) = 2 INTO v_active_col
  FROM information_schema.columns
  WHERE table_name = 'profiles' AND column_name IN ('active', 'deleted_at');

  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'create_appointment_safe'
  ) INTO v_rpc_function;

  SELECT COUNT(*) = 0 INTO v_triggers_ok
  FROM pg_trigger
  WHERE tgname IN ('on_auth_user_created', 'update_profiles_updated_at')
    AND tgenabled != 'O';

  -- Calculate score
  IF v_active_col THEN v_total_score := v_total_score + 1; END IF;
  IF v_rpc_function THEN v_total_score := v_total_score + 1; END IF;
  IF v_triggers_ok THEN v_total_score := v_total_score + 1; END IF;

  RAISE NOTICE '';
  RAISE NOTICE '  Columns (active/deleted_at): %', CASE WHEN v_active_col THEN '✓ PASS' ELSE '✗ FAIL' END;
  RAISE NOTICE '  RPC Function (safe appointments): %', CASE WHEN v_rpc_function THEN '✓ PASS' ELSE '✗ FAIL' END;
  RAISE NOTICE '  Triggers (enabled): %', CASE WHEN v_triggers_ok THEN '✓ PASS' ELSE '✗ FAIL' END;
  RAISE NOTICE '';
  RAISE NOTICE '  SCORE: %/3', v_total_score;
  RAISE NOTICE '';

  IF v_total_score = 3 THEN
    RAISE NOTICE '✓✓✓ ALL CRITICAL FIXES APPLIED SUCCESSFULLY';
  ELSIF v_total_score >= 2 THEN
    RAISE WARNING '⚠⚠ SOME ISSUES DETECTED - Review above';
  ELSE
    RAISE WARNING '✗✗✗ CRITICAL ISSUES - Fixes not applied correctly';
  END IF;
END $$;

\echo '=========================================='
