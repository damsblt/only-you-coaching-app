"use client"

import { useState, useEffect, useRef } from "react"
import { X, Heart, Plus, Share2, Info, Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight } from "lucide-react"
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

interface MobileStreamPlayerProps {
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

export default function MobileStreamPlayer({ 
  video, 
  onClose,
  onNext,
  onPrevious,
  currentIndex = 0,
  totalVideos = 1,
  className = "", 
  autoPlay = false, 
  muted = true // Default to muted for mobile auto-play
}: MobileStreamPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isMuted, setIsMuted] = useState(muted)
  const [volume, setVolume] = useState(1)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

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
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
            <h1 className="text-white text-lg font-bold">Vidéos Pilates</h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-white text-sm">
              {currentIndex + 1} / {totalVideos}
            </span>
            <button
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              className="text-white hover:text-gray-300 transition-colors p-1"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
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

          {/* Action Buttons - Right Side (Based on Wireframe) */}
          <div className="absolute right-4 bottom-32 flex flex-col space-y-4">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`bg-rose-500/20 backdrop-blur-sm rounded-full p-3 transition-colors ${
                isFavorite ? 'bg-rose-500/40' : 'hover:bg-rose-500/40'
              }`}
            >
              <Heart className={`w-6 h-6 text-white ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button className="bg-rose-500/20 backdrop-blur-sm rounded-full p-3 hover:bg-rose-500/40 transition-colors">
              <Plus className="w-6 h-6 text-white" />
            </button>
            <button className="bg-rose-500/20 backdrop-blur-sm rounded-full p-3 hover:bg-rose-500/40 transition-colors">
              <Share2 className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Video Controls - Bottom Overlay (Based on Wireframe) */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Video Info */}
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
              <span className="text-gray-300 text-sm">{formatDuration(duration)}</span>
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

            {/* Navigation Instructions */}
            <div className="text-white/60 text-xs mb-3">
              <div>Use arrow keys or swipe to navigate</div>
              <div>Click dots to jump to specific video</div>
            </div>
          </div>

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
        </div>
      </div>

      {/* Description Overlay - Based on Wireframe */}
      {isDetailsOpen && (
        <div className="absolute inset-0 bg-black/90 z-30 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Description</h3>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
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
