import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSignedVideoUrl, getPublicUrl } from '@/lib/s3'
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
    // No limit - fetch all videos
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
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
      // Note: We'll sort after fetching to handle exo_title (numeric) vs title (alphabetic)
      let query = db.from('videos_new').select(VIDEO_COLUMNS)

      // Apply filters
      query = query.eq('isPublished', true)

      // Handle videoType filter
      // If videoType is not provided, fetch all video types (for bibliotheque-videos)
      if (videoType === 'muscle-groups') {
        query = query.eq('videoType', 'MUSCLE_GROUPS')
      } else if (videoType === 'programmes') {
        query = query.eq('videoType', 'PROGRAMMES')
      }
      // If videoType is undefined/null, don't filter (show all types)

      // Handle region filter (priority: region > programme > muscleGroup)
      let finalRegion: string | null = null
      if (region && region !== 'all') {
        finalRegion = region
      } else if (programme && programme !== 'all') {
        finalRegion = programme
      } else if (muscleGroup && muscleGroup !== 'all') {
        // Map UI muscle group names to database region values
        const muscleGroupMap: { [key: string]: string} = {
          'Abdos': 'abdos',
          'Bande': 'bande',
          'Biceps': 'biceps',
          'Cardio': 'cardio',
          'Dos': 'dos',
          'Épaules': 'epaules',
          'Fessiers et jambes': 'fessiers-jambes',
          'Machine': 'machine',
          'Pectoraux': 'pectoraux',
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
      ['machine', 'abdos', 'brule-graisse', 'cuisses-abdos', 'cuisses-abdos-fessiers', 'dos-abdos', 
       'femmes', 'haute-intensite', 'homme', 'jambes', 'rehabilitation-dos'].includes(region)
    
    console.log('📊 Executing query with filters:', { 
      videoType, 
      region: finalRegion, 
      difficulty, 
      search,
      offset, 
      limit,
      needsCustomOrdering
    })
    
    // If we need custom ordering, fetch all matching videos first
    // Otherwise, apply pagination at the database level only if limit is specified
    // Note: We set a very high limit (50000) to ensure we fetch all videos, bypassing any default limits
    let queryToExecute = needsCustomOrdering 
      ? query.limit(50000)  // Fetch all videos for custom ordering (very high limit to bypass any default)
      : limit 
        ? query.range(offset, offset + limit - 1)  // Apply limit only if specified
        : query.limit(50000)  // No limit specified - fetch all videos (very high limit to bypass any default)
    
    console.log('🔍 About to execute query...', { 
      hasLimit: !!limit, 
      limitValue: limit, 
      needsCustomOrdering,
      willUseLimit: !limit && !needsCustomOrdering ? 50000 : 'custom'
    })
    
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
      // Apply pagination after sorting only if limit is specified
      if (limit) {
        sortedData = sortedData.slice(offset, offset + limit)
      } else {
        sortedData = sortedData.slice(offset) // Only apply offset, no limit
      }
      console.log(`📋 Applied custom ordering for ${region} program: ${sortedData.length} videos after pagination`)
    } else {
      // Sort by exo_title if available (numeric), otherwise by title (alphabetic)
      sortedData.sort((a, b) => {
        // If both have exo_title, sort numerically
        if (a.exo_title && b.exo_title) {
          const numA = parseFloat(a.exo_title)
          const numB = parseFloat(b.exo_title)
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB
          }
        }
        // If only one has exo_title, prioritize it
        if (a.exo_title && !b.exo_title) return -1
        if (!a.exo_title && b.exo_title) return 1
        // Otherwise sort alphabetically by title
        return (a.title || '').localeCompare(b.title || '')
      })
    }

    // Process thumbnails - use public URLs for thumbnails folder, signed URLs for others
    // Process in batches of 10 to avoid overwhelming the system
    const BATCH_SIZE = 10
    const videosWithSignedThumbnails = []
    
    for (let i = 0; i < sortedData.length; i += BATCH_SIZE) {
      const batch = sortedData.slice(i, i + BATCH_SIZE)
      const processedBatch = await Promise.all(
        batch.map(async (video) => {
          let processedVideo = { ...video }

          // Process thumbnail URL
          if (video.thumbnail) {
            try {
              const thumbnailUrl = new URL(video.thumbnail)
              
              // Check if it's a Neon Storage URL (keep as is - they're already accessible)
              if (thumbnailUrl.hostname.includes('neon.tech') || thumbnailUrl.hostname.includes('storage.neon')) {
                // Neon Storage URLs are already public and accessible, keep them as is
                // No processing needed
              } else if (thumbnailUrl.hostname.includes('s3') || thumbnailUrl.hostname.includes('amazonaws.com')) {
                // Check if it's an S3 URL
                let s3Key: string
                
                // Extract S3 key from URL pathname
                try {
                  // Decode pathname to handle URL encoding
                  let decodedPath = decodeURIComponent(thumbnailUrl.pathname)
                  s3Key = decodedPath.substring(1) // Remove leading slash
                } catch (decodeError) {
                  // If decode fails, try without decoding (might already be decoded)
                  s3Key = thumbnailUrl.pathname.substring(1)
                }
                
                // If URL has query parameters (signed URL), we still use the pathname
                // The query params are just for authentication, the key is in pathname
                
                // If it's in the thumbnails folder, use public URL with proper encoding
                if (s3Key.startsWith('thumbnails/')) {
                  // Use getPublicUrl which handles encoding properly
                  const publicUrl = getPublicUrl(s3Key)
                  processedVideo.thumbnail = publicUrl
                } else {
                  // For non-thumbnail files, generate a signed URL
                  const signedUrlResult = await getSignedVideoUrl(s3Key, 86400)
                  if (signedUrlResult.success) {
                    const cleanUrl = signedUrlResult.url.trim().replace(/\n/g, '').replace(/\r/g, '')
                    processedVideo.thumbnail = cleanUrl
                  } else {
                    console.warn('Failed to generate signed URL for thumbnail:', video.id, s3Key, signedUrlResult.error)
                    // Keep original URL as fallback
                  }
                }
              }
            } catch (urlError) {
              // Not a valid URL or error processing, keep original thumbnail
              console.warn('Thumbnail URL format not recognized for video', video.id, ':', video.thumbnail, 'Error:', urlError)
            }
          } else {
            // No thumbnail - log for debugging
            console.debug('Video has no thumbnail:', video.id, video.title)
          }

          // Process videoUrl - keep Neon Storage URLs as is, they're already accessible
          // For S3 URLs, we need to ensure they're properly formatted
          if (video.videoUrl) {
            try {
              const videoUrlObj = new URL(video.videoUrl)
              // Neon Storage URLs are already public and accessible, keep them as is
              if (videoUrlObj.hostname.includes('neon.tech') || videoUrlObj.hostname.includes('storage.neon')) {
                // No processing needed for Neon Storage URLs
              } else if (videoUrlObj.hostname.includes('s3') || videoUrlObj.hostname.includes('amazonaws.com')) {
                // S3 URLs: The videoUrl is kept as-is, but the actual streaming is handled by /api/videos/[id]/stream
                // The stream endpoint will extract the S3 key and generate a signed URL
                // For now, we can optionally replace the videoUrl with the stream endpoint URL
                // But this might break direct URL usage, so we keep the original URL
                // The frontend should use /api/videos/${id}/stream for playback
              }
            } catch (urlError) {
              // Not a valid URL, keep original but log warning
              console.warn('Video URL format not recognized for video', video.id, ':', video.videoUrl, 'Error:', urlError)
            }
          } else {
            console.warn('Video has no videoUrl:', video.id, video.title)
          }

          return processedVideo
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
