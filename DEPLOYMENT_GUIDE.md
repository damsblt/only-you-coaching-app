# 🚀 Deployment Guide - Only You Coaching

This guide will help you set up the Only You Coaching app to work both locally and on Vercel.

## 📋 Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Supabase account
- AWS account (for S3)
- Vercel account

## 🔧 Environment Setup

### 1. Local Development Setup

The app is already configured with your Supabase credentials. To set up locally:

```bash
# Install dependencies
npm install

# The .env.local file already contains your Supabase credentials
# You just need to add your AWS credentials and service role key

# Start development server
npm run dev
```

### 2. Required Environment Variables

#### Supabase Configuration ✅ (Already Set)
- `NEXT_PUBLIC_SUPABASE_URL`: https://otqyrsmxdtcvhueriwzp.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: [Your anon key]
- `SUPABASE_SERVICE_ROLE_KEY`: [Get from Supabase dashboard]
- `DATABASE_URL`: [Your PostgreSQL connection string]

#### AWS S3 Configuration ⚠️ (Needs Setup)
- `AWS_REGION`: eu-north-1
- `AWS_ACCESS_KEY_ID`: [Your AWS access key]
- `AWS_SECRET_ACCESS_KEY`: [Your AWS secret key]
- `AWS_S3_BUCKET_NAME`: only-you-coaching

#### NextAuth Configuration ✅ (Already Set)
- `NEXTAUTH_URL`: http://localhost:3000 (local) / https://only-you-coaching.vercel.app (production)
- `NEXTAUTH_SECRET`: [Your secret key]

## 🔑 Getting Missing Credentials

### Supabase Service Role Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `otqyrsmxdtcvhueriwzp`
3. Navigate to **Settings > API**
4. Copy the **service_role** key (NOT the anon key)
5. Add it to your `.env.local` file

### AWS S3 Credentials

1. Go to [AWS Console](https://console.aws.amazon.com)
2. Navigate to **IAM > Users**
3. Create a new user or use existing one
4. Attach policy: `AmazonS3FullAccess` (or create custom policy)
5. Generate access keys
6. Add to your `.env.local` file

## 🚀 Vercel Deployment

### 1. Environment Variables in Vercel

Your Vercel project already has most environment variables set. You need to add:

```bash
# Add Supabase Service Role Key
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Add AWS Credentials
vercel env add AWS_ACCESS_KEY_ID production
vercel env add AWS_SECRET_ACCESS_KEY production
```

### 2. Deploy to Vercel

```bash
# Deploy to production
vercel --prod

# Or push to GitHub (auto-deploys)
git push origin main
```

## 🧪 Testing Your Setup

### Local Testing

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Visit:** http://localhost:3000

3. **Check the console for environment status:**
   - Look for "🔧 Environment Status" in the server logs
   - All services should show ✅

### Vercel Testing

1. **Visit your Vercel URL:**
   - https://only-you-coaching.vercel.app

2. **Check browser console for errors**

3. **Test key features:**
   - Video loading
   - Database connections
   - Authentication

## 🔍 Troubleshooting

### Common Issues

#### 1. Supabase Connection Issues
```
Error: Missing NEXT_PUBLIC_SUPABASE_URL environment variable
```
**Solution:** Check your `.env.local` file has the correct Supabase URL and keys.

#### 2. S3 Upload Failures
```
Error: AWS credentials not found
```
**Solution:** Add your AWS credentials to both `.env.local` and Vercel environment variables.

#### 3. Database Connection Issues
```
Error: Prisma has detected that this project was built on Vercel
```
**Solution:** This is already fixed in the build process with `prisma generate`.

#### 4. Environment Variable Not Updating
**Solution:** 
- Restart your development server
- Redeploy on Vercel: `vercel --prod`

### Debug Commands

```bash
# Check environment status
node scripts/setup-environment.js

# Get Supabase service role key info
node scripts/get-supabase-service-role-key.js

# Check Vercel environment variables
vercel env ls
```

## 📁 File Structure

```
pilates-coaching-app/
├── .env.local                 # Local environment variables
├── .env.example              # Environment template
├── scripts/
│   ├── setup-environment.js  # Environment setup helper
│   └── get-supabase-service-role-key.js
├── src/lib/
│   ├── env.ts               # Environment validation
│   ├── supabase.ts          # Supabase client configuration
│   ├── s3.ts                # S3 client configuration
│   └── prisma.ts            # Database client
└── DEPLOYMENT_GUIDE.md      # This guide
```

## 🎯 Key Features Working

### ✅ Already Working
- **Supabase Database**: Connected and working
- **NextAuth Authentication**: Configured
- **Environment Validation**: Automatic error detection
- **Local Development**: Full functionality
- **Vercel Deployment**: Automatic builds

### ⚠️ Needs AWS Setup
- **S3 Video Storage**: Requires AWS credentials
- **Video Upload**: Needs S3 configuration
- **Thumbnail Generation**: Depends on S3

## 🚀 Next Steps

1. **Add AWS Credentials:**
   - Get AWS access keys
   - Add to `.env.local` and Vercel
   - Test video upload functionality

2. **Get Supabase Service Role Key:**
   - Copy from Supabase dashboard
   - Add to both local and Vercel environments

3. **Test Everything:**
   - Local development
   - Vercel deployment
   - All features working

4. **Optional Enhancements:**
   - Custom domain setup
   - SSL certificates
   - Performance monitoring

## 📞 Support

If you encounter issues:

1. Check the console logs for specific error messages
2. Verify all environment variables are set correctly
3. Test locally first, then deploy to Vercel
4. Check the troubleshooting section above

---

**🎉 Your Only You Coaching app is ready to go!** 

The foundation is solid with Supabase and NextAuth working. Just add your AWS credentials and you'll have a fully functional pilates coaching platform! 🏋️‍♀️
