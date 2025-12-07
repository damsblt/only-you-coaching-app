"use client"

import { useState, useEffect, useRef } from "react"
import { X, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from "lucide-react"
import { formatDuration, getDifficultyColor, getDifficultyLabel } from "@/lib/utils"
import { Button } from "@/components/ui/Button"

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

interface ListingPlayerProps {
  video: Video
  onClose?: () => void
  className?: string
  autoPlay?: boolean
  muted?: boolean
  variant?: 'modal' | 'inline'
}

export default function ListingPlayer({ 
  video, 
  onClose,
  className = "", 
  autoPlay = false, 
  muted = false,
  variant = 'modal'
}: ListingPlayerProps) {
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

  // Load video source when component mounts
  useEffect(() => {
    const loadVideo = async () => {
      try {
        console.log('🎬 Listing Player Loading:', video.id)
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
      
      // Get more details from the video element
      const videoElement = e.target as HTMLVideoElement
      if (videoElement) {
        console.error('Video element error details:', {
          error: videoElement.error,
          errorCode: videoElement.error?.code,
          errorMessage: videoElement.error?.message,
          networkState: videoElement.networkState,
          readyState: videoElement.readyState,
          src: videoElement.src,
          currentSrc: videoElement.currentSrc,
        })
        
        // Provide more specific error messages
        if (videoElement.error) {
          switch (videoElement.error.code) {
            case MediaError.MEDIA_ERR_ABORTED:
              setError('Chargement de la vidéo annulé. Veuillez réessayer.')
              break
            case MediaError.MEDIA_ERR_NETWORK:
              setError('Erreur réseau lors du chargement de la vidéo.')
              break
            case MediaError.MEDIA_ERR_DECODE:
              setError('Format vidéo non supporté ou corrompu.')
              break
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              setError('Source vidéo non supportée. Essayons l\'URL directe...')
              // Try fallback to direct URL
              if (video.videoUrl && videoElement.src?.includes('/api/videos/')) {
                console.log('🔄 Trying fallback to direct video URL:', video.videoUrl)
                setVideoSrc(video.videoUrl)
                setError(null)
                return
              }
              break
            default:
              setError('Erreur lors du chargement de la vidéo. Veuillez réessayer.')
          }
        } else {
          setError('Erreur lors du chargement de la vidéo. Veuillez réessayer.')
        }
      } else {
        setError('Failed to load video. Please try again.')
      }
      
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-center">
          <div className="text-red-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-1">Video Error</h3>
          <p className="text-red-600 text-sm mb-3">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="primary"
            size="sm"
            className="bg-red-600 hover:bg-red-700"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
        {/* Video Player */}
        <div className="relative aspect-video">
          {videoSrc && (
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full h-full object-cover"
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-sm">Loading...</p>
              </div>
            </div>
          )}

          {/* Play/Pause Overlay */}
          {!isPlaying && !isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                onClick={handleVideoClick}
                variant="ghost"
                size="sm"
                className="bg-white/20 backdrop-blur-sm rounded-full p-3 transition-all duration-200 transform hover:scale-110"
              >
                <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
              </Button>
            </div>
          )}

          {/* Controls Overlay */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}>
            {/* Progress Bar */}
            <div className="mb-2">
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
              <div className="flex items-center gap-2">
                <Button onClick={togglePlay} variant="ghost" size="sm" className="hover:text-rose-400 p-0">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                <Button onClick={() => skip(-10)} variant="ghost" size="sm" className="hover:text-rose-400 text-xs p-1">
                  -10s
                </Button>
                <Button onClick={() => skip(10)} variant="ghost" size="sm" className="hover:text-rose-400 text-xs p-1">
                  +10s
                </Button>
                <div className="flex items-center gap-1">
                  <Button onClick={toggleMute} variant="ghost" size="sm" className="hover:text-rose-400 p-0">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-12 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                <span className="text-xs">
                  {formatDuration(currentTime)} / {formatDuration(duration)}
                </span>
              </div>

            </div>
          </div>
        </div>

      </div>
    )
  }

  // Modal variant
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">{video.title}</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-600" />
          </Button>
        </div>

        <div className="flex">
          {/* Video Player */}
          <div className="flex-1">
            <div className="relative aspect-video bg-black">
              {videoSrc && (
                <video
                  ref={videoRef}
                  src={videoSrc}
                  className={`w-full h-full ${className}`}
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
                    className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-6 transition-all duration-200 transform hover:scale-110"
                  >
                    <Play className="w-12 h-12 text-rose-600" fill="currentColor" />
                  </button>
                </div>
              )}

              {/* Controls */}
              <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 transition-opacity duration-300 ${
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
                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-4">
                    <Button onClick={togglePlay} variant="ghost" size="sm" className="hover:text-rose-400 p-0">
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </Button>
                    <Button onClick={() => skip(-10)} variant="ghost" size="sm" className="hover:text-rose-400 p-0">
                      <SkipBack className="w-5 h-5" />
                    </Button>
                    <Button onClick={() => skip(10)} variant="ghost" size="sm" className="hover:text-rose-400 p-0">
                      <SkipForward className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button onClick={toggleMute} variant="ghost" size="sm" className="hover:text-rose-400 p-0">
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </Button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                    <span className="text-sm">
                      {formatDuration(currentTime)} / {formatDuration(duration)}
                    </span>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
