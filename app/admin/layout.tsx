'use client'

import { useSimpleAuth } from '@/components/providers/SimpleAuthProvider'
import { isAuthorizedAdmin } from '@/lib/admin-auth'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user: currentUser, loading: authLoading } = useSimpleAuth()

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès Refusé</h1>
          <p className="text-gray-600 mb-4">Vous devez être connecté pour accéder à cette page.</p>
          <a 
            href="/auth/signin-simple?from=admin" 
            className="inline-block bg-footer-500 hover:bg-footer-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Se connecter
          </a>
        </div>
      </div>
    )
  }

  // Vérifier que l'utilisateur est autorisé (email dans la liste autorisée)
  if (!currentUser.email || !isAuthorizedAdmin(currentUser.email)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès Refusé</h1>
          <p className="text-gray-600">Vous n'avez pas les permissions pour accéder à cette page.</p>
          <p className="text-sm text-gray-500 mt-2">Seuls les administrateurs autorisés peuvent accéder à cette section.</p>
          <a 
            href="/" 
            className="inline-block mt-4 bg-footer-500 hover:bg-footer-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

