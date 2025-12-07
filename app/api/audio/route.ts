import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hasAccess } from '@/lib/access-control'
import { getSignedAudioUrl } from '@/lib/s3'

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic'

// Cache configuration - revalidate every 60 seconds
export const revalidate = 60

// Columns needed for audio display - optimize query by selecting only needed fields
const AUDIO_COLUMNS = 'id,title,description,category,audioUrl,s3key,s3Key,thumbnail,duration,isPublished,createdAt,updatedAt'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters - use nextUrl.searchParams to avoid dynamic server usage warning
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '100') // Default limit instead of 1000
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query - optimize by selecting only needed columns
    let query = db
      .from('audios')
      .select(AUDIO_COLUMNS)
      .eq('isPublished', true)
      .order('title', { ascending: true })

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`)
    }

    // Apply pagination
    const { data, error } = await query.range(offset, offset + limit - 1).execute()
    
    if (error) {
      console.error('Database query error:', error)
      return NextResponse.json({ error: 'Failed to fetch audios' }, { status: 500 })
    }

    // Generate fresh signed URLs for each audio file
    // Process in batches of 10 to avoid overwhelming the system
    const BATCH_SIZE = 10
    const audiosWithSignedUrls = []
    
    for (let i = 0; i < (data ?? []).length; i += BATCH_SIZE) {
      const batch = (data ?? []).slice(i, i + BATCH_SIZE)
      const processedBatch = await Promise.all(
        batch.map(async (audio: any) => {
        // First, try to use s3key if it exists (preferred method)
        // Note: PostgreSQL column names are lowercase unless quoted, so it's s3key not s3Key
        const s3Key = audio.s3key || audio.s3Key
        if (s3Key && s3Key.trim() !== '') {
          try {
            // Decode URL-encoded S3 key to get the actual key
            const decodedKey = decodeURIComponent(s3Key)
            const signedUrlResult = await getSignedAudioUrl(decodedKey, 86400) // 24 hours
            if (signedUrlResult.success && signedUrlResult.url) {
              return { ...audio, audioUrl: signedUrlResult.url }
            } else {
              console.error(`Error generating signed URL from s3key for audio ${audio.id}:`, signedUrlResult.error)
            }
          } catch (keyError) {
            console.error(`Error processing s3key for audio ${audio.id}:`, keyError)
          }
        }
        
        // Fallback: try to extract S3 key from stored audioUrl
        if (audio.audioUrl && audio.audioUrl.trim() !== '') {
          try {
            // Check if audioUrl is an S3 URL
            const audioUrl = new URL(audio.audioUrl)
            
            // Check if it's an S3 URL (either old signed URL or direct S3 URL)
            if (audioUrl.hostname.includes('s3') || audioUrl.hostname.includes('amazonaws.com')) {
              // Extract the S3 key from the URL
              // For signed URLs, the key is in the pathname (before query params)
              // Example: https://bucket.s3.region.amazonaws.com/Audio/file.mp3?X-Amz-...
              let s3Key = ''
              
              if (audioUrl.pathname) {
                // Remove leading slash and decode URL-encoded path
                // The pathname is like "/Audio/folder/file.mp3"
                s3Key = decodeURIComponent(audioUrl.pathname.substring(1))
              }

              // Try to generate a fresh signed URL
              if (s3Key && s3Key.trim() !== '') {
                const signedUrlResult = await getSignedAudioUrl(s3Key, 86400) // 24 hours

                if (signedUrlResult.success && signedUrlResult.url) {
                  return { ...audio, audioUrl: signedUrlResult.url }
                } else {
                  console.error(`Error generating signed URL for audio ${audio.id}:`, signedUrlResult.error || 'Unknown error')
                }
              } else {
                console.warn(`Could not extract S3 key from URL for audio ${audio.id}: ${audio.audioUrl}`)
              }
            }
          } catch (urlError) {
            // Not a valid URL or failed to parse, try to use audioUrl as S3 key directly
            try {
              // If audioUrl doesn't look like a URL, it might be an S3 key
              if (!audio.audioUrl.startsWith('http')) {
                const signedUrlResult = await getSignedAudioUrl(audio.audioUrl, 86400)
                if (signedUrlResult.success && signedUrlResult.url) {
                  return { ...audio, audioUrl: signedUrlResult.url }
                }
              } else {
                console.error(`Error parsing audio URL for ${audio.id}:`, urlError)
              }
            } catch (keyError) {
              console.error(`Error processing audio URL for ${audio.id}:`, keyError)
            }
          }
        } else {
          console.warn(`Audio ${audio.id} has no audioUrl or s3key`)
        }

          // Return original audio if signed URL generation fails
          // This ensures the app doesn't break if URL generation fails
          return audio
        })
      )
      audiosWithSignedUrls.push(...processedBatch)
    }

    // Add cache headers for better performance
    return NextResponse.json(audiosWithSignedUrls, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'CDN-Cache-Control': 'public, s-maxage=60',
        'Vary': 'Accept-Encoding',
      },
    })
  } catch (error) {
    console.error('Error fetching audios:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audios' },
      { status: 500 }
    )
  }
}
