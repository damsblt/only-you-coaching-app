"use client"

import { useState, useEffect, useCallback } from 'react'

interface UseVideoPlayerOptions {
  preventScroll?: boolean
  onPlay?: () => void
  onPause?: () => void
  onError?: (error: any) => void
}

export function useVideoPlayer(options: UseVideoPlayerOptions = {}) {
  const { preventScroll = true, onPlay, onPause, onError } = options
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(mobile)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Prevent body scroll when video is playing (mobile)
  useEffect(() => {
    if (!preventScroll || !isMobile) return

    if (isPlaying) {
      // Store current scroll position
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.classList.add('video-playing')
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.classList.remove('video-playing')
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1)
      }
    }

    return () => {
      // Cleanup on unmount
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.classList.remove('video-playing')
    }
  }, [isPlaying, preventScroll, isMobile])

  // Handle video play
  const handlePlay = useCallback(() => {
    setIsPlaying(true)
    setError(null)
    onPlay?.()
  }, [onPlay])

  // Handle video pause
  const handlePause = useCallback(() => {
    setIsPlaying(false)
    onPause?.()
  }, [onPause])

  // Handle video error
  const handleError = useCallback((error: any) => {
    console.error('Video player error:', error)
    setError('Failed to load video. Please try again.')
    setIsPlaying(false)
    onError?.(error)
  }, [onError])

  // Handle video load
  const handleLoad = useCallback(() => {
    setError(null)
  }, [])

  // Handle touch events to prevent scroll conflicts
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isMobile) {
      e.stopPropagation()
    }
  }, [isMobile])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isMobile) {
      e.stopPropagation()
    }
  }, [isMobile])

  // Handle wheel events to prevent scroll conflicts
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (isMobile) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, [isMobile])

  return {
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
  }
}
