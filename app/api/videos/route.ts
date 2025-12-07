import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSignedVideoUrl } from '@/lib/s3'
import { sortVideosByProgramOrder } from '@/lib/program-orders'

// Cache configuration - revalidate every 60 seconds
export const revalidate = 60
export const dynamic = 'force-dynamic' // Override if needed

// Columns needed for video display - optimize query by selecting only needed fields
const VIDEO_COLUMNS = 'id,title,description,thumbnail,videoUrl,duration,difficulty,category,region,muscleGroups,startingPosition,movement,intensity,theme,series,constraints,targeted_muscles,exo_title,videoType,isPublished,createdAt,updatedAt'

export async function GET(request: NextRequest) {
  // Top-level error handler to catch any unhandled errors
  try {
    console.log('📥 Videos API called:', request.url)
    console.log('📥 DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.log('📥 db client exists:', !!db)
    
    // Verify database connection exists
    if (!db) {
      console.error('❌ Database client is null or undefined')
      return NextResponse.json({ 
        error: 'Database connection error',
        message: 'Database client is not initialized'
      }, { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is not set')
      return NextResponse.json({ 
        error: 'Database configuration error',
        message: 'DATABASE_URL environment variable is missing'
      }, { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Use nextUrl.searchParams to avoid dynamic server usage warning
    const searchParams = request.nextUrl.searchParams
    const muscleGroup = searchParams.get('muscleGroup')
    const programme = searchParams.get('programme')
    const region = searchParams.get('region')
    const difficulty = searchParams.get('difficulty')
    const search = searchParams.get('search')
    const videoType = searchParams.get('videoType')
    const limit = parseInt(searchParams.get('limit') || '100') // Default limit instead of 1000
    const offset = parseInt(searchParams.get('offset') || '0')
    
    console.log('📋 Parsed params:', { muscleGroup, programme, region, difficulty, search, videoType, limit, offset })

    // Use Neon database
    try {
      console.log('🔍 Fetching videos with params:', { videoType, region, difficulty, search, offset, limit })
      
      // Verify database connection is available
      if (!db) {
        console.error('❌ Database client is not initialized')
        return NextResponse.json({ 
          error: 'Database connection error',
          message: 'Database client is not initialized',
          details: 'Please check DATABASE_URL environment variable'
        }, { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      // Build query using Neon client
      let query = db.from('videos_new').select(VIDEO_COLUMNS).order('title', { ascending: true })

      // Apply filters
      query = query.eq('isPublished', true)

      // Handle videoType filter
      if (videoType === 'muscle-groups') {
        query = query.eq('videoType', 'MUSCLE_GROUPS')
      } else if (videoType === 'programmes') {
        query = query.eq('videoType', 'PROGRAMMES')
      }

      // Handle region filter (priority: region > programme > muscleGroup)
      let finalRegion: string | null = null
      if (region && region !== 'all') {
        finalRegion = region
      } else if (programme && programme !== 'all') {
        finalRegion = programme
      } else if (muscleGroup && muscleGroup !== 'all') {
        const muscleGroupMap: { [key: string]: string } = {
          'Abdos': 'abdos',
          'Bande': 'bande',
          'Biceps': 'biceps',
          'Cardio': 'cardio',
          'Dos': 'dos',
          'Fessiers et jambes': 'fessiers-jambes',
          'Streching': 'streching',
          'Triceps': 'triceps'
        }
        if (muscleGroupMap[muscleGroup]) {
          finalRegion = muscleGroupMap[muscleGroup]
        }
      }

      if (finalRegion) {
        query = query.eq('region', finalRegion)
      }

      if (difficulty && difficulty !== 'all') {
        query = query.eq('difficulty', difficulty)
      }

      if (search) {
        // Use simple ILIKE search for now
        query = query.ilike('title', `%${search}%`)
      }

    // For programs with specific ordering, we need to fetch all videos first,
    // then sort them, then apply pagination
    // Check if this region has a custom order defined in program-orders.ts
    const needsCustomOrdering = videoType === 'programmes' && region && 
      ['machine', 'abdos', 'brule-graisse', 'cuisses-abdos', 'dos-abdos', 
       'femmes', 'haute-intensite', 'jambes', 'rehabilitation-dos'].includes(region)
    
    console.log('📊 Executing query with filters:', { 
      videoType: where.videoType, 
      region: where.region, 
      difficulty, 
      search,
      offset, 
      limit,
      needsCustomOrdering
    })
    
    // If we need custom ordering, fetch all matching videos first (with a reasonable max limit)
    // Otherwise, apply pagination at the database level
    let queryToExecute = needsCustomOrdering 
      ? query.limit(500)  // Fetch up to 500 videos for custom ordering (should be more than enough)
      : query.range(offset, offset + limit - 1)
    
    console.log('🔍 About to execute query...')
    
    let data: any[] | null = null
    let error: any = null
    
    try {
      const result = await queryToExecute.execute()
      data = result.data
      error = result.error
      console.log('✅ Query executed, result:', { 
        dataCount: data?.length || 0, 
        hasError: !!error,
        errorMessage: error?.message || null,
        errorCode: (error as any)?.code || null
      })
    } catch (executeError: any) {
      console.error('❌ Query execution threw an error:', {
        message: executeError?.message,
        code: executeError?.code,
        stack: executeError?.stack?.substring(0, 500),
        fullError: executeError
      })
      error = executeError
    }
    
    if (error) {
      // Better error logging
      const errorDetails = {
        message: error.message || (error as any).detail || (error as any)?.message || 'Unknown database error',
        code: (error as any).code || (error as any)?.code || 'NO_CODE',
        details: (error as any).detail || (error as any)?.hint || null,
        hint: (error as any).hint || null,
        originalError: String(error)
      }
      console.error('❌ Database query error:', errorDetails)
      console.error('Query parameters:', { videoType, region, difficulty, search, offset, limit })
      console.error('Full error object:', error)
      
      return NextResponse.json({ 
        error: 'Failed to fetch videos',
        message: errorDetails.message,
        details: errorDetails.details || errorDetails.message,
        code: errorDetails.code
      }, { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    // Apply custom ordering if needed (for machine program)
    let sortedData = data || []
    if (needsCustomOrdering && region) {
      sortedData = sortVideosByProgramOrder(sortedData, region)
      // Apply pagination after sorting
      sortedData = sortedData.slice(offset, offset + limit)
      console.log(`📋 Applied custom ordering for ${region} program: ${sortedData.length} videos after pagination`)
    }

    // Process thumbnails - use public URLs for thumbnails folder, signed URLs for others
    // Process in batches of 10 to avoid overwhelming the system
    const BATCH_SIZE = 10
    const videosWithSignedThumbnails = []
    
    for (let i = 0; i < sortedData.length; i += BATCH_SIZE) {
      const batch = sortedData.slice(i, i + BATCH_SIZE)
      const processedBatch = await Promise.all(
        batch.map(async (video) => {
          if (!video.thumbnail) {
            return video
          }

          // Check if thumbnail is an S3 URL
          try {
            const thumbnailUrl = new URL(video.thumbnail)
            // Check if it's an S3 URL
            if (thumbnailUrl.hostname.includes('s3') || thumbnailUrl.hostname.includes('amazonaws.com')) {
              // If URL already has query parameters (signed URL), clean it up
              if (thumbnailUrl.search) {
                // Extract the S3 key from the pathname (ignore query params)
                const encodedPath = thumbnailUrl.pathname
                const decodedPath = decodeURIComponent(encodedPath)
                const s3Key = decodedPath.substring(1) // Remove leading slash
                
                // If it's in the thumbnails folder, use public URL
                if (s3Key.startsWith('thumbnails/')) {
                  const publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${s3Key}`
                  return { ...video, thumbnail: publicUrl }
                }
                
                // For non-thumbnail files, generate a new signed URL
                const signedUrlResult = await getSignedVideoUrl(s3Key, 86400)
                if (signedUrlResult.success) {
                  // Ensure the URL is properly formatted (no newlines)
                  const cleanUrl = signedUrlResult.url.trim().replace(/\n/g, '').replace(/\r/g, '')
                  return { ...video, thumbnail: cleanUrl }
                }
              } else {
                // No query params - it's already a public URL
                // If it's in thumbnails folder, keep it as is
                const encodedPath = thumbnailUrl.pathname
                const decodedPath = decodeURIComponent(encodedPath)
                const s3Key = decodedPath.substring(1)
                
                if (s3Key.startsWith('thumbnails/')) {
                  // Already a public URL, keep it
                  return video
                }
                
                // For non-thumbnail files, generate signed URL
                const signedUrlResult = await getSignedVideoUrl(s3Key, 86400)
                if (signedUrlResult.success) {
                  const cleanUrl = signedUrlResult.url.trim().replace(/\n/g, '').replace(/\r/g, '')
                  return { ...video, thumbnail: cleanUrl }
                }
              }
            }
          } catch (urlError) {
            // Not a valid URL or error processing, keep original thumbnail
            console.error('Error processing thumbnail URL for video', video.id, ':', urlError)
          }

          return video
        })
      )
      videosWithSignedThumbnails.push(...processedBatch)
    }

    // Add cache headers for better performance
    return NextResponse.json(videosWithSignedThumbnails, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'CDN-Cache-Control': 'public, s-maxage=60',
        'Vary': 'Accept-Encoding',
      },
    })
  } catch (error: any) {
    // Better error logging
    const errorDetails = {
      message: error?.message || String(error) || 'Unknown error',
      code: error?.code || 'NO_CODE',
      name: error?.name || null,
      stack: error?.stack || null,
      originalError: String(error)
    }
    console.error('❌ Unexpected error in videos API (inner catch):', errorDetails)
    console.error('Request parameters:', { videoType, region, difficulty, search, offset, limit })
    console.error('Full error:', error)
    
    // Always return a proper JSON response
    return NextResponse.json({ 
      error: 'Failed to fetch videos',
      message: errorDetails.message,
      details: errorDetails.message,
      code: errorDetails.code,
      stack: process.env.NODE_ENV === 'development' ? errorDetails.stack : undefined
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
  } catch (outerError: any) {
    // Catch any errors that escape the inner try-catch (e.g., during initialization)
    console.error('❌ CRITICAL: Error in videos API (outer catch):', {
      message: outerError?.message || String(outerError),
      code: outerError?.code,
      name: outerError?.name,
      stack: outerError?.stack,
      fullError: outerError
    })
    
    // Always return a proper JSON response, never let Next.js return HTML error page
    return NextResponse.json({ 
      error: 'Internal server error',
      message: outerError?.message || String(outerError) || 'An unexpected error occurred',
      details: 'The API route encountered an error before it could process the request',
      code: outerError?.code || 'UNKNOWN_ERROR'
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
