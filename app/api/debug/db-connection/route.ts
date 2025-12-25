import { NextRequest, NextResponse } from 'next/server'
import { db, sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {}
  }

  // Check 1: DATABASE_URL
  diagnostics.checks.DATABASE_URL = {
    exists: !!process.env.DATABASE_URL,
    length: process.env.DATABASE_URL?.length || 0,
    startsWith: process.env.DATABASE_URL?.substring(0, 20) || 'N/A',
    // Don't expose full URL in production
    preview: process.env.NODE_ENV === 'development' 
      ? process.env.DATABASE_URL 
      : `${process.env.DATABASE_URL?.substring(0, 30)}...`
  }

  // Check 2: Database client (sql)
  diagnostics.checks.sql = {
    exists: !!sql,
    type: typeof sql,
    // Check if sql is a function (neon client)
    isFunction: typeof sql === 'function'
  }

  // Check 3: Database client
  diagnostics.checks.db = {
    exists: !!db,
    type: typeof db,
    hasFrom: typeof (db as any)?.from === 'function'
  }

  // Check 4: Test connection
  try {
    if (sql) {
      const testResult = await (sql as any)`SELECT NOW() as current_time, version() as pg_version`
      const result = Array.isArray(testResult) ? testResult : (testResult?.rows || [])
      diagnostics.checks.connection = {
        success: true,
        currentTime: result[0]?.current_time,
        pgVersion: result[0]?.pg_version?.substring(0, 50)
      }
    } else {
      diagnostics.checks.connection = {
        success: false,
        error: 'SQL client is not initialized'
      }
    }
  } catch (error: any) {
    diagnostics.checks.connection = {
      success: false,
      error: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    }
  }

  // Check 5: Test query on users table
  try {
    if (db) {
      const result = await db
        .from('users')
        .select('id, email, role')
        .limit(1)
        .execute()
      
      if (result.error) {
        diagnostics.checks.usersTable = {
          success: false,
          error: result.error.message,
          code: result.error.code
        }
      } else {
        diagnostics.checks.usersTable = {
          success: true,
          sampleCount: result.data?.length || 0
        }
      }
    } else {
      diagnostics.checks.usersTable = {
        success: false,
        error: 'Database client is not initialized'
      }
    }
  } catch (error: any) {
    diagnostics.checks.usersTable = {
      success: false,
      error: error.message,
      code: error.code
    }
  }

  // Check 6: Test query on videos table
  try {
    if (db) {
      const result = await db
        .from('videos_new')
        .select('id, title')
        .limit(1)
        .execute()
      
      if (result.error) {
        diagnostics.checks.videosTable = {
          success: false,
          error: result.error.message,
          code: result.error.code
        }
      } else {
        diagnostics.checks.videosTable = {
          success: true,
          sampleCount: result.data?.length || 0
        }
      }
    } else {
      diagnostics.checks.videosTable = {
        success: false,
        error: 'Database client is not initialized'
      }
    }
  } catch (error: any) {
    diagnostics.checks.videosTable = {
      success: false,
      error: error.message,
      code: error.code
    }
  }

  // Determine overall status
  const allChecksPassed = Object.values(diagnostics.checks).every((check: any) => 
    check.success !== false
  )

  return NextResponse.json({
    status: allChecksPassed ? 'healthy' : 'unhealthy',
    ...diagnostics
  }, {
    status: allChecksPassed ? 200 : 500
  })
}

