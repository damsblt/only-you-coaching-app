-- Add tags column to audios table if it doesn't exist
-- This column stores tags as JSONB for efficient querying

-- Check if column exists and add it if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'audios' 
    AND column_name = 'tags'
  ) THEN
    ALTER TABLE audios ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;
    CREATE INDEX IF NOT EXISTS idx_audios_tags_gin ON audios USING GIN (tags);
    RAISE NOTICE 'Column tags added to audios table';
  ELSE
    RAISE NOTICE 'Column tags already exists in audios table';
  END IF;
END $$;

-- Update the category check constraint to include 'Coaching Mental' (with space)
-- First, drop the existing constraint if it exists
ALTER TABLE audios DROP CONSTRAINT IF EXISTS audios_category_check;

-- Add new constraint that allows multiple category formats
-- Note: PostgreSQL CHECK constraints are case-sensitive, so we need to allow both formats
ALTER TABLE audios ADD CONSTRAINT audios_category_check 
  CHECK (category IN (
    'meditation', 
    'coaching_mental', 
    'Coaching Mental',
    'meditation_guidee', 
    'Méditation Guidée',
    'Meditation Guidee'
  ));

