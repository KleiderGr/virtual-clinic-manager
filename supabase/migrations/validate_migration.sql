-- ============================================
-- VALIDATION QUERIES SCRIPT
-- ============================================
-- Run these queries after migration to verify everything worked
-- ============================================

-- 1. VERIFY RLS IS ENABLED
-- Expected: All 3 tables should have rowsecurity = true
SELECT 
  schemaname, 
  tablename, 
  rowsecurity,
  CASE WHEN rowsecurity THEN '✅ OK' ELSE '❌ FAIL' END as status
FROM pg_tables
WHERE tablename IN ('user_roles', 'profiles', 'admin_audit_log')
  AND schemaname = 'public'
ORDER BY tablename;

-- 2. VERIFY RLS POLICIES ON user_roles
-- Expected: 2 policies minimum
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN policyname LIKE '%admin%' THEN '✅ Admin policy'
    WHEN policyname LIKE '%view%' THEN '✅ View policy'
    ELSE '⚠️ Unknown policy'
  END as description
FROM pg_policies
WHERE tablename = 'user_roles' AND schemaname = 'public';

-- 3. VERIFY SOFT DELETE COLUMNS
-- Expected: active (boolean) and deleted_at (timestamptz)
SELECT 
  column_name, 
  data_type, 
  column_default,
  CASE 
    WHEN column_name = 'active' AND data_type = 'boolean' THEN '✅ OK'
    WHEN column_name = 'deleted_at' AND data_type LIKE '%timestamp%' THEN '✅ OK'
    ELSE '❌ FAIL'
  END as status
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('active', 'deleted_at')
ORDER BY column_name;

-- 4. VERIFY INDEXES CREATED
-- Expected: 15+ indexes
SELECT 
  tablename,
  indexname,
  indexdef,
  '✅' as status
FROM pg_indexes
WHERE tablename IN ('profiles', 'user_roles', 'doctors', 'appointments', 'availability')
  AND schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Count indexes
SELECT 
  COUNT(*) as total_indexes,
  CASE 
    WHEN COUNT(*) >= 15 THEN '✅ OK (15+ indexes created)'
    ELSE '⚠️ WARNING (less than 15 indexes)'
  END as status
FROM pg_indexes
WHERE tablename IN ('profiles', 'user_roles', 'doctors', 'appointments', 'availability')
  AND schemaname = 'public'
  AND indexname LIKE 'idx_%';

-- 5. VERIFY ADMIN AUDIT LOG TABLE
-- Expected: 8 columns
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default,
  '✅' as status
FROM information_schema.columns
WHERE table_name = 'admin_audit_log'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Count columns
SELECT 
  COUNT(*) as column_count,
  CASE 
    WHEN COUNT(*) >= 8 THEN '✅ OK (8 columns)'
    ELSE '❌ FAIL (missing columns)'
  END as status
FROM information_schema.columns
WHERE table_name = 'admin_audit_log';

-- 6. VERIFY log_admin_action FUNCTION
-- Expected: 1 function
SELECT 
  routine_name,
  routine_type,
  data_type as return_type,
  '✅ Function exists' as status
FROM information_schema.routines
WHERE routine_name = 'log_admin_action'
  AND routine_schema = 'public';

-- 7. VERIFY TRIGGERS
-- Expected: 2 triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  CASE 
    WHEN trigger_name = 'prevent_duplicate_roles' THEN '✅ Duplicate prevention'
    WHEN trigger_name = 'prevent_last_role_deletion' THEN '✅ Last role protection'
    ELSE '✅ OK'
  END as description
FROM information_schema.triggers
WHERE trigger_name IN ('prevent_duplicate_roles', 'prevent_last_role_deletion')
ORDER BY trigger_name;

-- 8. VERIFY ALL USERS ARE ACTIVE
-- Expected: All users should have active = true by default
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE active = true) as active_users,
  COUNT(*) FILTER (WHERE active = false OR active IS NULL) as inactive_users,
  CASE 
    WHEN COUNT(*) FILTER (WHERE active = false OR active IS NULL) = 0 
    THEN '✅ All users active'
    ELSE '⚠️ Some users inactive'
  END as status
FROM profiles;

-- Sample of users
SELECT 
  id, 
  email, 
  full_name, 
  active, 
  deleted_at,
  CASE WHEN active THEN '✅' ELSE '❌' END as status
FROM profiles
LIMIT 5;

-- 9. PERFORMANCE TEST - Index Usage
-- Check if email index is being used
EXPLAIN (FORMAT TEXT)
SELECT * FROM profiles WHERE email = 'test@example.com';
-- Should show "Index Scan using idx_profiles_email"

-- 10. SUMMARY REPORT
SELECT 
  'MIGRATION VALIDATION SUMMARY' as report,
  '==============================' as separator;

SELECT '1. RLS Enabled' as check_item,
  CASE 
    WHEN COUNT(*) = 3 THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as result
FROM pg_tables
WHERE tablename IN ('user_roles', 'profiles', 'admin_audit_log')
  AND schemaname = 'public'
  AND rowsecurity = true;

SELECT '2. RLS Policies' as check_item,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as result
FROM pg_policies
WHERE tablename = 'user_roles' AND schemaname = 'public';

SELECT '3. Soft Delete Columns' as check_item,
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as result
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('active', 'deleted_at');

SELECT '4. Performance Indexes' as check_item,
  CASE 
    WHEN COUNT(*) >= 15 THEN '✅ PASS' 
    ELSE '⚠️ WARNING' 
  END as result
FROM pg_indexes
WHERE tablename IN ('profiles', 'user_roles', 'doctors', 'appointments', 'availability')
  AND schemaname = 'public'
  AND indexname LIKE 'idx_%';

SELECT '5. Audit Log Table' as check_item,
  CASE 
    WHEN COUNT(*) >= 8 THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as result
FROM information_schema.columns
WHERE table_name = 'admin_audit_log';

SELECT '6. Validation Triggers' as check_item,
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as result
FROM information_schema.triggers
WHERE trigger_name IN ('prevent_duplicate_roles', 'prevent_last_role_deletion');

-- ============================================
-- END OF VALIDATION
-- ============================================
-- If all checks show ✅ PASS, migration was successful!
-- ============================================
