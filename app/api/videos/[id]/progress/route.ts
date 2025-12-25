import { NextRequest, NextResponse } from 'next/server'
import { db, update, insert } from '@/lib/db'

// POST /api/videos/[id]/progress - Update video progress
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params
    const body = await request.json()
    const { userId, completed, progressSeconds } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      )
    }

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      )
    }

    console.log('📥 Progress API called:', { videoId, userId, completed, progressSeconds })
    
    // Check if progress record exists
    const existingProgress = await db
      .from('user_video_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single()
    
    console.log('🔍 Existing progress check:', {
      hasError: !!existingProgress.error,
      hasData: !!existingProgress.data,
      error: existingProgress.error?.message || null
    })

    if (existingProgress.error || !existingProgress.data) {
      // Create new progress record using insert helper
      console.log('📝 Creating new progress record:', { userId, videoId, completed, progressSeconds })
      
      try {
        const result = await insert('user_video_progress', {
          user_id: userId,
          video_id: videoId,
          completed: completed || false,
          progress_seconds: progressSeconds || 0,
          last_watched: new Date().toISOString()
        })

        if (result.error) {
          console.error('❌ Error creating progress:', result.error)
          return NextResponse.json(
            { error: 'Failed to create progress record', details: result.error?.message || String(result.error) },
            { status: 500 }
          )
        }

        console.log('✅ Progress record created successfully')
        return NextResponse.json({ 
          success: true, 
          progress: result.data 
        })
      } catch (insertError: any) {
        console.error('❌ Exception during insert:', insertError)
        return NextResponse.json(
          { error: 'Failed to create progress record', details: insertError?.message || String(insertError) },
          { status: 500 }
        )
      }
    } else {
      // Update existing progress record
      console.log('📝 Updating existing progress record:', { userId, videoId, completed, progressSeconds })
      
      const updateData: any = {
        last_watched: new Date().toISOString()
      }

      if (completed !== undefined) {
        updateData.completed = completed
      }

      if (progressSeconds !== undefined) {
        updateData.progress_seconds = progressSeconds
      }

      try {
        const result = await update(
          'user_video_progress',
          updateData,
          { user_id: userId, video_id: videoId }
        )

        if (result.error) {
          console.error('❌ Error updating progress:', result.error)
          return NextResponse.json(
            { error: 'Failed to update progress record', details: result.error?.message || String(result.error) },
            { status: 500 }
          )
        }

        console.log('✅ Progress record updated successfully')
        return NextResponse.json({ 
          success: true, 
          progress: result.data 
        })
      } catch (updateError: any) {
        console.error('❌ Exception during update:', updateError)
        return NextResponse.json(
          { error: 'Failed to update progress record', details: updateError?.message || String(updateError) },
          { status: 500 }
        )
      }
    }
  } catch (error: any) {
    console.error('Error in progress API:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

// GET /api/videos/[id]/progress - Get video progress for a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      )
    }

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      )
    }

    const result = await db
      .from('user_video_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single()

    if (result.error) {
      // If no record found, return default progress
      if (result.error.code === 'PGRST116' || result.error.message?.includes('No rows returned')) {
        return NextResponse.json({
          completed: false,
          progressSeconds: 0,
          lastWatched: null
        })
      }

      return NextResponse.json(
        { error: 'Failed to fetch progress', details: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      completed: result.data?.completed || false,
      progressSeconds: result.data?.progress_seconds || 0,
      lastWatched: result.data?.last_watched || null
    })
  } catch (error: any) {
    console.error('Error fetching progress:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

