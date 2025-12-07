'use client'

import { useState, useEffect } from 'react'
import { useSimpleAuth } from '@/components/providers/SimpleAuthProvider'

export default function DebugAuthPage() {
  const [loading, setLoading] = useState(true)
  const [urlInfo, setUrlInfo] = useState<any>({})
  const { user, loading: authLoading } = useSimpleAuth()

  useEffect(() => {
    const getAuthInfo = async () => {
      try {
        // Get current URL info
        setUrlInfo({
          href: window.location.href,
          hash: window.location.hash,
          search: window.location.search,
          pathname: window.location.pathname
        })
      } catch (error) {
        console.error('Error getting URL info:', error)
      } finally {
        setLoading(false)
      }
    }

    getAuthInfo()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Auth Information</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">URL Information</h2>
          <pre className="text-sm">{JSON.stringify(urlInfo, null, 2)}</pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">User Information (Simple Auth)</h2>
          <pre className="text-sm">{JSON.stringify(user, null, 2)}</pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Auth Loading State</h2>
          <p>Loading: {authLoading ? 'Yes' : 'No'}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Environment Variables</h2>
          <div className="text-sm">
            <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
            <p>NEXT_PUBLIC_SITE_URL: {process.env.NEXT_PUBLIC_SITE_URL}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

