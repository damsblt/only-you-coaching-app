"use client"

import { useState, useEffect, useRef } from "react"
import { X, Heart, Plus, Share2, Info, Play, Pause, Volume2, VolumeX } from "lucide-react"
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

interface SimpleVideoPlayerProps {
  video: Video
  onClose?: () => void
  className?: string
  showDetails?: boolean
  autoPlay?: boolean
  muted?: boolean
}

export default function SimpleVideoPlayer({ 
  video, 
  onClose, 
  className = "", 
  showDetails = true, 
  autoPlay = false, 
  muted = false 
}: SimpleVideoPlayerProps) {
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
  const videoRef = useRef<HTMLVideoElement>(null)

  // Load video source when component mounts
  useEffect(() => {
    const loadVideo = async () => {
      try {
        console.group('🎬 VIDEO LOADING DEBUG')
        console.log('Video ID:', video.id)
        console.log('Video title:', video.title)
        console.log('Video URL from database:', video.videoUrl)
        
        setIsLoading(true)
        setError(null)
        
        // Validate video ID
        if (!video.id) {
          throw new Error('Video ID is missing')
        }
        
        // Use the streaming API endpoint
        const streamUrl = `/api/videos/${video.id}/stream`
        console.log('Streaming API URL:', streamUrl)
        
        // Always use the streaming API first (it handles CORS properly)
        console.log('Using streaming API URL:', streamUrl)
        setVideoSrc(streamUrl)
        console.groupEnd()
      } catch (err) {
        console.error('Error loading video:', err)
        setError(`Failed to load video: ${err instanceof Error ? err.message : 'Unknown error'}`)
        console.groupEnd()
      } finally {
        setIsLoading(false)
      }
    }

    loadVideo()
  }, [video.id, video.videoUrl])

  // Video event handlers
  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement || !videoSrc) return

    console.group('🎥 VIDEO ELEMENT SETUP')
    console.log('Video element:', videoElement)
    console.log('Video source:', videoSrc)
    console.log('Video element src:', videoElement.src)
    console.groupEnd()

    const handleLoadedMetadata = () => {
      console.log('Video metadata loaded, duration:', videoElement.duration)
      setDuration(videoElement.duration)
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
    }

    const handleError = (e: Event) => {
      console.group('🚨 VIDEO ERROR DEBUG')
      
      // Basic event information
      console.log('Event type:', e.type)
      console.log('Event target:', e.target)
      console.log('Event timestamp:', e.timeStamp)
      
      // Video element specific information
      const videoElement = e.target as HTMLVideoElement
      if (videoElement) {
        console.log('Video element error:', videoElement.error)
        console.log('Video element error code:', videoElement.error?.code)
        console.log('Video element error message:', videoElement.error?.message)
        console.log('Video network state:', videoElement.networkState)
        console.log('Video ready state:', videoElement.readyState)
        console.log('Video src:', videoElement.src)
        console.log('Video current src:', videoElement.currentSrc)
        console.log('Video poster:', videoElement.poster)
        console.log('Video duration:', videoElement.duration)
        console.log('Video paused:', videoElement.paused)
        console.log('Video ended:', videoElement.ended)
        console.log('Video muted:', videoElement.muted)
        console.log('Video volume:', videoElement.volume)
        console.log('Video playback rate:', videoElement.playbackRate)
        console.log('Video buffered ranges:', videoElement.buffered.length)
        console.log('Video seekable ranges:', videoElement.seekable.length)
        console.log('Video videoWidth:', videoElement.videoWidth)
        console.log('Video videoHeight:', videoElement.videoHeight)
        
        // Network state names
        const networkStateNames = {
          0: 'NETWORK_EMPTY',
          1: 'NETWORK_IDLE', 
          2: 'NETWORK_LOADING',
          3: 'NETWORK_NO_SOURCE'
        }
        console.log('Network state:', videoElement.networkState, `(${networkStateNames[videoElement.networkState]})`)
        
        // Ready state names
        const readyStateNames = {
          0: 'HAVE_NOTHING',
          1: 'HAVE_METADATA',
          2: 'HAVE_CURRENT_DATA',
          3: 'HAVE_FUTURE_DATA',
          4: 'HAVE_ENOUGH_DATA'
        }
        console.log('Ready state:', videoElement.readyState, `(${readyStateNames[videoElement.readyState]})`)
        
        // Check if video source is accessible
        if (videoElement.src) {
          fetch(videoElement.src, { method: 'HEAD' })
            .then(response => {
              console.log('Direct video source test - Status:', response.status)
              console.log('Direct video source test - Headers:', Object.fromEntries(response.headers.entries()))
            })
            .catch(fetchError => {
              console.log('Direct video source test failed:', fetchError)
            })
        }
      }
      
      // Check for CORS or network issues
      console.log('Current URL:', window.location.href)
      console.log('Video URL origin:', videoElement?.src ? new URL(videoElement.src).origin : 'No src')
      console.log('Current origin:', window.location.origin)
      
      console.groupEnd()
      
      // Determine error message based on available information
      let errorMessage = 'Failed to load video. Please try again.'
      let shouldTryFallback = false
      
      if (videoElement?.error) {
        switch (videoElement.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Video loading was aborted.'
            break
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error occurred while loading video.'
            shouldTryFallback = true
            break
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Video format not supported or corrupted.'
            break
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Video source not supported or not found.'
            shouldTryFallback = true
            break
          default:
            errorMessage = `Video error: ${videoElement.error.message || 'Unknown error'}`
            shouldTryFallback = true
        }
      } else if (videoElement?.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
        errorMessage = 'No video source available.'
        shouldTryFallback = true
      } else if (videoElement?.networkState === HTMLMediaElement.NETWORK_LOADING) {
        errorMessage = 'Video is still loading...'
      }
      
      // Try fallback to direct video URL if it's a network/source issue
      if (shouldTryFallback && video.videoUrl && videoElement?.src?.includes('/api/videos/')) {
        console.log('Trying fallback to direct video URL:', video.videoUrl)
        setVideoSrc(video.videoUrl)
        setIsLoading(true)
        setError(null)
        return
      }
      
      // If we're already using the direct URL and still getting errors, it's likely a CORS issue
      if (videoElement?.src?.includes('s3.eu-north-1.amazonaws.com')) {
        errorMessage = 'Video cannot be loaded. This is likely due to S3 configuration issues. Please contact support or try refreshing the page.'
        shouldTryFallback = false // Don't try fallback again
      }
      
      console.error('Final error message:', errorMessage)
      setError(errorMessage)
      setIsLoading(false)
    }

    const handleLoadStart = () => {
      setIsLoading(true)
      setError(null)
    }

    const handleCanPlay = () => {
      setIsLoading(false)
    }

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)
    videoElement.addEventListener('timeupdate', handleTimeUpdate)
    videoElement.addEventListener('ended', handleEnded)
    videoElement.addEventListener('error', handleError)
    videoElement.addEventListener('loadstart', handleLoadStart)
    videoElement.addEventListener('canplay', handleCanPlay)

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
      videoElement.removeEventListener('timeupdate', handleTimeUpdate)
      videoElement.removeEventListener('ended', handleEnded)
      videoElement.removeEventListener('error', handleError)
      videoElement.removeEventListener('loadstart', handleLoadStart)
      videoElement.removeEventListener('canplay', handleCanPlay)
    }
  }, [videoSrc])

  const togglePlay = () => {
    const videoElement = videoRef.current
    if (!videoElement || isLoading || error) return

    if (isPlaying) {
      videoElement.pause()
      setIsPlaying(false)
    } else {
      videoElement.play()
      setIsPlaying(true)
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

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
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
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">{video.title}</h2>
            <div className={`px-2 py-1 rounded-md text-sm font-medium text-white ${getDifficultyColor(video.difficulty)}`}>
              {getDifficultyLabel(video.difficulty)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Détails"
            >
              <Info className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
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
                  onClick={togglePlay}
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
                    onClick={togglePlay}
                    className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-6 transition-all duration-200 transform hover:scale-110"
                  >
                    <Play className="w-12 h-12 text-rose-600" fill="currentColor" />
                  </button>
                </div>
              )}

              {/* Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
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
                    <button onClick={togglePlay} className="hover:text-rose-400 transition-colors">
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </button>
                    <button onClick={() => skip(-10)} className="hover:text-rose-400 transition-colors">
                      <span className="text-sm">-10s</span>
                    </button>
                    <button onClick={() => skip(10)} className="hover:text-rose-400 transition-colors">
                      <span className="text-sm">+10s</span>
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
                        className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                    <span className="text-sm">
                      {formatDuration(currentTime)} / {formatDuration(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsFavorite(!isFavorite)}
                      className={`p-2 rounded-lg transition-colors ${
                        isFavorite ? 'text-rose-500 bg-rose-100' : 'hover:bg-gray-700'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                      <Plus className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details Panel */}
          {isDetailsOpen && (
            <div className="w-80 bg-gray-50 p-6 overflow-y-auto max-h-[70vh]">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails de l&apos;exercice</h3>
              
              {/* Description */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600 text-sm">{video.detailedDescription || video.description}</p>
              </div>

              {/* Category & Region */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Catégorie</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-sm">
                    {video.category}
                  </span>
                  {video.region && (
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                      {video.region}
                    </span>
                  )}
                </div>
              </div>

              {/* Muscle Groups */}
              {video.muscleGroups.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Muscles ciblés</h4>
                  <div className="flex flex-wrap gap-2">
                    {video.muscleGroups.map((muscle, index) => (
                      <span
                        key={index}
                        className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm"
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Starting Position */}
              {video.startingPosition && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Position de départ</h4>
                  <p className="text-gray-600 text-sm">{video.startingPosition}</p>
                </div>
              )}

              {/* Movement */}
              {video.movement && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Mouvement</h4>
                  <p className="text-gray-600 text-sm">{video.movement}</p>
                </div>
              )}

              {/* Series & Intensity */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Séries & Intensité</h4>
                <div className="space-y-2">
                  {video.series && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{video.series}</span>
                    </div>
                  )}
                  {video.intensity && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{video.intensity}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Constraints */}
              {video.constraints && video.constraints !== "Aucune" && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Contraintes</h4>
                  <p className="text-gray-600 text-sm">{video.constraints}</p>
                </div>
              )}

              {/* Tags */}
              {video.tags.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {video.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
