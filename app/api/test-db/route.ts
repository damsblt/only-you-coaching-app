import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabaseAdmin
      .from('programs_info')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Supabase connection error:', error)
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 })
    }

    // Test if we can get table info
    const { data: tableData, error: tableError } = await supabaseAdmin
      .from('programs_info')
      .select('*')
      .limit(5)

    if (tableError) {
      console.error('Table query error:', tableError)
      return NextResponse.json({ 
        error: 'Table query failed', 
        details: tableError.message,
        code: tableError.code,
        hint: tableError.hint
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      tableData: tableData || [],
      count: tableData?.length || 0
    })
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

