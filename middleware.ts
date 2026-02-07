import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware Next.js
 * 
 * Mode construction DÉSACTIVÉ - Le site est maintenant en ligne !
 * 
 * Pour réactiver le mode construction si besoin :
 * - Définir CONSTRUCTION_MODE=true dans les variables d'environnement
 */

export async function middleware(request: NextRequest) {
  // Mode construction désactivé - laisser passer toutes les requêtes
  return NextResponse.next()
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
