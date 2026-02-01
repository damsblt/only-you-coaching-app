-- Add orderIndex column to audios table if it doesn't exist
-- This column stores the display order for audios within their category

-- Check if column exists and add it if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'audios' 
    AND column_name = 'orderIndex'
  ) THEN
    ALTER TABLE audios ADD COLUMN "orderIndex" INTEGER;
    CREATE INDEX IF NOT EXISTS idx_audios_order_index ON audios("orderIndex");
    RAISE NOTICE 'Column orderIndex added to audios table';
  ELSE
    RAISE NOTICE 'Column orderIndex already exists in audios table';
  END IF;
END $$;
