"use client"

import { useState, useEffect, useRef } from "react"
import { X, Heart, Plus, Share2, Info, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from "lucide-react"
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
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Retry
          </button>
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
              <button
                onClick={handleVideoClick}
                className="bg-white/20 backdrop-blur-sm rounded-full p-3 transition-all duration-200 transform hover:scale-110"
              >
                <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
              </button>
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
                <button onClick={togglePlay} className="hover:text-rose-400 transition-colors">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button onClick={() => skip(-10)} className="hover:text-rose-400 transition-colors text-xs">
                  -10s
                </button>
                <button onClick={() => skip(10)} className="hover:text-rose-400 transition-colors text-xs">
                  +10s
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={toggleMute} className="hover:text-rose-400 transition-colors">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
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

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`p-1 rounded transition-colors ${
                    isFavorite ? 'text-rose-500 bg-rose-100' : 'hover:bg-gray-700'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button className="p-1 hover:bg-gray-700 rounded transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
                <button className="p-1 hover:bg-gray-700 rounded transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Video Info */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{video.title}</h3>
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{video.description}</p>
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getDifficultyColor(video.difficulty)}`}>
              {getDifficultyLabel(video.difficulty)}
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {video.category}
            </span>
            <span className="text-xs text-gray-500">
              {formatDuration(duration)}
            </span>
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
                    <button onClick={togglePlay} className="hover:text-rose-400 transition-colors">
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </button>
                    <button onClick={() => skip(-10)} className="hover:text-rose-400 transition-colors">
                      <SkipBack className="w-5 h-5" />
                    </button>
                    <button onClick={() => skip(10)} className="hover:text-rose-400 transition-colors">
                      <SkipForward className="w-5 h-5" />
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
