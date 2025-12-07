#!/bin/bash

# Update S3 triggers to listen to both Video/ and videos/ prefixes
# This ensures Lambda is triggered for both old and new video uploads

set -e

BUCKET_NAME="only-you-coaching"
REGION="eu-north-1"
FUNCTION_NAME="only-you-coaching-thumbnail-generator"

echo "🔧 Updating S3 triggers for Lambda function"
echo "============================================"

# Get current Lambda ARN
LAMBDA_ARN=$(aws lambda get-function \
  --function-name $FUNCTION_NAME \
  --region $REGION \
  --query 'Configuration.FunctionArn' \
  --output text)

echo "Lambda ARN: $LAMBDA_ARN"

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "Account ID: $ACCOUNT_ID"

echo "📋 Updating S3 bucket notification configuration..."
aws s3api put-bucket-notification-configuration \
  --bucket $BUCKET_NAME \
  --notification-configuration "{
    \"LambdaFunctionConfigurations\": [
      {
        \"Id\": \"thumbnail-generation-trigger-video-old\",
        \"LambdaFunctionArn\": \"arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_NAME}\",
        \"Events\": [\"s3:ObjectCreated:*\"],
        \"Filter\": {
          \"Key\": {
            \"FilterRules\": [
              {
                \"Name\": \"Prefix\",
                \"Value\": \"Video/\"
              },
              {
                \"Name\": \"Suffix\",
                \"Value\": \".mp4\"
              }
            ]
          }
        }
      },
      {
        \"Id\": \"thumbnail-generation-trigger-videos-new\",
        \"LambdaFunctionArn\": \"arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_NAME}\",
        \"Events\": [\"s3:ObjectCreated:*\"],
        \"Filter\": {
          \"Key\": {
            \"FilterRules\": [
              {
                \"Name\": \"Prefix\",
                \"Value\": \"videos/\"
              },
              {
                \"Name\": \"Suffix\",
                \"Value\": \".mp4\"
              }
            ]
          }
        }
      }
    ]
  }"

echo ""
echo "✅ S3 triggers updated successfully!"
echo ""
echo "📋 Lambda will now trigger on:"
echo "   - Video/*.mp4 (old videos)"
echo "   - videos/*.mp4 (new videos uploaded via admin form)"
echo ""
echo "🔍 Verify with:"
echo "aws s3api get-bucket-notification-configuration --bucket $BUCKET_NAME"


