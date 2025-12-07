import { NextRequest, NextResponse } from 'next/server'
import { db, pool } from '@/lib/db'

// GET - List all region descriptions or get specific by region_slug
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const regionSlug = searchParams.get('region')

  try {
    if (!db) {
      console.error('Database client not initialized')
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
    }

    let query = db.from('program_region_descriptions').select('*')

    // Filter by region slug if provided
    if (regionSlug) {
      query = query.eq('region_slug', regionSlug)
    }

    const result = await query.order('display_name', { ascending: true }).execute()

    if (result.error) {
      console.error('Database query error:', result.error)
      
      // If table doesn't exist, return empty array or null
      const errorMessage = result.error?.message || String(result.error)
      if (errorMessage?.includes('does not exist') || errorMessage?.includes('relation "public.program_region_descriptions"')) {
        console.warn('Table program_region_descriptions does not exist yet')
        return NextResponse.json(regionSlug ? null : [])
      }
      
      return NextResponse.json({ error: 'Failed to fetch region descriptions', details: errorMessage }, { status: 500 })
    }

    const data = result.data || []
    return NextResponse.json(regionSlug ? (data?.[0] || null) : data)
  } catch (error) {
    console.error('Region description fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch region descriptions' }, { status: 500 })
  }
}

// POST - Create new region description
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.region_slug || !body.display_name) {
      return NextResponse.json({ error: 'region_slug and display_name are required' }, { status: 400 })
    }

    if (!db) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
    }

    // Check if region_slug already exists
    const existingResult = await db
      .from('program_region_descriptions')
      .select('id')
      .eq('region_slug', body.region_slug)
      .single()

    if (existingResult.data) {
      return NextResponse.json({ error: 'Region description with this slug already exists' }, { status: 400 })
    }

    // Add timestamps
    const now = new Date().toISOString()
    const descriptionData = {
      ...body,
      created_at: now,
      updated_at: now
    }

    // Use raw SQL for insert since QueryBuilder insert is not chainable
    const insertKeys = Object.keys(descriptionData)
    const insertValues = Object.values(descriptionData)
    const placeholders = insertKeys.map((_, i) => `$${i + 1}`).join(', ')
    const insertQuery = `INSERT INTO "program_region_descriptions" (${insertKeys.map(k => `"${k}"`).join(', ')}) VALUES (${placeholders}) RETURNING *`
    
    try {
      const insertResult = await pool.query(insertQuery, insertValues)
      const data = insertResult.rows?.[0] || null
      
      if (!data) {
        return NextResponse.json({ error: 'Failed to create region description' }, { status: 500 })
      }
      
      return NextResponse.json(data, { status: 201 })
    } catch (insertError: any) {
      console.error('Database insert error:', insertError)
      
      // If table doesn't exist, provide helpful error message
      const errorMessage = insertError?.message || String(insertError)
      if (errorMessage?.includes('does not exist') || errorMessage?.includes('relation "public.program_region_descriptions"')) {
        return NextResponse.json({ 
          error: 'Table does not exist', 
          details: 'Please create the table first by running the SQL script',
          suggestion: 'Execute scripts/create-program-regions-descriptions.sql in your database'
        }, { status: 500 })
      }
      
      return NextResponse.json({ error: 'Failed to create region description', details: errorMessage }, { status: 500 })
    }
  } catch (error) {
    console.error('Region description creation error:', error)
    return NextResponse.json({ error: 'Failed to create region description' }, { status: 500 })
  }
}

// PUT - Update existing region description
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const regionSlug = searchParams.get('region')

  if (!id && !regionSlug) {
    return NextResponse.json({ error: 'ID or region_slug is required' }, { status: 400 })
  }

  try {
    const body = await request.json()

    // Add updated timestamp
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    }

    if (!db) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
    }

    // For update, we need to use raw SQL since the QueryBuilder doesn't have update method
    // First, find the record
    let findQuery = db.from('program_region_descriptions').select('*')
    if (id) {
      findQuery = findQuery.eq('id', id)
    } else if (regionSlug) {
      findQuery = findQuery.eq('region_slug', regionSlug)
    }

    const findResult = await findQuery.single()

    if (findResult.error || !findResult.data) {
      return NextResponse.json({ error: 'Region description not found' }, { status: 404 })
    }

    // Update using raw SQL
    const updateKeys = Object.keys(updateData)
    const updateValues = Object.values(updateData)
    const setClause = updateKeys.map((key, i) => `"${key}" = $${i + 1}`).join(', ')
    const whereClause = id ? `id = $${updateKeys.length + 1}` : `region_slug = $${updateKeys.length + 1}`
    const whereValue = id || regionSlug

    const updateQuery = `UPDATE "program_region_descriptions" SET ${setClause} WHERE ${whereClause} RETURNING *`
    const updateResult = await pool.query(updateQuery, [...updateValues, whereValue])

    if (!updateResult.rows || updateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to update region description' }, { status: 500 })
    }

    const data = updateResult.rows[0]

    return NextResponse.json(data)
  } catch (error) {
    console.error('Region description update error:', error)
    return NextResponse.json({ error: 'Failed to update region description' }, { status: 500 })
  }
}

// DELETE - Delete region description
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const regionSlug = searchParams.get('region')

  if (!id && !regionSlug) {
    return NextResponse.json({ error: 'ID or region_slug is required' }, { status: 400 })
  }

  try {
    if (!db) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
    }

    // For delete, use raw SQL
    const whereClause = id ? `id = $1` : `region_slug = $1`
    const whereValue = id || regionSlug

    try {
      const deleteQuery = `DELETE FROM "program_region_descriptions" WHERE ${whereClause} RETURNING *`
      const deleteResult = await pool.query(deleteQuery, [whereValue])
      
      return NextResponse.json({ message: 'Region description deleted successfully' })
    } catch (deleteError: any) {
      console.error('Database delete error:', deleteError)
      
      // If table doesn't exist, still return success (idempotency)
      const errorMessage = deleteError?.message || String(deleteError)
      if (errorMessage?.includes('does not exist') || errorMessage?.includes('relation "public.program_region_descriptions"')) {
        return NextResponse.json({ message: 'Region description deleted successfully' })
      }
      
      return NextResponse.json({ error: 'Failed to delete region description', details: errorMessage }, { status: 500 })
    }

    return NextResponse.json({ message: 'Region description deleted successfully' })
  } catch (error) {
    console.error('Region description deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete region description' }, { status: 500 })
  }
}

