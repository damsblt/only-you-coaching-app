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
  // Carousel mode for About page - moved before early return
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    // Fetch images from S3
    const fetchS3Images = async () => {
      try {
        // Use environment variable in production, fallback to window.location.origin
        const baseUrl = typeof window !== 'undefined' 
          ? (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin)
          : (process.env.NEXT_PUBLIC_SITE_URL || '')
        
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

  // If no images at all, show local images as fallback
  const imagesToShow = allImages.length > 0 ? allImages : localImages

  useEffect(() => {
    if (!isAutoPlaying || imagesToShow.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % imagesToShow.length)
    }, 4000) // Change image every 4 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying, imagesToShow.length])

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

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + imagesToShow.length) % imagesToShow.length)
    setIsAutoPlaying(false)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % imagesToShow.length)
    setIsAutoPlaying(false)
  }

  return (
    <div className="relative">
      {/* Carousel Container */}
      <div className="relative w-full h-96 md:h-[500px] rounded-2xl overflow-hidden shadow-xl">
        {imagesToShow.map((src, index) => (
          <div
            key={`${src}-${index}`}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={src}
              alt={`Séance de coaching ${index + 1}`}
              fill
              className="object-cover"
              unoptimized={src.startsWith('http')}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </div>
        ))}
        
        {/* Navigation Arrows */}
        {imagesToShow.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all z-10"
              aria-label="Image précédente"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all z-10"
              aria-label="Image suivante"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {imagesToShow.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {imagesToShow.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index)
                  setIsAutoPlaying(false)
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-white w-8'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Aller à l'image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

