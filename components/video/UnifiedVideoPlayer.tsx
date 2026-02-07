"use client"

import { useState, useEffect, useRef } from "react"
import { X, Heart, Plus, Share2, Info, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDuration, getDifficultyColor, getDifficultyLabel } from "@/lib/utils"
// import { MediaPlayer, MediaOutlet, MediaCommunitySkin } from '@vidstack/react'
import { useVideoPlayer } from '@/hooks/useVideoPlayer'
import { Button } from '@/components/ui/Button'

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

interface UnifiedVideoPlayerProps {
  video: Video
  onClose?: () => void
  onNext?: () => void
  onPrevious?: () => void
  currentIndex?: number
  totalVideos?: number
  className?: string
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  startTime?: number // Temps de début en secondes
  variant?: 'modal' | 'inline' | 'fullscreen'
  showDetails?: boolean
}

export default function UnifiedVideoPlayer({ 
  video, 
  onClose,
  onNext,
  onPrevious,
  currentIndex = 0,
  totalVideos = 1,
  className = "", 
  autoPlay = false, 
  muted = false,
  loop = false,
  startTime,
  variant = 'modal',
  showDetails = true
}: UnifiedVideoPlayerProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [showOverlay, setShowOverlay] = useState(true)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const playerRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Use the video player hook
  const {
    isPlaying,
    isMobile,
    error,
    handlePlay,
    handlePause,
    handleError,
    handleLoad,
    handleTouchStart,
    handleTouchMove,
    handleWheel,
    setError
  } = useVideoPlayer({
    preventScroll: variant === 'modal' || variant === 'fullscreen',
    onPlay: () => {
      console.log('🎬 Video started playing')
      // Hide overlay after 3 seconds when video starts playing
      if (isMobile) {
        console.log('📱 Mobile detected, setting up overlay timeout')
        setShowOverlay(true)
        if (overlayTimeoutRef.current) {
          clearTimeout(overlayTimeoutRef.current)
        }
        overlayTimeoutRef.current = setTimeout(() => {
          console.log('📱 Auto-hiding overlay after 3 seconds')
          setShowOverlay(false)
        }, 3000)
      }
    },
    onPause: () => {
      console.log('⏸️ Video paused')
      // Show overlay when video is paused
      if (isMobile) {
        console.log('📱 Video paused, showing overlay')
        setShowOverlay(true)
        if (overlayTimeoutRef.current) {
          clearTimeout(overlayTimeoutRef.current)
        }
      }
    },
    onError: (error) => console.error('Video error:', error)
  })

  // Load video source when component mounts
  useEffect(() => {
    const loadVideo = async () => {
      try {
        console.log('🎬 Unified Video Player Loading:', video.id)
        setError(null)
        
        if (!video.id) {
          throw new Error('Video ID is missing')
        }
        
        // Pour mobile avec startTime, utiliser l'URL directe avec fragment
        if (variant === 'inline' && startTime && isMobile && video.videoUrl) {
          const directUrl = `${video.videoUrl}#t=${startTime}`
          setVideoSrc(directUrl)
          console.log('📱 Mobile: Using direct S3 URL with start time:', directUrl)
        } else {
          // Toujours utiliser l'API de streaming pour une meilleure compatibilité
          const streamUrl = `/api/videos/${video.id}/stream`
          
          // Test if the streaming API is accessible
          try {
            const response = await fetch(streamUrl, { method: 'HEAD' })
            if (response.ok) {
              setVideoSrc(streamUrl)
              console.log('✅ Using streaming API:', streamUrl)
            } else {
              throw new Error(`Streaming API returned ${response.status}`)
            }
          } catch (streamError) {
            console.warn('Streaming API failed, trying direct URL:', streamError)
            // Fallback to direct video URL if streaming API fails
            if (video.videoUrl) {
              setVideoSrc(video.videoUrl)
              console.log('✅ Using direct video URL:', video.videoUrl)
            } else {
              throw new Error('No video URL available')
            }
          }
        }
      } catch (err) {
        console.error('Error loading video:', err)
        setError(`Failed to load video: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    loadVideo()
  }, [video.id, video.videoUrl, setError, variant, startTime])

  // Pour le variant inline, marquer comme prêt immédiatement
  useEffect(() => {
    if (variant === 'inline' && startTime) {
      setIsVideoReady(true)
    } else {
      setIsVideoReady(true)
    }
  }, [variant, startTime])

  // Logique spécifique pour mobile - forcer le démarrage au bon moment
  useEffect(() => {
    if (variant === 'inline' && startTime && playerRef.current && isMobile) {
      const video = playerRef.current
      
      const forceStartTime = () => {
        if (video.duration && video.currentTime < startTime) {
          video.currentTime = startTime
          console.log('📱 Mobile: Video forced to start at:', startTime, 'seconds')
        }
      }
      
      // Forcer immédiatement
      forceStartTime()
      
      // Forcer après un délai
      const timeout = setTimeout(forceStartTime, 1000)
      
      // Forcer quand la vidéo est prête
      video.addEventListener('canplay', forceStartTime)
      video.addEventListener('loadeddata', forceStartTime)
      
      return () => {
        clearTimeout(timeout)
        video.removeEventListener('canplay', forceStartTime)
        video.removeEventListener('loadeddata', forceStartTime)
      }
    }
  }, [variant, startTime, isMobile, videoSrc])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (overlayTimeoutRef.current) {
        clearTimeout(overlayTimeoutRef.current)
      }
    }
  }, [])

  // Fullscreen management for mobile landscape
  useEffect(() => {
    if (!isMobile || variant !== 'modal') return

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

    const enterMobileFullscreen = async () => {
      // iOS: Use native video fullscreen (the only way to truly hide browser UI on iOS)
      if (isIOS && playerRef.current) {
        const videoEl = playerRef.current as any
        if (videoEl.webkitEnterFullscreen) {
          try {
            await videoEl.webkitEnterFullscreen()
            setIsFullscreen(true)
            return
          } catch (err) {
            console.log('iOS webkitEnterFullscreen failed:', err)
          }
        }
      }

      // Android & other mobile: Use Fullscreen API with navigationUI: 'hide'
      const elementToFullscreen = playerRef.current || containerRef.current
      if (elementToFullscreen && !document.fullscreenElement) {
        try {
          if (elementToFullscreen.requestFullscreen) {
            await elementToFullscreen.requestFullscreen({ navigationUI: 'hide' } as any)
          } else if ((elementToFullscreen as any).webkitRequestFullscreen) {
            await (elementToFullscreen as any).webkitRequestFullscreen()
          } else if ((elementToFullscreen as any).mozRequestFullScreen) {
            await (elementToFullscreen as any).mozRequestFullScreen()
          } else if ((elementToFullscreen as any).msRequestFullscreen) {
            await (elementToFullscreen as any).msRequestFullscreen()
          }
        } catch (err) {
          console.log('Fullscreen request failed:', err)
        }
      }

      // Also lock screen orientation if possible
      if (screen.orientation && screen.orientation.lock) {
        try {
          await screen.orientation.lock('landscape')
        } catch (err) {
          console.log('Screen orientation lock not supported:', err)
        }
      }
    }

    const handleOrientationChange = async () => {
      // Detect landscape orientation
      const isLandscape = window.matchMedia('(orientation: landscape)').matches
      if (isLandscape) {
        await enterMobileFullscreen()
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

    // iOS native video fullscreen events
    const videoEl = playerRef.current
    if (videoEl) {
      videoEl.addEventListener('webkitbeginfullscreen', () => setIsFullscreen(true))
      videoEl.addEventListener('webkitendfullscreen', () => setIsFullscreen(false))
    }

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange)
      mediaQuery.removeEventListener('change', handleOrientationChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
      if (videoEl) {
        videoEl.removeEventListener('webkitbeginfullscreen', () => setIsFullscreen(true))
        videoEl.removeEventListener('webkitendfullscreen', () => setIsFullscreen(false))
      }
    }
  }, [isMobile, variant])

  // Handle user interaction to show overlay
  const handleUserInteraction = () => {
    if (isMobile && isPlaying) {
      console.log('📱 User interaction detected, showing overlay')
      setShowOverlay(true)
      if (overlayTimeoutRef.current) {
        clearTimeout(overlayTimeoutRef.current)
      }
      overlayTimeoutRef.current = setTimeout(() => {
        console.log('📱 Hiding overlay after 3 seconds')
        setShowOverlay(false)
      }, 3000)
    }
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
          <div className="text-center">
            <div className="text-red-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Video Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => window.location.reload()}
                variant="primary"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700"
              >
                Retry
              </Button>
              <Button
                onClick={onClose}
                variant="primary"
                size="sm"
                className="bg-gray-600 hover:bg-gray-700"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const playerContent = (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Video Player */}
      <div 
        className={`video-player-container w-full h-full ${className}`}
        onTouchStart={(e) => {
          handleTouchStart(e)
          handleUserInteraction()
        }}
        onTouchMove={(e) => {
          handleTouchMove(e)
          handleUserInteraction()
        }}
        onWheel={handleWheel}
        onClick={handleUserInteraction}
      >
        {videoSrc && isVideoReady ? (
          <video
            ref={playerRef}
            src={videoSrc}
            poster={video.thumbnail}
            autoPlay={autoPlay}
            muted={muted || isMobile}
            loop={loop}
            playsInline
            onError={(e) => {
              console.error('Video element error:', e)
              console.error('Video src:', videoSrc)
              console.error('Video element:', e.currentTarget)
              handleError(e)
            }}
            onLoadedData={(e) => {
              // Pour le variant inline, démarrer au bon moment
              if (variant === 'inline' && startTime && e.currentTarget.duration) {
                e.currentTarget.currentTime = startTime
                console.log('🎯 Video started at:', startTime, 'seconds')
              }
              handleLoad(e)
            }}
            onPlay={(e) => {
              // Vérifier que la vidéo est au bon moment quand elle commence à jouer
              if (variant === 'inline' && startTime) {
                if (e.currentTarget.currentTime < startTime) {
                  e.currentTarget.currentTime = startTime
                  console.log('🎯 Video corrected to start time on play:', startTime, 'seconds')
                }
                
                // Sur mobile, forcer plusieurs fois pour être sûr
                if (isMobile) {
                  setTimeout(() => {
                    if (e.currentTarget.currentTime < startTime) {
                      e.currentTarget.currentTime = startTime
                      console.log('📱 Mobile: Video re-corrected to start time:', startTime, 'seconds')
                    }
                  }, 500)
                  
                  setTimeout(() => {
                    if (e.currentTarget.currentTime < startTime) {
                      e.currentTarget.currentTime = startTime
                      console.log('📱 Mobile: Video final correction to start time:', startTime, 'seconds')
                    }
                  }, 1500)
                }
              }
              handlePlay()
            }}
            onPause={handlePause}
            className={`w-full h-full ${variant === 'inline' ? 'object-cover rounded-full' : ''}`}
            crossOrigin="anonymous"
            controls={variant !== 'inline'}
            preload="none"
            webkit-playsinline="true"
            playsInline
          >
            <source src={videoSrc} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading video...</p>
            </div>
          </div>
        )}
      </div>

      {/* Custom Overlays for Mobile */}
      {isMobile && (
        <div className={`absolute inset-0 z-20 transition-opacity duration-300 ${showOverlay ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-gray-300 p-1"
                >
                  <X className="w-6 h-6" />
                </Button>
                <h1 className="text-white text-lg font-bold">Vidéos Pilates</h1>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-white text-sm">
                  {currentIndex + 1} / {totalVideos}
                </span>
                <Button
                  onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-gray-300 p-1"
                >
                  <Info className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>


          {/* Navigation Arrows */}
          {onPrevious && (
            <Button
              onClick={onPrevious}
              variant="ghost"
              size="sm"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-3 text-white hover:bg-white/40 z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}

          {onNext && (
            <Button
              onClick={onNext}
              variant="ghost"
              size="sm"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-3 text-white hover:bg-white/40 z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          )}

          {/* Action Buttons - Right Side */}
          <div className="absolute right-4 bottom-32 flex flex-col space-y-4 z-10">
            <Button
              onClick={() => setIsFavorite(!isFavorite)}
              variant="ghost"
              size="sm"
              className={`bg-rose-500/20 backdrop-blur-sm rounded-full p-3 ${
                isFavorite ? 'bg-rose-500/40' : 'hover:bg-rose-500/40'
              }`}
            >
              <Heart className={`w-6 h-6 text-white ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="bg-rose-500/20 backdrop-blur-sm rounded-full p-3 hover:bg-rose-500/40"
            >
              <Plus className="w-6 h-6 text-white" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="bg-rose-500/20 backdrop-blur-sm rounded-full p-3 hover:bg-rose-500/40"
            >
              <Share2 className="w-6 h-6 text-white" />
            </Button>
          </div>

          {/* Video Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="text-white mb-4">
              <h2 className="text-xl font-bold mb-1">{video.title}</h2>
              <div className="flex items-center space-x-3 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  video.difficulty === 'BEGINNER' ? 'bg-green-500/20 text-green-300' :
                  video.difficulty === 'INTERMEDIATE' ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-red-500/20 text-red-300'
                }`}>
                  {video.difficulty === 'BEGINNER' ? 'Débutant' :
                   video.difficulty === 'INTERMEDIATE' ? 'Intermédiaire' : 'Avancé'}
                </span>
                <span className="text-gray-300 text-sm">{video.category}</span>
                <span className="text-gray-300 text-sm">{formatDuration(video.duration)}</span>
              </div>
              
              {/* Muscle Groups */}
              {video.muscleGroups && video.muscleGroups.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {video.muscleGroups.slice(0, 3).map((muscle, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded text-xs"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Layout */}
      {!isMobile && variant === 'modal' && (
        <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-white hover:text-gray-300 p-1"
              >
                <X className="w-6 h-6" />
              </Button>
              <h1 className="text-white text-lg font-bold">Vidéos Pilates</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-white text-sm">
                {currentIndex + 1} / {totalVideos}
              </span>
              <Button
                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                variant="ghost"
                size="sm"
                className="text-white hover:text-gray-300 p-1"
              >
                <Info className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Render based on variant
  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {playerContent}
      </div>
    )
  }

  if (variant === 'fullscreen') {
    return (
      <div className="fixed inset-0 bg-black z-50">
        {playerContent}
      </div>
    )
  }

  // Inline variant
  return (
    <div className={`relative w-full bg-black overflow-hidden ${variant === 'inline' ? 'aspect-square rounded-full' : 'aspect-video rounded-lg'}`}>
      {playerContent}
      
      {/* Description Overlay */}
      {isDetailsOpen && (
        <div className="absolute inset-0 bg-black/90 z-30 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Description</h3>
              <Button
                onClick={() => setIsDetailsOpen(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">{video.detailedDescription || video.description}</p>
              
              {video.muscleGroups && video.muscleGroups.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Muscles ciblés</h4>
                  <div className="flex flex-wrap gap-2">
                    {video.muscleGroups.map((muscle, index) => (
                      <span
                        key={index}
                        className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs"
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
