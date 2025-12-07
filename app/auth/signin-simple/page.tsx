'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSimpleAuth } from '@/components/providers/SimpleAuthProvider'
import { Button } from '@/components/ui/Button'

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, signUp } = useSimpleAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        // Sign up
        const planId = searchParams.get('planId')
        const { success, error: signUpError } = await signUp(email, password, email.split('@')[0], planId || undefined)
        if (success) {
          // Wait a moment for the auth state to be properly set
          setTimeout(() => {
            const callbackUrl = searchParams.get('callbackUrl')
            
            if (planId && callbackUrl) {
              // New user with planId - redirect to checkout
              console.log('New user with planId, redirecting to checkout:', `/checkout?planId=${planId}`)
              router.push(`/checkout?planId=${planId}`)
            } else {
              setError('Compte créé avec succès! Vous pouvez maintenant vous connecter.')
            }
          }, 500) // Small delay to ensure auth state is updated
        } else {
          setError(signUpError || 'Erreur lors de la création du compte')
        }
      } else {
        // Sign in
        const { success, error: signInError } = await signIn(email, password)
        if (success) {
          // Wait a moment for the auth state to be properly set
          setTimeout(() => {
            // Smart redirect based on where user came from
            const callbackUrl = searchParams.get('callbackUrl')
            const planId = searchParams.get('planId')
            const from = searchParams.get('from')
            
            if (planId && callbackUrl) {
              // Flow 2: Existing user with planId - redirect to subscriptions with auto-checkout
              console.log('Flow 2: Existing user with planId, redirecting to:', `${callbackUrl}?planId=${planId}&autoCheckout=true`)
              router.push(`${callbackUrl}?planId=${planId}&autoCheckout=true`)
            } else if (callbackUrl) {
              console.log('Redirecting to callback URL:', callbackUrl)
              router.push(callbackUrl)
            } else if (from === 'admin') {
              router.push('/admin/users')
            } else {
              router.push('/souscriptions/personnalise')
            }
          }, 500) // Small delay to ensure auth state is updated
        } else {
          setError(signInError || 'Erreur lors de la connexion')
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 py-12">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">
            {isSignUp ? 'Créer un compte' : 'Connexion'}
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm" style={{ color: error.includes('succès') ? '#39334D' : '#dc2626' }}>
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              fullWidth
              variant="primary"
              className="hover:opacity-90"
              style={{ backgroundColor: '#A65959' }}
            >
              {loading ? 'Chargement...' : (isSignUp ? 'Créer le compte' : 'Se connecter')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              onClick={() => setIsSignUp(!isSignUp)}
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700 text-sm underline"
            >
              {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? Créer un compte'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SimpleSignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 py-12">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-6"></div>
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
