import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing existing tables...')
    
    const results: Record<string, any> = {}
    
    // Test each table that should exist
    const tablesToTest = ['users', 'subscriptions', 'recipes', 'audios', 'videos_new', 'programs_info']
    
    for (const tableName of tablesToTest) {
      try {
        const { data, error } = await db
          .from(tableName)
          .select('*')
          .limit(1)
        
        results[tableName] = {
          exists: !error,
          error: error?.message || null,
          data: data || []
        }
      } catch (err) {
        results[tableName] = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          data: []
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      tableResults: results
    })
  } catch (error) {
    console.error('Test tables error:', error)
    return NextResponse.json({ 
      error: 'Failed to test tables', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

