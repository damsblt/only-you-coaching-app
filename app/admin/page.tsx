'use client'

import { useState, useEffect } from 'react'
import { Edit, Save, X, Plus, Trash2, Eye } from 'lucide-react'

interface Video {
  id: string
  title: string
  description: string
  detailedDescription: string
  thumbnail: string
  videoUrl: string
  duration: number
  difficulty: string
  category: string
  region: string
  muscleGroups: string[]
  startingPosition: string
  movement: string
  intensity: string
  theme: string
  series: string
  constraints: string
  tags: string[]
  isPublished: boolean
}

export default function AdminPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch videos
  useEffect(() => {
    async function fetchVideos() {
      try {
        const response = await fetch('/api/videos')
        if (!response.ok) throw new Error('Failed to fetch videos')
        const data = await response.json()
        setVideos(data)
      } catch (error) {
        console.error('Error fetching videos:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchVideos()
  }, [])

  // Update video
  const updateVideo = async (video: Video) => {
    try {
      // Ensure muscleGroups and tags are arrays, not null
      const videoData = {
        ...video,
        muscleGroups: Array.isArray(video.muscleGroups) ? video.muscleGroups : [],
        tags: Array.isArray(video.tags) ? video.tags : []
      }
      
      console.log('Updating video:', videoData)
      
      const response = await fetch(`/api/videos/${video.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoData)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', response.status, errorText)
        throw new Error(`Failed to update video: ${response.status} ${errorText}`)
      }
      
      const updatedVideo = await response.json()
      console.log('Video updated successfully:', updatedVideo)
      
      setVideos(videos.map(v => v.id === video.id ? updatedVideo : v))
      setEditingVideo(null)
    } catch (error) {
      console.error('Error updating video:', error)
      alert(`Erreur lors de la mise à jour: ${error.message}`)
    }
  }

  // Regenerate thumbnail
  const regenerateThumbnail = async (videoId: string) => {
    try {
      const response = await fetch(`/api/videos/${videoId}/thumbnail`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Failed to regenerate thumbnail')
      
      const updatedVideo = await response.json()
      setVideos(videos.map(v => v.id === videoId ? updatedVideo : v))
      
      // Show success message
      alert('Miniature régénérée avec succès!')
    } catch (error) {
      console.error('Error regenerating thumbnail:', error)
      alert('Erreur lors de la régénération de la miniature')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des vidéos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Administration des Vidéos</h1>
          <p className="text-gray-600 mt-2">Gérez vos vidéos Pilates</p>
        </div>

        {/* Videos List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Vidéos ({videos.length})</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {videos.map((video) => (
              <div key={video.id} className="p-6">
                <div className="flex items-start justify-between">
                  {/* Video Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-2">
                      {/* Thumbnail */}
                      {video.thumbnail && (
                        <div className="flex-shrink-0">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-20 h-14 object-cover rounded-lg border"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Video Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{video.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            video.difficulty === 'BEGINNER' ? 'bg-green-100 text-green-800' :
                            video.difficulty === 'INTERMEDIATE' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {video.difficulty}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {video.category}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {video.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-2">
                          {(Array.isArray(video.muscleGroups) ? video.muscleGroups : []).slice(0, 3).map((muscle, index) => (
                            <span key={index} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                              {muscle}
                            </span>
                          ))}
                          {(Array.isArray(video.muscleGroups) ? video.muscleGroups : []).length > 3 && (
                            <span className="text-gray-500 text-xs">
                              +{(Array.isArray(video.muscleGroups) ? video.muscleGroups : []).length - 3} autres
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setEditingVideo(video)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => regenerateThumbnail(video.id)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Régénérer la miniature"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Voir la vidéo"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Modal */}
        {editingVideo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Modifier la vidéo</h2>
                  <button
                    onClick={() => setEditingVideo(null)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    updateVideo(editingVideo)
                  }}
                  className="space-y-6"
                >
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Titre
                      </label>
                      <input
                        type="text"
                        value={editingVideo.title || ''}
                        onChange={(e) => setEditingVideo({...editingVideo, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Catégorie
                      </label>
                      <select
                        value={editingVideo.category || ''}
                        onChange={(e) => setEditingVideo({...editingVideo, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="Pilates">Pilates</option>
                        <option value="Renforcement">Renforcement</option>
                        <option value="Méditation">Méditation</option>
                        <option value="Étirement">Étirement</option>
                      </select>
                    </div>
                  </div>

                  {/* Descriptions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description courte
                    </label>
                    <textarea
                      value={editingVideo.description || ''}
                      onChange={(e) => setEditingVideo({...editingVideo, description: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description détaillée
                    </label>
                    <textarea
                      value={editingVideo.detailedDescription || ''}
                      onChange={(e) => setEditingVideo({...editingVideo, detailedDescription: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Thumbnail */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL de la miniature
                    </label>
                    <input
                      type="url"
                      value={editingVideo.thumbnail || ''}
                      onChange={(e) => setEditingVideo({...editingVideo, thumbnail: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://example.com/thumbnail.jpg"
                    />
                    {editingVideo.thumbnail && (
                      <div className="mt-2">
                        <img
                          src={editingVideo.thumbnail}
                          alt="Thumbnail preview"
                          className="w-32 h-20 object-cover rounded-lg border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Exercise Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Position de départ
                      </label>
                      <textarea
                        value={editingVideo.startingPosition || ''}
                        onChange={(e) => setEditingVideo({...editingVideo, startingPosition: e.target.value})}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mouvement
                      </label>
                      <textarea
                        value={editingVideo.movement || ''}
                        onChange={(e) => setEditingVideo({...editingVideo, movement: e.target.value})}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Muscle Groups */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Muscles ciblés (séparés par des virgules)
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(editingVideo.muscleGroups) ? editingVideo.muscleGroups.join(', ') : ''}
                      onChange={(e) => setEditingVideo({...editingVideo, muscleGroups: e.target.value.split(',').map(m => m.trim()).filter(m => m)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Abdominaux, Cuisses, Fessiers"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags (séparés par des virgules)
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(editingVideo.tags) ? editingVideo.tags.join(', ') : ''}
                      onChange={(e) => setEditingVideo({...editingVideo, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="pilates, débutant, abdos"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setEditingVideo(null)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Sauvegarder
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
