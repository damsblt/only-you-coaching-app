#!/usr/bin/env node

/**
 * Test Video Streaming API
 * This script tests the video streaming API endpoint directly
 */

const testVideoId = 'd140ef1d-80c7-4795-9579-14ebcf186e97'
const baseUrl = 'http://localhost:3000'

async function testVideoStreaming() {
  console.log('🧪 Testing Video Streaming API...')
  console.log('Video ID:', testVideoId)
  console.log('Base URL:', baseUrl)
  console.log('')

  try {
    // Test HEAD request
    console.log('1️⃣ Testing HEAD request...')
    const headResponse = await fetch(`${baseUrl}/api/videos/${testVideoId}/stream`, {
      method: 'HEAD'
    })
    
    console.log('   Status:', headResponse.status)
    console.log('   Status Text:', headResponse.statusText)
    console.log('   Content-Type:', headResponse.headers.get('content-type'))
    console.log('   Content-Length:', headResponse.headers.get('content-length'))
    console.log('   Cache-Control:', headResponse.headers.get('cache-control'))
    console.log('   Accept-Ranges:', headResponse.headers.get('accept-ranges'))
    
    if (headResponse.status === 200) {
      console.log('   ✅ HEAD request successful')
    } else {
      console.log('   ❌ HEAD request failed')
    }

    // Test GET request (this will redirect to signed URL)
    console.log('')
    console.log('2️⃣ Testing GET request...')
    const getResponse = await fetch(`${baseUrl}/api/videos/${testVideoId}/stream`, {
      method: 'GET',
      redirect: 'manual' // Don't follow redirects automatically
    })
    
    console.log('   Status:', getResponse.status)
    console.log('   Status Text:', getResponse.statusText)
    console.log('   Location:', getResponse.headers.get('location'))
    
    if (getResponse.status === 302 || getResponse.status === 301) {
      console.log('   ✅ GET request redirecting to signed URL')
      
      // Follow the redirect manually
      const location = getResponse.headers.get('location')
      if (location) {
        console.log('')
        console.log('3️⃣ Testing signed URL...')
        try {
          const signedResponse = await fetch(location, { method: 'HEAD' })
          console.log('   Signed URL Status:', signedResponse.status)
          console.log('   Signed URL Content-Type:', signedResponse.headers.get('content-type'))
          console.log('   Signed URL Content-Length:', signedResponse.headers.get('content-length'))
          
          if (signedResponse.status === 200) {
            console.log('   ✅ Signed URL is accessible')
          } else {
            console.log('   ❌ Signed URL not accessible')
          }
        } catch (signedError) {
          console.log('   ❌ Error accessing signed URL:', signedError.message)
        }
      }
    } else {
      console.log('   ❌ GET request failed or not redirecting')
    }

    // Test with browser-like headers
    console.log('')
    console.log('4️⃣ Testing with browser headers...')
    const browserResponse = await fetch(`${baseUrl}/api/videos/${testVideoId}/stream`, {
      method: 'GET',
      headers: {
        'Accept': 'video/mp4,video/*,*/*',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Range': 'bytes=0-1023'
      },
      redirect: 'manual'
    })
    
    console.log('   Status:', browserResponse.status)
    console.log('   Status Text:', browserResponse.statusText)
    console.log('   Content-Range:', browserResponse.headers.get('content-range'))
    console.log('   Accept-Ranges:', browserResponse.headers.get('accept-ranges'))

  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

// Run the test
testVideoStreaming().then(() => {
  console.log('')
  console.log('🏁 Test completed')
}).catch((error) => {
  console.error('💥 Test failed:', error)
  process.exit(1)
})
