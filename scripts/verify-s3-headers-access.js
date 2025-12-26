#!/usr/bin/env node

/**
 * Script pour vérifier l'accès aux images et vidéos des headers depuis S3
 * Teste les URLs publiques et signées
 */

require('dotenv').config({ path: '.env.local' });

const { S3Client, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const awsRegion = process.env.AWS_REGION || 'eu-north-1';
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching';

// Assets des headers à tester
const HEADER_ASSETS = {
  images: [
    'Photos/Illustration/brooke-lark-jUPOXXRNdcA-unsplash.jpg',
    'Photos/Illustration/element5-digital-OBbliBNuJlk-unsplash_edited.jpg',
    'Photos/Illustration/reverie-calme-femme-portant-ecouteurs-se-detendre-ecouter-livre-audio-dans-plantes-vertes-exotiques-surround.jpg',
    'Photos/Illustration/balanced-stone.jpg',
    'Photos/Training/ok (8).JPG',
  ],
  videos: [
    'Photos/Illustration/5033410_Fitness_Beach_Exercise_1920x1080 (1) (1).mp4',
    'Photos/Illustration/1860009_Lunges_Resistance Training_Exercise_1920x1080 (1).mp4',
  ]
};

if (!awsAccessKeyId || !awsSecretAccessKey) {
  console.error('❌ AWS credentials not found in environment variables');
  console.error('   Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
  process.exit(1);
}

const s3Client = new S3Client({
  region: awsRegion,
  credentials: {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
  },
});

function getPublicUrl(key) {
  return `https://${BUCKET_NAME}.s3.${awsRegion}.amazonaws.com/${key}`;
}

async function checkObjectExists(key) {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

async function testPublicUrl(key) {
  const publicUrl = getPublicUrl(key);
  try {
    const response = await fetch(publicUrl, { method: 'HEAD' });
    return {
      accessible: response.ok,
      status: response.status,
      url: publicUrl,
    };
  } catch (error) {
    return {
      accessible: false,
      error: error.message,
      url: publicUrl,
    };
  }
}

async function testSignedUrl(key) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return {
      success: true,
      url: signedUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function testAsset(key, type) {
  console.log(`\n📦 Testing ${type}: ${key}`);
  console.log('─'.repeat(80));
  
  // 1. Check if object exists
  const exists = await checkObjectExists(key);
  console.log(`   ${exists ? '✅' : '❌'} Object exists in S3: ${exists}`);
  
  if (!exists) {
    console.log(`   ⚠️  Object not found in bucket. Skipping further tests.`);
    return;
  }
  
  // 2. Test public URL
  console.log(`\n   🔓 Testing public URL access...`);
  const publicTest = await testPublicUrl(key);
  if (publicTest.accessible) {
    console.log(`   ✅ Public URL accessible: ${publicTest.status}`);
    console.log(`      URL: ${publicTest.url}`);
  } else {
    console.log(`   ❌ Public URL NOT accessible: ${publicTest.status || publicTest.error}`);
    console.log(`      URL: ${publicTest.url}`);
    console.log(`      💡 This means the S3 bucket policy may not allow public read access.`);
  }
  
  // 3. Test signed URL
  console.log(`\n   🔐 Testing signed URL generation...`);
  const signedTest = await testSignedUrl(key);
  if (signedTest.success) {
    console.log(`   ✅ Signed URL generated successfully`);
    console.log(`      URL: ${signedTest.url.substring(0, 100)}...`);
  } else {
    console.log(`   ❌ Failed to generate signed URL: ${signedTest.error}`);
    console.log(`      💡 Check AWS credentials and permissions.`);
  }
}

async function main() {
  console.log('🔍 Vérification de l\'accès aux assets des headers S3\n');
  console.log('='.repeat(80));
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Region: ${awsRegion}`);
  console.log(`Credentials: ${awsAccessKeyId ? '✅ Configured' : '❌ Missing'}`);
  console.log('='.repeat(80));
  
  // Test images
  console.log('\n📸 Testing Images:');
  for (const imageKey of HEADER_ASSETS.images) {
    await testAsset(imageKey, 'Image');
  }
  
  // Test videos
  console.log('\n\n🎥 Testing Videos:');
  for (const videoKey of HEADER_ASSETS.videos) {
    await testAsset(videoKey, 'Video');
  }
  
  console.log('\n\n' + '='.repeat(80));
  console.log('📋 Summary:');
  console.log('   - If public URLs fail: Check S3 bucket policy allows public read access');
  console.log('   - If signed URLs fail: Check AWS credentials and IAM permissions');
  console.log('   - Recommended: Use signed URLs for security, or configure public access');
  console.log('='.repeat(80));
}

main().catch(console.error);

