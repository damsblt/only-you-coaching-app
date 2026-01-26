import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

/**
 * Middleware pour rediriger toutes les pages vers la page en construction
 * 
 * Pour activer le mode construction :
 * - Définir CONSTRUCTION_MODE=true dans les variables d'environnement
 * 
 * Pour désactiver (mise en ligne) :
 * - Définir CONSTRUCTION_MODE=false ou supprimer la variable
 */

// Emails autorisés pour accéder à la page en construction
const AUTHORIZED_EMAILS = [
  'blmarieline@gmail.com',
  'damien.balet@me.com'
]

const JWT_SECRET = process.env.CONSTRUCTION_JWT_SECRET || 'construction-secret-key-change-in-production'
const COOKIE_NAME = 'construction-auth-token'

async function verifyAuth(request: NextRequest): Promise<boolean> {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value

    if (!token) {
      return false
    }

    // Vérifier le token
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    // Vérifier que l'email est autorisé
    const email = payload.email as string
    if (!email || !AUTHORIZED_EMAILS.includes(email.toLowerCase())) {
      return false
    }

    // Vérifier que le token indique l'autorisation
    if (!payload.authorized) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

export async function middleware(request: NextRequest) {
  // Vérifier si le mode construction est activé
  const constructionMode = process.env.CONSTRUCTION_MODE === 'true'
  
  // Si le mode construction n'est pas activé, laisser passer toutes les requêtes
  if (!constructionMode) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  // Routes autorisées sans authentification (ne pas rediriger)
  const publicPaths = [
    '/construction/login',        // Page de connexion
    '/api/construction-auth',      // API d'authentification
    '/api/construction-verify',    // API de vérification
    '/api/construction-logout',    // API de déconnexion
    '/_next',                     // Assets Next.js
    '/favicon.ico',               // Favicon
    '/robots.txt',                // Robots.txt
    '/sitemap.xml',               // Sitemap
  ]

  // Vérifier si la route est publique
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  )

  // Si la route est publique, laisser passer
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Vérifier l'authentification pour toutes les autres routes
  const isAuthenticated = await verifyAuth(request)

  // Si l'utilisateur est authentifié, laisser passer
  if (isAuthenticated) {
    return NextResponse.next()
  }

  // Rediriger vers la page de connexion pour toutes les autres routes
  const url = request.nextUrl.clone()
  url.pathname = '/construction/login'
  
  // Ajouter l'URL d'origine comme paramètre pour rediriger après connexion
  if (pathname !== '/') {
    url.searchParams.set('redirect', pathname)
  }

  return NextResponse.redirect(url)
}

// Configurer les chemins sur lesquels le middleware s'applique
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
