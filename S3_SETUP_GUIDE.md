# 🎥 S3 Access Point Setup Guide

## ✅ **Current Configuration**

Your S3 Access Point is now configured with:

- **Access Point Alias**: `s3-access-56ig858wntepzkh8ssrxmmjor4psgeun1a-s3alias`
- **Region**: `eu-north-1` (Stockholm)
- **Bucket**: `only-you-coaching`
- **Tag**: `S3_ACCESS_POINT: mL.2025.09.13`

## 🔧 **Required AWS Credentials**

To use S3, you need to configure these environment variables in `.env.local`:

```bash
# AWS S3 Configuration with Access Point
AWS_REGION="eu-north-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET_NAME="only-you-coaching"
AWS_S3_ACCESS_POINT_ALIAS="s3-access-56ig858wntepzkh8ssrxmmjor4psgeun1a-s3alias"
```

## 🔑 **How to Get AWS Credentials**

1. **Go to AWS IAM Console**
2. **Create a new user** (or use existing)
3. **Attach policies**:
   - `AmazonS3FullAccess` (for development)
   - Or create custom policy for your access point
4. **Create access keys**
5. **Copy the keys** to your `.env.local` file

## 📁 **File Structure in S3**

Your videos will be organized like this:

```
only-you-coaching/
├── videos/
│   └── {userId}/
│       ├── {timestamp}-video-name.mp4
│       └── {timestamp}-another-video.mp4
└── thumbnails/
    └── {userId}/
        ├── {video-name}-thumb.jpg
        └── {another-video}-thumb.jpg
```

## 🚀 **Testing Your Setup**

Run the test script to verify everything works:

```bash
node test-s3.js
```

## 🔒 **Security Features**

- **Access Point**: Secure access through VPC
- **Signed URLs**: Temporary access to private videos
- **User Isolation**: Each user's files are separated
- **Metadata**: Rich tagging and organization

## 📊 **Benefits of Your Setup**

1. **✅ Secure Access** - VPC-based access point
2. **✅ Cost Effective** - Pay only for what you use
3. **✅ Global CDN** - Fast video delivery worldwide
4. **✅ Scalable** - Handle thousands of users
5. **✅ Organized** - Clean file structure

## 🎯 **Next Steps**

1. **Configure AWS credentials** in `.env.local`
2. **Test the connection** with `node test-s3.js`
3. **Upload your first video** through the app
4. **Set up CloudFront CDN** for even faster delivery

## 🆘 **Troubleshooting**

**Common Issues:**

- **Access Denied**: Check AWS credentials and permissions
- **Region Mismatch**: Ensure region is `eu-north-1`
- **Access Point Error**: Verify access point alias is correct

**Need Help?**
- Check AWS CloudTrail for detailed error logs
- Verify IAM user has S3 permissions
- Ensure access point is active and accessible
