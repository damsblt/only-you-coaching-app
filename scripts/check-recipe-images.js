/**
 * Script to verify recipe images are accessible
 * Tests the S3 URLs generated for recipes
 */

require('dotenv').config({ path: '.env.local' });

const AWS_REGION = process.env.AWS_REGION || 'eu-north-1';
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching';
const S3_BASE_URL = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`;

async function checkImageUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      accessible: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type')
    };
  } catch (error) {
    return {
      accessible: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('🔍 Checking Recipe Images\n');
  console.log(`S3 Base URL: ${S3_BASE_URL}\n`);
  
  const testUrls = [
    `${S3_BASE_URL}/recettes/1.png`,
    `${S3_BASE_URL}/recettes/14.png`,
    `${S3_BASE_URL}/recettes/27.png`,
  ];
  
  for (const url of testUrls) {
    console.log(`Checking: ${url}`);
    const result = await checkImageUrl(url);
    
    if (result.accessible) {
      console.log(`  ✅ Accessible (${result.status}) - ${result.contentType}`);
    } else {
      console.log(`  ❌ Not accessible`);
      if (result.status) {
        console.log(`     Status: ${result.status}`);
      }
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
    }
    console.log();
  }
  
  console.log('\n💡 Tips:');
  console.log('   - If images are not accessible, check S3 bucket permissions');
  console.log('   - Ensure bucket has public read access or CORS is configured');
  console.log('   - Verify the file paths in S3 match the URLs above');
}

main().catch(console.error);

