/**
 * Cache headers configuration for optimal performance
 * 
 * Stratégies de cache:
 * - Immutable: Assets avec hash (JS, CSS, images optimisées) - 1 an
 * - Long-term: Assets statiques (images, vidéos) - 1 an avec revalidation
 * - Medium-term: API responses - 1 heure avec stale-while-revalidate
 * - Short-term: Pages dynamiques - 60s avec stale-while-revalidate
 */

export const CACHE_HEADERS = {
  // Assets immuables (avec hash dans le nom)
  immutable: {
    'Cache-Control': 'public, max-age=31536000, immutable',
  },
  
  // Images et vidéos statiques
  staticAssets: {
    'Cache-Control': 'public, max-age=31536000, stale-while-revalidate=86400',
  },
  
  // API responses (données qui changent peu)
  apiMedium: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  },
  
  // API responses (données qui changent souvent)
  apiShort: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
  },
  
  // Pages dynamiques
  pageDynamic: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=3600',
  },
  
  // Pas de cache
  noCache: {
    'Cache-Control': 'no-store, must-revalidate',
  },
} as const

/**
 * Helper pour ajouter des headers de cache à une Response
 */
export function withCacheHeaders(
  response: Response,
  cacheType: keyof typeof CACHE_HEADERS
): Response {
  const headers = new Headers(response.headers)
  const cacheHeaders = CACHE_HEADERS[cacheType]
  
  Object.entries(cacheHeaders).forEach(([key, value]) => {
    headers.set(key, value)
  })
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}


