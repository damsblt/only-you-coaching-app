"use client"

import { useState, useEffect, useRef } from "react"
import { X, Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDuration, getDifficultyColor, getDifficultyLabel } from "@/lib/utils"
import { useSimpleAuth } from "@/components/providers/SimpleAuthProvider"

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

interface MobileStreamPlayerProps {
  video: Video
  onClose?: () => void
  onNext?: () => void
  onPrevious?: () => void
  onVideoCompleted?: () => void
  currentIndex?: number
  totalVideos?: number
  className?: string
  autoPlay?: boolean
  muted?: boolean
}

export default function MobileStreamPlayer({ 
  video, 
  onClose,
  onNext,
  onPrevious,
  onVideoCompleted,
  currentIndex = 0,
  totalVideos = 1,
  className = "", 
  autoPlay = false, 
  muted = true // Default to muted for mobile auto-play
}: MobileStreamPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(muted)
  const [volume, setVolume] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()
  const lastSaveTimeRef = useRef<number>(0)
  const hasMarkedCompletedRef = useRef<boolean>(false)
  const { user } = useSimpleAuth()
  
  // State for landscape orientation hint
  const [showRotateHint, setShowRotateHint] = useState(false)
  const [isPortrait, setIsPortrait] = useState(true)

  // Load video source when component mounts
  useEffect(() => {
    const loadVideo = async () => {
      try {
        console.log('🎬 Mobile Stream Player Loading:', video.id)
        setIsLoading(true)
        setError(null)
        
        if (!video.id) {
          throw new Error('Video ID is missing')
        }
        
        const streamUrl = `/api/videos/${video.id}/stream`
        setVideoSrc(streamUrl)
      } catch (err) {
        console.error('Error loading video:', err)
        setError(`Failed to load video: ${err instanceof Error ? err.message : 'Unknown error'}`)
      } finally {
        setIsLoading(false)
      }
    }

    loadVideo()
    
    // Check orientation on mount and when orientation changes
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth
      setIsPortrait(portrait)
    }
    
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)
    
    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [video.id])
  
  // Request landscape orientation and show hint when video starts playing
  useEffect(() => {
    if (isPlaying && isPortrait) {
      // Try to use Screen Orientation API to lock to landscape
      const requestLandscape = async () => {
        try {
          // @ts-ignore - Screen Orientation API might not be in TypeScript definitions
          if (screen?.orientation?.lock) {
            // @ts-ignore
            await screen.orientation.lock('landscape')
            console.log('📱 Locked to landscape orientation')
          } else {
            // If API not available, show visual hint
            setShowRotateHint(true)
            
            // Auto-hide hint after 5 seconds
            const timer = setTimeout(() => {
              setShowRotateHint(false)
            }, 5000)
            
            return () => clearTimeout(timer)
          }
        } catch (error) {
          console.log('⚠️ Could not lock orientation, showing hint instead')
          setShowRotateHint(true)
          
          // Auto-hide hint after 5 seconds
          const timer = setTimeout(() => {
            setShowRotateHint(false)
          }, 5000)
          
          return () => clearTimeout(timer)
        }
      }
      
      requestLandscape()
    } else {
      setShowRotateHint(false)
    }
    
    // Cleanup: unlock orientation when video stops or component unmounts
    return () => {
      try {
        // @ts-ignore
        if (screen?.orientation?.unlock) {
          // @ts-ignore
          screen.orientation.unlock()
        }
      } catch (error) {
        console.log('⚠️ Could not unlock orientation')
      }
    }
  }, [isPlaying, isPortrait])

  // Function to save progress
  const saveProgress = async (progressSeconds: number, completed: boolean): Promise<void> => {
    if (!user || !video.id) {
      console.log('⚠️ [MobileStreamPlayer] Cannot save progress: missing user or video.id', { hasUser: !!user, hasVideoId: !!video.id })
      return Promise.resolve()
    }
    
    const now = Date.now()
    if (!completed && now - lastSaveTimeRef.current < 5000) {
      return Promise.resolve()
    }
    lastSaveTimeRef.current = now
    
    console.log('💾 [MobileStreamPlayer] Saving progress:', { videoId: video.id, userId: user.id, completed, progressSeconds })
    
    try {
      const response = await fetch(`/api/videos/${video.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, completed, progressSeconds })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ [MobileStreamPlayer] Error saving progress:', errorData)
        return Promise.resolve()
      }
      
      const data = await response.json()
      console.log('✅ [MobileStreamPlayer] Progress saved:', data)
      return Promise.resolve()
    } catch (error) {
      console.error('❌ [MobileStreamPlayer] Error saving progress (network):', error)
      return Promise.resolve()
    }
  }

  // Reset completion flag when video changes
  useEffect(() => {
    hasMarkedCompletedRef.current = false
  }, [video.id])

  // Video event handlers
  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement || !videoSrc) return

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration)
      setIsLoading(false)
      
      // Auto-play on mobile with muted video
      if (autoPlay) {
        videoElement.muted = true
        videoElement.play().catch(err => {
          console.log('Auto-play prevented:', err)
        })
      }
    }

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime)
      
      // Save progress logic
      if (videoElement.duration > 0) {
        const progressSeconds = Math.floor(videoElement.currentTime)
        
        // Mark as completed if watched at least 1 second
        if (progressSeconds >= 1 && !hasMarkedCompletedRef.current) {
          console.log(`📊 [MobileStreamPlayer] Video watched ${progressSeconds}s - marking as completed`)
          hasMarkedCompletedRef.current = true
          saveProgress(videoElement.duration, true).then(() => {
            console.log('✅ [MobileStreamPlayer] Video marked as completed, calling onVideoCompleted')
            if (onVideoCompleted) {
              onVideoCompleted()
            }
          })
        } else if (progressSeconds > 0 && progressSeconds % 5 === 0 && !hasMarkedCompletedRef.current) {
          saveProgress(progressSeconds, false)
        }
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
    }

    const handlePlay = () => {
      setIsPlaying(true)
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    const handleError = (e: Event) => {
      console.error('Video error:', e)
      setError('Failed to load video. Please try again.')
      setIsLoading(false)
    }

    const handleCanPlay = () => {
      setIsLoading(false)
    }

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)
    videoElement.addEventListener('timeupdate', handleTimeUpdate)
    videoElement.addEventListener('ended', handleEnded)
    videoElement.addEventListener('play', handlePlay)
    videoElement.addEventListener('pause', handlePause)
    videoElement.addEventListener('error', handleError)
    videoElement.addEventListener('canplay', handleCanPlay)

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
      videoElement.removeEventListener('timeupdate', handleTimeUpdate)
      videoElement.removeEventListener('ended', handleEnded)
      videoElement.removeEventListener('play', handlePlay)
      videoElement.removeEventListener('pause', handlePause)
      videoElement.removeEventListener('error', handleError)
      videoElement.removeEventListener('canplay', handleCanPlay)
    }
  }, [videoSrc, autoPlay])

  const togglePlay = async () => {
    const videoElement = videoRef.current
    if (!videoElement || isLoading || error) return

    try {
      if (isPlaying) {
        videoElement.pause()
      } else {
        // For mobile, ensure video is muted for auto-play
        if (!videoElement.muted) {
          videoElement.muted = true
          setIsMuted(true)
        }
        
        const playPromise = videoElement.play()
        if (playPromise !== undefined) {
          await playPromise
        }
      }
    } catch (err) {
      console.error('Error playing video:', err)
      setError('Failed to play video. Please try again.')
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const time = parseFloat(e.target.value)
    videoElement.currentTime = time
    setCurrentTime(time)
  }

  const toggleMute = () => {
    const videoElement = videoRef.current
    if (!videoElement) return

    videoElement.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const newVolume = parseFloat(e.target.value)
    videoElement.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const skip = (seconds: number) => {
    const videoElement = videoRef.current
    if (!videoElement) return

    videoElement.currentTime = Math.max(0, Math.min(duration, videoElement.currentTime + seconds))
  }

  const showControlsTemporarily = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }

  const handleVideoClick = () => {
    showControlsTemporarily()
    togglePlay()
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
              <button
                onClick={() => window.location.reload()}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Retry
              </button>
              <button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header - Mobile Optimized */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-lg font-bold">{video.title}</h1>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Video Area - Based on Wireframe */}
      <div className="flex-1 relative">
        {/* Video Player */}
        <div className="w-full h-full relative">
          {videoSrc && (
            <video
              ref={videoRef}
              src={videoSrc}
              className={`w-full h-full object-cover ${className}`}
              poster={video.thumbnail}
              onClick={handleVideoClick}
              preload="metadata"
              autoPlay={autoPlay}
              muted={muted || true}
              loop
              playsInline
              controls={false}
            />
          )}
          
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Loading video...</p>
              </div>
            </div>
          )}

          {/* Play/Pause Overlay - Mobile Optimized */}
          {!isPlaying && !isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={handleVideoClick}
                className="bg-white/20 backdrop-blur-sm rounded-full p-4 transition-all duration-200 transform hover:scale-110"
              >
                <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
              </button>
            </div>
          )}

          {/* Navigation Arrows - Mobile */}
          {onPrevious && (
            <button
              onClick={onPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-3 text-white hover:bg-white/40 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {onNext && (
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-3 text-white hover:bg-white/40 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

        </div>

        {/* Video Controls - Bottom Overlay (Based on Wireframe) */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Progress Bar */}
          <div className="mb-3">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="hover:text-rose-400 transition-colors">
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              <button onClick={() => skip(-10)} className="hover:text-rose-400 transition-colors text-sm">
                -10s
              </button>
              <button onClick={() => skip(10)} className="hover:text-rose-400 transition-colors text-sm">
                +10s
              </button>
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="hover:text-rose-400 transition-colors">
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
              <span className="text-sm">
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </span>
            </div>
          </div>
          
          {/* Rotate Hint Overlay - Show on mobile when video plays in portrait */}
          {showRotateHint && isPortrait && (
            <div className="rotate-hint-overlay">
              <div className="rotate-hint-icon">
                📱➡️📺
              </div>
              <div className="rotate-hint-text">
                <p className="font-bold text-xl mb-2">Tournez votre téléphone</p>
                <p>Pour une meilleure expérience, visionnez la vidéo en mode paysage</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
