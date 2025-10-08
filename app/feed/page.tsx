'use client'

import { useState, useEffect, useRef } from 'react'
import { Video } from '@prisma/client'
import { getVideoPositioning, getResponsiveVideoStyles, VideoPositioning } from '@/lib/video-positioning'

interface VideoFeedProps {
  videos: Video[]
}

export default function VideoFeed() {
  const [videos, setVideos] = useState<Video[]>([])
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isScrolling, setIsScrolling] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [screenWidth, setScreenWidth] = useState(0)
  const [manualAdjustments, setManualAdjustments] = useState<Record<string, VideoPositioning>>({})

  // Fetch videos
  useEffect(() => {
    async function fetchVideos() {
      try {
        const response = await fetch('/api/videos')
        if (!response.ok) throw new Error('Failed to fetch videos')
        const data = await response.json()
        setVideos(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load videos')
      } finally {
        setLoading(false)
      }
    }
    fetchVideos()
  }, [])

  // Track screen width for responsive positioning
  useEffect(() => {
    const updateScreenWidth = () => {
      setScreenWidth(window.innerWidth)
    }
    
    updateScreenWidth()
    window.addEventListener('resize', updateScreenWidth)
    return () => window.removeEventListener('resize', updateScreenWidth)
  }, [])

  // Handle touch events for swipe gestures (mobile only)
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only handle touch events, not mouse events
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
    const threshold = 50 // Minimum swipe distance

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0 && currentVideoIndex < videos.length - 1) {
        // Swipe up - next video
        goToNext()
      } else if (deltaY < 0 && currentVideoIndex > 0) {
        // Swipe down - previous video
        goToPrevious()
      }
    }
    
    setIsScrolling(false)
  }

  // Handle mouse events separately (no swipe behavior)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent mouse events from interfering with touch
    e.preventDefault()
  }

  // Handle keyboard navigation
  useEffect(() => {
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
  }, [currentVideoIndex, videos.length])

  // Navigation functions
  const goToPrevious = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(prev => prev - 1)
    }
  }

  const goToNext = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(prev => prev + 1)
    }
  }

  // Handle video play/pause
  const handleVideoClick = (videoId: string) => {
    const videoElement = document.querySelector(`video[data-video-id="${videoId}"]`) as HTMLVideoElement
    if (videoElement) {
      if (videoElement.paused) {
        videoElement.play()
      } else {
        videoElement.pause()
      }
    }
  }

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading videos...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">No videos available</div>
      </div>
    )
  }

  const currentVideo = videos[currentVideoIndex]

  return (
    <div className="h-screen w-screen bg-black relative overflow-hidden" style={{ position: 'fixed', top: 0, left: 0 }}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.history.back()}
              className="text-white hover:text-gray-300 transition-colors"
              title="Back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-white text-xl font-bold">Pilates Feed</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-white text-sm">
              {currentVideoIndex + 1} / {videos.length}
            </div>
            <button
              onClick={() => window.history.back()}
              className="text-white hover:text-gray-300 transition-colors p-2"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
        onMouseDown={handleMouseDown}
      >
        {videos.map((video, index) => (
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
                  manualAdjustments[video.id] || getVideoPositioning({
                    title: video.title,
                    description: video.description || '',
                    category: video.category,
                    muscleGroups: video.muscleGroups
                  }),
                  screenWidth || window.innerWidth
                )}
                poster={video.thumbnail || undefined}
                autoPlay={index === currentVideoIndex}
                muted={false}
                loop
                playsInline
                preload="metadata"
                data-video-id={video.id}
                onClick={() => handleVideoClick(video.id)}
              >
                <source src={`/api/videos/${video.id}/stream`} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Play/Pause Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Video Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <div className="text-white">
                <h2 className="text-2xl font-bold mb-2">{video.title}</h2>
                <p className="text-gray-300 mb-4">{video.description}</p>
                
                {/* Video Info */}
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span className="bg-red-500 text-white px-2 py-1 rounded">
                    {video.difficulty}
                  </span>
                  <span>{video.category}</span>
                  <span>{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                </div>

                {/* Muscle Groups */}
                {video.muscleGroups && video.muscleGroups.length > 0 && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-2">
                      {video.muscleGroups.map((muscle, idx) => (
                        <span
                          key={idx}
                          className="bg-white/20 text-white px-2 py-1 rounded-full text-xs"
                        >
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="absolute right-4 bottom-32 flex flex-col space-y-4">
              {/* Like Button */}
              <button className="bg-rose-500/20 backdrop-blur-sm rounded-full p-3 hover:bg-rose-500/40 transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              {/* Add to Playlist Button */}
              <button className="bg-rose-500/20 backdrop-blur-sm rounded-full p-3 hover:bg-rose-500/40 transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>

              {/* Share Button */}
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
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10">
        <button
          onClick={goToNext}
          disabled={currentVideoIndex === videos.length - 1}
          className={`p-3 rounded-full transition-all ${
            currentVideoIndex === videos.length - 1 
              ? 'bg-white/20 text-white/40 cursor-not-allowed' 
              : 'bg-white/20 text-white hover:bg-white/40 hover:scale-110'
          }`}
          title="Next video"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex space-x-2">
          {videos.map((_, index) => (
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