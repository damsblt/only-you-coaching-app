"use client"

import { useState, useEffect, useRef } from "react"
import { X, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from "lucide-react"
import { formatDuration, getDifficultyColor, getDifficultyLabel } from "@/lib/utils"
import { useSimpleAuth } from "@/components/providers/SimpleAuthProvider"
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
  exo_title?: string
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
  onVideoCompleted?: () => void
  className?: string
  showDetails?: boolean
  autoPlay?: boolean
  muted?: boolean
}

export default function SimpleVideoPlayer({ 
  video, 
  onClose,
  onVideoCompleted,
  className = "", 
  showDetails = true, 
  autoPlay = false, 
  muted = false 
}: SimpleVideoPlayerProps) {
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

  // Function to save progress
  const saveProgress = async (progressSeconds: number, completed: boolean): Promise<void> => {
    if (!user || !video.id) {
      console.log('⚠️ Cannot save progress: missing user or video.id', { hasUser: !!user, hasVideoId: !!video.id })
      return Promise.resolve() // Return resolved promise instead of void
    }
    
    // Throttle saves to avoid too many API calls (but always save if completed)
    const now = Date.now()
    if (!completed && now - lastSaveTimeRef.current < 5000) {
      return Promise.resolve() // Return resolved promise instead of void
    }
    lastSaveTimeRef.current = now
    
    console.log('💾 Saving progress to database:', { 
      videoId: video.id, 
      userId: user.id, 
      completed, 
      progressSeconds,
      timestamp: new Date().toISOString()
    })
    
    try {
      const response = await fetch(`/api/videos/${video.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          completed,
          progressSeconds
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Error saving progress - API returned error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          url: `/api/videos/${video.id}/progress`
        })
        return Promise.resolve() // Return resolved promise even on error to allow callback to proceed
      }
      
      const data = await response.json()
      console.log('✅ Progress saved successfully in database:', {
        success: data.success,
        progress: data.progress,
        videoId: video.id
      })
      return Promise.resolve() // Explicitly return resolved promise
    } catch (error) {
      console.error('❌ Error saving progress (network/exception):', error)
      return Promise.resolve() // Return resolved promise even on error to allow callback to proceed
    }
  }

  // Reset completion flag when video changes
  useEffect(() => {
    hasMarkedCompletedRef.current = false
  }, [video.id])

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
      // Don't show controls automatically on load
    }

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime)
      
      // Auto-save progress regularly
      if (user && videoElement.currentTime > 0 && videoElement.duration > 0) {
        const progressSeconds = Math.floor(videoElement.currentTime)
        const duration = Math.floor(videoElement.duration)
        const progressPercent = (videoElement.currentTime / videoElement.duration) * 100
        
        // Mark as completed if watched at least 1 second (for program mode progression)
        if (progressSeconds >= 1 && !hasMarkedCompletedRef.current) {
          console.log(`📊 Video watched ${progressSeconds} second(s) - marking as completed for program progression`)
          hasMarkedCompletedRef.current = true
          saveProgress(duration, true).then(() => {
            console.log('✅ Video marked as completed after 1 second, calling onVideoCompleted callback')
            // Call the onVideoCompleted callback if provided
            if (onVideoCompleted) {
              onVideoCompleted()
            }
          }).catch((error) => {
            console.error('❌ Error in saveProgress promise:', error)
          })
        } else if (progressSeconds > 0 && progressSeconds % 5 === 0 && !hasMarkedCompletedRef.current) {
          // Save progress every 5 seconds (even if just 5% watched) - but only if not already completed
          console.log(`📊 Saving progress: ${progressPercent.toFixed(1)}% (${progressSeconds}s / ${duration}s)`)
          saveProgress(progressSeconds, false)
        }
      }
    }

    const handleEnded = () => {
      console.log('🎬 Video ended! Duration:', videoElement.duration)
      setIsPlaying(false)
      
      // Mark video as completed when it ends (only if not already marked after 1 second)
      if (user && !hasMarkedCompletedRef.current) {
        const duration = Math.floor(videoElement.duration)
        console.log('💾 Marking video as completed at end:', { videoId: video.id, duration })
        hasMarkedCompletedRef.current = true
        saveProgress(duration, true).then(() => {
          console.log('✅ Video marked as completed at end, calling onVideoCompleted callback')
          // Call the onVideoCompleted callback if provided
          if (onVideoCompleted) {
            onVideoCompleted()
          }
        }).catch((error) => {
          console.error('❌ Error in saveProgress promise:', error)
        })
      } else if (hasMarkedCompletedRef.current) {
        console.log('✅ Video already marked as completed after 1 second, skipping end handler')
      } else {
        console.warn('⚠️ Cannot mark video as completed: no user')
      }
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
      if (videoElement?.src?.includes('s3.eu-north-1.amazonaws.com') || videoElement?.src?.includes('amazonaws.com')) {
        console.error('[VideoPlayer] S3 direct access failed. This could be due to:')
        console.error('  - CORS configuration issues on S3 bucket')
        console.error('  - Bucket permissions not allowing public read')
        console.error('  - Incorrect bucket name or region in environment variables')
        console.error('  - Network connectivity issues')
        errorMessage = 'Video cannot be loaded. This is likely due to S3 configuration issues. Please contact support or try refreshing the page.'
        shouldTryFallback = false // Don't try fallback again
      } else if (videoElement?.src?.includes('/api/videos/')) {
        // If streaming API fails, provide more context
        console.error('[VideoPlayer] Streaming API failed. This could be due to:')
        console.error('  - Missing AWS environment variables (AWS_S3_BUCKET_NAME, AWS_REGION)')
        console.error('  - API route error')
        console.error('  - Database connection issues')
        errorMessage = 'Video cannot be loaded. The streaming service may be experiencing issues. Please try refreshing the page.'
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
  }, [videoSrc, user, video.id])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [])

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
