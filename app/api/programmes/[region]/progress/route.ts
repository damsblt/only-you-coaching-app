import { NextRequest, NextResponse } from 'next/server'
import { db, query } from '@/lib/db'
import { sortVideosByProgramOrder } from '@/lib/program-orders'

// GET /api/programmes/[region]/progress - Get progress for all videos in a program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ region: string }> }
) {
  console.log('🚀 [PROGRESS API] GET /api/programmes/[region]/progress called')
  try {
    const { region } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    console.log('🚀 [PROGRESS API] Params:', { region, userId })

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      )
    }

    if (!region) {
      return NextResponse.json(
        { error: 'Region is required' },
        { status: 400 }
      )
    }

    // Get all videos for this region/program
    const videosResult = await db
      .from('videos_new')
      .select('id')
      .eq('region', region)
      .eq('videoType', 'PROGRAMMES')
      .eq('isPublished', true)
      .execute()

    if (videosResult.error) {
      return NextResponse.json(
        { error: 'Failed to fetch videos', details: videosResult.error },
        { status: 500 }
      )
    }

    // Sort videos using the same order as the frontend
    const videos = (videosResult.data || []) as Array<{ id: string }>
    const sortedVideos = sortVideosByProgramOrder(videos, region)
    const videoIds = sortedVideos.map((v: any) => v.id)

    if (videoIds.length === 0) {
      return NextResponse.json({
        progress: {},
        completedVideos: [],
        nextAvailableVideoIndex: 0
      })
    }

    // Get progress for all videos
    console.log('🔍 [PROGRESS API] Fetching progress for videos:', {
      userId,
      videoIds,
      videoIdsCount: videoIds.length,
      firstVideoId: videoIds[0],
      allVideoIds: JSON.stringify(videoIds, null, 2)
    })
    
    // Debug: Check what's actually in the database for this user
    try {
      const debugQuery = `SELECT * FROM "user_video_progress" WHERE "user_id" = $1::uuid`
      const debugResult = await query(debugQuery, [userId])
      const rows = Array.isArray(debugResult) ? debugResult : []
      console.log('🔍 [PROGRESS API] All progress records for user:', {
        count: rows.length,
        records: JSON.stringify(rows, null, 2),
        videoIdsInDb: rows.map((r: any) => r.video_id),
        videoIdsLookingFor: videoIds
      })
      
      // Check if any of the video IDs we're looking for exist in the DB
      const dbVideoIds = rows.map((r: any) => String(r.video_id))
      const lookingForIds = videoIds.map(id => String(id))
      const matches = lookingForIds.filter(id => dbVideoIds.includes(id))
      console.log('🔍 [PROGRESS API] ID matching:', {
        dbVideoIds,
        lookingForIds,
        matches,
        matchCount: matches.length
      })
    } catch (debugError) {
      console.error('⚠️ [PROGRESS API] Debug query failed:', debugError)
    }
    
    // Try direct SQL query if .in() doesn't work properly
    let progressResult: { data: any[] | null; error: any }
    
    if (videoIds.length === 0) {
      progressResult = { data: [], error: null }
    } else {
      // Use direct SQL query to ensure it works
      // Handle both UUID and TEXT types for video_id
      try {
        // Convert all videoIds to strings to ensure consistency
        const videoIdsAsStrings = videoIds.map(id => String(id))
        
        // Use QueryBuilder first (more reliable with neon client)
        console.log('🔍 [PROGRESS API] Using QueryBuilder with .in() method')
        console.log('🔍 [PROGRESS API] Query params:', {
          userId,
          videoIdsCount: videoIdsAsStrings.length,
          firstVideoId: videoIdsAsStrings[0],
          allVideoIds: videoIdsAsStrings
        })
        
        const queryResult = await db
          .from('user_video_progress')
          .select('*')
          .eq('user_id', userId)
          .in('video_id', videoIdsAsStrings)
          .execute()
        
        console.log('✅ [PROGRESS API] QueryBuilder result:', {
          hasError: !!queryResult.error,
          error: queryResult.error?.message || null,
          dataCount: queryResult.data?.length || 0,
          data: queryResult.data ? JSON.stringify(queryResult.data, null, 2) : null
        })
        
        if (queryResult.error) {
          throw queryResult.error
        }
        
        progressResult = { data: queryResult.data || [], error: null }
      } catch (sqlError: any) {
        console.error('❌ [PROGRESS API] Direct SQL query failed:', {
          message: sqlError?.message,
          code: sqlError?.code,
          detail: sqlError?.detail,
          error: sqlError
        })
        // Fallback to QueryBuilder
        console.log('🔄 [PROGRESS API] Falling back to QueryBuilder...')
        progressResult = await db
          .from('user_video_progress')
          .select('*')
          .eq('user_id', userId)
          .in('video_id', videoIds)
          .execute()
      }
    }

    console.log('📊 Progress query result:', {
      hasError: !!progressResult.error,
      error: progressResult.error?.message || null,
      dataCount: progressResult.data?.length || 0,
      data: progressResult.data ? JSON.stringify(progressResult.data, null, 2) : null
    })

    const progressMap: Record<string, { completed: boolean; progressSeconds: number }> = {}
    const completedVideos: string[] = []

    if (progressResult.data) {
      for (const progress of progressResult.data) {
        console.log('📝 Processing progress record:', {
          video_id: progress.video_id,
          completed: progress.completed,
          progress_seconds: progress.progress_seconds
        })
        progressMap[progress.video_id] = {
          completed: progress.completed || false,
          progressSeconds: progress.progress_seconds || 0
        }
        if (progress.completed) {
          completedVideos.push(progress.video_id)
        }
      }
    } else {
      console.log('⚠️ No progress data found in result')
    }

    // Find the first video that is not completed
    let nextAvailableVideoIndex = 0
    for (let i = 0; i < videoIds.length; i++) {
      const videoId = videoIds[i]
      if (!progressMap[videoId] || !progressMap[videoId].completed) {
        nextAvailableVideoIndex = i
        break
      }
      // If all videos are completed, set to last index
      if (i === videoIds.length - 1) {
        nextAvailableVideoIndex = videoIds.length
      }
    }

    console.log('📊 Returning progress data:', {
      totalVideos: videoIds.length,
      completedCount: completedVideos.length,
      nextAvailableIndex: nextAvailableVideoIndex,
      progressMapKeys: Object.keys(progressMap),
      progressMap: JSON.stringify(progressMap, null, 2),
      completedVideos: completedVideos,
      firstVideoId: videoIds[0],
      progressForFirstVideo: progressMap[videoIds[0]]
    })

    return NextResponse.json({
      progress: progressMap,
      completedVideos,
      nextAvailableVideoIndex,
      totalVideos: videoIds.length,
      completedCount: completedVideos.length
    })
  } catch (error: any) {
    console.error('Error fetching program progress:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

