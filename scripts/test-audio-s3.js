const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching';

async function testAudioS3() {
  try {
    console.log('🎵 Testing S3 Audio connection...');
    console.log(`Bucket: ${BUCKET_NAME}`);
    console.log(`Region: ${process.env.AWS_REGION || 'eu-north-1'}`);
    
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'Audio/',
    });

    const response = await s3Client.send(command);
    
    if (!response.Contents) {
      console.log('❌ No audio files found in Audio/ folder');
      return;
    }

    console.log(`✅ Found ${response.Contents.length} objects in Audio/ folder:`);
    
    const audioFiles = response.Contents.filter(obj => {
      const key = obj.Key || '';
      const extension = key.split('.').pop()?.toLowerCase();
      return ['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(extension || '');
    });

    console.log(`🎵 Found ${audioFiles.length} audio files:`);
    audioFiles.forEach((obj, index) => {
      const key = obj.Key || '';
      const filename = key.split('/').pop() || '';
      console.log(`  ${index + 1}. ${filename}`);
    });

  } catch (error) {
    console.error('❌ Error testing S3 Audio connection:', error.message);
  }
}

testAudioS3();

