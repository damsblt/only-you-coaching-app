-- Populate s3Key column from existing audioUrl values
-- This extracts the S3 key from the URL pathname (before query params)
-- The key may be URL-encoded, which is fine - the API will decode it

UPDATE audios 
SET s3Key = SPLIT_PART(SPLIT_PART("audioUrl", '.amazonaws.com/', 2), '?', 1)
WHERE s3Key IS NULL 
  AND "audioUrl" IS NOT NULL 
  AND "audioUrl" LIKE 'https://%.amazonaws.com/%';

-- Verify the update
SELECT 
  COUNT(*) as total_audios,
  COUNT(s3Key) as audios_with_s3key,
  COUNT(*) - COUNT(s3Key) as audios_without_s3key
FROM audios;

