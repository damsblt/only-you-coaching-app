/**
 * List files in the recettes folder to verify structure
 */

require('dotenv').config({ path: '.env.local' });

const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const awsRegion = process.env.AWS_REGION || 'eu-north-1';
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching';

const s3Client = new S3Client({
  region: awsRegion,
  credentials: {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
  },
});

async function listRecettesFiles() {
  try {
    console.log('📁 Listing files in recettes folder...\n');
    
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'recettes/',
      MaxKeys: 100,
    });
    
    const response = await s3Client.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log('❌ No files found in recettes/ folder');
      console.log('   Make sure files are uploaded to: s3://' + BUCKET_NAME + '/recettes/');
      return;
    }
    
    console.log(`✅ Found ${response.Contents.length} files:\n`);
    
    response.Contents
      .sort((a, b) => a.Key.localeCompare(b.Key))
      .forEach((obj, index) => {
        const fileName = obj.Key.replace('recettes/', '');
        const sizeKB = (obj.Size / 1024).toFixed(1);
        const url = `https://${BUCKET_NAME}.s3.${awsRegion}.amazonaws.com/${obj.Key}`;
        console.log(`${(index + 1).toString().padStart(3)}. ${fileName.padEnd(30)} (${sizeKB} KB)`);
        console.log(`     ${url}`);
      });
    
    console.log('\n💡 If images still return 403 after bucket policy:');
    console.log('   1. Go to AWS S3 Console → Bucket → Permissions');
    console.log('   2. Check "Block public access" settings');
    console.log('   3. If enabled, you need to:');
    console.log('      - Edit → Uncheck all blocks (or uncheck only for recettes folder if using ACLs)');
    console.log('      - Confirm');
    console.log('   4. Alternatively, select all files in recettes/ folder');
    console.log('      Actions → Make public using ACL');
    
  } catch (error) {
    console.error('❌ Error listing files:', error.message);
  }
}

listRecettesFiles();

