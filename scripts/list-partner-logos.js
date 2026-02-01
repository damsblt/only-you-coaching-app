/**
 * List files in the Photos/logos partenaires/ folder to verify structure
 */

require('dotenv').config({ path: '.env.local' });

const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const awsRegion = process.env.AWS_REGION || 'eu-north-1';
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching';

if (!awsAccessKeyId || !awsSecretAccessKey) {
  console.error('❌ AWS credentials not found in environment variables');
  process.exit(1);
}

const s3Client = new S3Client({
  region: awsRegion,
  credentials: {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
  },
});

async function listPartnerLogos() {
  try {
    console.log('📁 Listing files in Photos/logos partenaires/ folder...\n');
    
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'Photos/logos partenaires/',
      MaxKeys: 100,
    });
    
    const response = await s3Client.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log('❌ No files found in Photos/logos partenaires/ folder');
      console.log('   Make sure files are uploaded to: s3://' + BUCKET_NAME + '/Photos/logos partenaires/');
      return;
    }
    
    console.log(`✅ Found ${response.Contents.length} files:\n`);
    
    response.Contents
      .sort((a, b) => (a.Key || '').localeCompare(b.Key || ''))
      .forEach((obj, index) => {
        const fileName = (obj.Key || '').replace('Photos/logos partenaires/', '');
        const sizeKB = ((obj.Size || 0) / 1024).toFixed(1);
        const url = `https://${BUCKET_NAME}.s3.${awsRegion}.amazonaws.com/${encodeURIComponent(obj.Key || '')}`;
        console.log(`${(index + 1).toString().padStart(3)}. ${fileName.padEnd(40)} (${sizeKB} KB)`);
        console.log(`     Key: ${obj.Key}`);
        console.log(`     URL: ${url}\n`);
      });
    
    // Check specifically for Nusand
    const nusandFiles = response.Contents.filter(obj => 
      (obj.Key || '').toLowerCase().includes('nusand')
    );
    
    if (nusandFiles.length > 0) {
      console.log('\n🎯 Nusand files found:');
      nusandFiles.forEach(obj => {
        console.log(`   - ${obj.Key}`);
      });
    } else {
      console.log('\n⚠️  No files containing "nusand" found');
      console.log('   Please check the exact filename on S3');
    }
    
  } catch (error) {
    console.error('❌ Error listing partner logos:', error);
    process.exit(1);
  }
}

listPartnerLogos();
