import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAuthorizedAdminUser, getUserEmailFromRequest } from '@/lib/admin-auth'

// Helper pour vérifier l'autorisation
async function checkAdminAuth(request: Request): Promise<{ authorized: boolean; email: string | null }> {
  const email = getUserEmailFromRequest(request)
  if (!email) {
    return { authorized: false, email: null }
  }
  const authorized = await isAuthorizedAdminUser(email)
  return { authorized, email }
}

// GET - List all videos_new with optional videoType filter
export async function GET(request: NextRequest) {
  // Vérifier l'autorisation pour les requêtes incluant les vidéos non publiées
  const { searchParams } = new URL(request.url)
  const includeUnpublished = searchParams.get('includeUnpublished') === 'true'
  
  if (includeUnpublished) {
    const { authorized } = await checkAdminAuth(request)
    if (!authorized) {
      return NextResponse.json(
        { error: 'Accès refusé. Vous n\'avez pas les permissions nécessaires.' },
        { status: 403 }
      )
    }
  }
  const { searchParams } = new URL(request.url)
  const videoType = searchParams.get('videoType')
  const includeUnpublished = searchParams.get('includeUnpublished') === 'true'

  try {
    let query = db.from('videos_new').select('*')

    // Filter by videoType if provided
    if (videoType) {
      query = query.eq('videoType', videoType)
    }

    // Include unpublished videos for admin
    if (!includeUnpublished) {
      query = query.eq('isPublished', true)
    }

    const { data, error } = await query.order('title', { ascending: true }).execute()

    if (error) {
      console.error('Error fetching videos_new:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in videos_new API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    )
  }
}

// POST - Create a new video
export async function POST(request: NextRequest) {
  // Vérifier l'autorisation
  const { authorized } = await checkAdminAuth(request)
  if (!authorized) {
    return NextResponse.json(
      { error: 'Accès refusé. Vous n\'avez pas les permissions nécessaires pour créer des vidéos.' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const {
      title,
      description,
      detailedDescription,
      thumbnail,
      videoUrl,
      duration,
      difficulty,
      category,
      region,
      muscleGroups,
      startingPosition,
      movement,
      intensity,
      theme,
      series,
      constraints,
      tags, // Keep for backward compatibility, will be mapped to targeted_muscles
      isPublished,
      videoType,
      folder
    } = body

    const { data: result, error } = await db
      .from('videos_new')
      .insert({
        title,
        description,
        detailedDescription,
        thumbnail,
        videoUrl,
        duration: duration || 0,
        difficulty,
        category,
        region,
        muscleGroups: muscleGroups || [],
        startingPosition,
        movement,
        intensity,
        theme,
        series,
        constraints,
        targeted_muscles: (tags || body.targeted_muscles) || [],
        isPublished: isPublished || false,
        videoType: videoType || 'MUSCLE_GROUPS'
      })
    
    const data = result || null

    if (error) {
      console.error('Error creating video:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in videos_new POST:', error)
    return NextResponse.json(
      { error: 'Failed to create video' },
      { status: 500 }
    )
  }
}

// PUT - Update a video
export async function PUT(request: NextRequest) {
  // Vérifier l'autorisation
  const { authorized } = await checkAdminAuth(request)
  if (!authorized) {
    return NextResponse.json(
      { error: 'Accès refusé. Vous n\'avez pas les permissions nécessaires pour modifier des vidéos.' },
      { status: 403 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    const body = await request.json()

    // Use direct SQL query for update
    const { query } = await import('@/lib/db')
    const updateFields = Object.keys(body).filter(k => k !== 'id')
    const setClause = updateFields.map((k, i) => `"${k}" = $${i + 1}`).join(', ')
    const values = [...updateFields.map(k => {
      const val = body[k]
      // Handle arrays and objects
      if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
        return JSON.stringify(val)
      }
      return val
    }), new Date().toISOString(), id]
    
    const result = await query(
      `UPDATE videos_new SET ${setClause}, "updatedAt" = $${updateFields.length + 1} WHERE id = $${updateFields.length + 2} RETURNING *`,
      values
    )
    
    const data = result && result.length > 0 ? result[0] : null
    const error = data ? null : { message: 'Video not found' }

    if (error) {
      console.error('Error updating video:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in videos_new PUT:', error)
    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a video
export async function DELETE(request: NextRequest) {
  // Vérifier l'autorisation
  const { authorized } = await checkAdminAuth(request)
  if (!authorized) {
    return NextResponse.json(
      { error: 'Accès refusé. Vous n\'avez pas les permissions nécessaires pour supprimer des vidéos.' },
      { status: 403 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    const { query } = await import('@/lib/db')
    const result = await query('DELETE FROM videos_new WHERE id = $1 RETURNING *', [id])
    const error = result && result.length > 0 ? null : { message: 'Video not found' }

    if (error) {
      console.error('Error deleting video:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in videos_new DELETE:', error)
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    )
  }
}

