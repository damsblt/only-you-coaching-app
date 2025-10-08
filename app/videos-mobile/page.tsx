"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Filter, Play, Clock, Star, Grid, List, ArrowLeft, ArrowRight, X } from "lucide-react"
import VideoListingCard from "@/components/video/VideoListingCard"
import MobileVideoPlayer from "@/components/video/MobileVideoPlayer"
import { useVideos } from "@/hooks/useVideos"

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
  createdAt: string
  updatedAt: string
}

export default function VideosMobilePage() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all")
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("all")
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'stream'>('grid')
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Use the useVideos hook to fetch data
  const { videos, isLoading: loading, error } = useVideos({
    muscleGroup: selectedMuscleGroup,
    difficulty: selectedDifficulty,
    search: searchTerm,
    videoType: 'muscle-groups'
  })

  const difficulties = ["all", "BEGINNER", "INTERMEDIATE", "ADVANCED"]
  const muscleGroups = ["all", "Abdos", "Bande", "Biceps", "Cardio", "Dos", "Fessiers et jambes", "Streching", "Triceps"]

  const filteredVideos = videos

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle touch events for swipe gestures (mobile only)
  const handleTouchStart = (e: React.TouchEvent) => {
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
    
    const deltaY = startY - currentY
    const threshold = 50

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0 && currentVideoIndex < filteredVideos.length - 1) {
        goToNext()
      } else if (deltaY < 0 && currentVideoIndex > 0) {
        goToPrevious()
      }
    }
    
    setIsScrolling(false)
  }

  // Navigation functions
  const goToPrevious = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(prev => prev - 1)
    }
  }

  const goToNext = () => {
    if (currentVideoIndex < filteredVideos.length - 1) {
      setCurrentVideoIndex(prev => prev + 1)
    }
  }

  const handleVideoPlay = (video: Video) => {
    const videoIndex = filteredVideos.findIndex(v => v.id === video.id)
    if (videoIndex !== -1) {
      setCurrentVideoIndex(videoIndex)
    }
    setSelectedVideo(video)
    setViewMode('stream')
  }

  const handleVideoInfo = (video: Video) => {
    // Show video details in a modal or overlay
    console.log('Show info for:', video.title)
  }

  // Stream mode layout - Based on wireframe
  if (viewMode === 'stream') {
    return (
      <div className="h-screen w-screen bg-black relative overflow-hidden">
        <MobileVideoPlayer
          video={selectedVideo!}
          onClose={() => setViewMode('grid')}
          onNext={currentVideoIndex < filteredVideos.length - 1 ? goToNext : undefined}
          onPrevious={currentVideoIndex > 0 ? goToPrevious : undefined}
          currentIndex={currentVideoIndex}
          totalVideos={filteredVideos.length}
          autoPlay={true}
          muted={true}
        />
      </div>
    )
  }

  // Grid/List mode layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vidéos Pilates</h1>
              <p className="text-gray-600">
                {filteredVideos.length} vidéo{filteredVideos.length !== 1 ? "s" : ""} trouvée{filteredVideos.length !== 1 ? "s" : ""}
              </p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
                title="Grid View"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher une vidéo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Filter className="w-5 h-5" />
              <span>Filtres</span>
            </button>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                >
                  {difficulties.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty === "all" ? "Tous les niveaux" : 
                       difficulty === "BEGINNER" ? "Débutant" :
                       difficulty === "INTERMEDIATE" ? "Intermédiaire" : "Avancé"}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedMuscleGroup}
                  onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                >
                  {muscleGroups.map((muscleGroup) => (
                    <option key={muscleGroup} value={muscleGroup}>
                      {muscleGroup === "all" ? "Tous les groupes" : muscleGroup}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des vidéos...</p>
            </div>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucune vidéo trouvée pour ces critères.</p>
          </div>
        ) : (
          <div className={
            viewMode === 'list' 
              ? "space-y-3" 
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          }>
            {filteredVideos.map((video) => (
              <VideoListingCard
                key={video.id}
                video={video}
                onPlay={handleVideoPlay}
                onInfo={handleVideoInfo}
                variant={viewMode === 'list' ? 'list' : 'mobile'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
