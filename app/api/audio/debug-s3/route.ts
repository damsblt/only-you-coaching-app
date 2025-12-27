import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'

// Check if AWS credentials are available
const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY

const s3Client = hasAwsCredentials ? new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
}) : null

export async function GET(request: NextRequest) {
  try {
    if (!hasAwsCredentials || !s3Client) {
      return NextResponse.json(
        { error: 'AWS credentials not configured' },
        { status: 500 }
      )
    }

    // List all objects in the Audio/ folder
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'Audio/',
    })

    const response = await s3Client.send(command)
    
    if (!response.Contents || response.Contents.length === 0) {
      return NextResponse.json({ 
        message: 'No files found in S3 Audio/ folder',
        files: [],
        folders: []
      })
    }

    // Group files by folder
    const folders = new Set<string>()
    const files: any[] = []

    response.Contents.forEach(obj => {
      const key = obj.Key || ''
      const parts = key.split('/')
      
      if (parts.length > 1) {
        // Extract folder name (Audio/[folder]/file.mp3)
        const folderPath = parts.slice(0, -1).join('/')
        folders.add(folderPath)
      }
      
      files.push({
        key: key,
        size: obj.Size,
        lastModified: obj.LastModified,
        isAudio: ['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(key.split('.').pop()?.toLowerCase() || '')
      })
    })

    // Filter audio files
    const audioFiles = files.filter(f => f.isAudio)

    return NextResponse.json({
      message: `Found ${response.Contents.length} files in Audio/ folder`,
      totalFiles: response.Contents.length,
      audioFiles: audioFiles.length,
      folders: Array.from(folders).sort(),
      sampleFiles: files.slice(0, 20), // First 20 files as sample
      allFiles: files.map(f => f.key)
    })

  } catch (error) {
    console.error('Error listing S3 files:', error)
    return NextResponse.json(
      { error: 'Failed to list S3 files', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}






