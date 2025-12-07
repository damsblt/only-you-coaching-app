import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching videos from database...')
    
    // Simply fetch all published videos
    const { data: videos, error } = await supabaseAdmin
      .from('videos_new')
      .select('*')
      .eq('isPublished', true)
      .order('createdAt', { ascending: false })
      .limit(50) // Limit to 50 videos for testing

    if (error) {
      console.error('Error fetching videos:', error)
      return NextResponse.json(
        { error: 'Failed to fetch videos', details: error.message },
        { status: 500 }
      )
    }

    console.log(`✅ Found ${videos?.length || 0} videos`)
    
    return NextResponse.json(videos || [])
  } catch (error) {
    console.error('❌ Error fetching videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

