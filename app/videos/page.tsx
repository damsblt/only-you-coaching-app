"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Filter, Play, Clock, Star, Grid, List, ArrowLeft, ArrowRight } from "lucide-react"
import EnhancedVideoCard from "@/components/video/EnhancedVideoCard"
import ComputerStreamPlayer from "@/components/video/ComputerStreamPlayer"
import MobileStreamPlayer from "@/components/video/MobileStreamPlayer"
import ListingPlayer from "@/components/video/ListingPlayer"
import { Section } from "@/components/ui/Section"
import { Button } from "@/components/ui/Button"
import SimpleVideoPlayer from "@/components/video/SimpleVideoPlayer"
import { useVideos } from "@/hooks/useVideos"
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
  createdAt: string
  updatedAt: string
}

export default function VideosPage() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all")
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("all")
  const [viewMode, setViewMode] = useState<'grid' | 'feed' | 'mobile'>('grid')
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [screenWidth, setScreenWidth] = useState(0)
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [loadingVideoId, setLoadingVideoId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
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

  // Track screen width and mobile detection
  useEffect(() => {
    const updateScreenWidth = () => {
      setScreenWidth(window.innerWidth)
      setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    }
    
    updateScreenWidth()
    window.addEventListener('resize', updateScreenWidth)
    return () => window.removeEventListener('resize', updateScreenWidth)
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

  // Navigation functions
  const goToPrevious = () => {
    if (currentVideoIndex > 0) {
      // Pause and reset current video to beginning
      const currentVideo = document.querySelector(`video[data-video-id="${filteredVideos[currentVideoIndex].id}"]`) as HTMLVideoElement
      if (currentVideo) {
        currentVideo.pause()
        currentVideo.currentTime = 0
      }
      
      setCurrentVideoIndex(prev => prev - 1)
    }
  }

  const goToNext = () => {
    if (currentVideoIndex < filteredVideos.length - 1) {
      // Pause and reset current video to beginning
      const currentVideo = document.querySelector(`video[data-video-id="${filteredVideos[currentVideoIndex].id}"]`) as HTMLVideoElement
      if (currentVideo) {
        currentVideo.pause()
        currentVideo.currentTime = 0
      }
      
      setCurrentVideoIndex(prev => prev + 1)
    }
  }

  // Handle video play/pause
  const handleVideoClick = async (videoId: string) => {
    const videoElement = document.querySelector(`video[data-video-id="${videoId}"]`) as HTMLVideoElement
    if (!videoElement) return

    try {
      if (videoElement.paused) {
        // Reset to beginning and play
        videoElement.currentTime = 0
        
        // Check if video is ready to play
        if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
          const playPromise = videoElement.play()
          if (playPromise !== undefined) {
            await playPromise
            setPlayingVideoId(videoId)
          }
        } else {
          // Wait for video to be ready
          videoElement.addEventListener('canplay', () => {
            videoElement.play().then(() => {
              setPlayingVideoId(videoId)
            }).catch(error => {
              console.log('Autoplay prevented:', error)
            })
          }, { once: true })
        }
      } else {
        videoElement.pause()
        setPlayingVideoId(null)
      }
    } catch (error) {
      console.log('Video play error:', error)
    }
  }

  // Auto-play video when currentVideoIndex changes (feed mode only)
  useEffect(() => {
    if (viewMode !== 'feed' || filteredVideos.length === 0) return

    const currentVideo = filteredVideos[currentVideoIndex]
    if (!currentVideo) return

    // Set loading state
    setLoadingVideoId(currentVideo.id)
    setPlayingVideoId(null)

    // Small delay to ensure video element is rendered
    const timer = setTimeout(() => {
      const videoElement = document.querySelector(`video[data-video-id="${currentVideo.id}"]`) as HTMLVideoElement
      if (videoElement) {
        // Always reset video to beginning and play automatically
        videoElement.currentTime = 0
        
        // For mobile, ensure video is muted for auto-play
        if (isMobile) {
          videoElement.muted = true
        }
        
        // Check if video is ready to play
        if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
          const playPromise = videoElement.play()
          if (playPromise !== undefined) {
            playPromise.then(() => {
              setPlayingVideoId(currentVideo.id)
              setLoadingVideoId(null)
            }).catch(error => {
              console.log('Autoplay prevented:', error)
              setPlayingVideoId(null)
              setLoadingVideoId(null)
            })
          }
        } else {
          // Wait for video to be ready
          videoElement.addEventListener('canplay', () => {
            videoElement.play().then(() => {
              setPlayingVideoId(currentVideo.id)
              setLoadingVideoId(null)
            }).catch(error => {
              console.log('Autoplay prevented:', error)
              setPlayingVideoId(null)
              setLoadingVideoId(null)
            })
          }, { once: true })
        }
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [currentVideoIndex, viewMode, filteredVideos, isMobile])

  // Handle keyboard navigation for feed mode
  useEffect(() => {
    if (viewMode !== 'feed') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPrevious()
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentVideoIndex, filteredVideos.length, viewMode])

  // Mobile view mode layout
  if (viewMode === 'mobile') {
    return (
      <div className="h-screen w-screen bg-black relative overflow-hidden">
        <MobileStreamPlayer
          video={filteredVideos[currentVideoIndex]}
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

  // Feed mode layout - Use ComputerStreamPlayer for desktop
  if (viewMode === 'feed') {
    return (
      <div className="h-screen w-screen bg-black relative overflow-hidden hide-app-chrome" style={{ position: 'fixed', top: 0, left: 0 }}>
        <ComputerStreamPlayer
          video={filteredVideos[currentVideoIndex]}
          onClose={() => setViewMode('grid')}
          onNext={currentVideoIndex < filteredVideos.length - 1 ? goToNext : undefined}
          onPrevious={currentVideoIndex > 0 ? goToPrevious : undefined}
          currentIndex={currentVideoIndex}
          totalVideos={filteredVideos.length}
          autoPlay={true}
          muted={false}
        />
      </div>
    )
  }

  // Legacy feed mode layout (keeping as fallback)
  if (viewMode === 'legacy-feed') {
    return (
      <div className="h-screen w-screen bg-black relative overflow-hidden hide-app-chrome" style={{ position: 'fixed', top: 0, left: 0 }}>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setViewMode('grid')}
                className="text-white hover:text-gray-300 transition-colors"
                title="Back to Grid"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-white text-xl font-bold">Vidéos Pilates</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-white text-sm">
                {currentVideoIndex + 1} / {filteredVideos.length}
              </div>
            </div>
          </div>
        </div>

        {/* Video Container */}
        <div
          ref={containerRef}
          className="h-screen w-screen video-feed-container"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {loadingVideoId === video.id ? (
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  ) : playingVideoId === video.id ? (
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 transition-opacity duration-300">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                      </svg>
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-opacity duration-300">
                      <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="text-white">
                  <h2 className="text-2xl font-bold mb-2">{video.title}</h2>
                  <p className="text-gray-200 mb-4">{video.description}</p>
                  
                  {/* Video Info */}
                  <div className="flex items-center space-x-4 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      video.difficulty === 'BEGINNER' ? 'bg-green-500/20 text-green-300' :
                      video.difficulty === 'INTERMEDIATE' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {video.difficulty === 'BEGINNER' ? 'Débutant' :
                       video.difficulty === 'INTERMEDIATE' ? 'Intermédiaire' : 'Avancé'}
                    </span>
                    <span className="text-gray-300 text-sm">{video.category}</span>
                    <span className="text-gray-300 text-sm">{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                  </div>

                  {/* Muscle Groups */}
                  {video.muscleGroups && video.muscleGroups.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {video.muscleGroups.slice(0, 3).map((muscle) => (
                        <span
                          key={muscle}
                          className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded text-sm"
                        >
                          {muscle}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="absolute right-4 bottom-32 flex flex-col space-y-4">
                <button className="bg-rose-500/20 backdrop-blur-sm rounded-full p-3 hover:bg-rose-500/40 transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button className="bg-rose-500/20 backdrop-blur-sm rounded-full p-3 hover:bg-rose-500/40 transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                <button className="bg-rose-500/20 backdrop-blur-sm rounded-full p-3 hover:bg-rose-500/40 transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-10">
          <button
            onClick={goToPrevious}
            disabled={currentVideoIndex === 0}
            className={`p-3 rounded-full transition-all ${
              currentVideoIndex === 0 
                ? 'bg-white/20 text-white/40 cursor-not-allowed' 
                : 'bg-white/20 text-white hover:bg-white/40 hover:scale-110'
            }`}
            title="Previous video"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10">
          <button
            onClick={goToNext}
            disabled={currentVideoIndex === filteredVideos.length - 1}
            className={`p-3 rounded-full transition-all ${
              currentVideoIndex === filteredVideos.length - 1 
                ? 'bg-white/20 text-white/40 cursor-not-allowed' 
                : 'bg-white/20 text-white hover:bg-white/40 hover:scale-110'
            }`}
            title="Next video"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex space-x-2">
            {filteredVideos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentVideoIndex(index)}
                className={`w-2 h-2 rounded-full transition-all hover:scale-125 ${
                  index === currentVideoIndex ? 'bg-white' : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Navigation Instructions */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10">
          <div className="text-white/60 text-sm text-center">
            <div className="mb-1">Use arrow keys or swipe to navigate</div>
            <div className="text-xs">Click dots to jump to specific video</div>
          </div>
        </div>
      </div>
    )
  }

  // Grid mode layout
  return (
    <Section gradient="neutral">
      <div className="">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Groupes Musculaires</h1>
              <p className="text-lg text-gray-600">
                Exercices ciblés par groupe musculaire
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
                onClick={() => setViewMode('feed')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'feed' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
                title="Feed View"
              >
                <List className="w-5 h-5" />
              </button>
              {isMobile && (
                <button
                  onClick={() => setViewMode('mobile')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'mobile' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  title="Mobile View"
                >
                  <Play className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher une vidéo..."
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

            {/* Muscle Group Filter */}
            <select
              value={selectedMuscleGroup}
              onChange={(e) => setSelectedMuscleGroup(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {muscleGroups.map((muscleGroup) => (
                <option key={muscleGroup} value={muscleGroup}>
                  {muscleGroup === "all" ? "Tous les groupes musculaires" : muscleGroup}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredVideos.length} vidéo{filteredVideos.length !== 1 ? "s" : ""} trouvée{filteredVideos.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Video Grid */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video) => (
              <EnhancedVideoCard
                key={video.id}
                video={video}
                onPlay={() => setSelectedVideo(video)}
              />
            ))}
          </div>
        )}

        {/* Enhanced Video Player Modal */}
        {selectedVideo && (
          <ListingPlayer
            video={selectedVideo}
            onClose={() => setSelectedVideo(null)}
            variant="modal"
          />
        )}
      </div>
    </Section>
  )
}

