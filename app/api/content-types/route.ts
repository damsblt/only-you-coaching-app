import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Content Type Definitions
export const CONTENT_TYPES = {
  programs: {
    table: 'programs_info',
    displayName: 'Programs',
    fields: {
      name: { type: 'text', required: true, label: 'Program Name' },
      slug: { type: 'text', required: true, label: 'Slug' },
      description: { type: 'textarea', required: false, label: 'Description' },
      content: { type: 'textarea', required: false, label: 'Content' },
      is_published: { type: 'boolean', required: false, label: 'Published', default: false }
    }
  },
  videos: {
    table: 'videos',
    displayName: 'Videos',
    fields: {
      title: { type: 'text', required: true, label: 'Video Title' },
      description: { type: 'textarea', required: false, label: 'Description' },
      url: { type: 'url', required: true, label: 'Video URL' },
      thumbnail_url: { type: 'url', required: false, label: 'Thumbnail URL' },
      duration: { type: 'number', required: false, label: 'Duration (seconds)' },
      is_published: { type: 'boolean', required: false, label: 'Published', default: false }
    }
  },
  recipes: {
    table: 'recipes',
    displayName: 'Recipes',
    fields: {
      title: { type: 'text', required: true, label: 'Recipe Title' },
      slug: { type: 'text', required: true, label: 'Slug' },
      description: { type: 'textarea', required: false, label: 'Description' },
      ingredients: { type: 'textarea', required: false, label: 'Ingredients' },
      instructions: { type: 'textarea', required: false, label: 'Instructions' },
      prep_time: { type: 'number', required: false, label: 'Prep Time (minutes)' },
      cook_time: { type: 'number', required: false, label: 'Cook Time (minutes)' },
      servings: { type: 'number', required: false, label: 'Servings' },
      is_published: { type: 'boolean', required: false, label: 'Published', default: false }
    }
  }
} as const

// GET - Get content type schema
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const contentType = searchParams.get('type')

  if (!contentType) {
    // Return all available content types
    return NextResponse.json({
      contentTypes: Object.keys(CONTENT_TYPES).map(key => ({
        key,
        displayName: CONTENT_TYPES[key as keyof typeof CONTENT_TYPES].displayName,
        table: CONTENT_TYPES[key as keyof typeof CONTENT_TYPES].table
      }))
    })
  }

  if (!CONTENT_TYPES[contentType as keyof typeof CONTENT_TYPES]) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
  }

  const config = CONTENT_TYPES[contentType as keyof typeof CONTENT_TYPES]
  
  return NextResponse.json({
    contentType,
    displayName: config.displayName,
    table: config.table,
    fields: config.fields
  })
}

// POST - Create content type (if needed for dynamic creation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentType, fields } = body

    if (!contentType || !fields) {
      return NextResponse.json({ error: 'Content type and fields are required' }, { status: 400 })
    }

    // This would typically create a new table in Supabase
    // For now, we'll just return success as we're using predefined tables
    return NextResponse.json({ 
      message: 'Content type created successfully',
      contentType,
      fields 
    })
  } catch (error) {
    console.error('Content type creation error:', error)
    return NextResponse.json({ error: 'Failed to create content type' }, { status: 500 })
  }
}

