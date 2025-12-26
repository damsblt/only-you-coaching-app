import { NextRequest, NextResponse } from 'next/server'
import { getSignedVideoUrl } from '@/lib/s3'

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

// GET /api/testimonials/photos - Get signed URLs for testimonial photos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const names = searchParams.get('names')
    
    if (!names) {
      return NextResponse.json(
        { error: 'Names parameter is required', photos: {} },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Check AWS credentials
    const hasAwsCredentials = !!(
      process.env.AWS_ACCESS_KEY_ID && 
      process.env.AWS_SECRET_ACCESS_KEY
    )
    
    const nameList = names.split(',').map(name => name.trim())
    const photoUrls: Record<string, string> = {}
    const bucketName = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
    const region = process.env.AWS_REGION || 'eu-north-1'

    console.log(`Generating URLs for ${nameList.length} testimonials`)

    // Generate proxy URLs for each testimonial photo (bypasses CORS issues)
    // Use the request URL to determine the base URL
    const requestUrl = new URL(request.url)
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`
    
    for (const name of nameList) {
      const s3Key = testimonialPhotos[name]
      if (s3Key) {
        // Use our proxy endpoint to serve images through our API (bypasses CORS)
        const encodedName = encodeURIComponent(name)
        photoUrls[name] = `${baseUrl}/api/testimonials/image/${encodedName}`
        console.log(`✅ Generated proxy URL for ${name}: ${photoUrls[name]}`)
      } else {
        console.warn(`⚠️ No S3 key found for testimonial: ${name}`)
      }
    }

    console.log(`Successfully generated ${Object.keys(photoUrls).length} photo URLs`)
    return NextResponse.json(
      { photos: photoUrls },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    // Enhanced error logging
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }
    console.error('❌ Error generating testimonial photo URLs:', errorDetails)
    
    // Always return a valid JSON response, even on error
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: errorDetails.message,
        photos: {} // Return empty photos so component can show fallback avatars
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}




