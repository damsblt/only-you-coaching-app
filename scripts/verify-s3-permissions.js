/**
 * Script to verify S3 permissions and test image accessibility
 */

require('dotenv').config({ path: '.env.local' });

const AWS_REGION = process.env.AWS_REGION || 'eu-north-1';
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching';

// Test URLs
const testUrls = [
  'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/1.png',
  'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/14.png',
  'https://only-you-coaching.s3.eu-north-1.amazonaws.com/recettes/Recettes_Vol.I/27.png'
];

async function testImageAccess() {
  console.log('🔍 Testing S3 Image Accessibility\n');
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Region: ${AWS_REGION}\n`);

  let accessibleCount = 0;
  let forbiddenCount = 0;

  for (const url of testUrls) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      
      if (response.ok) {
        console.log(`✅ ${url}`);
        console.log(`   Status: ${response.status} ${response.statusText}`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        accessibleCount++;
      } else if (response.status === 403) {
        console.log(`❌ ${url}`);
        console.log(`   Status: ${response.status} Forbidden`);
        forbiddenCount++;
      } else {
        console.log(`⚠️  ${url}`);
        console.log(`   Status: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${url}`);
      console.log(`   Error: ${error.message}`);
      forbiddenCount++;
    }
    console.log();
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Accessible: ${accessibleCount}/${testUrls.length}`);
  console.log(`   ❌ Forbidden: ${forbiddenCount}/${testUrls.length}`);

  if (forbiddenCount > 0) {
    console.log('\n💡 To fix 403 errors, check in AWS Console:');
    console.log('   1. Bucket → Permissions tab');
    console.log('   2. "Block public access (bucket settings)" → Edit');
    console.log('      → Uncheck all 4 options → Save');
    console.log('   3. "Bucket policy" → Edit');
    console.log('      → Add policy from: scripts/s3-bucket-policy-recettes.json');
    console.log('   4. Optional: Select all files in recettes/ folder');
    console.log('      → Actions → Make public using ACL');
  } else {
    console.log('\n✅ All images are publicly accessible!');
  }
}

testImageAccess().catch(console.error);

