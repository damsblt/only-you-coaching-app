import { NextRequest, NextResponse } from 'next/server'
import { getSignedVideoUrl, getPublicUrl } from '@/lib/s3'

// Map of testimonial names to their S3 photo keys
// Photos are stored in Photos/Témoinages/ folder
const testimonialPhotos: Record<string, string> = {
  'JEAN YVES': 'Photos/Témoinages/PHOTO JEAN YVES.jpg',
  'LUCIENNE': 'Photos/Témoinages/PHOTO LUCIENNE.jpg',
  'VALERIE': 'Photos/Témoinages/PHOTO VALERIE.jpg',
  'TRISTAN': 'Photos/Témoinages/PHOTO TRISTAN.jpg',
  'YVONNE': 'Photos/Témoinages/Foto Yvonne.PNG',
  'PIERRE ANDRE': 'Photos/Témoinages/PHOTO PIERRE ANDRE.jpg',
  'SEDEF': 'Photos/Témoinages/PHOTO SDEF.jpg',
  'VERONIQUE': 'Photos/Témoinages/photo véronique.jpg',
  'NICOLAS': 'Photos/Témoinages/PHOTO NICOLAS.jpg',
}


// GET /api/testimonials/image/[name] - Proxy testimonial image from S3
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params
    const decodedName = decodeURIComponent(name)
    
    console.log(`🔍 Looking up photo for testimonial: "${decodedName}"`)
    const s3Key = testimonialPhotos[decodedName]
    if (!s3Key) {
      console.error(`❌ No S3 key mapping found for: "${decodedName}"`)
      console.log('Available mappings:', Object.keys(testimonialPhotos))
      return NextResponse.json(
        { error: `No photo found for testimonial: ${decodedName}` },
        { status: 404 }
      )
    }
    
    console.log(`📸 Fetching S3 key: "${s3Key}" for testimonial: "${decodedName}"`)

    // Check AWS credentials
    const hasAwsCredentials = !!(
      process.env.AWS_ACCESS_KEY_ID && 
      process.env.AWS_SECRET_ACCESS_KEY
    )
    
    // Determine which URL to use (signed or public)
    let imageUrl: string
    
    if (!hasAwsCredentials) {
      console.warn(`⚠️ AWS credentials not configured for ${decodedName}. Using public URL fallback.`)
      const encodedKey = s3Key.split('/').map(segment => encodeURIComponent(segment)).join('/')
      imageUrl = getPublicUrl(encodedKey)
    } else {
      try {
        // Generate a signed URL first
        const signedUrlResult = await getSignedVideoUrl(s3Key, 3600) // 1 hour expiry
        
        if (signedUrlResult.success && signedUrlResult.url) {
          imageUrl = signedUrlResult.url.trim().replace(/\n/g, '').replace(/\r/g, '')
          console.log(`✅ Generated signed URL for ${decodedName}`)
        } else {
          // Fallback to public URL if signed URL generation fails
          console.warn(`⚠️ Failed to generate signed URL for ${decodedName}, using public URL:`, signedUrlResult.error)
          const encodedKey = s3Key.split('/').map(segment => encodeURIComponent(segment)).join('/')
          imageUrl = getPublicUrl(encodedKey)
        }
      } catch (error) {
        // Fallback to public URL on error
        console.warn(`⚠️ Error generating signed URL for ${decodedName}, using public URL:`, error)
        const encodedKey = s3Key.split('/').map(segment => encodeURIComponent(segment)).join('/')
        imageUrl = getPublicUrl(encodedKey)
      }
    }

    try {
      console.log(`📥 Fetching image for ${decodedName} from: ${imageUrl.substring(0, 100)}...`)
      
      // Fetch the image from S3 (signed or public URL)
      const imageResponse = await fetch(imageUrl)
      
      if (!imageResponse.ok) {
        console.error(`❌ Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`)
        return NextResponse.json(
          { error: 'Failed to fetch image', details: `HTTP ${imageResponse.status}` },
          { status: imageResponse.status }
        )
      }

      // Get the image data
      const imageBuffer = await imageResponse.arrayBuffer()
      const buffer = Buffer.from(imageBuffer)
      
      // Determine content type from response or file extension
      const contentType = imageResponse.headers.get('content-type') || 
        (s3Key.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg')

      console.log(`✅ Successfully fetched image for ${decodedName} (${buffer.length} bytes)`)

      // Return the image with proper headers
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour (matches signed URL expiry)
          'Access-Control-Allow-Origin': '*',
        },
      })
    } catch (s3Error) {
      console.error(`❌ Error fetching image for ${decodedName}:`, s3Error)
      console.error(`   Attempted S3 key: "${s3Key}"`)
      const errorMessage = s3Error instanceof Error ? s3Error.message : 'Unknown error'
      console.error(`   Error message: ${errorMessage}`)
      
      return NextResponse.json(
        { error: 'Failed to fetch image', details: errorMessage },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in testimonial image proxy:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

