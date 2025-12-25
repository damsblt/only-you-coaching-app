'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface GalleryProps {
  localImages: string[]
}

export default function Gallery({ localImages }: GalleryProps) {
  const [s3Images, setS3Images] = useState<string[]>([])
  const [allImages, setAllImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch images from S3
    const fetchS3Images = async () => {
      try {
        const baseUrl = typeof window !== 'undefined' 
          ? window.location.origin 
          : process.env.NEXT_PUBLIC_APP_URL || ''
        
        const apiUrl = `${baseUrl}/api/gallery/training-photos`
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        })
        
        if (response.ok) {
          const data = await response.json()
          setS3Images(data.photos || [])
        } else {
          console.error('Failed to fetch S3 images:', response.status)
        }
      } catch (error) {
        console.error('Error fetching S3 images:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchS3Images()
  }, [])

  useEffect(() => {
    // Mix local and S3 images randomly
    // Always include local images, even if S3 fails
    const mixedImages = [...localImages, ...s3Images]
    
    // Shuffle the array to mix them up
    const shuffled = [...mixedImages].sort(() => Math.random() - 0.5)
    
    // Take up to 12 images (or all if less)
    // If we have fewer than 12, we'll show what we have
    setAllImages(shuffled.slice(0, 12))
  }, [localImages, s3Images])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="relative w-full h-48 rounded-2xl overflow-hidden shadow-lg bg-gray-200 dark:bg-gray-700 animate-pulse"
          />
        ))}
      </div>
    )
  }

  // If no images at all, show local images as fallback
  const imagesToShow = allImages.length > 0 ? allImages : localImages

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {imagesToShow.map((src, index) => (
        <div
          key={`${src}-${index}`}
          className="relative w-full h-48 rounded-2xl overflow-hidden shadow-lg group cursor-pointer"
        >
          <Image
            src={src}
            alt="Séance de coaching"
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            unoptimized={src.startsWith('http')} // Don't optimize external URLs
            onError={(e) => {
              // Hide broken images
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      ))}
    </div>
  )
}

