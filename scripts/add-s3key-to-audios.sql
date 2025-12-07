-- Add s3Key column to audios table
-- This allows us to store the S3 key instead of expiring signed URLs

-- Add the s3Key column if it doesn't exist
ALTER TABLE audios 
ADD COLUMN IF NOT EXISTS s3Key TEXT;

-- Create an index on s3Key for faster lookups
CREATE INDEX IF NOT EXISTS idx_audios_s3key ON audios(s3Key);

-- Update existing records to extract s3Key from audioUrl
-- This extracts the S3 key from signed URLs stored in audioUrl
-- Note: The S3 key is stored as-is from the URL (may be URL-encoded)
-- The API code will handle decoding when generating signed URLs
UPDATE audios 
SET s3Key = SPLIT_PART(SPLIT_PART("audioUrl", '.amazonaws.com/', 2), '?', 1)
WHERE s3Key IS NULL 
  AND "audioUrl" IS NOT NULL 
  AND "audioUrl" LIKE 'https://%.amazonaws.com/%';

-- Add a comment to explain the column
COMMENT ON COLUMN audios.s3Key IS 'S3 key for the audio file. Used to generate fresh signed URLs on demand.';

