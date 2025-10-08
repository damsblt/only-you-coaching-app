import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching videos from database...')
    
    // Simply fetch all published videos
    const videos = await prisma.video.findMany({
      where: {
        isPublished: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to 50 videos for testing
    })

    console.log(`✅ Found ${videos.length} videos`)
    
    return NextResponse.json(videos)
  } catch (error) {
    console.error('❌ Error fetching videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

