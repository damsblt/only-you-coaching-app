/**
 * Publish a recipe to make it visible on the recipes page
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const recipeSlug = process.argv[2] || 'recettes-vegetariennes-vol-i';

async function publishRecipe() {
  console.log(`📢 Publishing recipe: ${recipeSlug}\n`);

  try {
    const { data, error } = await supabase
      .from('recipes')
      .update({
        is_published: true,
        published_at: new Date().toISOString()
      })
      .eq('slug', recipeSlug)
      .select()
      .single();

    if (error) {
      console.error('❌ Error publishing recipe:', error);
      process.exit(1);
    }

    if (!data) {
      console.error(`❌ Recipe not found: ${recipeSlug}`);
      process.exit(1);
    }

    console.log('✅ Recipe published successfully!');
    console.log(`   Title: ${data.title}`);
    console.log(`   Slug: ${data.slug}`);
    console.log(`   Published at: ${data.published_at}`);
    console.log(`\n🌐 View at: http://localhost:3000/recettes`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

publishRecipe();

