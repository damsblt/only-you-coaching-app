import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware pour rediriger toutes les pages vers la page en construction
 * 
 * Pour activer le mode construction :
 * - Définir CONSTRUCTION_MODE=true dans les variables d'environnement
 * 
 * Pour désactiver (mise en ligne) :
 * - Définir CONSTRUCTION_MODE=false ou supprimer la variable
 */

export function middleware(request: NextRequest) {
  // Vérifier si le mode construction est activé
  const constructionMode = process.env.CONSTRUCTION_MODE === 'true'
  
  // Si le mode construction n'est pas activé, laisser passer toutes les requêtes
  if (!constructionMode) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  // Routes autorisées (ne pas rediriger)
  const allowedPaths = [
    '/construction',           // Page de construction
    '/construction/login',     // Page de connexion
    '/api/construction-auth',  // API d'authentification
    '/api',                    // Toutes les API routes
    '/_next',                  // Assets Next.js
    '/favicon.ico',            // Favicon
    '/robots.txt',             // Robots.txt
    '/sitemap.xml',            // Sitemap
  ]

  // Vérifier si la route est autorisée
  const isAllowed = allowedPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  )

  // Si la route est autorisée, laisser passer
  if (isAllowed) {
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
