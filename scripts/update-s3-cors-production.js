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
        // Development domains
        'http://localhost:3000',
        'https://localhost:3000',
        'http://127.0.0.1:3000',
        'https://127.0.0.1:3000',
        // Production domains
        'https://only-you-coaching-damsblts-projects.vercel.app',
        'https://only-you-coaching.vercel.app',
        'https://helvetiforma.ch',
        // Wildcard for Vercel preview deployments
        'https://only-you-coaching-*.vercel.app'
      ],
      ExposeHeaders: ['ETag', 'Content-Length', 'Content-Type'],
      MaxAgeSeconds: 3000
    }
  ]
};

async function updateS3CorsForProduction() {
  try {
    console.log('🔧 Updating S3 CORS configuration for production...');
    console.log('📋 Production domains to add:');
    console.log('  - https://only-you-coaching-damsblts-projects.vercel.app');
    console.log('  - https://only-you-coaching.vercel.app');
    console.log('  - https://helvetiforma.ch');
    console.log('  - https://only-you-coaching-*.vercel.app (wildcard for previews)');
    
    const command = new PutBucketCorsCommand({
      Bucket: 'only-you-coaching',
      CORSConfiguration: corsConfiguration
    });

    await s3Client.send(command);
    console.log('✅ S3 CORS configuration updated successfully for production!');
    console.log('📋 Updated CORS Rules:');
    console.log(JSON.stringify(corsConfiguration, null, 2));
    
  } catch (error) {
    console.error('❌ Error updating S3 CORS:', error);
    if (error.name === 'NoSuchBucket') {
      console.error('Bucket "only-you-coaching" does not exist');
    } else if (error.name === 'AccessDenied') {
      console.error('Access denied. Check your AWS credentials and permissions');
    }
  }
}

updateS3CorsForProduction();
