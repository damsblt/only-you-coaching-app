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
 * 
 * Les routes /admin/* permettent de contourner le middleware pour le développeur
 */

export async function middleware(request: NextRequest) {
  // Vérifier si le mode construction est activé
  const constructionModeEnv = process.env.CONSTRUCTION_MODE
  // Vérifier de manière plus robuste (gère "true", "True", "TRUE", etc.)
  const constructionMode = String(constructionModeEnv || '').toLowerCase().trim() === 'true'
  
  // Si le mode construction n'est pas activé, laisser passer toutes les requêtes
  if (!constructionMode) {
    return NextResponse.next()
  }

  // Domaines pour lesquels le mode construction s'applique
  const constructionDomains = [
    'only-you-coaching.com',
    'www.only-you-coaching.com',
  ]

  // Récupérer le hostname de la requête
  const hostname = request.headers.get('host') || ''
  const domain = hostname.split(':')[0] // Enlever le port si présent

  // Si le domaine n'est pas dans la liste des domaines de construction, laisser passer
  if (!constructionDomains.includes(domain)) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  // Routes autorisées (ne pas rediriger vers /construction)
  const allowedPaths = [
    '/construction',              // Page de construction elle-même
    '/admin',                     // Route admin (contourne le middleware)
    '/_next',                     // Assets Next.js
    '/favicon.ico',               // Favicon
    '/robots.txt',                // Robots.txt
    '/sitemap.xml',               // Sitemap
  ]

  // Vérifier si la route commence par /admin (contourne le middleware)
  if (pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Vérifier si la route est autorisée
  const isAllowed = allowedPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  )

  // Si la route est autorisée, laisser passer
  if (isAllowed) {
    return NextResponse.next()
  }

  // Rediriger vers la page de construction pour toutes les autres routes
  const url = request.nextUrl.clone()
  url.pathname = '/construction'

  return NextResponse.redirect(url)
}

// Configurer les chemins sur lesquels le middleware s'applique
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
