'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Video {
  id: string
  title: string
  description: string | null
  detailedDescription: string | null
  thumbnail: string | null
  videoUrl: string
  duration: number
  difficulty: string
  category: string
  region: string | null
  muscleGroups: string[]
  startingPosition: string | null
  movement: string | null
  intensity: string | null
  theme: string | null
  series: string | null
  constraints: string | null
  tags: string[]
  isPublished: boolean
  videoType: string
  createdAt: string
  updatedAt: string
  folder: string | null
}

export default function VideosContentAdmin() {
  const [programmeVideos, setProgrammeVideos] = useState<Video[]>([])
  const [muscleGroupVideos, setMuscleGroupVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [currentVideoType, setCurrentVideoType] = useState<'PROGRAMMES' | 'MUSCLE_GROUPS'>('MUSCLE_GROUPS')
  const [activeSection, setActiveSection] = useState<'PROGRAMMES' | 'MUSCLE_GROUPS'>('MUSCLE_GROUPS')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    detailedDescription: '',
    thumbnail: '',
    videoUrl: '',
    duration: 0,
    difficulty: 'BEGINNER',
    category: '',
    region: '',
    muscleGroups: [] as string[],
    startingPosition: '',
    movement: '',
    intensity: '',
    theme: '',
    series: '',
    constraints: '',
    tags: [] as string[],
    isPublished: false,
    videoType: 'MUSCLE_GROUPS',
    folder: ''
  })

  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Fetch videos
  const fetchVideos = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch PROGRAMMES videos
      const programmesResponse = await fetch('/api/admin/videos-new?videoType=PROGRAMMES&includeUnpublished=true')
      if (!programmesResponse.ok) throw new Error('Failed to fetch PROGRAMMES videos')
      const programmesData = await programmesResponse.json()
      setProgrammeVideos(programmesData)

      // Fetch MUSCLE_GROUPS videos
      const muscleGroupResponse = await fetch('/api/admin/videos-new?videoType=MUSCLE_GROUPS&includeUnpublished=true')
      if (!muscleGroupResponse.ok) throw new Error('Failed to fetch MUSCLE_GROUPS videos')
      const muscleGroupData = await muscleGroupResponse.json()
      setMuscleGroupVideos(muscleGroupData)

      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  // Reset form when switching sections
  useEffect(() => {
    if (showCreateForm) {
      setCurrentVideoType(activeSection)
      setFormData(prev => ({ ...prev, videoType: activeSection }))
    }
  }, [activeSection, showCreateForm])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)

      const url = editingVideo
        ? `/api/admin/videos-new?id=${editingVideo.id}`
        : '/api/admin/videos-new'

      const method = editingVideo ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save video')
      }

      const result = await response.json()

      // Lambda AWS will automatically generate thumbnail when video is uploaded to S3
      // No need to call API here - Lambda handles it via S3 trigger
      if (result?.id && !formData.thumbnail) {
        console.log('Video créée. La Lambda AWS génèrera automatiquement le thumbnail depuis S3.')
        // Lambda will handle thumbnail generation asynchronously
        // Refresh after a delay to show thumbnail once Lambda has processed it
        setTimeout(async () => {
          await fetchVideos()
        }, 5000) // Wait 5 seconds for Lambda to process
      }

      // Reset form and refresh
      resetForm()
      await fetchVideos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedVideoFile && !selectedThumbnailFile) {
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const uploadFormData = new FormData()
      if (selectedVideoFile) {
        uploadFormData.append('video', selectedVideoFile)
      }
      if (selectedThumbnailFile) {
        uploadFormData.append('thumbnail', selectedThumbnailFile)
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 300)

      const response = await fetch('/api/admin/videos-new/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      clearInterval(progressInterval)
      setUploadProgress(90)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      setUploadProgress(100)

      // Update form with uploaded URLs
      if (result.videoUrl) {
        setFormData(prev => ({ ...prev, videoUrl: result.videoUrl }))
      }
      if (result.thumbnailUrl) {
        setFormData(prev => ({ ...prev, thumbnail: result.thumbnailUrl }))
      }

      // Clear file selections
      setSelectedVideoFile(null)
      setSelectedThumbnailFile(null)

      // Show success message
      alert('Fichiers uploadés avec succès ! Les URLs ont été remplies automatiquement.')

      setTimeout(() => setUploadProgress(0), 2000)
    } catch (err) {
      console.error('Upload error:', err)
      alert(`Erreur lors de l'upload: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      detailedDescription: '',
      thumbnail: '',
      videoUrl: '',
      duration: 0,
      difficulty: 'BEGINNER',
      category: '',
      region: '',
      muscleGroups: [],
      startingPosition: '',
      movement: '',
      intensity: '',
      theme: '',
      series: '',
      constraints: '',
      tags: [],
      isPublished: false,
      videoType: activeSection,
      folder: ''
    })
    setSelectedVideoFile(null)
    setSelectedThumbnailFile(null)
    setShowCreateForm(false)
    setEditingVideo(null)
    setUploadProgress(0)
  }

  // Handle edit
  const handleEdit = (video: Video) => {
    setFormData({
      title: video.title,
      description: video.description || '',
      detailedDescription: video.detailedDescription || '',
      thumbnail: video.thumbnail || '',
      videoUrl: video.videoUrl,
      duration: video.duration,
      difficulty: video.difficulty,
      category: video.category,
      region: video.region || '',
      muscleGroups: video.muscleGroups || [],
      startingPosition: video.startingPosition || '',
      movement: video.movement || '',
      intensity: video.intensity || '',
      theme: video.theme || '',
      series: video.series || '',
      constraints: video.constraints || '',
      tags: video.tags || [],
      isPublished: video.isPublished,
      videoType: video.videoType,
      folder: video.folder || ''
    })
    setEditingVideo(video)
    setCurrentVideoType(video.videoType as 'PROGRAMMES' | 'MUSCLE_GROUPS')
    setActiveSection(video.videoType as 'PROGRAMMES' | 'MUSCLE_GROUPS')
    setShowCreateForm(true)
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return

    try {
      setLoading(true)
      const response = await fetch(`/api/admin/videos-new?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete video')
      }

      await fetchVideos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const currentVideos = activeSection === 'PROGRAMMES' ? programmeVideos : muscleGroupVideos

  if (loading && programmeVideos.length === 0 && muscleGroupVideos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading videos...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Videos Management</h1>
              <p className="mt-2 text-gray-600">Edit videos for programmes and muscle groups</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Back to Admin
              </Link>
              <button
                onClick={() => {
                  setShowCreateForm(true)
                  setEditingVideo(null)
                  setCurrentVideoType(activeSection)
                }}
                className="bg-footer-500 hover:bg-footer-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                Create New Video
              </button>
            </div>
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

        {/* Section Toggle */}
        <div className="mb-6 flex gap-4 bg-white p-1 rounded-lg shadow-sm inline-flex">
          <button
            onClick={() => setActiveSection('MUSCLE_GROUPS')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              activeSection === 'MUSCLE_GROUPS'
                ? 'bg-footer-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Vidéos ({muscleGroupVideos.length})
          </button>
          <button
            onClick={() => setActiveSection('PROGRAMMES')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              activeSection === 'PROGRAMMES'
                ? 'bg-footer-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Programmes ({programmeVideos.length})
          </button>
        </div>

        {/* Active Section Info */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Currently viewing:</strong> {activeSection === 'PROGRAMMES' 
              ? 'Videos for Programmes (shown on /programmes)' 
              : 'Vidéos (shown on /bibliotheque-videos)'}
          </p>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingVideo ? 'Edit Video' : 'Create New Video'}
              <span className="ml-2 text-sm font-normal text-gray-500">
                (Type: {currentVideoType})
              </span>
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Video File
                    <span className="ml-1 text-xs text-gray-500">(max 500MB, formats: mp4, mov, etc.)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setSelectedVideoFile(file)
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    {selectedVideoFile && (
                      <span className="flex items-center text-sm text-gray-600 px-2">
                        {selectedVideoFile.name}
                        <button
                          type="button"
                          onClick={() => setSelectedVideoFile(null)}
                          className="ml-2 text-red-600 hover:text-red-800"
                          title="Remove file"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Thumbnail Image
                    <span className="ml-1 text-xs text-gray-500">(formats: jpg, png, etc.)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setSelectedThumbnailFile(file)
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    {selectedThumbnailFile && (
                      <span className="flex items-center text-sm text-gray-600 px-2">
                        {selectedThumbnailFile.name}
                        <button
                          type="button"
                          onClick={() => setSelectedThumbnailFile(null)}
                          className="ml-2 text-red-600 hover:text-red-800"
                          title="Remove file"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                </div>
                {(selectedVideoFile || selectedThumbnailFile) && (
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={handleFileUpload}
                      disabled={uploading}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? `Upload en cours... ${uploadProgress}%` : 'Uploader les fichiers vers S3'}
                    </button>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                )}
                <div className="md:col-span-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>ℹ️ Génération automatique de thumbnail</strong>
                    </p>
                    <p className="mt-1 text-xs text-blue-700">
                      Si aucun thumbnail n'est fourni, la Lambda AWS générera automatiquement un thumbnail 
                      depuis la vidéo (frame à 5 secondes) une fois la vidéo uploadée dans S3.
                      Le thumbnail apparaîtra dans la liste après quelques secondes.
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Video URL *</label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ou entrez une URL manuellement"
                  />
                  {formData.videoUrl && (
                    <p className="mt-1 text-xs text-gray-500">✓ URL de vidéo définie</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                  <input
                    type="url"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData(prev => ({ ...prev, thumbnail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ou entrez une URL manuellement"
                  />
                  {formData.thumbnail && (
                    <p className="mt-1 text-xs text-gray-500">✓ URL de thumbnail définie</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (seconds)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Intensity</label>
                  <input
                    type="text"
                    value={formData.intensity}
                    onChange={(e) => setFormData(prev => ({ ...prev, intensity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                  <input
                    type="text"
                    value={formData.theme}
                    onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Series</label>
                  <input
                    type="text"
                    value={formData.series}
                    onChange={(e) => setFormData(prev => ({ ...prev, series: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Starting Position</label>
                  <input
                    type="text"
                    value={formData.startingPosition}
                    onChange={(e) => setFormData(prev => ({ ...prev, startingPosition: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Movement</label>
                  <input
                    type="text"
                    value={formData.movement}
                    onChange={(e) => setFormData(prev => ({ ...prev, movement: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Constraints</label>
                  <input
                    type="text"
                    value={formData.constraints}
                    onChange={(e) => setFormData(prev => ({ ...prev, constraints: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Folder</label>
                  <input
                    type="text"
                    value={formData.folder}
                    onChange={(e) => setFormData(prev => ({ ...prev, folder: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Textareas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description</label>
                  <textarea
                    value={formData.detailedDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, detailedDescription: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Arrays */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Muscle Groups (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.muscleGroups.join(', ')}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      muscleGroups: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="abdos, biceps, triceps"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags.join(', ')}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      tags: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>

              {/* Published */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
                  Publish this video
                </label>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingVideo ? 'Update Video' : 'Create Video')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Videos List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeSection} Videos ({currentVideos.length})
            </h2>
          </div>

          {currentVideos.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>No {activeSection.toLowerCase()} videos found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {currentVideos.map((video) => (
                <div key={video.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{video.title}</h3>
                        {video.isPublished ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Draft
                          </span>
                        )}
                      </div>
                      {video.description && (
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{video.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                        {video.region && <span>📍 {video.region}</span>}
                        {video.difficulty && <span>⚡ {video.difficulty}</span>}
                        {video.duration > 0 && <span>⏱️ {video.duration}s</span>}
                        {video.videoType && <span>🏷️ {video.videoType}</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(video)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(video.id)}
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

