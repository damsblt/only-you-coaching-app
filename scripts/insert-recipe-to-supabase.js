/**
 * Script to insert recipe directly into Supabase database
 * Uses the credentials from .env.local
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Recipe data with correct image URLs
const recipeData = {
  title: 'Recettes Végétariennes - Volume I',
  slug: 'recettes-vegetariennes-vol-i',
  description: 'Une collection de 27 recettes végétariennes délicieuses et nutritives pour votre bien-être.',
  image: 'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/1.png',
  images: [
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/1.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/2.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/3.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/4.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/5.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/6.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/7.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/8.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/9.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/10.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/11.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/12.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/13.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/14.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/15.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/16.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/17.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/18.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/19.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/20.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/21.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/22.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/23.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/24.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/25.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/26.png',
    'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/27.png'
  ],
  pdf_url: 'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/Recettes_Vegetariennes_Vol_I.pdf',
  category: 'vegetarian',
  prep_time: 30,
  servings: 4,
  is_vegetarian: true,
  difficulty: 'medium',
  tags: ['végétarien', 'healthy', 'plantes'],
  ingredients: [],
  instructions: '',
  is_premium: false,
  is_published: false
};

async function insertRecipe() {
  console.log('📝 Inserting recipe into Supabase...\n');
  console.log(`Title: ${recipeData.title}`);
  console.log(`Images: ${recipeData.images.length} pages\n`);

  try {
    // First, check if recipe exists
    const { data: existing } = await supabase
      .from('recipes')
      .select('id, slug')
      .eq('slug', recipeData.slug)
      .single();

    if (existing) {
      console.log('⚠️  Recipe already exists, updating...');
      
      const { data, error } = await supabase
        .from('recipes')
        .update({
          ...recipeData,
          updated_at: new Date().toISOString()
        })
        .eq('slug', recipeData.slug)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating recipe:', error);
        process.exit(1);
      }

      console.log('✅ Recipe updated successfully!');
      console.log(`   ID: ${data.id}`);
      console.log(`   Slug: ${data.slug}`);
    } else {
      console.log('➕ Creating new recipe...');
      
      const { data, error } = await supabase
        .from('recipes')
        .insert([recipeData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error inserting recipe:', error);
        console.error('   Details:', error.message);
        process.exit(1);
      }

      console.log('✅ Recipe created successfully!');
      console.log(`   ID: ${data.id}`);
      console.log(`   Slug: ${data.slug}`);
    }

    console.log('\n💡 Next steps:');
    console.log('   1. Verify images are accessible (they may return 403 if S3 permissions are not set)');
    console.log('   2. Test recipe page: http://localhost:3000/recettes');
    console.log('   3. When ready, publish with:');
    console.log(`      UPDATE recipes SET is_published = true, published_at = NOW() WHERE slug = '${recipeData.slug}';`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Check if pdf_url column exists first
async function checkSchema() {
  console.log('🔍 Checking database schema...\n');
  
  try {
    // Try to select pdf_url to see if column exists
    const { error } = await supabase
      .from('recipes')
      .select('pdf_url')
      .limit(1);

    if (error && error.message.includes('pdf_url')) {
      console.log('⚠️  pdf_url column does not exist yet.');
      console.log('   Run this SQL first: scripts/add-pdf-url-to-recipes.sql\n');
      return false;
    }
    
    console.log('✅ Schema looks good (pdf_url column exists)\n');
    return true;
  } catch (error) {
    console.log('⚠️  Could not verify schema, proceeding anyway...\n');
    return true;
  }
}

(async () => {
  const schemaOk = await checkSchema();
  if (schemaOk) {
    await insertRecipe();
  } else {
    console.log('Please run the migration first, then re-run this script.');
  }
})();

