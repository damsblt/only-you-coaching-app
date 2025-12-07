import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Attempting to create programs_info table by inserting test data...')
    
    // Try to insert a test record - this might create the table if it doesn't exist
    const testData = {
      name: 'Test Program',
      slug: 'test-program',
      description: 'This is a test program',
      content: 'Test content',
      is_published: false
    }

    const { data, error } = await supabaseAdmin
      .from('programs_info')
      .insert(testData)
      .select()

    if (error) {
      console.error('Error inserting test data:', error)
      
      // If the error is about table not existing, we need to create it manually
      if (error.message.includes('relation "public.programs_info" does not exist')) {
        return NextResponse.json({ 
          error: 'Table does not exist and cannot be auto-created',
          details: 'The programs_info table needs to be created manually in Supabase',
          suggestion: 'Please create the table in your Supabase dashboard with the following SQL:',
          sql: `
CREATE TABLE programs_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  content TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to create table', 
        details: error.message 
      }, { status: 500 })
    }

    // If successful, delete the test record
    if (data && data[0]) {
      await supabaseAdmin
        .from('programs_info')
        .delete()
        .eq('id', data[0].id)
    }

    return NextResponse.json({ 
      success: true,
      message: 'programs_info table is ready to use',
      testData: data
    })
  } catch (error) {
    console.error('Create table error:', error)
    return NextResponse.json({ 
      error: 'Failed to create table', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET - Check if table exists
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('programs_info')
      .select('*')
      .limit(1)

    return NextResponse.json({ 
      exists: !error,
      error: error?.message || null,
      data: data || []
    })
  } catch (error) {
    return NextResponse.json({ 
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    })
  }
}