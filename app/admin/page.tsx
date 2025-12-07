'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ContentType {
  key: string
  displayName: string
  table: string
}

interface ContentTypeSchema {
  contentType: string
  displayName: string
  table: string
  fields: Record<string, any>
}

export default function AdminDashboard() {
  const [contentTypes, setContentTypes] = useState<ContentType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchContentTypes()
  }, [])

  const fetchContentTypes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/content-types')
      if (!response.ok) {
        throw new Error('Failed to fetch content types')
      }
      const data = await response.json()
      setContentTypes(data.contentTypes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your Pilates coaching content</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Quick Create</h3>
                <p className="text-sm text-gray-500">Create new content quickly</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Published Content</h3>
                <p className="text-sm text-gray-500">View published content</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Draft Content</h3>
                <p className="text-sm text-gray-500">Manage draft content</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Types */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Content Management</h2>
            <p className="mt-1 text-sm text-gray-500">Manage different types of content for your Pilates coaching app</p>
          </div>
          
          <div className="p-6">
            {contentTypes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No content types available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contentTypes.map((contentType) => (
                  <Link
                    key={contentType.key}
                    href={`/admin/content/${contentType.key}`}
                    className="group block p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                          {contentType.displayName}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Manage {contentType.displayName.toLowerCase()}
                        </p>
                        <p className="mt-2 text-xs text-gray-400">
                          Table: {contentType.table}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Additional Tools */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database Connection</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Status</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Content Types</span>
                <span className="text-sm font-medium text-gray-900">{contentTypes.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link href="/admin/content/videos" className="block text-sm text-blue-600 hover:text-blue-800">
                Manage Videos (videos_new)
              </Link>
              <Link href="/admin/users" className="block text-sm text-blue-600 hover:text-blue-800">
                Manage Users
              </Link>
              <Link href="/admin/program-regions" className="block text-sm text-blue-600 hover:text-blue-800">
                Descriptions des Régions de Programmes
              </Link>
              <Link href="/admin/subscriptions" className="block text-sm text-blue-600 hover:text-blue-800">
                View Subscriptions
              </Link>
              <Link href="/admin/analytics" className="block text-sm text-blue-600 hover:text-blue-800">
                Analytics Dashboard
              </Link>
              <Link href="/" className="block text-sm text-blue-600 hover:text-blue-800">
                View Public Site
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}