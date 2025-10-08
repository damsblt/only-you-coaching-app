"use client"

import { useState, useEffect, useRef } from "react"
import { X, Heart, Plus, Share2, Info, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDuration, getDifficultyColor, getDifficultyLabel } from "@/lib/utils"
// import { MediaPlayer, MediaOutlet, MediaCommunitySkin } from '@vidstack/react'
import { useVideoPlayer } from '@/hooks/useVideoPlayer'

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
  variant = 'modal',
  showDetails = true
}: UnifiedVideoPlayerProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [showOverlay, setShowOverlay] = useState(true)
  const playerRef = useRef<HTMLDivElement>(null)
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
        
        // First try the streaming API
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
      } catch (err) {
        console.error('Error loading video:', err)
        setError(`Failed to load video: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    loadVideo()
  }, [video.id, video.videoUrl, setError])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (overlayTimeoutRef.current) {
        clearTimeout(overlayTimeoutRef.current)
      }
    }
  }, [])

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

  const playerContent = (
    <div className="relative w-full h-full">
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
        {videoSrc ? (
          <video
            ref={playerRef}
            src={videoSrc}
            poster={video.thumbnail}
            autoPlay={autoPlay}
            muted={muted || isMobile}
            playsInline
            onError={handleError}
            onLoadedData={handleLoad}
            onPlay={handlePlay}
            onPause={handlePause}
            className="w-full h-full"
            crossOrigin="anonymous"
            controls
            preload="metadata"
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


          {/* Navigation Arrows */}
          {onPrevious && (
            <button
              onClick={onPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-3 text-white hover:bg-white/40 transition-colors z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {onNext && (
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-3 text-white hover:bg-white/40 transition-colors z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Action Buttons - Right Side */}
          <div className="absolute right-4 bottom-32 flex flex-col space-y-4 z-10">
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
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      {playerContent}
      
      {/* Description Overlay */}
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
