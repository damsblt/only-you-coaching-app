# 🎥 Thumbnail Automation System

This system automatically generates thumbnails for all videos in your S3 bucket and updates the database with thumbnail URLs.

## 🚀 Quick Start

1. **Setup** (first time only):
   ```bash
   npm run setup-thumbnails
   ```

2. **Generate thumbnails**:
   ```bash
   npm run thumbnails
   ```

## 📁 Project Structure

```
pilates-coaching-app/
├── scripts/
│   ├── setup-thumbnail-automation.js      # Setup checker
│   ├── generate-thumbnails-simple.js      # Simple thumbnail generator (recommended)
│   └── generate-thumbnails-automation.js  # Advanced generator (requires ffmpeg)
└── THUMBNAIL_AUTOMATION.md               # This file
```

## 🛠️ Available Scripts

| Script | Description | Requirements |
|--------|-------------|--------------|
| `npm run setup-thumbnails` | Check system requirements and setup | None |
| `npm run thumbnails` | Generate simple placeholder thumbnails | AWS credentials |
| `npm run generate-thumbnails-simple` | Same as above (explicit) | AWS credentials |
| `npm run generate-thumbnails` | Generate real video thumbnails | AWS credentials + ffmpeg |

## 🔧 Setup Requirements

### Required Environment Variables

Create a `.env.local` file with:

```bash
AWS_REGION="eu-north-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET_NAME="only-you-coaching"
AWS_S3_ACCESS_POINT_ALIAS="s3-access-56ig858wntepzkh8ssrxmmjor4psgeun1a-s3alias"
```

### For Advanced Thumbnails (Optional)

If you want real video thumbnails instead of placeholders:

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

## 📊 How It Works

### Simple Thumbnails (Default)
- Creates beautiful SVG placeholder thumbnails
- No external dependencies required
- Fast processing
- Includes video name and category
- Works with your organized folder structure

### Advanced Thumbnails (Optional)
- Extracts actual frames from videos
- Requires ffmpeg installation
- Slower processing
- More accurate representation

## 🎯 Video Organization

The system works with your organized S3 structure:

```
Video/
├── groupes-musculaires/
│   ├── abdos/
│   ├── biceps/
│   ├── cardio/
│   ├── dos/
│   ├── fessiers-jambes/
│   ├── streching/
│   └── triceps/
└── programmes-predefinis/
    ├── abdos/
    ├── brule-graisse/
    ├── cuisses-abdos/
    ├── cuisses-abdos-fessiers/
    ├── dos-abdos/
    ├── femmes/
    ├── haute-intensite/
    ├── homme/
    ├── jambes/
    ├── machine/
    ├── pectoraux/
    └── rehabilitation-dos/
```

## 📈 Features

- **Batch Processing**: Processes videos in batches to avoid overwhelming the system
- **Progress Tracking**: Shows real-time progress and statistics
- **Error Handling**: Continues processing even if some videos fail
- **Database Updates**: Automatically updates your database with thumbnail URLs
- **S3 Integration**: Uploads thumbnails directly to your S3 bucket
- **Organized Structure**: Maintains your folder organization in thumbnails

## 🔍 Monitoring

The script provides detailed output:

```
🚀 Starting Simple Thumbnail Generation
=======================================

🔍 Scanning S3 for video files...
📹 Found 524 video files

📦 Processing batch 1/53
Videos 1-10 of 524
🎬 Creating thumbnail for: 1. Biceps assis sur le ballon + haltère
☁️  Uploaded thumbnail: thumbnails/1. Biceps assis sur le ballon + haltère-thumb.svg
💾 Updated database for video: 1. Biceps assis sur le ballon + haltère

📊 Summary
==========
✅ Successfully processed: 520 videos
❌ Errors: 4 videos
📈 Success rate: 99.2%
```

## 🎨 Thumbnail Design

Simple thumbnails include:
- Gradient background
- Play button icon
- Video name (truncated if too long)
- Category label (Muscle Groups / Predefined Programs)
- Professional styling

## 🚨 Troubleshooting

### Common Issues

1. **AWS Credentials Error**
   - Check your `.env.local` file
   - Verify AWS credentials are correct
   - Ensure IAM user has S3 permissions

2. **Database Connection Error**
   - Check Prisma configuration
   - Verify database is running
   - Check connection string

3. **S3 Access Denied**
   - Verify bucket name is correct
   - Check access point alias
   - Ensure region matches

### Getting Help

Run the setup script to diagnose issues:
```bash
npm run setup-thumbnails
```

## 🔄 Re-running

You can safely re-run the thumbnail generation:
- Existing thumbnails will be overwritten
- Database will be updated with new URLs
- No duplicate processing issues

## 📝 Notes

- Thumbnails are stored in S3 under `thumbnails/` folder
- Database updates use video name matching
- Process can be interrupted and resumed safely
- All operations are logged for debugging

## 🎯 Next Steps

After generating thumbnails:
1. Check S3 bucket for thumbnail files
2. Verify database has thumbnail URLs
3. Test video display in your app
4. Consider setting up CloudFront CDN for faster loading

