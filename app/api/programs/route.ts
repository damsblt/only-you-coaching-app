import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - List all programs or get specific program by slug
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const published = searchParams.get('published') === 'true'

  try {
    let query = supabaseAdmin.from('programs_info').select('*')

    // Filter by published status if requested
    if (published) {
      query = query.eq('is_published', true)
    }

    // Filter by slug if provided
    if (slug) {
      query = query.eq('slug', slug)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase query error:', error)
      
      // If table doesn't exist, return empty array
      if (error.message?.includes('does not exist') || error.message?.includes('relation "public.programs_info"')) {
        console.warn('Table programs_info does not exist yet')
        return NextResponse.json([])
      }
      
      return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 })
    }

    return NextResponse.json(slug ? (data?.[0] || null) : (data || []))
  } catch (error) {
    console.error('Program fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 })
  }
}

// POST - Create new program
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    // Check if slug already exists
    const { data: existingProgram } = await supabaseAdmin
      .from('programs_info')
      .select('id')
      .eq('slug', body.slug)
      .single()

    if (existingProgram) {
      return NextResponse.json({ error: 'Program with this slug already exists' }, { status: 400 })
    }

    // Add timestamps
    const now = new Date().toISOString()
    const programData = {
      ...body,
      created_at: now,
      updated_at: now,
      is_published: body.is_published || false
    }

    const { data, error } = await supabaseAdmin
      .from('programs_info')
      .insert(programData)
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Failed to create program' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Program creation error:', error)
    return NextResponse.json({ error: 'Failed to create program' }, { status: 500 })
  }
}

// PUT - Update existing program
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const slug = searchParams.get('slug')

  if (!id && !slug) {
    return NextResponse.json({ error: 'Program ID or slug is required' }, { status: 400 })
  }

  try {
    const body = await request.json()

    // Add updated timestamp
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    }

    let query = supabaseAdmin.from('programs_info').update(updateData)

    // Use ID or slug for update
    if (id) {
      query = query.eq('id', id)
    } else if (slug) {
      query = query.eq('slug', slug)
    }

    const { data, error } = await query.select().single()

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({ error: 'Failed to update program' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Program update error:', error)
    return NextResponse.json({ error: 'Failed to update program' }, { status: 500 })
  }
}

// DELETE - Delete program
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const slug = searchParams.get('slug')

  if (!id && !slug) {
    return NextResponse.json({ error: 'Program ID or slug is required' }, { status: 400 })
  }

  try {
    let query = supabaseAdmin.from('programs_info').delete()

    // Use ID or slug for deletion
    if (id) {
      query = query.eq('id', id)
    } else if (slug) {
      query = query.eq('slug', slug)
    }

    const { error } = await query

    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Program deleted successfully' })
  } catch (error) {
    console.error('Program deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 })
  }
}

