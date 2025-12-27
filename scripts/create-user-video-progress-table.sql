-- =====================================================
-- 🗄️ CREATE USER VIDEO PROGRESS TABLE
-- =====================================================
-- This script creates the user_video_progress table
-- Run this in Neon SQL Editor
-- =====================================================

-- Create user_video_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  video_id TEXT NOT NULL, -- Using TEXT to match videos_new.id type
  progress_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  last_watched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_video_progress_user_id ON user_video_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_video_progress_video_id ON user_video_progress(video_id);
CREATE INDEX IF NOT EXISTS idx_user_video_progress_completed ON user_video_progress(completed);

-- Add foreign key constraints (optional, but recommended)
-- Note: These will fail if the referenced tables don't exist or use different ID types
-- ALTER TABLE user_video_progress
--   ADD CONSTRAINT fk_user_video_progress_user
--   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ALTER TABLE user_video_progress
--   ADD CONSTRAINT fk_user_video_progress_video
--   FOREIGN KEY (video_id) REFERENCES videos_new(id) ON DELETE CASCADE;















