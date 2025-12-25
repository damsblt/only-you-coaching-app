import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { syncUserWithDatabase } from '@/lib/sync-user'

export async function POST(req: NextRequest) {
  try {
    // Check database connection first
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL is not set')
      return NextResponse.json(
        { 
          error: 'Database configuration error',
          message: 'DATABASE_URL environment variable is missing',
          details: 'Please check your environment variables'
        },
        { status: 500 }
      )
    }

    const { userId } = await req.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Check if user already exists in our custom table
    const { data: existingUser, error: existingUserError } = await db
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (existingUserError && existingUserError.code !== 'PGRST116') {
      console.error('Error checking existing user:', existingUserError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (existingUser) {
      return NextResponse.json({ success: true, user: existingUser })
    }

    // Sync user with database (this will handle user creation through auth system)
    const syncResult = await syncUserWithDatabase(userId)
    
    if (!syncResult.success) {
      return NextResponse.json({ error: syncResult.error || 'Failed to sync user' }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: syncResult.user })

  } catch (error: any) {
    // Enhanced error logging for production debugging
    const errorDetails = {
      message: error?.message || 'Unknown error',
      code: error?.code || 'NO_CODE',
      name: error?.name || null,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      // Include database connection info if available
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlLength: process.env.DATABASE_URL?.length || 0,
    }
    console.error('❌ Error syncing user:', errorDetails)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error?.message || 'Unknown error',
        // Only include detailed error info in development
        details: process.env.NODE_ENV === 'development' 
          ? errorDetails 
          : 'An error occurred while syncing the user. Please try again later.'
      },
      { status: 500 }
    )
  }
}
