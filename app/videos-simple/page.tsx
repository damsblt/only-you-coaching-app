'use client'

import { useState, useEffect } from 'react'
import { Video } from '@/types'

export default function VideosSimplePage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchVideos() {
      try {
        console.log('🔍 Fetching videos...')
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/videos-simple')
        console.log('📡 Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Videos fetched:', data.length)
          setVideos(data)
        } else {
          const errorData = await response.json()
          console.error('❌ API Error:', errorData)
          setError(`API Error: ${errorData.error || 'Unknown error'}`)
        }
      } catch (error) {
        console.error('❌ Fetch Error:', error)
        setError(`Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading videos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Videos Simple Test</h1>
          <p className="text-gray-600">Found {videos.length} videos</p>
        </div>

        {videos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No videos found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {video.thumbnail && (
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      console.log('❌ Thumbnail failed to load:', video.thumbnail)
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{video.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{video.description}</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {video.difficulty}
                    </span>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      {video.category}
                    </span>
                    {video.videoType && (
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                        {video.videoType}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Duration: {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

