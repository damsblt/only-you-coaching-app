'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'

interface GalleryProps {
  localImages?: string[]
}

export default function Gallery({ localImages = [] }: GalleryProps) {
  const [s3Images, setS3Images] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
          cache: 'default',
        })
        
        if (response.ok) {
          const data = await response.json()
          const photos = data.photos || []
          setS3Images(photos)
          
          if (photos.length === 0) {
            // Check if there's an error message
            if (data.error) {
              setError(`Aucune photo trouvée: ${data.error}`)
            } else {
              setError('Aucune photo trouvée dans la galerie. Vérifiez que le dossier Photos/Training/gallery/ existe dans S3.')
            }
          } else {
            setError(null)
          }
        } else {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData.error || errorData.message || `Erreur HTTP ${response.status}`
          console.error('Failed to fetch S3 images:', response.status, errorMessage)
          setError(`Impossible de charger les photos: ${errorMessage}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
        console.error('Error fetching S3 images:', error)
        setError(`Erreur de connexion: ${errorMessage}`)
      } finally {
        setLoading(false)
      }
    }

    fetchS3Images()
  }, [])

  // Use S3 images if available, otherwise fallback to local images
  // Memoize to prevent infinite loops
  const imagesToShow = useMemo(() => {
    if (s3Images.length > 0) {
      return s3Images
    }
    if (localImages.length > 0) {
      return localImages
    }
    return []
  }, [s3Images, localImages])

  useEffect(() => {
    if (!isAutoPlaying || imagesToShow.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % imagesToShow.length)
    }, 4000) // Change image every 4 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying, imagesToShow.length])

  // Précharger les images suivantes pour une transition plus fluide
  useEffect(() => {
    if (imagesToShow.length === 0) return

    const preloadLinks: HTMLLinkElement[] = []

    const preloadImages = () => {
      // Nettoyer les liens de préchargement précédents
      preloadLinks.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link)
        }
      })
      preloadLinks.length = 0

      // Précharger l'image suivante et celle d'après
      const nextIndex = (currentIndex + 1) % imagesToShow.length
      const nextNextIndex = (currentIndex + 2) % imagesToShow.length
      
      const imagesToPreload = [imagesToShow[nextIndex]]
      if (imagesToShow.length > 2) {
        imagesToPreload.push(imagesToShow[nextNextIndex])
      }

      imagesToPreload.forEach((src) => {
        if (src) {
          const link = document.createElement('link')
          link.rel = 'preload'
          link.as = 'image'
          link.href = src
          document.head.appendChild(link)
          preloadLinks.push(link)
        }
      })
    }

    preloadImages()

    // Nettoyer à la destruction
    return () => {
      preloadLinks.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link)
        }
      })
    }
  }, [currentIndex, imagesToShow])

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

  // Show error message if no images and error occurred
  if (imagesToShow.length === 0 && error) {
    return (
      <div className="text-center py-12 px-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Photos non disponibles
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300 mb-4">
            {error}
          </p>
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            Pour diagnostiquer le problème, visitez: <a href="/api/gallery/debug" target="_blank" rel="noopener noreferrer" className="underline">/api/gallery/debug</a>
          </p>
        </div>
      </div>
    )
  }

  // Show empty state if no images but no error
  if (imagesToShow.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Aucune photo disponible
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            La galerie est vide pour le moment.
          </p>
        </div>
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
        {imagesToShow.map((src, index) => {
          // Charger immédiatement l'image actuelle et la suivante, lazy load les autres
          const isCurrentOrNext = index === currentIndex || index === (currentIndex + 1) % imagesToShow.length
          
          return (
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
                className="object-contain"
                sizes="100vw"
                priority={index === currentIndex}
                loading={isCurrentOrNext ? 'eager' : 'lazy'}
                quality={75}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </div>
          )
        })}
        
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

