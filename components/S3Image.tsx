'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'

interface S3ImageProps {
  s3Key: string
  alt: string
  fill?: boolean
  className?: string
  fallbackSrc?: string
  width?: number
  height?: number
  style?: React.CSSProperties
}

// Cache global pour les URLs S3 (valide 6 heures)
// Utiliser le cache global partagé avec le préchargeur
declare global {
  var s3ImageCache: Map<string, { url: string; timestamp: number }> | undefined
}

// Initialiser le cache global s'il n'existe pas
if (typeof window !== 'undefined' && !globalThis.s3ImageCache) {
  globalThis.s3ImageCache = new Map()
}

const s3ImageCache = typeof window !== 'undefined' && globalThis.s3ImageCache 
  ? globalThis.s3ImageCache 
  : new Map<string, { url: string; timestamp: number }>()

const CACHE_DURATION = 6 * 60 * 60 * 1000 // 6 heures

async function fetchS3ImageUrl(s3Key: string): Promise<string | null> {
  // Utiliser le cache global partagé
  const cache = typeof window !== 'undefined' && globalThis.s3ImageCache 
    ? globalThis.s3ImageCache 
    : s3ImageCache
  
  // Vérifier le cache
  const cached = cache.get(s3Key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.url
  }

  try {
    const baseUrl = typeof window !== 'undefined' 
      ? (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin)
      : (process.env.NEXT_PUBLIC_SITE_URL || '')
    
    const apiUrl = `${baseUrl}/api/gallery/specific-photo?key=${encodeURIComponent(s3Key)}`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Utiliser le cache HTTP pour accélérer les requêtes répétées
      cache: 'default' // Utilise le cache du navigateur
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.url) {
        // Mettre en cache global
        cache.set(s3Key, { url: data.url, timestamp: Date.now() })
        return data.url
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching S3 image URL:', error)
    return null
  }
}

export default function S3Image({ 
  s3Key, 
  alt, 
  fill = false,
  className = '',
  fallbackSrc,
  width,
  height,
  style,
  priority = false,
  loading: loadingProp
}: S3ImageProps & { priority?: boolean; loading?: 'lazy' | 'eager' }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadImage = async () => {
      // Utiliser le cache global partagé
      const cache = typeof window !== 'undefined' && globalThis.s3ImageCache 
        ? globalThis.s3ImageCache 
        : s3ImageCache
      
      // Vérifier le cache immédiatement
      const cached = cache.get(s3Key)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        if (!cancelled) {
          setImageUrl(cached.url)
          setIsLoading(false)
          return
        }
      }

      // Sinon, fetch avec cache HTTP
      const url = await fetchS3ImageUrl(s3Key)
      if (!cancelled) {
        if (url) {
          setImageUrl(url)
          setError(false)
        } else {
          setError(true)
        }
        setIsLoading(false)
      }
    }

    loadImage()

    return () => {
      cancelled = true
    }
  }, [s3Key])

  if (isLoading) {
    return (
      <div 
        className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}
        style={fill ? undefined : { width, height }}
      />
    )
  }

  if (error || !imageUrl) {
    if (fallbackSrc) {
      return (
        <Image
          src={fallbackSrc}
          alt={alt}
          fill={fill}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          className={className}
          style={style}
        />
      )
    }
    return null
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={className}
      style={style}
      unoptimized
      priority={priority}
      loading={loadingProp}
      onError={() => {
        setError(true)
      }}
    />
  )
}

