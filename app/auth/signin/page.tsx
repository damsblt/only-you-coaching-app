'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSimpleAuth } from '@/components/providers/SimpleAuthProvider'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'

function SignInForm() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const { user, signIn, signUp } = useSimpleAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Vérifier si l'utilisateur vient de confirmer son email
    if (searchParams.get('confirmed') === 'true') {
      setConfirmed(true)
    }

    // Vérifier s'il y a une erreur de callback
    if (searchParams.get('error') === 'callback_error') {
      setError('Erreur lors de la connexion. Veuillez réessayer.')
    }

    // Si l'utilisateur est déjà connecté, rediriger
    if (user) {
      router.push('/')
    }
  }, [user, router, searchParams])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { success, error: signInError } = await signIn(email, password)
      if (success) {
        router.push('/')
      } else {
        setError(signInError || 'Erreur lors de la connexion')
      }
    } catch (error) {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')

    try {
      // For testing, just sign in with a mock Google user
      const { success, error: signInError } = await signIn('google@test.com', 'password')
      if (success) {
        router.push('/')
      } else {
        setError(signInError || 'Erreur lors de la connexion Google')
      }
    } catch (error) {
      setError('Erreur lors de la connexion Google. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { success, error: signUpError } = await signUp(email, password, email.split('@')[0])
      if (success) {
        setConfirmed(true)
        setEmail('')
        setPassword('')
        // Redirect to subscription page after a short delay
        setTimeout(() => {
          router.push('/souscriptions/personnalise')
        }, 2000)
      } else {
        setError(signUpError || 'Erreur lors de l\'inscription')
      }
    } catch (error) {
      setError('Une erreur est survenue lors de l\'inscription. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (user) {
    return (
      <Section gradient="neutral">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Déjà connecté !</h1>
          <p className="text-gray-600">Redirection vers la page d'accueil...</p>
        </div>
      </Section>
    )
  }

  return (
    <Section 
      gradient="soft" 
      title="Connexion" 
      subtitle="Accédez à votre contenu de coaching Pilates"
    >
      <div className="max-w-md mx-auto">
        {confirmed && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-green-500 text-xl mr-3">✅</div>
              <div>
                <h3 className="text-green-800 font-semibold">Compte créé !</h3>
                <p className="text-green-700 text-sm">
                  Votre compte a été créé. Redirection vers les abonnements...
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <Button onClick={handleGoogleSignIn} disabled={loading} fullWidth>
            {loading ? 'Connexion...' : 'Se connecter avec Google'}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">ou</span>
            </div>
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="votre@email.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" disabled={loading} fullWidth>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Pas encore de compte ?{' '}
              <button
                onClick={handleSignUp}
                disabled={loading}
                className="text-blue-600 hover:text-blue-700 font-medium underline"
              >
                S'inscrire
              </button>
            </p>
          </div>
        </div>
      </div>
    </Section>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <Section gradient="soft" title="Connexion" subtitle="Chargement...">
        <div className="max-w-md mx-auto text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </Section>
    }>
      <SignInForm />
    </Suspense>
  )
}
