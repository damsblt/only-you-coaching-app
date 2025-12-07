
-- Recipe: Recettes Végétariennes - Volume I
INSERT INTO recipes (
  title, slug, description, image, images, pdf_url,
  category, prep_time, servings, is_vegetarian, difficulty,
  tags, ingredients, instructions,
  is_premium, is_published, published_at, created_at, updated_at
) VALUES (
  'Recettes Végétariennes - Volume I',
  'recettes-vegetariennes-vol-i',
  'Une collection de 27 recettes végétariennes délicieuses et nutritives pour votre bien-être.',
  'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/1.png',
  '["https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/1.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/2.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/3.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/4.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/5.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/6.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/7.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/8.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/9.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/10.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/11.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/12.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/13.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/14.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/15.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/16.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/17.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/18.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/19.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/20.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/21.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/22.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/23.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/24.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/25.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/26.png","https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/27.png"]'::jsonb,
  'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/Recettes_Vegetariennes_Vol_I.pdf',
  'vegetarian',
  30,
  4,
  true,
  'medium',
  '["végétarien","healthy","plantes"]'::jsonb,
  '[]'::jsonb,
  '',
  false,
  false,
  NULL,
  '2025-10-29T17:08:16.387Z',
  '2025-10-29T17:08:16.387Z'
)
ON CONFLICT (slug) 
DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  image = EXCLUDED.image,
  images = EXCLUDED.images,
  pdf_url = EXCLUDED.pdf_url,
  category = EXCLUDED.category,
  prep_time = EXCLUDED.prep_time,
  servings = EXCLUDED.servings,
  is_vegetarian = EXCLUDED.is_vegetarian,
  difficulty = EXCLUDED.difficulty,
  tags = EXCLUDED.tags,
  ingredients = EXCLUDED.ingredients,
  instructions = EXCLUDED.instructions,
  is_premium = EXCLUDED.is_premium,
  is_published = EXCLUDED.is_published,
  updated_at = EXCLUDED.updated_at;
