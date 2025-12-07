import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Sign in user with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 401 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to sign in' }, { status: 500 })
    }

    // Get user data from our database
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Don't fail the request, user is authenticated
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        fullName: userData?.full_name || authData.user.user_metadata?.full_name
      },
      token: authData.session?.access_token
    })
  } catch (error: any) {
    console.error('Signin error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
