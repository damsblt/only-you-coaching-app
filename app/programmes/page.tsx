"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from '@supabase/supabase-js'
import { Search, Filter, Play, Clock, Star, Grid, List, ArrowLeft, ArrowRight } from "lucide-react"
import EnhancedVideoCard from "@/components/video/EnhancedVideoCard"
import SimpleVideoPlayer from "@/components/video/SimpleVideoPlayer"
import { Section } from "@/components/ui/Section"
import { Button } from "@/components/ui/Button"
import { getVideoPositioning, getResponsiveVideoStyles, VideoPositioning } from '@/lib/video-positioning'

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

  updatedAt: string
}

export default function ProgrammesPage() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all")
  const [selectedProgramme, setSelectedProgramme] = useState<string>("all")
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'feed'>('grid')
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [screenWidth, setScreenWidth] = useState(0)
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [loadingVideoId, setLoadingVideoId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const difficulties = ["all", "BEGINNER", "INTERMEDIATE", "ADVANCED"]
  const programmes = ["all", "abdos", "brule-graisse", "haute-intensite", "machine", "pectoraux", "rehabilitation-dos", "special-femme", "cuisses-abdos-fessiers", "dos-abdos", "femmes", "homme", "jambes", "cuisses-abdos"]

  // Fetch videos from Supabase directly on client (PROGRAMMES)
  useEffect(() => {
    async function fetchVideos() {
      try {
        setLoading(true)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        let query = supabase.from('videos_new').select('*').order('title', { ascending: true })
        query = query.eq('isPublished', true).eq('videoType', 'PROGRAMMES')

        if (selectedProgramme && selectedProgramme !== 'all') {
          query = query.eq('region', selectedProgramme)
        }

        if (selectedDifficulty && selectedDifficulty !== 'all') {
          query = query.eq('difficulty', selectedDifficulty)
        }

        if (searchTerm) {
          const ilike = (col: string) => `${col}.ilike.%${searchTerm}%`
          query = query.or([
            ilike('title'),
            ilike('description'),
            ilike('startingPosition'),
            ilike('movement'),
            ilike('theme')
          ].join(','))
        }

        const { data, error } = await query.limit(1000)
        if (error) {
          console.error('Supabase programmes fetch error:', error)
          setVideos([])
        } else {
          setVideos(data || [])
        }
      } catch (error) {
        console.error('Error fetching programmes videos:', error)
        setVideos([])
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [selectedProgramme, selectedDifficulty, searchTerm])

  const filteredVideos = videos

  // Track screen width for responsive positioning
  useEffect(() => {
    const updateScreenWidth = () => {
      setScreenWidth(window.innerWidth)
    }
    
    updateScreenWidth()
    window.addEventListener('resize', updateScreenWidth)
    return () => window.removeEventListener('resize', updateScreenWidth)
  }, [])

  // Handle touch events for swipe gestures (mobile only)
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only handle touch events, not mouse events
    if (e.type === 'touchstart') {
      e.preventDefault()
      setStartY(e.touches[0].clientY)
      setCurrentY(e.touches[0].clientY)
      setIsScrolling(true)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isScrolling || e.type !== 'touchmove') return
    e.preventDefault()
    setCurrentY(e.touches[0].clientY)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isScrolling || e.type !== 'touchend') return
    e.preventDefault()
    setIsScrolling(false)
    
    const deltaY = startY - currentY
    const threshold = 50

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0 && currentVideoIndex < filteredVideos.length - 1) {
        // Swipe up - next video
        setCurrentVideoIndex(prev => prev + 1)
      } else if (deltaY < 0 && currentVideoIndex > 0) {
        // Swipe down - previous video
        setCurrentVideoIndex(prev => prev - 1)
      }
    }
  }

  // Handle mouse events for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setStartY(e.clientY)
    setCurrentY(e.clientY)
    setIsScrolling(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isScrolling) return
    e.preventDefault()
    setCurrentY(e.clientY)
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isScrolling) return
    e.preventDefault()
    setIsScrolling(false)
    
    const deltaY = startY - currentY
    const threshold = 50

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0 && currentVideoIndex < filteredVideos.length - 1) {
        // Swipe up - next video
        setCurrentVideoIndex(prev => prev + 1)
      } else if (deltaY < 0 && currentVideoIndex > 0) {
        // Swipe down - previous video
        setCurrentVideoIndex(prev => prev - 1)
      }
    }
  }

  const handleVideoClick = (videoId: string) => {
    setLoadingVideoId(videoId)
    const video = videos.find(v => v.id === videoId)
    if (video) {
      setSelectedVideo(video)
      setPlayingVideoId(videoId)
    }
  }

  const handleClosePlayer = () => {
    setSelectedVideo(null)
    setPlayingVideoId(null)
    setLoadingVideoId(null)
  }

  const handleNextVideo = () => {
    if (currentVideoIndex < filteredVideos.length - 1) {
      setCurrentVideoIndex(prev => prev + 1)
    }
  }

  const handlePrevVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(prev => prev - 1)
    }
  }

  // Hide global header/footer while in feed view
  useEffect(() => {
    if (viewMode === 'feed') {
      document.body.classList.add('hide-app-chrome')
    } else {
      document.body.classList.remove('hide-app-chrome')
    }

    return () => {
      document.body.classList.remove('hide-app-chrome')
    }
  }, [viewMode])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des programmes...</p>
        </div>
      </div>
    )
  }

  if (selectedVideo) {
    return (
        <SimpleVideoPlayer
          video={selectedVideo}
          onClose={handleClosePlayer}
        />
    )
  }

  return (
    <Section gradient="neutral">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b rounded-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Programmes Prédéfinis</h1>
              <p className="mt-2 text-gray-600">
                Découvrez nos programmes d&apos;entraînement spécialisés
              </p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${
                  viewMode === 'grid' 
                    ? 'bg-purple-100 text-purple-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('feed')}
                className={`p-2 rounded-lg ${
                  viewMode === 'feed' 
                    ? 'bg-purple-100 text-purple-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm border-b rounded-2xl mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Rechercher un programme..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {difficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty === "all" ? "Tous les niveaux" : 
                   difficulty === "BEGINNER" ? "Débutant" :
                   difficulty === "INTERMEDIATE" ? "Intermédiaire" : "Avancé"}
                </option>
              ))}
            </select>

            {/* Programme Filter */}
            <select
              value={selectedProgramme}
              onChange={(e) => setSelectedProgramme(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {programmes.map((programme) => {
                const displayNames: { [key: string]: string } = {
                  "all": "Tous les programmes",
                  "abdos": "Abdos",
                  "brule-graisse": "Brûle graisse",
                  "haute-intensite": "Haute intensité",
                  "machine": "Machine",
                  "pectoraux": "Pectoraux",
                  "rehabilitation-dos": "Réhabilitation du dos",
                  "special-femme": "Spécial femme",
                  "cuisses-abdos-fessiers": "Cuisses, Abdos, Fessiers",
                  "dos-abdos": "Dos & Abdos",
                  "femmes": "Femmes",
                  "homme": "Homme",
                  "jambes": "Jambes",
                  "cuisses-abdos": "Cuisses & Abdos"
                }
                return (
                  <option key={programme} value={programme}>
                    {displayNames[programme] || programme}
                  </option>
                )
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-gray-600">
            {filteredVideos.length} programme{filteredVideos.length !== 1 ? 's' : ''} trouvé{filteredVideos.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {viewMode === 'grid' ? (
        /* Grid View */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {filteredVideos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Filter className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun programme trouvé</h3>
              <p className="text-gray-500">Essayez de modifier vos filtres de recherche</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVideos.map((video) => (
                <EnhancedVideoCard
                  key={video.id}
                  video={video}
                  onPlay={() => handleVideoClick(video.id)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Feed View */
        <div className="h-screen w-screen relative hide-app-chrome">
          {/* Navigation Controls */}
          <div className="absolute top-4 right-4 z-10 flex space-x-2">
            <button
              onClick={handlePrevVideo}
              disabled={currentVideoIndex === 0}
              className="p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNextVideo}
              disabled={currentVideoIndex === filteredVideos.length - 1}
              className="p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          {/* Video Counter */}
          <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
            {currentVideoIndex + 1} / {filteredVideos.length}
          </div>

          {/* Video Container */}
          <div
            ref={containerRef}
            className="h-screen w-screen video-feed-container"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
        {filteredVideos.map((video, index) => (
          <div
            key={video.id}
            className={`h-screen w-screen video-feed-item relative ${
              index === currentVideoIndex ? 'block' : 'hidden'
            }`}
          >
            {/* Video Player */}
            <div className="h-screen w-screen relative overflow-hidden">
        <video
          className="w-full h-full object-cover"
          style={getResponsiveVideoStyles(
            getVideoPositioning({
              title: video.title,
              description: video.description,
              category: video.category,
              muscleGroups: video.muscleGroups
            }),
            screenWidth || window.innerWidth
          )}
          poster={video.thumbnail}
          muted={false}
          loop
          playsInline
          preload={currentVideoIndex === index ? "metadata" : "none"}
          data-video-id={video.id}
          onClick={() => handleVideoClick(video.id)}
        >
          <source src={`/api/videos/${video.id}/stream`} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
                
                {/* Play/Pause Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none
                  group-hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-black bg-opacity-50 rounded-full p-4">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                </div>

                {/* Video Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">{video.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-300">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4" />
                      <span>{video.difficulty}</span>
                    </div>
                    {video.muscleGroups && video.muscleGroups.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <span>{Array.isArray(video.muscleGroups) ? video.muscleGroups.join(', ') : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}
    </Section>
  )
}
