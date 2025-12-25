import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Check if user exists
export async function GET(request: NextRequest) {
  try {
    // Check database connection
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

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    console.log('🔍 Checking user existence for:', email)

    const { data: existingUser, error } = await db
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      // PGRST116 means no rows found, which is fine
      if (error.code === 'PGRST116' || error.message?.includes('No rows returned')) {
        console.log('👤 User not found (expected):', email)
        return NextResponse.json({ user: null, exists: false })
      }

      // Better error logging
      const errorDetails = {
        message: error.message || 'Unknown error',
        code: error.code || 'NO_CODE',
        details: error.details || null,
        hint: error.hint || null,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
      console.error('❌ Database error during user check:', errorDetails)

      return NextResponse.json(
        { 
          error: 'Database error', 
          message: errorDetails.message,
          code: errorDetails.code,
          details: process.env.NODE_ENV === 'development' ? errorDetails : 'Database query failed',
          exists: false 
        },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json({
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role || 'USER',
          planId: existingUser.planid || 'essentiel'
        },
        exists: true
      })
    }

    return NextResponse.json({ user: null, exists: false })
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
    console.error('❌ Error in GET /api/simple-auth/user:', errorDetails)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error?.message || 'Unknown error',
        // Only include detailed error info in development
        details: process.env.NODE_ENV === 'development' 
          ? errorDetails 
          : 'An error occurred while checking the user. Please try again later.'
      },
      { status: 500 }
    )
  }
}

// POST - Create user
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { email, name, planId } = body

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      )
    }

    // Generate a UUID for the user
    const userId = crypto.randomUUID()
    const now = new Date().toISOString()

    console.log('Attempting to create user in database:', { email, name, userId })

    const { data: newUser, error } = await db
      .from('users')
      .insert({
        id: userId,
        email,
        name: name,
        role: 'USER',
        planid: planId || 'essentiel',
        updatedAt: now
      })

    if (error) {
      // Better error logging - PostgreSQL errors may have different structure
      const errorMessage = error.message || (error as any).detail || 'Unknown error'
      const errorCode = error.code || (error as any).code || 'NO_CODE'
      const errorDetails = {
        message: errorMessage,
        code: errorCode,
        details: (error as any).detail || null,
        hint: (error as any).hint || null,
        constraint: (error as any).constraint || null,
        originalError: error
      }
      console.error('Error creating user in database:', errorDetails)

      // Handle duplicate email error (PostgreSQL unique constraint violation)
      // Error code 23505 = unique_violation
      // Check for email constraint or unique constraint on email
      if (
        errorCode === '23505' || 
        errorMessage?.includes('duplicate key') ||
        errorMessage?.includes('unique constraint') ||
        (error as any).constraint?.includes('email')
      ) {
        return NextResponse.json(
          { 
            error: 'Un compte avec cet email existe déjà. Veuillez vous connecter.',
            code: '23505'
          },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { 
          error: 'Failed to create user',
          details: errorDetails
        },
        { status: 500 }
      )
    }

    if (!newUser) {
      console.error('❌ User creation returned null data')
      return NextResponse.json(
        { 
          error: 'Failed to create user',
          details: 'Database insert returned no data'
        },
        { status: 500 }
      )
    }

    console.log('✅ User created successfully in database:', newUser)
    return NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role || 'USER',
        planId: newUser.planid || planId || 'essentiel'
      }
    })
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
    console.error('❌ Error in POST /api/simple-auth/user:', errorDetails)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error?.message || 'Unknown error',
        // Only include detailed error info in development
        details: process.env.NODE_ENV === 'development' 
          ? errorDetails 
          : 'An error occurred while creating the user. Please try again later.'
      },
      { status: 500 }
    )
  }
}

