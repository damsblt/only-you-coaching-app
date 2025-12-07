'use client'

import { useSimpleAuth } from '@/components/providers/SimpleAuthProvider'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'

export default function TestAuthPage() {
  const { user, loading, signIn, signUp, signOut } = useSimpleAuth()

  const handleTestSignIn = async () => {
    const { success, error } = await signIn('test@example.com', 'password123')
    if (error) {
      console.error('Sign in error:', error)
    } else {
      console.log('Sign in success:', success)
    }
  }

  const handleTestSignUp = async () => {
    const { success, error } = await signUp('test@example.com', 'password123', 'Test User')
    if (error) {
      console.error('Sign up error:', error)
    } else {
      console.log('Sign up success:', success)
    }
  }

  if (loading) {
    return (
      <Section gradient="soft" title="Test Auth" subtitle="Loading...">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </Section>
    )
  }

  return (
    <Section gradient="soft" title="Test Auth" subtitle="Test Simple Authentication">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Current Auth State</h3>
          <div className="space-y-2">
            <p><strong>User:</strong> {user ? user.email : 'Not signed in'}</p>
            <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
            <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Test Actions</h3>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleTestSignUp}>
                Test Sign Up
              </Button>
              <Button onClick={handleTestSignIn}>
                Test Sign In
              </Button>
              <Button onClick={signOut} variant="outline">
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {user && (
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-2">User Details</h3>
            <pre className="text-sm text-green-700 overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}

        {session && (
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Session Details</h3>
            <pre className="text-sm text-blue-700 overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Section>
  )
}

