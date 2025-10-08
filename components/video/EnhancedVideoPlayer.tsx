"use client"

import { useState, useRef, useEffect } from "react"
import { X, Heart, Plus, Share2, Volume2, VolumeX, Play, Pause, SkipBack, SkipForward, Clock, Users, Target, Zap, Tag, Info } from "lucide-react"
import { formatDuration, getDifficultyColor, getDifficultyLabel } from "@/lib/utils"

interface EnhancedVideo {
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

interface EnhancedVideoPlayerProps {
  video: EnhancedVideo
  onClose?: () => void
  className?: string
  showDetails?: boolean
  autoPlay?: boolean
  muted?: boolean
}

export default function EnhancedVideoPlayer({ 
  video, 
  onClose, 
  className = "", 
  showDetails = true, 
  autoPlay = false, 
  muted = false 
}: EnhancedVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  const retryVideoLoad = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1)
      setError(null)
      setIsLoading(true)
      // Reset video source to trigger reload
      setVideoSrc(null)
      setTimeout(() => {
        const streamUrl = `/api/videos/${video.id}/stream`
        setVideoSrc(streamUrl)
      }, 1000)
    }
  }

  // Load video source when component mounts
  useEffect(() => {
    const loadVideo = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Validate video ID
        if (!video.id) {
          throw new Error('Video ID is missing')
        }
        
        // Use the streaming API endpoint
        const streamUrl = `/api/videos/${video.id}/stream`
        console.log('🎬 Starting video load process')
        console.log('Video ID:', video.id)
        console.log('Stream URL:', streamUrl)
        console.log('Original video URL:', video.videoUrl)
        
        // Test if the API endpoint is accessible with detailed logging
        try {
          console.log('🔍 Testing API endpoint accessibility...')
          const response = await fetch(streamUrl, { 
            method: 'HEAD',
            headers: {
              'Accept': 'video/*',
            }
          })
          
          console.log('API response status:', response.status)
          console.log('API response status text:', response.statusText)
          console.log('API response headers:', Object.fromEntries(response.headers.entries()))
          
          if (!response.ok) {
            console.warn(`⚠️ API returned ${response.status}: ${response.statusText}`)
            // Try fallback to direct video URL
            if (video.videoUrl) {
              console.log('🔄 Falling back to direct video URL:', video.videoUrl)
              setVideoSrc(video.videoUrl)
              return
            }
          } else {
            console.log('✅ Video API endpoint is accessible')
          }
        } catch (apiError) {
          console.error('❌ API endpoint test failed:', apiError)
          console.error('API error details:', {
            name: apiError instanceof Error ? apiError.name : 'Unknown',
            message: apiError instanceof Error ? apiError.message : 'Unknown error',
            stack: apiError instanceof Error ? apiError.stack : 'No stack trace'
          })
          
          // Try fallback to direct video URL
          if (video.videoUrl) {
            console.log('🔄 Falling back to direct video URL due to API error:', video.videoUrl)
            setVideoSrc(video.videoUrl)
            return
          }
        }
        
        console.log('🎯 Setting video source to stream URL')
        setVideoSrc(streamUrl)
      } catch (err) {
        console.error('💥 Error in loadVideo function:', err)
        setError(`Failed to load video: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setIsLoading(false)
      }
    }

    loadVideo()
  }, [video.id])

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement || !videoSrc) return

    // Add global error handler for this component
    const globalErrorHandler = (event: ErrorEvent) => {
      console.error('🌍 Global error caught:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      })
    }

    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      console.error('🌍 Unhandled promise rejection:', {
        reason: event.reason,
        promise: event.promise
      })
    }

    // Add global error listeners
    window.addEventListener('error', globalErrorHandler)
    window.addEventListener('unhandledrejection', unhandledRejectionHandler)

    // Note: Removed console.error interception to prevent infinite recursion

    // Add network monitoring
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const [url, options] = args
      console.log('🌐 Network request:', { url, options })
      
      try {
        const response = await originalFetch(...args)
        console.log('🌐 Network response:', {
          url,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        })
        return response
      } catch (error) {
        console.error('🌐 Network error:', { url, error })
        throw error
      }
    }

    // Restore original fetch and remove listeners on cleanup
    return () => {
      window.fetch = originalFetch
      window.removeEventListener('error', globalErrorHandler)
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler)
    }
  }, [videoSrc])

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement || !videoSrc) return


    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
    }

    const handleError = (e: Event) => {
      // Simplified error handling to prevent recursion
      try {
        console.group('🚨 VIDEO ERROR DEBUG INFO')
        
        // Basic event information
        console.log('Event type:', e.type)
        console.log('Event target:', e.target)
        console.log('Event timestamp:', e.timeStamp)
        
        // Video element information
        const videoElement = e.target as HTMLVideoElement
        const error = videoElement.error
        
        console.log('Video element error:', error)
        console.log('Video element error code:', error?.code)
        console.log('Video element error message:', error?.message)
        console.log('Video network state:', videoElement.networkState)
        console.log('Video ready state:', videoElement.readyState)
        console.log('Video src:', videoElement.src)
        console.log('Video current src:', videoElement.currentSrc)
        
        console.groupEnd()
      
      // Try to serialize the event object manually
      try {
        const eventInfo = {
          type: e.type,
          target: e.target,
          currentTarget: e.currentTarget,
          timeStamp: e.timeStamp,
          bubbles: e.bubbles,
          cancelable: e.cancelable,
          defaultPrevented: e.defaultPrevented,
          eventPhase: e.eventPhase,
          isTrusted: e.isTrusted,
        }
        console.error('Event info (manual serialization):', eventInfo)
      } catch (serializationError) {
        console.error('Failed to serialize event:', serializationError)
      }
      
      // Try to enumerate event properties
      try {
        const eventProps = {}
        for (const prop in e) {
          try {
            eventProps[prop] = e[prop]
          } catch (propError) {
            eventProps[prop] = `[Error accessing: ${propError.message}]`
          }
        }
        console.error('Event properties (enumerated):', eventProps)
      } catch (enumError) {
        console.error('Failed to enumerate event properties:', enumError)
      }
      
      // Try to access specific error event properties
      try {
        if (e instanceof ErrorEvent) {
          console.error('ErrorEvent specific properties:', {
            message: e.message,
            filename: e.filename,
            lineno: e.lineno,
            colno: e.colno,
            error: e.error
          })
        }
      } catch (errorEventError) {
        console.error('Failed to access ErrorEvent properties:', errorEventError)
      }
      
      console.error('Event object (direct):', e)
      console.error('Event type:', e.type)
      console.error('Event target:', e.target)
      console.error('Event currentTarget:', e.currentTarget)
      console.error('Event timeStamp:', e.timeStamp)
      
      console.error('Video element:', videoElement)
      console.error('Video element error:', error)
      console.error('Video element error code:', error?.code)
      console.error('Video element error message:', error?.message)
      console.error('Video network state:', videoElement.networkState)
      console.error('Video ready state:', videoElement.readyState)
      console.error('Video src:', videoElement.src)
      console.error('Video current src:', videoElement.currentSrc)
      console.error('Video poster:', videoElement.poster)
      console.error('Video duration:', videoElement.duration)
      console.error('Video paused:', videoElement.paused)
      console.error('Video ended:', videoElement.ended)
      console.error('Video muted:', videoElement.muted)
      console.error('Video volume:', videoElement.volume)
      console.error('Video playback rate:', videoElement.playbackRate)
      console.error('Video buffered ranges:', videoElement.buffered.length)
      console.error('Video seekable ranges:', videoElement.seekable.length)
      console.error('Video videoWidth:', videoElement.videoWidth)
      console.error('Video videoHeight:', videoElement.videoHeight)
      
      // Check if it's a network error by examining the event more closely
      if (e instanceof ErrorEvent) {
        console.error('ErrorEvent message:', e.message)
        console.error('ErrorEvent filename:', e.filename)
        console.error('ErrorEvent lineno:', e.lineno)
        console.error('ErrorEvent colno:', e.colno)
        console.error('ErrorEvent error:', e.error)
      }
      
      // Check for CORS or network issues
      console.error('Current URL:', window.location.href)
      console.error('Video URL origin:', videoElement.src ? new URL(videoElement.src).origin : 'No src')
      console.error('Current origin:', window.location.origin)
      
      // Alternative error detection methods
      console.error('=== ALTERNATIVE ERROR DETECTION ===')
      
      // Check if video element has any error state
      const hasError = videoElement.error !== null
      console.error('Video element has error:', hasError)
      
      // Check network state
      const networkStateNames = {
        0: 'NETWORK_EMPTY',
        1: 'NETWORK_IDLE', 
        2: 'NETWORK_LOADING',
        3: 'NETWORK_NO_SOURCE'
      }
      console.error('Network state:', videoElement.networkState, `(${networkStateNames[videoElement.networkState]})`)
      
      // Check ready state
      const readyStateNames = {
        0: 'HAVE_NOTHING',
        1: 'HAVE_METADATA',
        2: 'HAVE_CURRENT_DATA',
        3: 'HAVE_FUTURE_DATA',
        4: 'HAVE_ENOUGH_DATA'
      }
      console.error('Ready state:', videoElement.readyState, `(${readyStateNames[videoElement.readyState]})`)
      
      // Check if video source is accessible
      if (videoElement.src) {
        fetch(videoElement.src, { method: 'HEAD' })
          .then(response => {
            console.error('Direct video source test - Status:', response.status)
            console.error('Direct video source test - Headers:', Object.fromEntries(response.headers.entries()))
          })
          .catch(fetchError => {
            console.error('Direct video source test failed:', fetchError)
          })
      }
      
      // Check browser console for any additional errors
      console.error('Check browser console for additional error messages above this point')
      
      console.groupEnd()
      
      let errorMessage = 'Failed to load video. Please try again.'
      
      if (error) {
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Video loading was aborted.'
            break
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error occurred while loading video.'
            break
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Video format not supported or corrupted.'
            break
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Video source not supported or not found.'
            break
          default:
            errorMessage = `Video error: ${error.message || 'Unknown error'}`
        }
      } else {
        // Check network state for additional context
        switch (videoElement.networkState) {
          case HTMLMediaElement.NETWORK_NO_SOURCE:
            errorMessage = 'No video source available.'
            break
          case HTMLMediaElement.NETWORK_LOADING:
            errorMessage = 'Video is still loading...'
            break
          case HTMLMediaElement.NETWORK_NO_SOURCE:
            errorMessage = 'No video source found.'
            break
        }
      }
      
      console.error('Final error message:', errorMessage)
      setError(errorMessage)
      setIsLoading(false)
      
      } catch (handlerError) {
        console.error('Error in handleError:', handlerError)
        setError('Failed to load video. Please try again.')
        setIsLoading(false)
      }
    }

    const handleLoadStart = () => {
      console.log('🎬 Video load started')
      console.log('Video src:', videoElement.src)
      console.log('Video current src:', videoElement.currentSrc)
      setIsLoading(true)
      setError(null)
    }

    const handleCanPlay = () => {
      console.log('✅ Video can play')
      console.log('Video duration:', videoElement.duration)
      console.log('Video ready state:', videoElement.readyState)
      setIsLoading(false)
    }

    const handleLoadedData = () => {
      console.log('📊 Video data loaded')
      console.log('Video duration:', videoElement.duration)
      console.log('Video videoWidth:', videoElement.videoWidth)
      console.log('Video videoHeight:', videoElement.videoHeight)
    }

    const handleLoadedMetadata = () => {
      console.log('📋 Video metadata loaded')
      console.log('Video duration:', videoElement.duration)
      console.log('Video videoWidth:', videoElement.videoWidth)
      console.log('Video videoHeight:', videoElement.videoHeight)
      setDuration(videoElement.duration)
      setIsLoading(false)
    }

    const handleProgress = () => {
      console.log('⏳ Video progress')
      console.log('Video buffered ranges:', videoElement.buffered.length)
      if (videoElement.buffered.length > 0) {
        console.log('Buffered start:', videoElement.buffered.start(0))
        console.log('Buffered end:', videoElement.buffered.end(0))
      }
    }

    const handleStalled = () => {
      console.warn('Video stalled - network issues detected')
    }

    const handleSuspend = () => {
      console.warn('Video loading suspended')
    }

    const handleWaiting = () => {
      console.warn('Video waiting for data')
    }

    const handleEmptied = () => {
      console.warn('Video emptied - source changed or error occurred')
    }

    // Test video element capabilities
    const testVideoElement = () => {
      console.log('🧪 Testing video element capabilities...')
      console.log('Can play MP4:', videoElement.canPlayType('video/mp4'))
      console.log('Can play WebM:', videoElement.canPlayType('video/webm'))
      console.log('Can play OGG:', videoElement.canPlayType('video/ogg'))
      console.log('Video element ready state:', videoElement.readyState)
      console.log('Video element network state:', videoElement.networkState)
    }

    // Run test after a short delay to ensure element is ready
    setTimeout(testVideoElement, 100)

    // Add continuous error monitoring
    const errorMonitor = setInterval(() => {
      if (videoElement.error) {
        console.error('🔍 ERROR DETECTED VIA POLLING:', {
          error: videoElement.error,
          errorCode: videoElement.error.code,
          errorMessage: videoElement.error.message,
          networkState: videoElement.networkState,
          readyState: videoElement.readyState,
          src: videoElement.src,
          currentSrc: videoElement.currentSrc
        })
      }
    }, 1000) // Check every second

    // Clean up error monitor
    const cleanupErrorMonitor = () => {
      clearInterval(errorMonitor)
    }

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)
    videoElement.addEventListener('loadeddata', handleLoadedData)
    videoElement.addEventListener('progress', handleProgress)
    videoElement.addEventListener('timeupdate', handleTimeUpdate)
    videoElement.addEventListener('ended', handleEnded)
    videoElement.addEventListener('error', handleError)
    videoElement.addEventListener('loadstart', handleLoadStart)
    videoElement.addEventListener('canplay', handleCanPlay)
    videoElement.addEventListener('stalled', handleStalled)
    videoElement.addEventListener('suspend', handleSuspend)
    videoElement.addEventListener('waiting', handleWaiting)
    videoElement.addEventListener('emptied', handleEmptied)

    return () => {
      cleanupErrorMonitor()
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
      videoElement.removeEventListener('loadeddata', handleLoadedData)
      videoElement.removeEventListener('progress', handleProgress)
      videoElement.removeEventListener('timeupdate', handleTimeUpdate)
      videoElement.removeEventListener('ended', handleEnded)
      videoElement.removeEventListener('error', handleError)
      videoElement.removeEventListener('loadstart', handleLoadStart)
      videoElement.removeEventListener('canplay', handleCanPlay)
      videoElement.removeEventListener('stalled', handleStalled)
      videoElement.removeEventListener('suspend', handleSuspend)
      videoElement.removeEventListener('waiting', handleWaiting)
      videoElement.removeEventListener('emptied', handleEmptied)
    }
  }, [videoSrc])

  const togglePlay = async () => {
    const videoElement = videoRef.current
    if (!videoElement || isLoading || error) return

    try {
      if (isPlaying) {
        videoElement.pause()
        setIsPlaying(false)
      } else {
        // Check if video is ready to play
        if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
          const playPromise = videoElement.play()
          if (playPromise !== undefined) {
            await playPromise
            setIsPlaying(true)
          }
        } else {
          // Wait for video to be ready
          videoElement.addEventListener('canplay', () => {
            videoElement.play().then(() => {
              setIsPlaying(true)
            }).catch(err => {
              console.error('Error playing video:', err)
              setError('Failed to play video. Please try again.')
            })
          }, { once: true })
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
              <video
                ref={videoRef}
                src={videoSrc || undefined}
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
              
              {/* Loading State */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Loading video...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                  <div className="text-center text-white p-6">
                    <div className="text-red-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium mb-2">Video Error</p>
                    <p className="text-sm text-gray-300 mb-4">{error}</p>
                    <div className="flex gap-2 justify-center">
                      {retryCount < 3 && (
                        <button
                          onClick={retryVideoLoad}
                          className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Retry ({3 - retryCount} attempts left)
                        </button>
                      )}
                      <button
                        onClick={() => window.location.reload()}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Reload Page
                      </button>
                    </div>
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
                      <Zap className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-gray-600">{video.series}</span>
                    </div>
                  )}
                  {video.intensity && (
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-500" />
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
