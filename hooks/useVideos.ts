import { useState, useEffect } from 'react'

interface Video {
  id: string
  title: string
  description: string
  detailedDescription?: string
  thumbnail: string
  videoUrl: string
  duration: number
  difficulty: string
  category: string
  region?: string
  muscleGroups: string[]
  startingPosition?: string
  movement?: string
  intensity?: string
  theme?: string
  series?: string
  constraints?: string
  tags: string[]
  isPublished: boolean
}

interface UseVideosOptions {
  muscleGroup?: string
  programme?: string
  difficulty?: string
  search?: string
  videoType?: string
}

export function useVideos(options: UseVideosOptions = {}) {
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Build query params for API
        const params = new URLSearchParams()
        
        if (options.videoType) {
          params.set('videoType', options.videoType)
        }
        
        if (options.muscleGroup && options.muscleGroup !== 'all') {
          params.set('muscleGroup', options.muscleGroup)
        }

        if (options.programme && options.programme !== 'all') {
          params.set('programme', options.programme)
        }

        if (options.difficulty && options.difficulty !== 'all') {
          params.set('difficulty', options.difficulty)
        }

        if (options.search) {
          params.set('search', options.search)
        }

        // Use API endpoint which generates signed URLs for thumbnails
        const response = await fetch(`/api/videos?${params.toString()}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch videos: ${response.statusText}`)
        }
        
        const data = await response.json()
        setVideos(data || [])
      } catch (err) {
        console.error('Error fetching videos:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch videos')
      } finally {
        setIsLoading(false)
      }
    }

    fetchVideos()
  }, [options.muscleGroup, options.programme, options.difficulty, options.search, options.videoType])

  return { videos, isLoading, error }
}
