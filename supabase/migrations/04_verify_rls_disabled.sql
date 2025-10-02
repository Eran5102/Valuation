-- Check if RLS is enabled or disabled on tables
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'organization_members', 'super_admins')
ORDER BY tablename;