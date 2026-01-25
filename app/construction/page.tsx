'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Construction, Wrench, Hammer, ArrowLeft } from 'lucide-react'

const ALLOWED_DOMAIN = 'only-you-coaching.com'

export default function ConstructionPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [domainCheck, setDomainCheck] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Vérifier le domaine d'abord
    const checkDomain = () => {
      if (typeof window === 'undefined') return false
      
      const hostname = window.location.hostname
      // Permettre l'accès sur le domaine de production ET en développement (localhost)
      const isAllowed = 
        hostname === ALLOWED_DOMAIN || 
        hostname === `www.${ALLOWED_DOMAIN}` ||
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('localhost:')
      
      console.log(`[Construction Page] Domaine détecté: ${hostname}, Autorisé: ${isAllowed}`)
      setDomainCheck(isAllowed)
      
      if (!isAllowed) {
        // Rediriger vers la page d'accueil si ce n'est pas le bon domaine
        console.log(`Accès refusé: domaine ${hostname} non autorisé. Domaine requis: ${ALLOWED_DOMAIN}`)
        router.push('/')
        return false
      }
      
      return true
    }

    if (!checkDomain()) {
      setLoading(false)
      return
    }

    // Vérifier l'authentification au chargement
    const checkAuth = () => {
      try {
        const authData = localStorage.getItem('construction-auth')
        if (authData) {
          const parsed = JSON.parse(authData)
          // Vérifier que l'authentification n'est pas expirée (24 heures)
          const isExpired = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000
          
          if (!isExpired) {
            setIsAuthenticated(true)
            setUser(parsed.user)
          } else {
            localStorage.removeItem('construction-auth')
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        localStorage.removeItem('construction-auth')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('construction-auth')
    router.push('/construction/login')
  }

  if (loading || domainCheck === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  // Vérifier le domaine - rediriger si ce n'est pas le bon domaine
  if (domainCheck === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-xl mb-4">Accès non autorisé</p>
          <p className="text-gray-300">Cette page n'est accessible que sur {ALLOWED_DOMAIN}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    router.push('/construction/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Construction className="w-8 h-8 text-primary-400" />
              <h1 className="text-2xl font-bold text-white">Page en Construction</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300 text-sm">
                Connecté en tant que: <span className="font-semibold text-white">{user?.email}</span>
              </span>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white"
              >
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-primary-500/20 rounded-full mb-6">
            <Construction className="w-12 h-12 text-primary-400" />
          </div>
          <h2 className="text-5xl font-bold text-white mb-4">
            Site en Construction
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Nous travaillons dur pour vous offrir une expérience exceptionnelle. 
            Cette page est temporairement accessible uniquement aux administrateurs.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10">
            <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mb-4">
              <Wrench className="w-6 h-6 text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">En Développement</h3>
            <p className="text-gray-300">
              Notre équipe travaille activement sur de nouvelles fonctionnalités et améliorations.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10">
            <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mb-4">
              <Hammer className="w-6 h-6 text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Bientôt Disponible</h3>
            <p className="text-gray-300">
              Le site complet sera bientôt accessible au public avec toutes les fonctionnalités.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10">
            <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mb-4">
              <Construction className="w-6 h-6 text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Accès Restreint</h3>
            <p className="text-gray-300">
              Cette page est temporairement réservée aux administrateurs et développeurs.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center">
          <Button
            onClick={() => router.push('/')}
            variant="primary"
            size="lg"
            className="mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  )
}
