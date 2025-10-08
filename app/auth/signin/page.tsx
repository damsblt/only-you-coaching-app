'use client'

import { signIn, getSession } from 'next-auth/react'
import { Session } from 'next-auth'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const router = useRouter()

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        setSession(session)
        router.push('/')
      }
    })
  }, [router])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signIn('google', { callbackUrl: '/' })
    } catch (error) {
      console.error('Google sign-in error:', error)
      alert('Google sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (session) {
    return (
      <Section gradient="neutral">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Already signed in!</h1>
          <p className="text-gray-600">Redirecting to homepage...</p>
        </div>
      </Section>
    )
  }

  return (
    <Section gradient="soft" title="Connexion" subtitle="Accédez à votre contenu de coaching Pilates">
      <div className="max-w-md mx-auto">
        <Button onClick={handleGoogleSignIn} disabled={loading} fullWidth>
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </Button>
        <div className="mt-4 text-center text-sm text-gray-600">
          Email authentication will be available soon
        </div>
      </div>
    </Section>
  )
}
