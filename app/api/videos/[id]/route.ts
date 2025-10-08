import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single video
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const video = await prisma.video.findUnique({
      where: { id }
    })

    if (!video) {
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

    const video = await prisma.video.update({
      where: { id },
      data: allowedFields
    })

    console.log('API: Video updated successfully:', video)
    return NextResponse.json(video)
  } catch (error) {
    console.error('Error updating video:', error)
    
    // Provide more specific error messages
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A video with this data already exists' }, { status: 400 })
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }
    
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
    await prisma.video.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Video deleted successfully' })
  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}


