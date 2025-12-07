'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ProgramRegionDescription {
  id: string
  region_slug: string
  display_name: string
  description?: string
  created_at: string
  updated_at: string
}

export default function ProgramRegionsManager() {
  const [regions, setRegions] = useState<ProgramRegionDescription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingRegion, setEditingRegion] = useState<ProgramRegionDescription | null>(null)
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState({
    region_slug: '',
    display_name: '',
    description: ''
  })

  // Fetch regions
  const fetchRegions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/program-regions')
      if (!response.ok) {
        throw new Error('Failed to fetch region descriptions')
      }
      const data = await response.json()
      setRegions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRegions()
  }, [])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      
      const url = editingRegion 
        ? `/api/program-regions?id=${editingRegion.id}`
        : '/api/program-regions'
      
      const method = editingRegion ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save region description')
      }

      // Reset form and refresh data
      setFormData({ region_slug: '', display_name: '', description: '' })
      setShowCreateForm(false)
      setEditingRegion(null)
      await fetchRegions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Handle edit
  const handleEdit = (region: ProgramRegionDescription) => {
    setFormData({
      region_slug: region.region_slug,
      display_name: region.display_name,
      description: region.description || ''
    })
    setEditingRegion(region)
    setShowCreateForm(true)
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette description de région ?')) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/program-regions?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete region description')
      }

      await fetchRegions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Auto-generate display name from region slug
  const handleRegionSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value
    // Generate display name from slug (e.g., "haute-intensite" -> "Haute Intensité")
    const displayName = slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    setFormData(prev => ({ ...prev, region_slug: slug, display_name: displayName || prev.display_name }))
  }

  if (loading && regions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des descriptions...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Descriptions des Régions de Programmes</h1>
              <p className="mt-2 text-gray-600">Gérez les descriptions affichées sur les pages de chaque région de programme</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Retour
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Ajouter une Région
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingRegion ? 'Modifier la Description' : 'Ajouter une Nouvelle Région'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug de la Région *
                  </label>
                  <input
                    type="text"
                    value={formData.region_slug}
                    onChange={handleRegionSlugChange}
                    required
                    disabled={!!editingRegion}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="ex: haute-intensite"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    L'identifiant unique de la région (ne peut pas être modifié)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom d'Affichage *
                  </label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ex: Haute Intensité"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Entrez la description qui sera affichée sur la page de cette région..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Cette description sera visible sur la page /programmes/[region]
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingRegion(null)
                    setFormData({ region_slug: '', display_name: '', description: '' })
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Enregistrement...' : (editingRegion ? 'Mettre à jour' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Regions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Régions ({regions.length})</h2>
          </div>
          
          {regions.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>Aucune description de région trouvée. Ajoutez votre première région pour commencer.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {regions.map((region) => (
                <div key={region.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{region.display_name}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          /programmes/{region.region_slug}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">Slug: {region.region_slug}</p>
                      {region.description ? (
                        <p className="mt-2 text-sm text-gray-600">{region.description}</p>
                      ) : (
                        <p className="mt-2 text-sm text-gray-400 italic">Aucune description</p>
                      )}
                      <p className="mt-2 text-xs text-gray-400">
                        Créé: {new Date(region.created_at).toLocaleDateString('fr-FR')}
                        {region.updated_at !== region.created_at && (
                          <span> • Modifié: {new Date(region.updated_at).toLocaleDateString('fr-FR')}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(region)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(region.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Supprimer
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


