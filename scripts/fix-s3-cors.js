const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.local' });

const s3Client = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const corsConfiguration = {
  CORSRules: [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'HEAD'],
      AllowedOrigins: [
        'http://localhost:3000',
        'https://localhost:3000',
        'http://127.0.0.1:3000',
        'https://127.0.0.1:3000',
        // Add your production domain here when ready
        // 'https://yourdomain.com'
      ],
      ExposeHeaders: ['ETag', 'Content-Length', 'Content-Type'],
      MaxAgeSeconds: 3000
    }
  ]
};

async function fixS3Cors() {
  try {
    console.log('🔧 Setting S3 CORS configuration...');
    
    const command = new PutBucketCorsCommand({
      Bucket: 'only-you-coaching',
      CORSConfiguration: corsConfiguration
    });

    await s3Client.send(command);
    console.log('✅ S3 CORS configuration updated successfully!');
    console.log('📋 CORS Rules:');
    console.log(JSON.stringify(corsConfiguration, null, 2));
    
  } catch (error) {
    console.error('❌ Error setting S3 CORS:', error);
    if (error.name === 'NoSuchBucket') {
      console.error('Bucket "only-you-coaching" does not exist');
    } else if (error.name === 'AccessDenied') {
      console.error('Access denied. Check your AWS credentials and permissions');
    }
  }
}

fixS3Cors();
