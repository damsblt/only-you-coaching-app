'use client'

import { useState, useEffect } from 'react'
import S3Image from '@/components/S3Image'

interface PageHeaderProps {
  imageS3Key?: string
  videoS3Key?: string
  title?: string
  subtitle?: string
  height?: 'small' | 'medium' | 'large' | 'fullScreen'
  className?: string
}

const heightClasses = {
  small: 'h-48 md:h-64',
  medium: 'h-64 md:h-80',
  large: 'h-80 md:h-96',
  fullScreen: 'h-screen'
}

// Cache global pour les URLs vidéo S3 (valide 1 heure)
// Utiliser le cache global partagé avec le préchargeur
declare global {
  var s3VideoCache: Map<string, { url: string; timestamp: number }> | undefined
}

// Initialiser le cache global s'il n'existe pas
if (typeof window !== 'undefined' && !globalThis.s3VideoCache) {
  globalThis.s3VideoCache = new Map()
}

const s3VideoCache = typeof window !== 'undefined' && globalThis.s3VideoCache 
  ? globalThis.s3VideoCache 
  : new Map<string, { url: string; timestamp: number }>()

const VIDEO_CACHE_DURATION = 60 * 60 * 1000 // 1 heure

async function fetchS3VideoUrl(videoS3Key: string): Promise<string | null> {
  // Utiliser le cache global partagé
  const cache = typeof window !== 'undefined' && globalThis.s3VideoCache 
    ? globalThis.s3VideoCache 
    : s3VideoCache
  
  // Vérifier le cache
  const cached = cache.get(videoS3Key)
  if (cached && Date.now() - cached.timestamp < VIDEO_CACHE_DURATION) {
    return cached.url
  }

  try {
    const baseUrl = typeof window !== 'undefined' 
      ? (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin)
      : (process.env.NEXT_PUBLIC_SITE_URL || '')
    
    const apiUrl = `${baseUrl}/api/videos/s3-video?key=${encodeURIComponent(videoS3Key)}`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Utiliser le cache HTTP pour accélérer
      cache: 'default' // Utilise le cache du navigateur
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.url) {
        // Mettre en cache global
        cache.set(videoS3Key, { url: data.url, timestamp: Date.now() })
        return data.url
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching video URL:', error)
    return null
  }
}

export default function PageHeader({ 
  imageS3Key, 
  videoS3Key,
  title, 
  subtitle,
  height = 'medium',
  className = ''
}: PageHeaderProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoLoading, setVideoLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  // Detect mobile and tablet screen sizes
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768) // mobile
      setIsTablet(width >= 768 && width < 1024) // tablet
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Fetch video URL if videoS3Key is provided
  useEffect(() => {
    if (videoS3Key) {
      let cancelled = false

      const loadVideo = async () => {
        // Utiliser le cache global partagé
        const cache = typeof window !== 'undefined' && globalThis.s3VideoCache 
          ? globalThis.s3VideoCache 
          : s3VideoCache
        
        // Vérifier le cache immédiatement
        const cached = cache.get(videoS3Key)
        if (cached && Date.now() - cached.timestamp < VIDEO_CACHE_DURATION) {
          if (!cancelled) {
            setVideoUrl(cached.url)
            setVideoLoading(false)
            return
          }
        }

        // Sinon, fetch avec cache HTTP
        const url = await fetchS3VideoUrl(videoS3Key)
        if (!cancelled) {
          setVideoUrl(url)
          setVideoLoading(false)
        }
      }

      loadVideo()

      return () => {
        cancelled = true
      }
    } else {
      setVideoLoading(false)
    }
  }, [videoS3Key])

  return (
    <div className={`relative w-full ${heightClasses[height]} overflow-hidden ${className}`}>
      {/* Background - Video or Image */}
      <div className="absolute inset-0">
        {videoS3Key && videoUrl ? (
          <video
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
            style={{
              objectPosition: isMobile ? '35% center' : 'center'
            }}
            onError={(e) => {
              console.error('Video error:', e)
              setVideoUrl(null)
            }}
          />
        ) : videoS3Key && videoLoading ? (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ) : imageS3Key ? (
          <S3Image
            s3Key={imageS3Key}
            alt={title || 'Page header'}
            fill
            className="object-cover"
            priority={true}
            style={{
              objectPosition: (isMobile || isTablet) ? '35% center' : 'center'
            }}
          />
        ) : (
          <div className="w-full h-full bg-footer-500" />
        )}
        {/* Overlay gradient for better text readability - only if there's an image or video */}
        {(imageS3Key || videoS3Key) && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
        )}
      </div>
      
      {/* Content */}
      {(title || subtitle) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 z-10">
          {title && (
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto drop-shadow-md">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

