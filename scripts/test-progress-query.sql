-- Test query to check if progress data exists
-- Run this in Neon SQL Editor

-- Check if table exists and has data
SELECT COUNT(*) as total_records FROM user_video_progress;

-- Check progress for specific user and video
SELECT * FROM user_video_progress 
WHERE user_id = '79009ecc-7fec-486a-9602-fbec0e2008f9' 
  AND video_id = 'b715f139-e108-4c48-b79f-dc44350ef74c';

-- Check all progress for this user
SELECT * FROM user_video_progress 
WHERE user_id = '79009ecc-7fec-486a-9602-fbec0e2008f9';

-- =====================================================
-- TEST PROGRESS QUERY - DIAGNOSTIC COMPLET
-- =====================================================

-- 1. Check if table exists and has data
SELECT COUNT(*) as total_records FROM user_video_progress;

-- 2. Check all progress for this user (no JOIN)
SELECT * FROM user_video_progress 
WHERE user_id = '79009ecc-7fec-486a-9602-fbec0e2008f9'
ORDER BY last_watched DESC;

-- 3. Check specific video progress
SELECT * FROM user_video_progress 
WHERE user_id = '79009ecc-7fec-486a-9602-fbec0e2008f9' 
  AND video_id = 'b715f139-e108-4c48-b79f-dc44350ef74c';

-- 4. Check data types in both tables
SELECT 
  'user_video_progress' as table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'user_video_progress'
ORDER BY ordinal_position

UNION ALL

SELECT 
  'videos_new' as table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'videos_new' AND column_name = 'id'
ORDER BY table_name, ordinal_position;

-- 5. Check if video exists in videos_new
SELECT id, title, region, "videoType" 
FROM videos_new 
WHERE id = 'b715f139-e108-4c48-b79f-dc44350ef74c';

-- 6. Check video ID type (UUID vs TEXT)
SELECT 
  id,
  pg_typeof(id) as id_type,
  id::text as id_as_text,
  title
FROM videos_new 
WHERE id = 'b715f139-e108-4c48-b79f-dc44350ef74c';

-- 7. Try JOIN with explicit type casting (UUID to TEXT)
SELECT 
  uvp.*,
  vn.id as video_id_from_videos,
  vn.title,
  vn.region,
  vn."videoType",
  uvp.video_id = vn.id::text as direct_match,
  uvp.video_id = vn.id::uuid::text as uuid_to_text_match
FROM user_video_progress uvp
LEFT JOIN videos_new vn ON uvp.video_id = vn.id::text
WHERE uvp.user_id = '79009ecc-7fec-486a-9602-fbec0e2008f9';

-- 8. Check progress for all videos in abdos program (with proper casting)
SELECT 
  uvp.*,
  vn.id as video_id_from_videos,
  vn.title,
  vn.region,
  vn."videoType"
FROM user_video_progress uvp
LEFT JOIN videos_new vn ON uvp.video_id = vn.id::text
WHERE uvp.user_id = '79009ecc-7fec-486a-9602-fbec0e2008f9'
  AND vn.region = 'abdos'
  AND vn."videoType" = 'PROGRAMMES';

-- 9. Get all videos in abdos program to see their IDs
SELECT id, title, region, "videoType"
FROM videos_new
WHERE region = 'abdos' AND "videoType" = 'PROGRAMMES'
ORDER BY title;

