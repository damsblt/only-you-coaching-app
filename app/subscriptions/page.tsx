'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SubscriptionsPage() {
  const router = useRouter()

  useEffect(() => {
    // Rediriger vers la page Coaching personnalisé par défaut
    router.replace('/subscriptions/personnalise')
  }, [router])

  // Afficher un loader pendant la redirection
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Redirection...</p>
      </div>
    </div>
  )
}
