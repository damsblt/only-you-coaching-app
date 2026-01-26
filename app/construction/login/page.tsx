'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Lock, Mail } from 'lucide-react'

const ALLOWED_DOMAIN = 'only-you-coaching.com'

function ConstructionLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Vérifier le domaine au chargement
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      // Permettre l'accès sur le domaine de production ET en développement (localhost)
      const isAllowed = 
        hostname === ALLOWED_DOMAIN || 
        hostname === `www.${ALLOWED_DOMAIN}` ||
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('localhost:')
      
      console.log(`[Construction Login] Domaine détecté: ${hostname}, Autorisé: ${isAllowed}`)
      
      if (!isAllowed) {
        // Rediriger vers la page d'accueil si ce n'est pas le bon domaine
        console.log(`Accès refusé: domaine ${hostname} non autorisé. Domaine requis: ${ALLOWED_DOMAIN}`)
        router.push('/')
      }
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/construction-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Le cookie est maintenant défini côté serveur, pas besoin de localStorage
        // Mais on peut garder localStorage pour l'affichage côté client
        localStorage.setItem('construction-auth', JSON.stringify({
          user: data.user,
          timestamp: Date.now()
        }))
        
        // Rediriger vers la page en construction ou vers l'URL d'origine si fournie
        const redirectTo = searchParams.get('redirect') || '/construction'
        router.push(redirectTo)
      } else {
        setError(data.error || 'Erreur lors de la connexion')
      }
    } catch (err: any) {
      setError('Erreur de connexion. Veuillez réessayer.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/20 rounded-full mb-4">
              <Lock className="w-8 h-8 text-primary-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Accès Restreint
            </h1>
            <p className="text-gray-300">
              Page en construction - Accès autorisé uniquement
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="votre@email.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-sm text-red-200">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              size="lg"
              className="w-full"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ConstructionLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    }>
      <ConstructionLoginForm />
    </Suspense>
  )
}
