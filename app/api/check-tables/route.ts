import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('Checking Supabase tables...')
    
    // Get all tables from information_schema
    const { data: tables, error } = await db
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name')

    if (error) {
      console.error('Error fetching tables:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch tables', 
        details: error.message 
      }, { status: 500 })
    }

    const tableNames = tables?.map(t => t.table_name) || []
    
    // Also check if programs_info table exists specifically
    const { data: programsData, error: programsError } = await db
      .from('programs_info')
      .select('*')
      .limit(1)

    return NextResponse.json({ 
      success: true,
      tables: tableNames,
      programs_info_exists: !programsError,
      programs_error: programsError?.message || null,
      programs_data: programsData || []
    })
  } catch (error) {
    console.error('Check tables error:', error)
    return NextResponse.json({ 
      error: 'Failed to check tables', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

