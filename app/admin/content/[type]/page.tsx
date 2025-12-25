'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface ContentTypeSchema {
  contentType: string
  displayName: string
  table: string
  fields: Record<string, {
    type: string
    required: boolean
    label: string
    default?: any
  }>
}

interface ContentItem {
  id: string
  [key: string]: any
}

export default function DynamicContentManager() {
  const routeParams = useParams()
  const contentType = (routeParams?.type || '') as string
  
  const [schema, setSchema] = useState<ContentTypeSchema | null>(null)
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})

  // Fetch content type schema
  const fetchSchema = async () => {
    try {
      const response = await fetch(`/api/content-types?type=${contentType}`)
      if (!response.ok) {
        throw new Error('Failed to fetch content type schema')
      }
      const data = await response.json()
      setSchema(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  // Fetch content items
  const fetchItems = async () => {
    try {
      const response = await fetch(`/api/content?type=${contentType}`)
      if (!response.ok) {
        throw new Error('Failed to fetch content')
      }
      const data = await response.json()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (contentType) {
      fetchSchema()
      fetchItems()
    }
  }, [contentType])

  // Initialize form data
  useEffect(() => {
    if (schema) {
      const initialData: Record<string, any> = {}
      Object.entries(schema.fields).forEach(([key, field]) => {
        initialData[key] = field.default || (field.type === 'boolean' ? false : '')
      })
      setFormData(initialData)
    }
  }, [schema])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      
      const url = editingItem 
        ? `/api/content?type=${contentType}&id=${editingItem.id}`
        : `/api/content?type=${contentType}`
      
      const method = editingItem ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save content')
      }

      // Reset form and refresh data
      setFormData({})
      setShowCreateForm(false)
      setEditingItem(null)
      await fetchItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Handle edit
  const handleEdit = (item: ContentItem) => {
    setFormData(item)
    setEditingItem(item)
    setShowCreateForm(true)
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/content?type=${contentType}&id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete content')
      }

      await fetchItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Render form field
  const renderField = (key: string, field: any) => {
    const value = formData[key] || ''
    
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        )
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        )
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [key]: Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        )
      case 'url':
        return (
          <input
            type="url"
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        )
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        )
    }
  }

  if (loading && !schema) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading content manager...</p>
        </div>
      </div>
    )
  }

  if (!schema) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Content Type Not Found</h1>
          <p className="mt-2 text-gray-600">The requested content type does not exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{schema.displayName} Manager</h1>
              <p className="mt-2 text-gray-600">Manage your {schema.displayName.toLowerCase()}</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-footer-500 hover:bg-footer-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              Create New {schema.displayName.slice(0, -1)}
            </button>
          </div>
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

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingItem ? `Edit ${schema.displayName.slice(0, -1)}` : `Create New ${schema.displayName.slice(0, -1)}`}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(schema.fields).map(([key, field]) => (
                  <div key={key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label} {field.required && '*'}
                    </label>
                    {renderField(key, field)}
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingItem(null)
                    setFormData({})
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Content List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{schema.displayName} ({items.length})</h2>
          </div>
          
          {items.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>No {schema.displayName.toLowerCase()} found. Create your first item to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {items.map((item) => (
                <div key={item.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {item.name || item.title || `Item ${item.id}`}
                        </h3>
                        {item.is_published !== undefined && (
                          item.is_published ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Draft
                            </span>
                          )
                        )}
                      </div>
                      {item.slug && (
                        <p className="mt-1 text-sm text-gray-500">/{item.slug}</p>
                      )}
                      {item.description && (
                        <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                      )}
                      <p className="mt-2 text-xs text-gray-400">
                        Created: {new Date(item.created_at).toLocaleDateString()}
                        {item.updated_at !== item.created_at && (
                          <span> • Updated: {new Date(item.updated_at).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

