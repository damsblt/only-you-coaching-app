import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

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

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        let query = supabase.from('videos_new').select('*').order('title', { ascending: true })

        // Only published
        query = query.eq('isPublished', true)

        if (options.videoType === 'muscle-groups') {
          query = query.eq('videoType', 'MUSCLE_GROUPS')
        } else if (options.videoType === 'programmes') {
          query = query.eq('videoType', 'PROGRAMMES')
        }

        if (options.muscleGroup && options.muscleGroup !== 'all') {
          const muscleGroupMap: { [key: string]: string } = {
            'Abdos': 'abdos',
            'Bande': 'bande',
            'Biceps': 'biceps',
            'Cardio': 'cardio',
            'Dos': 'dos',
            'Fessiers et jambes': 'fessiers-jambes',
            'Streching': 'streching',
            'Triceps': 'triceps'
          }
          const region = muscleGroupMap[options.muscleGroup]
          if (region) query = query.eq('region', region)
        }

        if (options.programme && options.programme !== 'all') {
          query = query.eq('region', options.programme)
        }

        if (options.difficulty && options.difficulty !== 'all') {
          query = query.eq('difficulty', options.difficulty)
        }

        if (options.search) {
          const s = options.search
          const ilike = (col: string) => `${col}.ilike.%${s}%`
          query = query.or([
            ilike('title'),
            ilike('description'),
            ilike('startingPosition'),
            ilike('movement'),
            ilike('theme')
          ].join(','))
        }

        const { data, error } = await query.limit(1000)
        if (error) throw new Error(error.message)
        setVideos(data || [])
      } catch (err) {
        console.error('Error fetching videos (client supabase):', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch videos')
      } finally {
        setIsLoading(false)
      }
    }

    fetchVideos()
  }, [options.muscleGroup, options.programme, options.difficulty, options.search, options.videoType])

  return { videos, isLoading, error }
}
