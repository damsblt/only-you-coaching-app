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

  // Fetch video URL if videoS3Key is provided
  useEffect(() => {
    if (videoS3Key) {
      const fetchVideoUrl = async () => {
        try {
          setVideoLoading(true)
          const baseUrl = typeof window !== 'undefined' 
            ? window.location.origin 
            : process.env.NEXT_PUBLIC_APP_URL || ''
          
          const apiUrl = `${baseUrl}/api/videos/s3-video?key=${encodeURIComponent(videoS3Key)}`
          
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            cache: 'no-store',
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.url) {
              setVideoUrl(data.url)
            }
          }
        } catch (error) {
          console.error('Error fetching video URL:', error)
        } finally {
          setVideoLoading(false)
        }
      }

      fetchVideoUrl()
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
            className="w-full h-full object-cover"
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
          />
        ) : null}
        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
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

