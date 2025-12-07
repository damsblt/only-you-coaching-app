import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName } = await req.json()
    
    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Email, password and full name are required' }, { status: 400 })
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: fullName
      },
      email_confirm: true // Auto-confirm for testing
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Create user record in our database
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Database error:', dbError)
      // Don't fail the request, user is created in auth
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        fullName: fullName
      }
    })
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
