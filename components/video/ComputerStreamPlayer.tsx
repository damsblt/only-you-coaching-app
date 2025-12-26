"use client"

import { useState, useEffect, useRef } from "react"
import { X, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Maximize2, Settings } from "lucide-react"
import { formatDuration, getDifficultyColor, getDifficultyLabel } from "@/lib/utils"

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

interface ComputerStreamPlayerProps {
  video: Video
  onClose?: () => void
  onNext?: () => void
  onPrevious?: () => void
  currentIndex?: number
  totalVideos?: number
  className?: string
  autoPlay?: boolean
  muted?: boolean
}

export default function ComputerStreamPlayer({ 
  video, 
  onClose,
  onNext,
  onPrevious,
  currentIndex = 0,
  totalVideos = 1,
  className = "", 
  autoPlay = false, 
  muted = false 
}: ComputerStreamPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(muted)
  const [volume, setVolume] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()
  
  // TikTok-style scroll states
  const [isMobile, setIsMobile] = useState(false)
  const [touchStartY, setTouchStartY] = useState(0)
  const [touchStartX, setTouchStartX] = useState(0)
  const [touchEndY, setTouchEndY] = useState(0)
  const [touchEndX, setTouchEndX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [swipeProgress, setSwipeProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Minimum swipe distance to trigger navigation (in pixels)
  const MIN_SWIPE_DISTANCE = 50
  // Maximum horizontal movement to consider it a vertical swipe
  const MAX_HORIZONTAL_MOVEMENT = 50

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                            window.innerWidth <= 768 ||
                            ('ontouchstart' in window)
      setIsMobile(isMobileDevice)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load video source when component mounts
  useEffect(() => {
    const loadVideo = async () => {
      try {
        console.log('🎬 Computer Stream Player Loading:', video.id)
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
  }, [video.id])

  // Video event handlers
  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement || !videoSrc) return

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration)
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime)
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
  }, [videoSrc])

  const togglePlay = async () => {
    const videoElement = videoRef.current
    if (!videoElement || isLoading || error) return

    try {
      if (isPlaying) {
        videoElement.pause()
      } else {
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

  const handlePlaybackRateChange = (rate: number) => {
    const videoElement = videoRef.current
    if (!videoElement) return

    videoElement.playbackRate = rate
    setPlaybackRate(rate)
  }

  const toggleFullscreen = async () => {
    // On mobile, always try to lock orientation to landscape first
    if (isMobile && screen.orientation && screen.orientation.lock) {
      try {
        await screen.orientation.lock('landscape')
        // If orientation lock succeeds, it will encourage user to rotate phone
      } catch (err) {
        console.log('Screen orientation lock not supported or failed:', err)
      }
    }

    if (!document.fullscreenElement) {
      // Enter fullscreen
      try {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen()
        } else if (videoRef.current?.requestFullscreen) {
          await videoRef.current.requestFullscreen()
        } else if ((containerRef.current as any)?.webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen()
        } else if ((videoRef.current as any)?.webkitRequestFullscreen) {
          await (videoRef.current as any).webkitRequestFullscreen()
        }
        setIsFullscreen(true)
      } catch (err) {
        console.log('Fullscreen request failed:', err)
        // Even if fullscreen fails, orientation lock should still work
      }
    } else {
      // Exit fullscreen
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen()
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen()
        }
        setIsFullscreen(false)
      } catch (err) {
        console.log('Exit fullscreen failed:', err)
      }
      
      // On mobile, unlock orientation when exiting fullscreen
      if (isMobile && screen.orientation && screen.orientation.unlock) {
        try {
          screen.orientation.unlock()
        } catch (err) {
          console.log('Screen orientation unlock failed:', err)
        }
      }
    }
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

  // TikTok-style swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return
    const touch = e.touches[0]
    setTouchStartY(touch.clientY)
    setTouchStartX(touch.clientX)
    setTouchEndY(touch.clientY)
    setTouchEndX(touch.clientX)
    setIsSwiping(true)
    setSwipeProgress(0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !isSwiping) return
    const touch = e.touches[0]
    setTouchEndY(touch.clientY)
    setTouchEndX(touch.clientX)
    
    const deltaY = touch.clientY - touchStartY
    const deltaX = Math.abs(touch.clientX - touchStartX)
    const absDeltaY = Math.abs(deltaY)
    
    // Only prevent default if it's a vertical swipe (not horizontal)
    if (absDeltaY > 10 && deltaX < MAX_HORIZONTAL_MOVEMENT) {
      e.preventDefault()
      
      // Calculate swipe progress (0 to 1)
      const progress = Math.min(absDeltaY / (window.innerHeight * 0.3), 1)
      setSwipeProgress(progress)
    }
  }

  const handleTouchEnd = () => {
    if (!isMobile || !isSwiping) return
    
    const deltaY = touchStartY - touchEndY
    const deltaX = Math.abs(touchEndX - touchStartX)
    const absDeltaY = Math.abs(deltaY)
    
    // Only trigger navigation if:
    // 1. Swipe distance is significant
    // 2. It's primarily a vertical swipe (not horizontal)
    if (absDeltaY > MIN_SWIPE_DISTANCE && deltaX < MAX_HORIZONTAL_MOVEMENT) {
      if (deltaY > 0 && onNext) {
        // Swipe up - next video
        onNext()
      } else if (deltaY < 0 && onPrevious) {
        // Swipe down - previous video
        onPrevious()
      }
    }
    
    setIsSwiping(false)
    setSwipeProgress(0)
    setTouchStartY(0)
    setTouchStartX(0)
    setTouchEndY(0)
    setTouchEndX(0)
  }

  // Prevent body scroll when on mobile
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isMobile])

  if (error) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
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
    <div 
      className="fixed inset-0 bg-black z-50 flex"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: isMobile ? 'pan-y' : 'auto' }}
    >
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
              muted={muted}
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

          {/* Play/Pause Overlay */}
          {!isPlaying && !isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={handleVideoClick}
                className="bg-white/20 backdrop-blur-sm rounded-full p-6 transition-all duration-200 transform hover:scale-110"
              >
                <Play className="w-16 h-16 text-white ml-2" fill="currentColor" />
              </button>
            </div>
          )}

          {/* Top Controls */}
          <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="flex items-center justify-between">
              <h1 className="text-white text-xl font-bold">{video.title}</h1>
            </div>
          </div>

          {/* Close Button - Always visible */}
          <div className="absolute top-0 right-0 p-4 z-10">
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors p-2 bg-black/50 rounded-full hover:bg-black/70 backdrop-blur-sm"
              title="Fermer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Bottom Controls */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}>
            {/* Progress Bar */}
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <button onClick={togglePlay} className="hover:text-rose-400 transition-colors">
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                </button>
                <button onClick={() => skip(-10)} className="hover:text-rose-400 transition-colors">
                  <SkipBack className="w-6 h-6" />
                </button>
                <button onClick={() => skip(10)} className="hover:text-rose-400 transition-colors">
                  <SkipForward className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={toggleMute} className="hover:text-rose-400 transition-colors">
                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                <span className="text-sm">
                  {formatDuration(currentTime)} / {formatDuration(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  {showSettings && (
                    <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg p-3 min-w-32">
                      <div className="space-y-2">
                        <div className="text-xs text-gray-300 mb-1">Playback Speed</div>
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                          <button
                            key={rate}
                            onClick={() => handlePlaybackRateChange(rate)}
                            className={`block w-full text-left px-2 py-1 rounded text-sm ${
                              playbackRate === rate ? 'bg-rose-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                            }`}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Arrows - Hidden on mobile when swipe is enabled */}
          {!isMobile && onPrevious && (
            <button
              onClick={onPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-4 text-white hover:bg-white/40 transition-colors"
            >
              <SkipBack className="w-6 h-6" />
            </button>
          )}

          {!isMobile && onNext && (
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-4 text-white hover:bg-white/40 transition-colors"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          )}

          {/* Swipe Indicator - Mobile only */}
          {isMobile && isSwiping && swipeProgress > 0.1 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="bg-black/50 backdrop-blur-sm rounded-full p-6 transition-opacity duration-200"
                style={{ opacity: swipeProgress }}
              >
                {touchStartY > touchEndY ? (
                  <SkipForward className="w-12 h-12 text-white" />
                ) : (
                  <SkipBack className="w-12 h-12 text-white" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
