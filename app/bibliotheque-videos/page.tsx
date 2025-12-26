"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Filter, Play, Clock, Star, Grid, List, ArrowLeft, ArrowRight } from "lucide-react"
import EnhancedVideoCard from "@/components/video/EnhancedVideoCard"
import ComputerStreamPlayer from "@/components/video/ComputerStreamPlayer"
import MobileStreamPlayer from "@/components/video/MobileStreamPlayer"
import { Section } from "@/components/ui/Section"
import { Button } from "@/components/ui/Button"
import { useVideos } from "@/hooks/useVideos"
import { getVideoPositioning, getResponsiveVideoStyles, VideoPositioning } from '@/lib/video-positioning'
import ProtectedContent from "@/components/ProtectedContent"
import { useSimpleAuth } from "@/components/providers/SimpleAuthProvider"
import PageHeader from "@/components/layout/PageHeader"

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
  targeted_muscles?: string[]
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
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("all")
  const [viewMode, setViewMode] = useState<'grid' | 'feed' | 'mobile' | 'legacy-feed'>('grid')
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [screenWidth, setScreenWidth] = useState(0)
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [loadingVideoId, setLoadingVideoId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Use the auth context
  const { user, loading: authLoading } = useSimpleAuth()

  // Use the useVideos hook to fetch data
  // Fetch both MUSCLE_GROUPS and PROGRAMMES videos for the library
  const { videos, isLoading: loading, error } = useVideos({
    muscleGroup: selectedMuscleGroup,
    difficulty: "all",
    search: searchTerm,
    videoType: undefined // undefined = fetch all video types
  })

  const muscleGroups = ["all", "Abdos", "Bande", "Biceps", "Cardio", "Dos", "Fessiers et jambes", "Machine", "Pectoraux", "Streching", "Triceps"]


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

  // Fullscreen management for mobile landscape in feed mode
  useEffect(() => {
    if (viewMode !== 'feed') return

    const handleOrientationChange = async () => {
      // Detect landscape orientation on mobile
      const isLandscape = window.matchMedia('(orientation: landscape)').matches
      const isMobileDevice = window.innerWidth <= 1024
      
      if (isLandscape && isMobileDevice && containerRef.current) {
        try {
          // Try to enter fullscreen
          if (!document.fullscreenElement) {
            if (containerRef.current.requestFullscreen) {
              await containerRef.current.requestFullscreen()
            } else if ((containerRef.current as any).webkitRequestFullscreen) {
              await (containerRef.current as any).webkitRequestFullscreen()
            } else if ((containerRef.current as any).mozRequestFullScreen) {
              await (containerRef.current as any).mozRequestFullScreen()
            } else if ((containerRef.current as any).msRequestFullscreen) {
              await (containerRef.current as any).msRequestFullscreen()
            }
          }
          
          // Lock screen orientation if possible
          if (screen.orientation && screen.orientation.lock) {
            try {
              await screen.orientation.lock('landscape')
            } catch (err) {
              console.log('Screen orientation lock not supported')
            }
          }
        } catch (err) {
          console.log('Fullscreen request failed:', err)
        }
      }
    }

    // Listen for orientation changes
    window.addEventListener('orientationchange', handleOrientationChange)
    const mediaQuery = window.matchMedia('(orientation: landscape)')
    mediaQuery.addEventListener('change', handleOrientationChange)
    
    // Check initial orientation
    handleOrientationChange()

    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      )
      setIsFullscreen(isCurrentlyFullscreen)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange)
      mediaQuery.removeEventListener('change', handleOrientationChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
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

  // Handle video play from grid - opens in feed view
  const handleVideoPlay = (video: Video) => {
    // Find the index of the video in filteredVideos
    const videoIndex = filteredVideos.findIndex(v => v.id === video.id)
    
    if (videoIndex !== -1) {
      // Set the current video index
      setCurrentVideoIndex(videoIndex)
      // Switch to feed view mode
      setViewMode('feed')
    } else {
      // If video not found in filtered list, add it and switch to feed
      // This shouldn't happen, but just in case
      console.warn('Video not found in filtered list, opening in feed anyway')
      setViewMode('feed')
    }
  }

  // Handle video play/pause (for feed mode)
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
      <ProtectedContent feature="videoLibrary" userId={user?.id}>
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
      </ProtectedContent>
    )
  }

  // Feed mode layout - Use ComputerStreamPlayer for desktop
  if (viewMode === 'feed') {
    return (
      <ProtectedContent feature="videoLibrary" userId={user?.id}>
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
      </ProtectedContent>
    )
  }

  // Legacy feed mode layout (keeping as fallback)
  if (viewMode === 'legacy-feed') {
    return (
      <ProtectedContent feature="videoLibrary" userId={user?.id}>
        <div className="h-screen w-screen bg-black relative overflow-hidden hide-app-chrome" style={{ position: 'fixed', top: 0, left: 0 }}>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setViewMode('grid')}
                variant="ghost"
                size="sm"
                className="text-white hover:text-gray-300 p-0"
                title="Back to Grid"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
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
                <Button variant="ghost" size="sm" className="bg-rose-500/20 backdrop-blur-sm rounded-full p-3 hover:bg-rose-500/40">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </Button>
                <Button variant="ghost" size="sm" className="bg-rose-500/20 backdrop-blur-sm rounded-full p-3 hover:bg-rose-500/40">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </Button>
                <Button variant="ghost" size="sm" className="bg-rose-500/20 backdrop-blur-sm rounded-full p-3 hover:bg-rose-500/40">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-10">
          <Button
            onClick={goToPrevious}
            disabled={currentVideoIndex === 0}
            variant="ghost"
            size="sm"
            className={`p-3 rounded-full ${
              currentVideoIndex === 0 
                ? 'bg-white/20 text-white/40 cursor-not-allowed' 
                : 'bg-white/20 text-white hover:bg-white/40 hover:scale-110'
            }`}
            title="Previous video"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </div>

        <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10">
          <Button
            onClick={goToNext}
            disabled={currentVideoIndex === filteredVideos.length - 1}
            variant="ghost"
            size="sm"
            className={`p-3 rounded-full ${
              currentVideoIndex === filteredVideos.length - 1 
                ? 'bg-white/20 text-white/40 cursor-not-allowed' 
                : 'bg-white/20 text-white hover:bg-white/40 hover:scale-110'
            }`}
            title="Next video"
          >
            <ArrowRight className="w-6 h-6" />
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex space-x-2">
            {filteredVideos.map((_, index) => (
              <Button
                key={index}
                onClick={() => setCurrentVideoIndex(index)}
                variant="ghost"
                size="sm"
                className={`w-2 h-2 rounded-full p-0 min-w-0 ${
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
      </ProtectedContent>
    )
  }

  if (authLoading || loading) {
    return (
      <>
        <PageHeader
          videoS3Key="Photos/Illustration/5033410_Fitness_Beach_Exercise_1920x1080 (1) (1).mp4"
          title="Bibliothèque de Vidéos"
          subtitle="Chargement de votre bibliothèque..."
          height="fullScreen"
        />
        <Section 
          gradient="soft" 
          className="min-h-screen"
        >
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </Section>
      </>
    )
  }

  // Display error state
  if (error) {
    return (
      <>
        <PageHeader
          videoS3Key="Photos/Illustration/5033410_Fitness_Beach_Exercise_1920x1080 (1) (1).mp4"
          title="Bibliothèque de Vidéos"
          subtitle="Erreur de chargement"
          height="fullScreen"
        />
        <Section 
          gradient="soft" 
          className="min-h-screen"
        >
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Erreur de chargement</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md text-center">{error}</p>
          <div className="flex gap-4">
            <Button
              onClick={() => window.location.reload()}
              variant="primary"
              size="lg"
            >
              Réessayer
            </Button>
            <Button
              onClick={() => window.location.href = '/debug-auth'}
              variant="ghost"
              size="lg"
            >
              Vérifier la connexion
            </Button>
          </div>
        </div>
      </Section>
      </>
    )
  }

  // Grid mode layout
  return (
    <>
      <PageHeader
        videoS3Key="Photos/Illustration/5033410_Fitness_Beach_Exercise_1920x1080 (1) (1).mp4"
        title="Bibliothèque de Vidéos"
        subtitle="Des exercices ciblés par groupe musculaire, conçus pour vous guider vers vos objectifs fitness, étape par étape."
        height="fullScreen"
      />
      <Section 
        gradient="soft" 
        className="min-h-screen"
      >
        {/* Introduction - Visible to all */}
        <div className="mb-12 text-center">
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            Le coaching en ligne est le moyen le plus efficace pour atteindre vos objectifs de perte de poids, remise en forme et santé. Déterminer votre moment et votre endroit pour pratiquer, et profiter d'un contact par email avec votre coach en cas de question.
          </p>
        </div>

        <ProtectedContent 
          feature="videoLibrary" 
          userId={user?.id}
        >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
                <h2 className="text-3xl font-bold text-accent-500 dark:text-accent-400 mb-2">Groupes Musculaires</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                Exercices ciblés par groupe musculaire
              </p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                  onClick={() => setViewMode('grid' as const)}
                  variant={(viewMode as string) === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                  className={`p-2 ${(viewMode as string) === 'grid' ? 'bg-footer-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                title="Grid View"
              >
                <Grid className="w-5 h-5" />
              </Button>
              <Button
                  onClick={() => setViewMode('feed' as const)}
                  variant={(viewMode as string) === 'feed' ? 'primary' : 'ghost'}
                size="sm"
                  className={`p-2 ${(viewMode as string) === 'feed' ? 'bg-footer-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                title="Feed View"
              >
                <List className="w-5 h-5" />
              </Button>
              {isMobile && (
                <Button
                    onClick={() => setViewMode('mobile' as const)}
                    variant={(viewMode as string) === 'mobile' ? 'primary' : 'ghost'}
                  size="sm"
                    className={`p-2 ${(viewMode as string) === 'mobile' ? 'bg-footer-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                  title="Mobile View"
                >
                  <Play className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8 border border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher une vidéo..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSearchTerm(searchInput)
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <Button
                onClick={() => setSearchTerm(searchInput)}
                variant="primary"
                size="md"
                className="px-6"
              >
                <Search className="w-5 h-5 mr-2" />
                Rechercher
              </Button>
            </div>

            {/* Muscle Group Filter */}
            <select
              value={selectedMuscleGroup}
              onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
            <p className="text-gray-600 dark:text-gray-400">
            {filteredVideos.length} vidéo{filteredVideos.length !== 1 ? "s" : ""} trouvée{filteredVideos.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Video Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Chargement des vidéos...</p>
            </div>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">Aucune vidéo trouvée pour ces critères.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video) => (
              <EnhancedVideoCard
                key={video.id}
                video={video}
                onPlay={handleVideoPlay}
              />
            ))}
          </div>
        )}

        </ProtectedContent>

        {/* Free Trial CTA Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="relative bg-gradient-to-br from-accent-500 via-accent-600 to-burgundy-600 rounded-2xl shadow-2xl p-10 md:p-12 mb-12 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Découvrez plus avec notre essai gratuit
              </h2>
              
              <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-3xl mx-auto mb-8">
                Explorez une sélection de nos vidéos, audios et recettes premium pour vous donner un avant-goût de ce qui vous attend !
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  href="/essai-gratuit"
                  variant="white"
                  size="lg"
                  className="group shadow-xl"
                >
                  Essayer gratuitement
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}

