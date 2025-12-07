/**
 * Fix the PDF URL for the recipe - update to match actual S3 filename
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Actual PDF filename in S3
const actualPdfUrl = 'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/pdf.pdf';

async function fixPdfUrl() {
  console.log('🔧 Fixing PDF URL for recipe...\n');

  try {
    const { data, error } = await supabase
      .from('recipes')
      .update({
        pdf_url: actualPdfUrl,
        updated_at: new Date().toISOString()
      })
      .eq('slug', 'recettes-vegetariennes-vol-i')
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating PDF URL:', error);
      process.exit(1);
    }

    console.log('✅ PDF URL updated successfully!');
    console.log(`   Recipe: ${data.title}`);
    console.log(`   New PDF URL: ${data.pdf_url}`);
    console.log('\n💡 You can now test the PDF viewer in the booklet mode.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

fixPdfUrl();

