import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'construction-auth-token'

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true })
  
  // Supprimer le cookie
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return response
}
