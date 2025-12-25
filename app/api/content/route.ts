import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Content Types Configuration
const CONTENT_TYPES = {
  programs: {
    table: 'programs_info',
    fields: ['id', 'name', 'slug', 'description', 'content', 'is_published', 'created_at', 'updated_at'],
    required: ['name', 'slug']
  },
  videos: {
    table: 'videos',
    fields: ['id', 'title', 'description', 'url', 'thumbnail_url', 'duration', 'is_published', 'created_at', 'updated_at'],
    required: ['title', 'url']
  },
  recipes: {
    table: 'recipes',
    fields: ['id', 'title', 'slug', 'description', 'ingredients', 'instructions', 'prep_time', 'cook_time', 'servings', 'is_published', 'created_at', 'updated_at'],
    required: ['title', 'slug']
  },
  audios: {
    table: 'audios',
    fields: ['id', 'title', 'description', 'audioUrl', 's3key', 'thumbnail', 'duration', 'category', 'isPublished', 'createdAt', 'updatedAt'],
    required: ['title']
  }
}

// GET - List all content of a specific type
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const contentType = searchParams.get('type')
  const slug = searchParams.get('slug')
  const published = searchParams.get('published') === 'true'

  console.log('Content API GET request:', { contentType, slug, published })

  if (!contentType || !CONTENT_TYPES[contentType as keyof typeof CONTENT_TYPES]) {
    console.error('Invalid content type:', contentType)
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
  }

  try {
    const config = CONTENT_TYPES[contentType as keyof typeof CONTENT_TYPES]
    console.log('Using config:', config)
    
    let query = db.from(config.table).select('*')

    // Filter by published status if requested
    if (published) {
      // audios table uses camelCase, others use snake_case
      const publishedField = config.table === 'audios' ? 'isPublished' : 'is_published'
      query = query.eq(publishedField, true)
    }

    // Filter by slug if provided
    if (slug) {
      query = query.eq('slug', slug)
    }

    // Order by created_at or createdAt depending on table
    const createdAtField = config.table === 'audios' ? 'createdAt' : 'created_at'
    const { data, error } = await query.order(createdAtField, { ascending: false })

    if (error) {
      console.error('Supabase query error:', error)
      
      // If table doesn't exist, return empty array
      if (error.message?.includes('does not exist') || error.message?.includes(`relation "public.${config.table}"`)) {
        console.warn(`Table ${config.table} does not exist yet`)
        return NextResponse.json([])
      }
      
      return NextResponse.json({ error: 'Failed to fetch content', details: error.message }, { status: 500 })
    }

    console.log('Query successful, returning data:', data?.length || 0, 'items')
    return NextResponse.json(slug ? (data?.[0] || null) : (data || []))
  } catch (error) {
    console.error('Content fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch content', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

// POST - Create new content
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const contentType = searchParams.get('type')

  if (!contentType || !CONTENT_TYPES[contentType as keyof typeof CONTENT_TYPES]) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
  }

  try {
    const config = CONTENT_TYPES[contentType as keyof typeof CONTENT_TYPES]
    const body = await request.json()

    // Validate required fields
    for (const field of config.required) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Add timestamps - handle camelCase for audios table
    const now = new Date().toISOString()
    const contentData: any = { ...body }
    
    if (config.table === 'audios') {
      contentData.createdAt = now
      contentData.updatedAt = now
      contentData.isPublished = body.isPublished !== undefined ? body.isPublished : (body.is_published !== undefined ? body.is_published : false)
    } else {
      contentData.created_at = now
      contentData.updated_at = now
      contentData.is_published = body.is_published || false
    }

    const { data, error } = await db
      .from(config.table)
      .insert(contentData)
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Failed to create content' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Content creation error:', error)
    return NextResponse.json({ error: 'Failed to create content' }, { status: 500 })
  }
}

// PUT - Update existing content
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const contentType = searchParams.get('type')
  const id = searchParams.get('id')

  if (!contentType || !CONTENT_TYPES[contentType as keyof typeof CONTENT_TYPES]) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
  }

  if (!id) {
    return NextResponse.json({ error: 'Content ID is required' }, { status: 400 })
  }

  try {
    const config = CONTENT_TYPES[contentType as keyof typeof CONTENT_TYPES]
    const body = await request.json()

    // Add updated timestamp - handle camelCase for audios table
    const updateData: any = { ...body }
    
    if (config.table === 'audios') {
      updateData.updatedAt = new Date().toISOString()
      // Remove snake_case fields if they exist
      delete updateData.updated_at
      delete updateData.created_at
      // Handle isPublished field
      if (body.is_published !== undefined) {
        updateData.isPublished = body.is_published
        delete updateData.is_published
      }
    } else {
      updateData.updated_at = new Date().toISOString()
    }

    const { data, error } = await db
      .from(config.table)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({ error: 'Failed to update content' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Content update error:', error)
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 })
  }
}

// DELETE - Delete content
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const contentType = searchParams.get('type')
  const id = searchParams.get('id')

  if (!contentType || !CONTENT_TYPES[contentType as keyof typeof CONTENT_TYPES]) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
  }

  if (!id) {
    return NextResponse.json({ error: 'Content ID is required' }, { status: 400 })
  }

  try {
    const config = CONTENT_TYPES[contentType as keyof typeof CONTENT_TYPES]

    const { error } = await db
      .from(config.table)
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Content deleted successfully' })
  } catch (error) {
    console.error('Content deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 })
  }
}
