/**
 * Script to generate recipe data from S3 images
 * Creates the image URLs and prepares data for database insertion
 * 
 * Usage:
 *   node scripts/setup-recipes-from-s3.js
 * 
 * This assumes images are in: s3://only-you-coaching/recettes/
 */

require('dotenv').config({ path: '.env.local' });

const AWS_REGION = process.env.AWS_REGION || 'eu-north-1';
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching';
const S3_BASE_URL = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`;

// Recipe images configuration
// Update these based on what you uploaded
const RECIPE_CONFIGS = [
  {
    title: 'Recettes Végétariennes - Volume I',
    slug: 'recettes-vegetariennes-vol-i',
    description: 'Une collection de 27 recettes végétariennes délicieuses et nutritives pour votre bien-être.',
    category: 'vegetarian',
    prepTime: 30, // Average prep time
    servings: 4,
    isVegetarian: true,
    difficulty: 'medium',
    tags: ['végétarien', 'healthy', 'plantes'],
    ingredients: [], // Can be filled manually
    instructions: '', // Can be filled manually
    isPremium: false,
    isPublished: false,
    // Image files (1.png through 27.png based on your upload)
    imageCount: 27,
    imagePrefix: 'recettes/Recettes_Vol.I/', // S3 path prefix
    pdfFileName: 'Recettes_Vegetariennes_Vol_I.pdf', // Optional PDF (relative to imagePrefix)
  }
];

/**
 * Generate S3 URLs for recipe images
 */
function generateImageUrls(prefix, count) {
  const urls = [];
  for (let i = 1; i <= count; i++) {
    // Assuming files are named: 1.png, 2.png, etc.
    const fileName = `${i}.png`;
    const key = `${prefix}${fileName}`;
    const url = `${S3_BASE_URL}/${key}`;
    urls.push(url);
  }
  return urls;
}

/**
 * Generate main image (first page)
 */
function getMainImage(imageUrls) {
  return imageUrls[0] || '';
}

/**
 * Generate PDF URL (optional)
 */
function getPdfUrl(pdfFileName, prefix) {
  if (!pdfFileName) return null;
  // If pdfFileName already includes the prefix path, don't double it
  const key = pdfFileName.startsWith(prefix) ? pdfFileName : `${prefix}${pdfFileName}`;
  return `${S3_BASE_URL}/${key}`;
}

/**
 * Format recipe for database insertion
 */
function formatRecipeForDB(recipeConfig) {
  const imageUrls = generateImageUrls(recipeConfig.imagePrefix, recipeConfig.imageCount);
  const mainImage = getMainImage(imageUrls);
  const pdfUrl = getPdfUrl(recipeConfig.pdfFileName, recipeConfig.imagePrefix);

  return {
    title: recipeConfig.title,
    slug: recipeConfig.slug,
    description: recipeConfig.description,
    image: mainImage,
    images: imageUrls,
    pdf_url: pdfUrl,
    category: recipeConfig.category,
    prep_time: recipeConfig.prepTime,
    servings: recipeConfig.servings,
    is_vegetarian: recipeConfig.isVegetarian,
    difficulty: recipeConfig.difficulty,
    tags: recipeConfig.tags,
    ingredients: recipeConfig.ingredients,
    instructions: recipeConfig.instructions,
    is_premium: recipeConfig.isPremium,
    is_published: recipeConfig.isPublished,
  };
}

/**
 * Generate SQL INSERT statement
 */
function generateSQL(recipe) {
  const now = new Date().toISOString();
  
  return `
-- Recipe: ${recipe.title}
INSERT INTO recipes (
  title, slug, description, image, images, pdf_url,
  category, prep_time, servings, is_vegetarian, difficulty,
  tags, ingredients, instructions,
  is_premium, is_published, published_at, created_at, updated_at
) VALUES (
  '${recipe.title.replace(/'/g, "''")}',
  '${recipe.slug}',
  '${recipe.description.replace(/'/g, "''")}',
  '${recipe.image}',
  '${JSON.stringify(recipe.images)}'::jsonb,
  ${recipe.pdf_url ? `'${recipe.pdf_url}'` : 'NULL'},
  '${recipe.category}',
  ${recipe.prep_time},
  ${recipe.servings},
  ${recipe.is_vegetarian},
  '${recipe.difficulty}',
  '${JSON.stringify(recipe.tags)}'::jsonb,
  '${JSON.stringify(recipe.ingredients)}'::jsonb,
  '${recipe.instructions.replace(/'/g, "''")}',
  ${recipe.is_premium},
  ${recipe.is_published},
  ${recipe.is_published ? `'${now}'` : 'NULL'},
  '${now}',
  '${now}'
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
`;
}

/**
 * Generate JSON for API testing
 */
function generateJSON(recipe) {
  return JSON.stringify(recipe, null, 2);
}

// Main execution
console.log('📚 Recipe Setup from S3\n');
console.log(`S3 Base URL: ${S3_BASE_URL}\n`);

RECIPE_CONFIGS.forEach((config, index) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Recipe ${index + 1}: ${config.title}`);
  console.log('='.repeat(60));
  
  const recipe = formatRecipeForDB(config);
  
  // Show URLs
  console.log(`\n✅ Generated ${recipe.images.length} image URLs`);
  console.log(`📄 Main Image: ${recipe.image}`);
  if (recipe.pdf_url) {
    console.log(`📚 PDF URL: ${recipe.pdf_url}`);
  }
  console.log(`\n🔗 Image URLs (first 3 shown):`);
  recipe.images.slice(0, 3).forEach((url, i) => {
    console.log(`   ${i + 1}. ${url}`);
  });
  if (recipe.images.length > 3) {
    console.log(`   ... and ${recipe.images.length - 3} more`);
  }
  
  // Generate SQL
  console.log(`\n📝 SQL INSERT Statement:\n`);
  console.log(generateSQL(recipe));
  
  // Generate JSON for API
  console.log(`\n📋 JSON for API (POST /api/recipes):\n`);
  console.log(generateJSON(recipe));
  
  // Save to file
  const fs = require('fs');
  const sqlFile = `scripts/recipes-${config.slug}-insert.sql`;
  const jsonFile = `scripts/recipes-${config.slug}.json`;
  
  fs.writeFileSync(sqlFile, generateSQL(recipe));
  fs.writeFileSync(jsonFile, generateJSON(recipe));
  
  console.log(`\n💾 Files saved:`);
  console.log(`   SQL: ${sqlFile}`);
  console.log(`   JSON: ${jsonFile}`);
});

console.log(`\n\n✅ Done! Next steps:`);
console.log(`   1. Review the generated SQL files`);
console.log(`   2. Run the SQL in Supabase SQL Editor`);
console.log(`   3. Or use the JSON files with POST /api/recipes`);
console.log(`   4. Test at: http://localhost:3000/recettes`);

