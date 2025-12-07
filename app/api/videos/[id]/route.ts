import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// GET single video
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: video, error } = await supabaseAdmin
      .from('videos_new')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !video) {
      console.error('Error fetching video:', error)
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return NextResponse.json(video)
  } catch (error) {
    console.error('Error fetching video:', error)
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 })
  }
}

// UPDATE video
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    console.log('API: Updating video', id, 'with data:', body)
    
    const { id: bodyId, ...updateData } = body

    // Remove fields that shouldn't be updated
    const { createdAt, updatedAt, ...allowedFields } = updateData

    // Validate required fields
    if (!allowedFields.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Ensure array fields are arrays, not null
    if (allowedFields.muscleGroups === null) {
      allowedFields.muscleGroups = []
    }
    if (allowedFields.tags === null) {
      allowedFields.tags = []
    }

    const { data: video, error } = await supabaseAdmin
      .from('videos_new')
      .update(allowedFields)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating video:', error)
      return NextResponse.json({ 
        error: 'Failed to update video', 
        details: error.message 
      }, { status: 500 })
    }

    console.log('API: Video updated successfully:', video)
    return NextResponse.json(video)
  } catch (error) {
    console.error('Error updating video:', error)
    
    return NextResponse.json({ 
      error: 'Failed to update video', 
      details: error.message 
    }, { status: 500 })
  }
}

// DELETE video
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await supabaseAdmin
      .from('videos_new')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting video:', error)
      return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Video deleted successfully' })
  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}


