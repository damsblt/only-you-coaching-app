'use client'

import { useState, useEffect } from 'react'
import { getAllUsersWithSubscriptions } from '@/lib/access-control'
import { useSimpleAuth } from '@/components/providers/SimpleAuthProvider'
import { isAuthorizedAdmin } from '@/lib/admin-auth'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)
  const [createdUserPassword, setCreatedUserPassword] = useState<string | null>(null)
  const [createdUserEmail, setCreatedUserEmail] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    name: ''
  })
  
  // Use the auth context instead of direct auth calls
  const { user: currentUser, loading: authLoading } = useSimpleAuth()

  const fetchUsers = async () => {
    if (currentUser && currentUser.email) {
      try {
        const response = await fetch(`/api/admin/users?email=${encodeURIComponent(currentUser.email)}`, {
          headers: {
            'x-user-email': currentUser.email
          }
        })
        const data = await response.json()
        if (!response.ok) {
          if (response.status === 403) {
            setCreateError('Accès refusé. Vous n\'avez pas les permissions nécessaires.')
          }
          return
        }
        if (data.users) {
          setUsers(data.users)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [currentUser])

  const handleDeleteUser = async (userId: string, userEmail: string, userName: string) => {
    if (!currentUser?.email) {
      alert('Vous devez être connecté pour supprimer un utilisateur')
      return
    }

    const confirmMessage = `Êtes-vous sûr de vouloir supprimer l'utilisateur "${userName || userEmail}" ?\n\nCette action est irréversible et supprimera également tous les abonnements associés.`
    
    if (!confirm(confirmMessage)) {
      return
    }

    setDeleting(userId)

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': currentUser.email
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression de l\'utilisateur')
      }

      // Rafraîchir la liste des utilisateurs
      await fetchUsers()
      
      // Afficher un message de succès
      setCreateSuccess(`Utilisateur "${userName || userEmail}" supprimé avec succès`)
      setTimeout(() => setCreateSuccess(null), 5000)
    } catch (error: any) {
      console.error('Error deleting user:', error)
      setCreateError(error.message || 'Erreur lors de la suppression de l\'utilisateur')
      setTimeout(() => setCreateError(null), 5000)
    } finally {
      setDeleting(null)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    setCreateSuccess(null)

    if (!currentUser || !currentUser.email) {
      setCreateError('Vous devez être connecté pour créer un utilisateur')
      setCreating(false)
      return
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userEmail: currentUser.email // Passer l'email de l'utilisateur qui fait la requête
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de l\'utilisateur')
      }

      // Stocker le mot de passe et l'email pour l'affichage
      if (data.password) {
        setCreatedUserPassword(data.password)
        setCreatedUserEmail(data.user.email)
      }
      
      setCreateSuccess('Utilisateur créé avec succès avec accès intégral !')
      setFormData({ email: '', name: '' })
      setCreateError(null) // Réinitialiser les erreurs
      setShowCreateForm(false) // Fermer le formulaire mais garder le message visible
      
      // Rafraîchir la liste des utilisateurs
      await fetchUsers()
    } catch (error: any) {
      setCreateError(error.message || 'Erreur lors de la création de l\'utilisateur')
    } finally {
      setCreating(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Gestion des Utilisateurs et Abonnements
              </h1>
              <button
                onClick={() => {
                  setShowCreateForm(!showCreateForm)
                  // Réinitialiser les messages quand on ouvre le formulaire
                  if (!showCreateForm) {
                    setCreateError(null)
                    setCreateSuccess(null)
                    setCreatedUserPassword(null)
                    setCreatedUserEmail(null)
                  }
                }}
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Créer un utilisateur
              </button>
            </div>

            {/* Message de succès (affiché en dehors du formulaire pour rester visible) */}
            {createSuccess && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-semibold mb-2">{createSuccess}</p>
                {createdUserPassword && createdUserEmail && (
                  <div className="mt-4 p-4 bg-white border-2 border-green-300 rounded-lg">
                    <p className="text-sm font-semibold text-gray-700 mb-3">
                      📋 Informations de connexion à transmettre :
                    </p>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Email :</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-gray-100 px-3 py-2 rounded font-mono text-sm">
                            {createdUserEmail}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(createdUserEmail)
                              alert('Email copié !')
                            }}
                            className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded text-sm"
                          >
                            📋 Copier
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Mot de passe :</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-yellow-50 border-2 border-yellow-300 px-3 py-2 rounded font-mono text-lg font-bold text-gray-900">
                            {createdUserPassword}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(createdUserPassword)
                              alert('Mot de passe copié !')
                            }}
                            className="bg-yellow-200 hover:bg-yellow-300 px-3 py-2 rounded text-sm font-semibold"
                          >
                            📋 Copier
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-3 italic">
                      ⚠️ Notez ces informations avant de fermer cette fenêtre. Le mot de passe ne sera plus affiché.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCreatedUserPassword(null)
                        setCreatedUserEmail(null)
                        setCreateSuccess(null)
                      }}
                      className="mt-3 text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      Masquer les informations
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Formulaire de création */}
            {showCreateForm && (
              <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Créer un nouvel utilisateur avec accès intégral
                </h2>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  {createError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800">{createError}</p>
                    </div>
                  )}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="exemple@email.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom complet <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Prénom Nom"
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Note :</strong> L'utilisateur pourra se connecter avec son email. Le système d'authentification gère automatiquement les sessions.
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Accès intégral :</strong> Cet utilisateur aura accès à toutes les vidéos, programmes, audios et recettes sans limitation.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={creating}
                      className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creating ? 'Création...' : 'Créer l\'utilisateur'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false)
                        setFormData({ email: '', name: '' })
                        setCreateError(null)
                        setCreateSuccess(null)
                        setCreatedUserPassword(null)
                        setCreatedUserEmail(null)
                      }}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900">Total Utilisateurs</h3>
                  <p className="text-3xl font-bold text-blue-600">{users.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900">Abonnements Actifs</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {users.filter(u => u.hasActiveSubscription).length}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-yellow-900">Sans Abonnement</h3>
                  <p className="text-3xl font-bold text-yellow-600">
                    {users.filter(u => !u.hasActiveSubscription).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Abonnement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fin d'Abonnement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-600">
                                {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || 'Sans nom'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isAdmin ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            No Payment Made
                          </span>
                        ) : user.hasActiveSubscription ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {user.currentPlan || 'Actif'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Aucun
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isAdmin ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-1">
                              Admin
                            </span>
                            <span className="text-xs text-gray-500">
                              {user.adminNote}
                            </span>
                          </div>
                        ) : user.hasActiveSubscription ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.subscriptionEnd ? 
                          new Date(user.subscriptionEnd).toLocaleDateString('fr-FR') : 
                          '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {!user.isAdmin && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email, user.name)}
                            disabled={deleting === user.id}
                            className={`transition-colors ${
                              deleting === user.id
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-900'
                            }`}
                            title={deleting === user.id ? 'Suppression en cours...' : 'Supprimer l\'utilisateur'}
                          >
                            {deleting === user.id ? (
                              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Aucun utilisateur trouvé.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
