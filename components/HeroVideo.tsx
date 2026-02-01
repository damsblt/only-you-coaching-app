'use client'

import { useEffect, useState, useRef } from 'react'
import { Play, Pause } from 'lucide-react'

interface HeroVideoProps {
  videoS3Key: string
  videoId: string
  thumbnail?: string
}

export default function HeroVideo({ videoS3Key, videoId, thumbnail }: HeroVideoProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const loadVideoUrl = async () => {
      try {
        const baseUrl = typeof window !== 'undefined' 
          ? window.location.origin
          : ''
        
        const apiUrl = `${baseUrl}/api/videos/s3-video?key=${encodeURIComponent(videoS3Key)}`
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.url) {
            setVideoUrl(data.url)
          }
        }
      } catch (error) {
        console.error('Error loading video URL:', error)
      } finally {
        setLoading(false)
      }
    }

    loadVideoUrl()
  }, [videoS3Key])

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        setIsPlaying(false)
      } else {
        // Remettre la vidéo au début avant de jouer
        videoRef.current.currentTime = 0
        videoRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  // Écouter les événements de la vidéo pour mettre à jour l'état
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
    }
  }, [videoUrl])

  if (loading) {
    return (
      <div className="relative w-full aspect-square max-w-md mx-auto">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-secondary-200 to-accent-200 shadow-organic"></div>
        <div className="relative w-full h-full rounded-full overflow-hidden border-8 border-white/50 shadow-floating">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary-100 to-accent-100">
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
              <div className="animate-pulse text-gray-400">Chargement...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!videoUrl) {
    return null
  }

  return (
    <div className="relative w-full aspect-square max-w-md mx-auto">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-secondary-200 to-accent-200 shadow-organic"></div>
      <div className="relative w-full h-full rounded-full overflow-hidden border-8 border-white/50 shadow-floating">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary-100 to-accent-100">
          <div className="w-full h-full rounded-full overflow-hidden">
            {/* Vidéo - démarre uniquement après clic sur play */}
            <video
              ref={videoRef}
              src={videoUrl}
              poster={thumbnail}
              muted={false}
              loop
              playsInline
              className="w-full h-full object-cover rounded-full"
              preload="metadata"
              style={{ 
                objectPosition: 'center',
                filter: 'brightness(1.1) contrast(1.05)'
              }}
            >
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          </div>
        </div>
      </div>
      
      {/* Bouton play/pause positionné en bas à droite, à l'extérieur du cercle */}
      <button
        onClick={togglePlayPause}
        className="absolute bottom-4 right-4 w-12 h-12 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-floating hover:scale-110 transition-all duration-300 group z-10 border-2 border-white/50"
        aria-label={isPlaying ? 'Mettre en pause' : 'Lire la vidéo'}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 text-accent-500 group-hover:text-accent-600 transition-colors" />
        ) : (
          <Play className="w-5 h-5 text-accent-500 group-hover:text-accent-600 transition-colors ml-0.5" />
        )}
      </button>
    </div>
  )
}
