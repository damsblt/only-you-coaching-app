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
  /** Custom object-position for the image (e.g. 'center 25%') */
  imagePosition?: string
  /** Zoom factor: 1 = normal, 0.9 = dezoom 10%, 1.1 = zoom 10% */
  imageScale?: number
}

const heightClasses = {
  small: 'h-48 md:h-64',
  medium: 'h-64 md:h-80',
  large: 'h-80 md:h-96',
  fullScreen: 'h-screen'
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

export default function PageHeader({ 
  imageS3Key, 
  videoS3Key,
  title, 
  subtitle,
  height = 'medium',
  className = '',
  imagePosition,
  imageScale = 1
}: PageHeaderProps) {
  // Générer l'URL vidéo directement (pas besoin d'API pour les URLs publiques)
  const videoUrl = videoS3Key ? getDirectS3Url(videoS3Key) : null
  const [videoError, setVideoError] = useState(false)
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

  return (
    <div className={`relative w-full ${className}`}>
      {/* Header area with clipped background */}
      <div className={`relative ${heightClasses[height]} overflow-hidden`}>
        {/* Background - Video or Image (inset negative for dezoom effect) */}
        <div 
          className="absolute"
          style={{
            inset: imageScale !== 1 ? `${-((1 - imageScale) * 50)}%` : '0'
          }}
        >
          {videoS3Key && videoUrl && !videoError ? (
            <video
              src={videoUrl}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="w-full h-full object-cover"
              style={{
                objectPosition: imagePosition || (isMobile ? '35% center' : 'center')
              }}
              onError={(e) => {
                console.error('Video load error for key:', videoS3Key, e)
                setVideoError(true)
              }}
            />
          ) : imageS3Key ? (
            <S3Image
              s3Key={imageS3Key}
              alt={title || 'Page header'}
              fill
              className="object-cover"
              priority={true}
              style={{
                objectPosition: imagePosition || ((isMobile || isTablet) ? '35% center' : 'center')
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

      {/* Wave effect - overlaps with header bottom and connects to section below */}
      <div className="relative -mt-[60px] md:-mt-[80px] lg:-mt-[100px] -mb-[2px] z-20 pointer-events-none">
        <svg 
          viewBox="0 0 1440 120" 
          preserveAspectRatio="none" 
          className="w-full h-[60px] md:h-[80px] lg:h-[100px] block"
        >
          <path 
            d="M0,78 C80,76 180,38 340,32 C440,28 520,68 650,78 C740,84 830,50 980,42 C1080,37 1180,65 1300,72 C1380,76 1420,72 1440,70 L1440,120 L0,120 Z" 
            fill="#F5E6E0"
          />
        </svg>
      </div>
    </div>
  )
}

