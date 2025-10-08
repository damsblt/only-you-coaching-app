#!/bin/bash

# Setup FFmpeg Lambda Layer
# This script downloads and packages ffmpeg for AWS Lambda

set -e

LAYER_NAME="ffmpeg-layer"
REGION="eu-north-1"
FUNCTION_NAME="only-you-coaching-thumbnail-generator"

echo "🎬 Setting up FFmpeg Lambda Layer"
echo "================================="

# Create temporary directory
TEMP_DIR=$(mktemp -d)
cd $TEMP_DIR

echo "📥 Downloading FFmpeg static build..."
# Download ffmpeg static build for Lambda
curl -L -o ffmpeg.zip https://github.com/vot/ffbinaries-prebuilt/releases/download/v4.4.1/ffmpeg-4.4.1-linux-64.zip
curl -L -o ffprobe.zip https://github.com/vot/ffbinaries-prebuilt/releases/download/v4.4.1/ffprobe-4.4.1-linux-64.zip

unzip -q ffmpeg.zip
unzip -q ffprobe.zip

echo "📦 Creating layer structure..."
# Create layer directory structure
mkdir -p layer/bin
cp ffmpeg layer/bin/
cp ffprobe layer/bin/
chmod +x layer/bin/ffmpeg
chmod +x layer/bin/ffprobe

echo "📋 Creating layer zip..."
cd layer
zip -r ../ffmpeg-layer.zip .
cd ..

echo "☁️  Publishing Lambda layer..."
LAYER_ARN=$(aws lambda publish-layer-version \
  --layer-name $LAYER_NAME \
  --description "FFmpeg and FFprobe binaries for video processing" \
  --zip-file fileb://ffmpeg-layer.zip \
  --compatible-runtimes nodejs20.x \
  --query 'LayerVersionArn' \
  --output text)

echo "Layer ARN: $LAYER_ARN"

echo "🔧 Updating Lambda function with layer..."
aws lambda update-function-configuration \
  --function-name $FUNCTION_NAME \
  --layers $LAYER_ARN

echo "✅ FFmpeg layer setup complete!"
echo ""
echo "🧪 Test the function:"
echo "aws lambda invoke --function-name $FUNCTION_NAME --cli-binary-format raw-in-base64-out --payload file://test-payload.json response.json"

# Cleanup
cd /
rm -rf $TEMP_DIR

echo "🎉 FFmpeg layer is now active on your Lambda function!"
