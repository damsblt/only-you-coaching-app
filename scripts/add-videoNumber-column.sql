-- Migration: Add videoNumber column to videos_new table
-- This column stores the number at the beginning of the video filename
-- Supports both integers (1, 2, 10) and decimals (10.1, 10.2)

-- Check if column already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'videos_new' 
    AND column_name = 'videoNumber'
  ) THEN
    -- Add the column
    ALTER TABLE videos_new 
    ADD COLUMN "videoNumber" DECIMAL(10, 2);
    
    -- Add index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_videos_new_video_number ON videos_new("videoNumber");
    
    -- Add composite index for videoNumber + region (useful for matching)
    CREATE INDEX IF NOT EXISTS idx_videos_new_video_number_region ON videos_new("videoNumber", region);
    
    RAISE NOTICE 'Column videoNumber added successfully';
  ELSE
    RAISE NOTICE 'Column videoNumber already exists';
  END IF;
END $$;

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  numeric_precision, 
  numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'videos_new' 
AND column_name = 'videoNumber';
