-- Add pdf_url column to recipes table for storing PDF booklet files
-- This allows recipes to have both individual images and a compiled PDF

ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Add comment
COMMENT ON COLUMN recipes.pdf_url IS 'URL du PDF (optionnel - pour les recettes en format livret/compilé)';

-- Create index for faster queries if needed
CREATE INDEX IF NOT EXISTS idx_recipes_pdf_url ON recipes(pdf_url) WHERE pdf_url IS NOT NULL;

