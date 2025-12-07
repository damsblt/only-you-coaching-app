/**
 * Script to make recipe images publicly accessible in S3
 * Sets up bucket policy and CORS for the recettes folder
 */

require('dotenv').config({ path: '.env.local' });

const { S3Client, PutBucketPolicyCommand, PutBucketCorsCommand, GetBucketCorsCommand } = require('@aws-sdk/client-s3');

const awsRegion = process.env.AWS_REGION || 'eu-north-1';
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching';

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

// Bucket policy to allow public read access to recettes folder
const bucketPolicy = {
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'PublicReadRecettes',
      Effect: 'Allow',
      Principal: '*',
      Action: 's3:GetObject',
      Resource: [
        `arn:aws:s3:::${BUCKET_NAME}/recettes/*`,
        `arn:aws:s3:::${BUCKET_NAME}/recettes/**/*`
      ],
    },
  ],
};

// CORS configuration
const corsConfiguration = {
  CORSRules: [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'HEAD'],
      AllowedOrigins: ['*'], // In production, specify your domain
      ExposeHeaders: ['ETag', 'Content-Length'],
      MaxAgeSeconds: 3000,
    },
  ],
};

async function checkExistingCORS() {
  try {
    const command = new GetBucketCorsCommand({ Bucket: BUCKET_NAME });
    const response = await s3Client.send(command);
    return response.CORSRules || [];
  } catch (error) {
    if (error.name === 'NoSuchCORSConfiguration') {
      return [];
    }
    throw error;
  }
}

async function setBucketPolicy() {
  try {
    console.log('📝 Setting bucket policy for recettes folder...');
    
    const command = new PutBucketPolicyCommand({
      Bucket: BUCKET_NAME,
      Policy: JSON.stringify(bucketPolicy),
    });
    
    await s3Client.send(command);
    console.log('✅ Bucket policy set successfully');
    console.log('   - Public read access enabled for: s3://' + BUCKET_NAME + '/recettes/*');
  } catch (error) {
    console.error('❌ Error setting bucket policy:', error.message);
    throw error;
  }
}

async function setCORS() {
  try {
    console.log('📝 Setting CORS configuration...');
    
    const existingRules = await checkExistingCORS();
    
    // Merge with existing rules if any
    const mergedRules = [...existingRules];
    
    // Check if our rule already exists
    const hasRecettesRule = existingRules.some(
      rule => rule.AllowedOrigins?.includes('*') && rule.AllowedMethods?.includes('GET')
    );
    
    if (!hasRecettesRule) {
      mergedRules.push(corsConfiguration.CORSRules[0]);
    }
    
    const command = new PutBucketCorsCommand({
      Bucket: BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: mergedRules,
      },
    });
    
    await s3Client.send(command);
    console.log('✅ CORS configuration updated successfully');
  } catch (error) {
    console.error('❌ Error setting CORS:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🔧 Fixing S3 Permissions for Recipe Images\n');
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Region: ${awsRegion}`);
  console.log(`Target folder: recettes/\n`);

  try {
    await setBucketPolicy();
    await setCORS();
    
    console.log('\n✅ Permissions configured successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Wait a few seconds for changes to propagate');
    console.log('   2. Test images at:');
    console.log(`      https://${BUCKET_NAME}.s3.${awsRegion}.amazonaws.com/recettes/1.png`);
    console.log('   3. If still 403, verify:');
    console.log('      - Files are actually in s3://' + BUCKET_NAME + '/recettes/');
    console.log('      - File names match (1.png, 2.png, etc.)');
    console.log('      - Block public access settings are disabled for this folder');
    
  } catch (error) {
    console.error('\n❌ Failed to configure permissions');
    console.error('   Error:', error.message);
    console.log('\n💡 Manual alternative:');
    console.log('   1. Go to AWS S3 Console');
    console.log(`   2. Select bucket: ${BUCKET_NAME}`);
    console.log('   3. Select "recettes" folder');
    console.log('   4. Actions → Make public');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { setBucketPolicy, setCORS };

