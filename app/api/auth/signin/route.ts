import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Get user from database
    const { data: userData, error: dbError } = await db
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (dbError || !userData) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Verify password (assuming password is hashed in database)
    // Note: You should implement proper password hashing during signup
    const isValidPassword = await bcrypt.compare(password, userData.password || '')
    
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.full_name
      }
    })
  } catch (error: any) {
    console.error('Signin error:', error)
    return NextResponse.json({ error: error.message || 'Failed to sign in' }, { status: 500 })
  }
}
