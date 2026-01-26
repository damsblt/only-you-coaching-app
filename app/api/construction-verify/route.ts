import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// Emails autorisés pour accéder à la page en construction
const AUTHORIZED_EMAILS = [
  'blmarieline@gmail.com',
  'damien.balet@me.com'
]

const JWT_SECRET = process.env.CONSTRUCTION_JWT_SECRET || 'construction-secret-key-change-in-production'
const COOKIE_NAME = 'construction-auth-token'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value

    if (!token) {
      return NextResponse.json(
        { authenticated: false, error: 'No token found' },
        { status: 401 }
      )
    }

    // Vérifier le token
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    // Vérifier que l'email est autorisé
    const email = payload.email as string
    if (!email || !AUTHORIZED_EMAILS.includes(email.toLowerCase())) {
      return NextResponse.json(
        { authenticated: false, error: 'Unauthorized email' },
        { status: 403 }
      )
    }

    // Vérifier que le token indique l'autorisation
    if (!payload.authorized) {
      return NextResponse.json(
        { authenticated: false, error: 'Not authorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.id,
        email: payload.email,
      }
    })
  } catch (error: any) {
    console.error('Construction verify error:', error)
    return NextResponse.json(
      { authenticated: false, error: 'Invalid token' },
      { status: 401 }
    )
  }
}
