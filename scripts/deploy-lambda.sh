#!/bin/bash

# Deploy Lambda function for S3 -> Thumbnail -> Supabase automation
# This script packages the Lambda function and creates the necessary AWS resources

set -e

# Configuration
FUNCTION_NAME="only-you-coaching-thumbnail-generator"
BUCKET_NAME="only-you-coaching"
REGION="eu-north-1"
ROLE_NAME="only-you-coaching-lambda-role"
POLICY_NAME="only-you-coaching-lambda-policy"

# Supabase credentials (replace with your actual values)
SUPABASE_URL="https://otqyrsmxdtcvhueriwzp.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90cXlyc214ZHRjdmh1ZXJpd3pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAyMzQ3MCwiZXhwIjoyMDczNTk5NDcwfQ.tvlTfPDszMRjsr7mFMekZ2_sD0-qNDz3NYkbbyT7Okw"

echo "🚀 Deploying Lambda function for S3 -> Thumbnail -> Supabase automation"
echo "=================================================================="

# 1. Create deployment package
echo "📦 Creating deployment package..."
cd lambda
npm init -y
npm install @aws-sdk/client-s3 @supabase/supabase-js --legacy-peer-deps
zip -r ../lambda-deployment.zip .
cd ..

# 2. Create IAM role for Lambda
echo "🔐 Creating IAM role..."
ROLE_ARN=$(aws iam create-role \
  --role-name $ROLE_NAME \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "lambda.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }' \
  --query 'Role.Arn' \
  --output text 2>/dev/null || aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)

echo "Role ARN: $ROLE_ARN"

# 3. Create and attach policy for S3 access
echo "📋 Creating IAM policy..."
aws iam put-role-policy \
  --role-name $ROLE_NAME \
  --policy-name $POLICY_NAME \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource": "arn:aws:logs:*:*:*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject",
          "s3:PutObject"
        ],
        "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
      }
    ]
  }'

# 4. Wait for role to be ready
echo "⏳ Waiting for IAM role to be ready..."
sleep 10

# 5. Create Lambda function
echo "🔧 Creating Lambda function..."
aws lambda create-function \
  --function-name $FUNCTION_NAME \
  --runtime nodejs20.x \
  --role $ROLE_ARN \
  --handler index.handler \
  --zip-file fileb://lambda-deployment.zip \
  --timeout 300 \
  --memory-size 1024 \
  --environment Variables="{
    S3_BUCKET_NAME=$BUCKET_NAME,
    SUPABASE_URL=$SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
  }" \
  --query 'FunctionArn' \
  --output text

# 6. Add S3 trigger
echo "🔗 Adding S3 trigger..."
aws s3api put-bucket-notification-configuration \
  --bucket $BUCKET_NAME \
  --notification-configuration '{
    "LambdaFunctionConfigurations": [
      {
        "Id": "thumbnail-generation-trigger",
        "LambdaFunctionArn": "arn:aws:lambda:'$REGION':'$(aws sts get-caller-identity --query Account --output text)':function:'$FUNCTION_NAME'",
        "Events": ["s3:ObjectCreated:Put"],
        "Filter": {
          "Key": {
            "FilterRules": [
              {
                "Name": "prefix",
                "Value": "Video/"
              },
              {
                "Name": "suffix",
                "Value": ".mp4"
              }
            ]
          }
        }
      }
    ]
  }'

# 7. Grant S3 permission to invoke Lambda
echo "🔑 Granting S3 permission to invoke Lambda..."
aws lambda add-permission \
  --function-name $FUNCTION_NAME \
  --principal s3.amazonaws.com \
  --action lambda:InvokeFunction \
  --source-arn "arn:aws:s3:::$BUCKET_NAME" \
  --statement-id "s3-trigger-permission"

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Summary:"
echo "- Lambda function: $FUNCTION_NAME"
echo "- S3 bucket: $BUCKET_NAME"
echo "- Trigger: Video/*.mp4 files"
echo "- Region: $REGION"
echo ""
echo "🧪 Test by uploading a video to S3:"
echo "aws s3 cp your-video.mp4 s3://$BUCKET_NAME/Video/groupes-musculaires/abdos/test.mp4"
echo ""
echo "📊 Monitor logs:"
echo "aws logs tail /aws/lambda/$FUNCTION_NAME --follow"
echo ""
echo "🗑️  To delete everything:"
echo "aws lambda delete-function --function-name $FUNCTION_NAME"
echo "aws iam delete-role-policy --role-name $ROLE_NAME --policy-name $POLICY_NAME"
echo "aws iam delete-role --role-name $ROLE_NAME"
echo "aws s3api put-bucket-notification-configuration --bucket $BUCKET_NAME --notification-configuration '{}'"
