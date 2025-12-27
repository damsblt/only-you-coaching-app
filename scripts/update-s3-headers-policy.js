#!/usr/bin/env node

/**
 * Script pour mettre à jour la policy S3 pour permettre l'accès public
 * aux images et vidéos des headers (dossier Photos/)
 */

require('dotenv').config({ path: '.env.local' });

const { S3Client, GetBucketPolicyCommand, PutBucketPolicyCommand } = require('@aws-sdk/client-s3');

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

async function getCurrentPolicy() {
  try {
    const command = new GetBucketPolicyCommand({ Bucket: BUCKET_NAME });
    const response = await s3Client.send(command);
    return JSON.parse(response.Policy);
  } catch (error) {
    if (error.name === 'NoSuchBucketPolicy') {
      return null;
    }
    throw error;
  }
}

async function updateBucketPolicy() {
  console.log('🔧 Updating S3 bucket policy for headers assets...\n');
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Region: ${awsRegion}\n`);

  // Get current policy
  let currentPolicy = await getCurrentPolicy();
  
  // Required statements for headers
  const requiredStatements = [
    {
      Sid: 'PublicReadPhotos',
      Effect: 'Allow',
      Principal: '*',
      Action: 's3:GetObject',
      Resource: [
        `arn:aws:s3:::${BUCKET_NAME}/Photos/*`,
        `arn:aws:s3:::${BUCKET_NAME}/Photos/**/*`
      ]
    },
    {
      Sid: 'PublicReadVideos',
      Effect: 'Allow',
      Principal: '*',
      Action: 's3:GetObject',
      Resource: [
        `arn:aws:s3:::${BUCKET_NAME}/Video/*`,
        `arn:aws:s3:::${BUCKET_NAME}/Video/**/*`
      ]
    },
    {
      Sid: 'PublicReadThumbnails',
      Effect: 'Allow',
      Principal: '*',
      Action: 's3:GetObject',
      Resource: [
        `arn:aws:s3:::${BUCKET_NAME}/thumbnails/*`,
        `arn:aws:s3:::${BUCKET_NAME}/thumbnails/**/*`
      ]
    }
  ];

  if (!currentPolicy) {
    console.log('📝 No existing policy found. Creating new policy...');
    currentPolicy = {
      Version: '2012-10-17',
      Statement: requiredStatements
    };
  } else {
    console.log('📝 Merging with existing policy...');
    const existingStatements = currentPolicy.Statement || [];
    const existingSids = new Set(existingStatements.map(s => s.Sid));
    
    // Add only missing statements
    const newStatements = requiredStatements.filter(s => !existingSids.has(s.Sid));
    
    if (newStatements.length > 0) {
      currentPolicy.Statement = [...existingStatements, ...newStatements];
      console.log(`   ✅ Adding ${newStatements.length} new statement(s)`);
    } else {
      console.log('   ✅ All required statements already exist');
      return;
    }
  }

  try {
    const command = new PutBucketPolicyCommand({
      Bucket: BUCKET_NAME,
      Policy: JSON.stringify(currentPolicy, null, 2)
    });
    
    await s3Client.send(command);
    
    console.log('\n✅ Bucket policy updated successfully!');
    console.log('\n📋 Updated Policy:');
    console.log(JSON.stringify(currentPolicy, null, 2));
    console.log('\n💡 Note: Make sure "Block public access" settings allow public read access.');
    console.log('   Go to S3 Console > Bucket > Permissions > Block public access');
  } catch (error) {
    console.error('\n❌ Error updating bucket policy:', error.message);
    if (error.name === 'AccessDenied') {
      console.error('   💡 Check IAM permissions. User needs s3:PutBucketPolicy permission.');
    }
    process.exit(1);
  }
}

updateBucketPolicy().catch(console.error);






