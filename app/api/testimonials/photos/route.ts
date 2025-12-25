import { NextRequest, NextResponse } from 'next/server'
import { getSignedVideoUrl } from '@/lib/s3'

// Map of testimonial names to their S3 photo keys
const testimonialPhotos: Record<string, string> = {
  'JEAN YVES': 'Photos/PHOTO JEAN YVES.jpg',
  'LUCIENNE': 'Photos/PHOTO LUCIENNE.jpg',
  'VALERIE': 'Photos/PHOTO VALERIE.jpg',
  'TRISTAN': 'Photos/PHOTO TRISTAN.jpg',
  'YVONNE': 'Photos/Foto Yvonne.PNG',
  'PIERRE ANDRE': 'Photos/PHOTO PIERRE ANDRE.jpg',
  'SEDEF': 'Photos/PHOTO SDEF.jpg',
  'VERONIQUE': 'Photos/photo véronique.jpg',
  'NICOLAS': 'Photos/PHOTO NICOLAS.jpg',
}

// GET /api/testimonials/photos - Get signed URLs for testimonial photos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const names = searchParams.get('names')
    
    if (!names) {
      return NextResponse.json(
        { error: 'Names parameter is required' },
        { status: 400 }
      )
    }

    // Check AWS credentials
    const hasAwsCredentials = !!(
      process.env.AWS_ACCESS_KEY_ID && 
      process.env.AWS_SECRET_ACCESS_KEY
    )
    
    if (!hasAwsCredentials) {
      console.error('⚠️ AWS credentials not configured. Cannot generate signed URLs.')
      return NextResponse.json(
        { 
          error: 'AWS credentials not configured',
          photos: {} 
        },
        { status: 500 }
      )
    }

    const nameList = names.split(',').map(name => name.trim())
    const photoUrls: Record<string, string> = {}

    console.log(`Generating signed URLs for ${nameList.length} testimonials`)

    // Generate signed URLs for each testimonial photo
    for (const name of nameList) {
      const s3Key = testimonialPhotos[name]
      if (s3Key) {
        try {
          // Try to generate signed URL first (valid for 7 days)
          const signedUrlResult = await getSignedVideoUrl(s3Key, 604800)
          if (signedUrlResult.success) {
            const cleanUrl = signedUrlResult.url.trim().replace(/\n/g, '').replace(/\r/g, '')
            photoUrls[name] = cleanUrl
            console.log(`✅ Generated signed URL for ${name}`)
          } else {
            // Fallback to public URL if signed URL generation fails
            console.warn(`⚠️ Signed URL failed for ${name}, using public URL as fallback`)
            // Encode the S3 key properly for URL (encode each segment separately to preserve slashes)
            const encodedKey = s3Key.split('/').map(segment => encodeURIComponent(segment)).join('/')
            const bucketName = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
            const region = process.env.AWS_REGION || 'eu-north-1'
            const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${encodedKey}`
            photoUrls[name] = publicUrl
            console.log(`✅ Using public URL fallback for ${name}: ${publicUrl}`)
          }
        } catch (error) {
          // Fallback to public URL on error
          console.warn(`⚠️ Error generating signed URL for ${name}, using public URL:`, error)
          const encodedKey = s3Key.split('/').map(segment => encodeURIComponent(segment)).join('/')
          const bucketName = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
          const region = process.env.AWS_REGION || 'eu-north-1'
          const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${encodedKey}`
          photoUrls[name] = publicUrl
        }
      } else {
        console.warn(`⚠️ No S3 key found for testimonial: ${name}`)
      }
    }

    console.log(`Successfully generated ${Object.keys(photoUrls).length} photo URLs`)
    return NextResponse.json({ photos: photoUrls })
  } catch (error) {
    console.error('❌ Error generating testimonial photo URLs:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        photos: {}
      },
      { status: 500 }
    )
  }
}




