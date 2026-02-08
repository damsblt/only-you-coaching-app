'use client'

import { useState, useRef } from 'react'
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
  sizes?: string // Pour les images responsives
}

// Configuration S3
const S3_BUCKET = 'only-you-coaching'
const S3_REGION = 'eu-north-1'

/**
 * Génère directement l'URL publique S3 côté client
 * Évite un aller-retour API inutile puisque les URLs sont publiques
 */
function getDirectS3Url(s3Key: string): string {
  const segments = s3Key.split('/')
  const encodedSegments = segments.map(segment => {
    try {
      const decoded = decodeURIComponent(segment)
      return encodeURIComponent(decoded)
    } catch {
      return encodeURIComponent(segment)
    }
  })
  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${encodedSegments.join('/')}`
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
  sizes,
  priority = false,
  loading: loadingProp
}: S3ImageProps & { priority?: boolean; loading?: 'lazy' | 'eager' }) {
  // Générer l'URL directement — pas besoin d'appel API pour une URL publique
  const imageUrl = getDirectS3Url(s3Key)
  const [error, setError] = useState(false)

  // Reset error quand la clé S3 change (sans useEffect pour éviter un remontage)
  const prevS3KeyRef = useRef(s3Key)
  if (prevS3KeyRef.current !== s3Key) {
    setError(false)
    prevS3KeyRef.current = s3Key
  }

  if (error) {
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
          sizes={sizes || (fill ? '100vw' : undefined)}
          quality={75}
        />
      )
    }
    // En cas d'erreur sans fallback, afficher un placeholder visible
    return (
      <div 
        className={`bg-gray-300 dark:bg-gray-600 ${fill ? 'absolute inset-0' : ''} ${className}`}
        style={fill ? undefined : { width, height }}
      />
    )
  }

  return (
    <Image
      key={s3Key}
      src={imageUrl}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={className}
      style={style}
      sizes={sizes || (fill ? '100vw' : undefined)}
      priority={priority}
      loading={loadingProp || (priority ? 'eager' : 'lazy')}
      fetchPriority={priority ? 'high' : 'auto'}
      quality={85}
      onError={(e) => {
        console.error(`[S3Image] Failed to load image: ${s3Key}`, {
          url: imageUrl,
          error: e
        })
        setError(true)
      }}
    />
  )
}

