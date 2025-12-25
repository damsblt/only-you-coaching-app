'use client'

import { useState, useEffect } from 'react'
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

export default function S3Image({ 
  s3Key, 
  alt, 
  fill = false,
  className = '',
  fallbackSrc,
  width,
  height,
  style
}: S3ImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchImageUrl = async () => {
      try {
        const baseUrl = typeof window !== 'undefined' 
          ? window.location.origin 
          : process.env.NEXT_PUBLIC_APP_URL || ''
        
        const apiUrl = `${baseUrl}/api/gallery/specific-photo?key=${encodeURIComponent(s3Key)}`
        
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
            setImageUrl(data.url)
          } else {
            setError(true)
          }
        } else {
          console.error('Failed to fetch S3 image URL:', response.status)
          setError(true)
        }
      } catch (error) {
        console.error('Error fetching S3 image URL:', error)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchImageUrl()
  }, [s3Key])

  if (loading) {
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
      onError={() => {
        setError(true)
      }}
    />
  )
}

