'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Minimize2, Image } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface RecipeBookletViewerProps {
  images: string[]
  pdfUrl?: string
  title: string
  onClose?: () => void
}

export default function RecipeBookletViewer({ images, pdfUrl, title, onClose }: RecipeBookletViewerProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const viewMode = 'images' // Always use images mode, PDF support removed
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)

  const totalPages = images.length
  const showTwoPages = !isFullscreen && zoom <= 1

  // Log images on mount to debug
  useEffect(() => {
    console.log('RecipeBookletViewer - Images:', images)
    console.log('RecipeBookletViewer - PDF URL:', pdfUrl)
    console.log('RecipeBookletViewer - Total pages:', totalPages)
  }, [images, pdfUrl, totalPages])

  const handleImageError = (pageIndex: number) => {
    console.error(`Error loading image at page ${pageIndex + 1}:`, images[pageIndex])
    setImageErrors(prev => new Set(prev).add(pageIndex))
  }

  // Keyboard navigation
  useEffect(() => {
    if (!onClose) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        goToPreviousPage()
      } else if (e.key === 'ArrowRight') {
        goToNextPage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Handle fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - (showTwoPages ? 2 : 1)))
  }

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + (showTwoPages ? 2 : 1)))
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }


  const handleZoomIn = () => {
    setZoom((prev) => Math.min(3, prev + 0.25))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.5, prev - 0.25))
  }

  const resetZoom = () => {
    setZoom(1)
  }

  // Calculate which pages to display
  const getDisplayPages = () => {
    if (!showTwoPages) {
      return [currentPage]
    }
    // Show two pages side by side (like an open book)
    return [currentPage, currentPage + 1].filter((page) => page < totalPages)
  }

  const displayPages = getDisplayPages()

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 w-full h-full bg-gray-900 flex flex-col"
    >
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm text-white">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold truncate max-w-md">{title}</h2>
          
          {/* Page Counter */}
          <div className="text-sm text-gray-300">
            Page {currentPage + 1} / {totalPages}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="text-white hover:bg-white/20"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-300 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="text-white hover:bg-white/20"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            {(zoom !== 1) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetZoom}
                className="text-white hover:bg-white/20 text-xs"
              >
                Reset
              </Button>
            )}
          </>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-white hover:bg-white/20"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              Fermer
            </Button>
          )}
        </div>
      </div>

      {/* Booklet Display Area */}
      <div className="flex-1 overflow-hidden bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center p-4 relative">
        {/* Image Booklet Viewer */}
        <div 
          ref={pageRef}
          className="flex items-center justify-center gap-4 transition-transform duration-300"
          style={{ transform: `scale(${zoom})` }}
        >
            {displayPages.map((pageIndex, idx) => {
              const isEvenPage = pageIndex % 2 === 0
              const isLastPage = pageIndex === totalPages - 1
              
              return (
                <div
                  key={pageIndex}
                  className={`
                    relative bg-white shadow-2xl
                    ${showTwoPages && displayPages.length === 1 && isEvenPage 
                      ? 'mr-auto' // Show on right side if only one page
                      : ''}
                    ${showTwoPages && displayPages.length === 2 && idx === 1
                      ? 'border-l border-gray-300' // Add border between pages
                      : ''}
                    transition-transform hover:scale-[1.02]
                  `}
                  style={{
                    width: showTwoPages ? 'calc(50vw - 4rem)' : 'calc(100vw - 8rem)',
                    maxWidth: showTwoPages ? '600px' : '1200px',
                    minHeight: '80vh',
                    maxHeight: '90vh',
                  }}
                >
                  {imageErrors.has(pageIndex) ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                      <div className="text-center p-8">
                        <p className="text-gray-500 dark:text-gray-400 mb-2">
                          Erreur de chargement de l'image
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 break-all max-w-md">
                          {images[pageIndex]}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={images[pageIndex]}
                      alt={`${title} - Page ${pageIndex + 1}`}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      onError={() => handleImageError(pageIndex)}
                    />
                  )}
                  
                  {/* Page Number Badge */}
                  <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                    {pageIndex + 1}
                  </div>
                </div>
              )
            })}
          </div>

        {/* Navigation Arrows */}
        <>
            {currentPage > 0 && (
              <Button
                variant="ghost"
                size="lg"
                onClick={goToPreviousPage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm"
                aria-label="Page précédente"
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            )}

            {currentPage < totalPages - (showTwoPages ? 2 : 1) && (
              <Button
                variant="ghost"
                size="lg"
                onClick={goToNextPage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm"
                aria-label="Page suivante"
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            )}
        </>

        {/* Thumbnail Strip (Side) */}
        {totalPages > 1 && (
          <div className="absolute right-20 top-1/2 -translate-y-1/2 bg-black/70 backdrop-blur-sm rounded-lg p-2 overflow-y-auto max-h-[80vh] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent w-[88px]">
            <div className="flex flex-col gap-2 pr-1">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  className={`
                    flex-shrink-0 w-20 h-28 rounded overflow-hidden border-2 transition-all
                    ${index === currentPage
                      ? 'border-primary shadow-lg scale-110 ring-2 ring-primary/50'
                      : 'border-transparent hover:border-gray-400 opacity-70 hover:opacity-100'
                    }
                  `}
                >
                  <img
                    src={image}
                    alt={`Page ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error(`Error loading thumbnail ${index + 1}:`, image)
                      const target = e.target as HTMLImageElement
                      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="140"%3E%3Crect width="100" height="140" fill="%23ccc"/%3E%3Ctext x="50" y="70" text-anchor="middle" fill="%23999"%3EErreur%3C/text%3E%3C/svg%3E'
                    }}
                  />
                  {/* Page number on thumbnail */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-0.5 text-center">
                    {index + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

