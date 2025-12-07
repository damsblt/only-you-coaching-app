-- =====================================================
-- 🛡️ MANUAL RLS SETUP FOR PILATES APP
-- =====================================================
-- Copy and paste these statements one by one into your Supabase SQL Editor
-- Go to: https://app.supabase.com → Your Project → SQL Editor

-- =====================================================
-- STEP 1: ENABLE RLS ON ALL TABLES
-- =====================================================

-- Enable RLS on videos_new table
ALTER TABLE videos_new ENABLE ROW LEVEL SECURITY;

-- Enable RLS on users table  
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on favorites table
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Enable RLS on playlists table
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- Enable RLS on playlist_items table
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;

-- Enable RLS on bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on audios table
ALTER TABLE audios ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: VIDEOS_NEW TABLE POLICIES
-- =====================================================

-- Allow anonymous users to see only published videos
CREATE POLICY "Allow anonymous access to published videos" 
ON videos_new FOR SELECT 
TO anon 
USING (is_published = true);

-- Allow authenticated users to see all published videos
CREATE POLICY "Allow authenticated users to see published videos" 
ON videos_new FOR SELECT 
TO authenticated 
USING (is_published = true);

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
USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can create own subscriptions" 
ON subscriptions FOR INSERT 
TO authenticated 
USING (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions" 
ON subscriptions FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

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
-- STEP 5: FAVORITES TABLE POLICIES
-- =====================================================

-- Users can only see their own favorites
CREATE POLICY "Users can view own favorites" 
ON favorites FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Users can manage their own favorites
CREATE POLICY "Users can manage own favorites" 
ON favorites FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- =====================================================
-- STEP 6: PLAYLISTS TABLE POLICIES
-- =====================================================

-- Users can see their own playlists and public playlists
CREATE POLICY "Users can view own and public playlists" 
ON playlists FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id OR is_public = true);

-- Users can manage their own playlists
CREATE POLICY "Users can manage own playlists" 
ON playlists FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- =====================================================
-- STEP 7: PLAYLIST_ITEMS TABLE POLICIES
-- =====================================================

-- Users can see items from their own playlists and public playlists
CREATE POLICY "Users can view playlist items from own and public playlists" 
ON playlist_items FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM playlists 
    WHERE playlists.id = playlist_items.playlist_id 
    AND (playlists.user_id = auth.uid() OR playlists.is_public = true)
  )
);

-- Users can manage items in their own playlists
CREATE POLICY "Users can manage own playlist items" 
ON playlist_items FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM playlists 
    WHERE playlists.id = playlist_items.playlist_id 
    AND playlists.user_id = auth.uid()
  )
);

-- =====================================================
-- STEP 8: BOOKINGS TABLE POLICIES
-- =====================================================

-- Users can only see their own bookings
CREATE POLICY "Users can view own bookings" 
ON bookings FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Users can manage their own bookings
CREATE POLICY "Users can manage own bookings" 
ON bookings FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- Allow admins to see all bookings
CREATE POLICY "Admins can see all bookings" 
ON bookings FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'ADMIN'
  )
);

-- =====================================================
-- STEP 9: AUDIOS TABLE POLICIES
-- =====================================================

-- Allow anonymous users to see published audios
CREATE POLICY "Allow anonymous access to published audios" 
ON audios FOR SELECT 
TO anon 
USING (is_published = true);

-- Allow authenticated users to see all published audios
CREATE POLICY "Allow authenticated users to see published audios" 
ON audios FOR SELECT 
TO authenticated 
USING (is_published = true);

-- Allow admins to manage all audios
CREATE POLICY "Allow admins to manage audios" 
ON audios FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'ADMIN'
  )
);

-- =====================================================
-- STEP 10: VERIFICATION QUERIES
-- =====================================================

-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('videos_new', 'users', 'subscriptions', 'favorites', 'playlists', 'playlist_items', 'bookings', 'audios');

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
