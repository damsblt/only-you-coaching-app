/**
 * Liste des emails autorisés à accéder à l'administration
 * et à créer de nouveaux utilisateurs
 */
export const AUTHORIZED_ADMIN_EMAILS = [
  'blmarieline@gmail.com',
  'damien.balet@me.com',
  'baletdamien@gmail.com'
] as const

/**
 * Vérifie si un email est autorisé à accéder aux fonctionnalités admin
 * @param email - L'email à vérifier
 * @returns true si l'email est autorisé, false sinon
 */
export function isAuthorizedAdmin(email: string | null | undefined): boolean {
  if (!email) {
    return false
  }
  
  return AUTHORIZED_ADMIN_EMAILS.includes(email.toLowerCase() as any)
}

/**
 * Vérifie si un utilisateur a le rôle ADMIN dans la base de données
 * @param email - L'email de l'utilisateur
 * @returns Promise<boolean> - true si l'utilisateur est admin, false sinon
 */
export async function isUserAdmin(email: string): Promise<boolean> {
  try {
    const { db } = await import('@/lib/db')
    
    const { data: user, error } = await db
      .from('users')
      .select('role')
      .eq('email', email.toLowerCase())
      .single()
    
    if (error || !user) {
      return false
    }
    
    return user.role === 'ADMIN'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Vérifie si un utilisateur est autorisé (email dans la liste ET rôle ADMIN)
 * @param email - L'email de l'utilisateur
 * @returns Promise<boolean> - true si l'utilisateur est autorisé, false sinon
 */
export async function isAuthorizedAdminUser(email: string | null | undefined): Promise<boolean> {
  if (!email) {
    return false
  }
  
  // Vérifier d'abord si l'email est dans la liste autorisée
  if (!isAuthorizedAdmin(email)) {
    return false
  }
  
  // Vérifier ensuite si l'utilisateur a le rôle ADMIN dans la base de données
  return await isUserAdmin(email)
}

/**
 * Helper pour extraire l'email de l'utilisateur depuis une requête Next.js
 * @param request - La requête NextRequest
 * @returns L'email de l'utilisateur ou null
 */
export function getUserEmailFromRequest(request: Request): string | null {
  // Essayer d'abord depuis les headers
  const headerEmail = request.headers.get('x-user-email')
  if (headerEmail) {
    return headerEmail
  }
  
  // Essayer depuis les query params
  try {
    const url = new URL(request.url)
    const queryEmail = url.searchParams.get('email')
    if (queryEmail) {
      return queryEmail
    }
  } catch {
    // Ignore URL parsing errors
  }
  
  return null
}

