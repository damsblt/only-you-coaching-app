-- =====================================================
-- 🛡️ ROW LEVEL SECURITY (RLS) SETUP FOR PILATES APP
-- =====================================================
-- This script sets up comprehensive RLS policies for your Pilates coaching app
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================

-- Enable RLS on all main tables
ALTER TABLE videos_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audios ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. VIDEOS_NEW TABLE POLICIES
-- =====================================================

-- Allow anonymous users to see only published videos
-- This is important for your public video browsing
CREATE POLICY "Allow anonymous access to published videos" 
ON videos_new FOR SELECT 
TO anon 
USING (is_published = true);

-- Allow authenticated users to see all published videos
-- This gives logged-in users access to all content
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

-- Allow admins to insert/update/delete videos
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
-- 3. USERS TABLE POLICIES
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
-- 4. SUBSCRIPTIONS TABLE POLICIES
-- =====================================================

-- Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" 
ON subscriptions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Users can insert their own subscriptions (for new signups)
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
-- 5. FAVORITES TABLE POLICIES
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
-- 6. PLAYLISTS TABLE POLICIES
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
-- 7. PLAYLIST_ITEMS TABLE POLICIES
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
-- 8. BOOKINGS TABLE POLICIES
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
-- 9. AUDIOS TABLE POLICIES
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
-- 10. HELPER FUNCTIONS FOR PREMIUM CONTENT
-- =====================================================

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION user_has_active_subscription(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE subscriptions.user_id = user_id 
    AND subscriptions.status = 'ACTIVE'
    AND subscriptions.stripe_current_period_end > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION user_is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = user_id 
    AND users.role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. PREMIUM CONTENT POLICIES (OPTIONAL)
-- =====================================================
-- Uncomment these if you want to restrict premium content

-- -- Only allow users with active subscriptions to see premium videos
-- CREATE POLICY "Premium videos require active subscription" 
-- ON videos_new FOR SELECT 
-- TO authenticated 
-- USING (
--   is_published = true 
--   AND (
--     -- Free content is always accessible
--     video_type = 'FREE' 
--     OR 
--     -- Premium content requires active subscription
--     (video_type = 'PREMIUM' AND user_has_active_subscription(auth.uid()))
--     OR
--     -- Admins can see everything
--     user_is_admin(auth.uid())
--   )
-- );

-- =====================================================
-- 12. TESTING QUERIES
-- =====================================================

-- Test anonymous access (should only see published content)
-- SELECT COUNT(*) FROM videos_new; -- Should work for anon users

-- Test authenticated user access
-- SELECT COUNT(*) FROM videos_new; -- Should work for authenticated users

-- Test user-specific data access
-- SELECT COUNT(*) FROM favorites WHERE user_id = auth.uid(); -- Should work for authenticated users

-- =====================================================
-- 13. VERIFICATION QUERIES
-- =====================================================

-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('videos_new', 'users', 'subscriptions', 'favorites', 'playlists', 'playlist_items', 'bookings', 'audios');

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
