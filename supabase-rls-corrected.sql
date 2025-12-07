-- =====================================================
-- 🛡️ CORRECTED RLS SETUP FOR PILATES APP
-- =====================================================
-- Based on actual table structure found in your Supabase project
-- Copy and paste these statements into your Supabase SQL Editor

-- =====================================================
-- STEP 1: ENABLE RLS ON ALL TABLES
-- =====================================================

-- Enable RLS on videos_new table
ALTER TABLE videos_new ENABLE ROW LEVEL SECURITY;

-- Enable RLS on users table  
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: VIDEOS_NEW TABLE POLICIES
-- =====================================================

-- Allow anonymous users to see only published videos
CREATE POLICY "Allow anonymous access to published videos" 
ON videos_new FOR SELECT 
TO anon 
USING ("isPublished" = true);

-- Allow authenticated users to see all published videos
CREATE POLICY "Allow authenticated users to see published videos" 
ON videos_new FOR SELECT 
TO authenticated 
USING ("isPublished" = true);

-- Allow admins to see all videos (including unpublished)
CREATE POLICY "Allow admins to see all videos" 
ON videos_new FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'ADMIN'
  )
);

-- Allow admins to manage videos
CREATE POLICY "Allow admins to manage videos" 
ON videos_new FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'ADMIN'
  )
);

-- =====================================================
-- STEP 3: USERS TABLE POLICIES
-- =====================================================

-- Users can only see their own profile
CREATE POLICY "Users can view own profile" 
ON users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON users FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Allow admins to see all users
CREATE POLICY "Admins can see all users" 
ON users FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'ADMIN'
  )
);

-- Allow admins to manage all users
CREATE POLICY "Admins can manage all users" 
ON users FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'ADMIN'
  )
);

-- =====================================================
-- STEP 4: SUBSCRIPTIONS TABLE POLICIES
-- =====================================================

-- Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" 
ON subscriptions FOR SELECT 
TO authenticated 
USING (auth.uid() = "userId");

-- Users can insert their own subscriptions
CREATE POLICY "Users can create own subscriptions" 
ON subscriptions FOR INSERT 
TO authenticated 
USING (auth.uid() = "userId");

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions" 
ON subscriptions FOR UPDATE 
TO authenticated 
USING (auth.uid() = "userId");

-- Allow admins to see all subscriptions
CREATE POLICY "Admins can see all subscriptions" 
ON subscriptions FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'ADMIN'
  )
);

-- Allow admins to manage all subscriptions
CREATE POLICY "Admins can manage all subscriptions" 
ON subscriptions FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'ADMIN'
  )
);

-- =====================================================
-- STEP 5: VERIFICATION QUERIES
-- =====================================================

-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('videos_new', 'users', 'subscriptions')
ORDER BY tablename;

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
