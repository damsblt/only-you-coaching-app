'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react'

interface RecipeBookletViewerProps {
  images: string[]
  pdfUrl?: string
  title: string
  onClose?: () => void
}

export default function RecipeBookletViewer({ images, title, onClose }: RecipeBookletViewerProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [isWide, setIsWide] = useState(false)
  const [showThumbs, setShowThumbs] = useState(false)
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)
  const pagesScrollRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const totalPages = images.length
  // Two-page spread only on large screens at fit zoom
  const showTwoPages = isWide && zoom === 1 && totalPages > 1
  const step = showTwoPages ? 2 : 1
  const isZoomedIn = zoom > 1

  const setZoomAndScrollTop = useCallback((next: number | ((z: number) => number)) => {
    setZoom((prev) => {
      const value = typeof next === 'function' ? next(prev) : next
      // After zoom-in, pin to top so titles aren't cropped
      requestAnimationFrame(() => {
        pagesScrollRef.current?.scrollTo({ top: 0, left: 0 })
      })
      return value
    })
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const update = () => setIsWide(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Lock ALL scroll containers (html, body, app shell) — body alone is not enough
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const shell = document.querySelector('[data-app-shell]') as HTMLElement | null

    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      shellOverflow: shell?.style.overflow ?? '',
      scrollY: window.scrollY,
    }

    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    if (shell) shell.style.overflow = 'hidden'

    // Freeze scroll position so the page behind doesn't jump
    body.style.position = 'fixed'
    body.style.top = `-${prev.scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'

    return () => {
      html.style.overflow = prev.htmlOverflow
      body.style.overflow = prev.bodyOverflow
      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      body.style.width = ''
      if (shell) shell.style.overflow = prev.shellOverflow
      window.scrollTo(0, prev.scrollY)
    }
  }, [])

  const goToPreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(0, prev - step))
  }, [step])

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + step))
  }, [step, totalPages])

  // Always land at the top when changing page (or zoom)
  useEffect(() => {
    pagesScrollRef.current?.scrollTo({ top: 0, left: 0 })
  }, [currentPage, zoom])

  const canGoPrev = currentPage > 0
  const canGoNext = currentPage < totalPages - step

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPreviousPage()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToNextPage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, goToPreviousPage, goToNextPage])

  const handleImageError = (pageIndex: number) => {
    setImageErrors((prev) => new Set(prev).add(pageIndex))
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return

    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    touchStartX.current = null
    touchStartY.current = null

    // Ignore mostly-vertical gestures (scroll/zoom intent)
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return

    if (dx < 0) goToNextPage()
    else goToPreviousPage()
  }

  const displayPages = showTwoPages
    ? [currentPage, currentPage + 1].filter((page) => page < totalPages)
    : [currentPage]

  const pageLabel =
    showTwoPages && displayPages.length === 2
      ? `${displayPages[0] + 1}–${displayPages[1] + 1} / ${totalPages}`
      : `${currentPage + 1} / ${totalPages}`

  const progress = totalPages > 0 ? ((currentPage + 1) / totalPages) * 100 : 0

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[200] flex flex-col bg-[#2a2438]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Top bar — minimal */}
      <header className="relative z-20 flex shrink-0 items-center gap-3 px-3 py-3 sm:px-5 pt-[max(0.75rem,env(safe-area-inset-top))] bg-[#39334D]/95 backdrop-blur-md text-white">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Fermer le livret"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold sm:text-base">{title}</h2>
          <p className="text-xs text-white/60">{pageLabel}</p>
        </div>

        {/* Zoom — desktop only. Resizes the page (no CSS scale) so the top stays visible. */}
        <div className="hidden sm:flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoomAndScrollTop((z) => Math.max(1, z - 0.25))}
            disabled={zoom <= 1}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40 transition-colors"
            aria-label="Zoom arrière"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[2.75rem] text-center text-xs text-white/70">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomAndScrollTop((z) => Math.min(2, z + 0.25))}
            disabled={zoom >= 2}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40 transition-colors"
            aria-label="Zoom avant"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Progress */}
      <div className="h-0.5 w-full shrink-0 bg-white/10">
        <div
          className="h-full bg-[#D4888C] transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Pages — min-h-0 so flex child can shrink; overflow scroll only when zoomed */}
      <div
        ref={pagesScrollRef}
        className={`relative min-h-0 flex-1 ${isZoomedIn ? 'overflow-auto' : 'overflow-hidden'}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`flex w-full justify-center p-2 sm:p-4 ${
            isZoomedIn ? 'items-start min-h-min' : 'h-full items-center'
          }`}
        >
          <div
            className={`flex justify-center gap-3 sm:gap-4 ${
              isZoomedIn ? 'items-start' : 'h-full max-h-full items-center'
            }`}
          >
            {displayPages.map((pageIndex, idx) => (
              <div
                key={pageIndex}
                className={`
                  relative overflow-hidden bg-[#F5E6E0] shadow-2xl
                  rounded-lg sm:rounded-xl
                  ${isZoomedIn ? '' : 'h-full max-h-full w-auto'}
                  ${showTwoPages && idx === 1 ? '' : ''}
                `}
              >
                {imageErrors.has(pageIndex) ? (
                  <div className="flex aspect-[3/4] w-full max-w-md items-center justify-center p-6 text-center">
                    <p className="text-sm text-[#39334D]/70">
                      Impossible de charger la page {pageIndex + 1}
                    </p>
                  </div>
                ) : (
                  <img
                    src={images[pageIndex]}
                    alt={`${title} — page ${pageIndex + 1}`}
                    className={`block select-none object-contain ${
                      isZoomedIn
                        ? 'h-auto w-auto'
                        : showTwoPages
                          ? 'h-full max-h-full w-auto max-w-[min(100%,46vw)]'
                          : 'h-full max-h-full w-auto max-w-full'
                    }`}
                    style={
                      isZoomedIn
                        ? {
                            width: `min(92vw, ${Math.round(680 * zoom)}px)`,
                          }
                        : undefined
                    }
                    draggable={false}
                    loading={Math.abs(pageIndex - currentPage) <= 2 ? 'eager' : 'lazy'}
                    onError={() => handleImageError(pageIndex)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Side arrows */}
        {canGoPrev && (
          <button
            type="button"
            onClick={goToPreviousPage}
            className="absolute left-1 sm:left-3 top-1/2 z-10 -translate-y-1/2 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#39334D]/80 text-white shadow-lg backdrop-blur-sm hover:bg-[#A65959] transition-colors"
            aria-label="Page précédente"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
        )}

        {canGoNext && (
          <button
            type="button"
            onClick={goToNextPage}
            className="absolute right-1 sm:right-3 top-1/2 z-10 -translate-y-1/2 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#39334D]/80 text-white shadow-lg backdrop-blur-sm hover:bg-[#A65959] transition-colors"
            aria-label="Page suivante"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        )}
      </div>

      {/* Bottom navigation */}
      <footer className="relative z-20 shrink-0 border-t border-white/10 bg-[#39334D]/95 backdrop-blur-md px-3 py-3 sm:px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            type="button"
            onClick={goToPreviousPage}
            disabled={!canGoPrev}
            className="flex h-11 flex-1 items-center justify-center gap-1 rounded-full bg-white/10 text-sm font-medium text-white disabled:opacity-35 hover:bg-white/15 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </button>

          <button
            type="button"
            onClick={() => setShowThumbs((v) => !v)}
            className={`flex h-11 min-w-[4.5rem] items-center justify-center rounded-full text-sm font-semibold transition-colors ${
              showThumbs
                ? 'bg-[#D4888C] text-white'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
            aria-expanded={showThumbs}
            aria-label="Afficher les miniatures"
          >
            Pages
          </button>

          <button
            type="button"
            onClick={goToNextPage}
            disabled={!canGoNext}
            className="flex h-11 flex-1 items-center justify-center gap-1 rounded-full bg-[#D4888C] text-sm font-medium text-white disabled:opacity-35 hover:bg-[#A65959] transition-colors"
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {showThumbs && totalPages > 1 && (
          <div className="mx-auto mt-3 max-w-4xl overflow-x-auto pb-1 scrollbar-thin">
            <div className="flex gap-2 px-1">
              {images.map((image, index) => {
                const active =
                  index === currentPage ||
                  (showTwoPages && index === currentPage + 1)
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setCurrentPage(index)
                      setShowThumbs(false)
                    }}
                    className={`
                      relative flex-shrink-0 overflow-hidden rounded-md transition-all
                      w-14 h-20 sm:w-16 sm:h-24
                      ${active
                        ? 'ring-2 ring-[#D4888C] scale-105 opacity-100'
                        : 'opacity-60 hover:opacity-100 ring-1 ring-white/20'
                      }
                    `}
                    aria-label={`Aller à la page ${index + 1}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <img
                      src={image}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-black/55 py-0.5 text-center text-[10px] text-white">
                      {index + 1}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <p className="mt-2 text-center text-[11px] text-white/45 sm:hidden">
          Glissez pour tourner les pages
        </p>
      </footer>
    </div>
  )
}
