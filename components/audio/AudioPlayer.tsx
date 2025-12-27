"use client"

import { useState, useRef, useEffect } from "react"
import { X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react"
import { Audio } from "@/types"
import { formatDuration } from "@/lib/utils"
import S3Image from "@/components/S3Image"

interface AudioPlayerProps {
  audio: Audio
  onClose: () => void
}

export function AudioPlayer({ audio, onClose }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duration, setDuration] = useState(audio.duration || 0)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audioElement = audioRef.current
    if (!audioElement) return

    // Check if audioUrl is valid
    if (!audio.audioUrl || audio.audioUrl.trim() === '') {
      setError('Aucune source audio disponible')
      return
    }

    const updateTime = () => setCurrentTime(audioElement.currentTime)
    const handleEnded = () => setIsPlaying(false)
    const handleLoadedMetadata = () => {
      setDuration(audioElement.duration || audio.duration || 0)
    }
    const handleError = (e: Event) => {
      const error = audioElement.error
      if (error) {
        let errorMessage = 'Erreur lors du chargement de l\'audio'
        switch (error.code) {
          case error.MEDIA_ERR_ABORTED:
            errorMessage = 'Chargement interrompu'
            break
          case error.MEDIA_ERR_NETWORK:
            errorMessage = 'Erreur réseau lors du chargement'
            break
          case error.MEDIA_ERR_DECODE:
            errorMessage = 'Erreur de décodage de l\'audio'
            break
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Format audio non supporté ou source invalide'
            break
        }
        setError(errorMessage)
        setIsPlaying(false)
      }
    }

    audioElement.addEventListener('timeupdate', updateTime)
    audioElement.addEventListener('ended', handleEnded)
    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata)
    audioElement.addEventListener('error', handleError)

    return () => {
      audioElement.removeEventListener('timeupdate', updateTime)
      audioElement.removeEventListener('ended', handleEnded)
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audioElement.removeEventListener('error', handleError)
    }
  }, [audio.audioUrl, audio.duration])

  const togglePlayPause = async () => {
    const audioElement = audioRef.current
    if (!audioElement || error || !audio.audioUrl) return

    if (isPlaying) {
      audioElement.pause()
      setIsPlaying(false)
    } else {
      try {
        await audioElement.play()
        setIsPlaying(true)
      } catch (err) {
        console.error('Error playing audio:', err)
        setError('Impossible de lire l\'audio. Vérifiez votre connexion ou essayez à nouveau.')
        setIsPlaying(false)
      }
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audioElement = audioRef.current
    if (!audioElement) return

    const newTime = parseFloat(e.target.value)
    audioElement.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const audioElement = audioRef.current
    if (!audioElement) return

    if (isMuted) {
      audioElement.volume = volume
      setIsMuted(false)
    } else {
      audioElement.volume = 0
      setIsMuted(true)
    }
  }

  const skipBackward = () => {
    const audioElement = audioRef.current
    if (!audioElement) return

    audioElement.currentTime = Math.max(0, audioElement.currentTime - 10)
  }

  const skipForward = () => {
    const audioElement = audioRef.current
    if (!audioElement) return

    audioElement.currentTime = Math.min(audioElement.duration, audioElement.currentTime + 10)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">{audio.title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Visualizer */}
        <div className="p-8 bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="flex items-center justify-center mb-8">
            <div className="w-48 h-48 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center relative overflow-hidden">
              {/* Determine if thumbnail is an S3 key (starts with "Photos/") or a URL */}
              {audio.thumbnail && (
                audio.thumbnail.startsWith("Photos/") || 
                audio.thumbnail.startsWith("Video/") ||
                audio.thumbnail.startsWith("thumbnails/")
              ) ? (
                <S3Image
                  s3Key={audio.thumbnail}
                  alt={audio.title}
                  width={160}
                  height={160}
                  className="rounded-full object-cover"
                  fallbackSrc="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"
                />
              ) : (
                <img
                  src={audio.thumbnail || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"}
                  alt={audio.title}
                  className="w-40 h-40 rounded-full object-cover"
                />
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            <input
              type="range"
              min="0"
              max={duration || audio.duration || 0}
              value={currentTime}
              onChange={handleSeek}
              disabled={!!error}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration || audio.duration || 0)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-6">
            <button
              onClick={skipBackward}
              className="p-3 text-gray-600 hover:text-purple-600 transition-colors"
            >
              <SkipBack className="w-6 h-6" />
            </button>
            
            <button
              onClick={togglePlayPause}
              disabled={!!error || !audio.audioUrl}
              className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </button>
            
            <button
              onClick={skipForward}
              className="p-3 text-gray-600 hover:text-purple-600 transition-colors"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center justify-center space-x-4 mt-6">
            <button
              onClick={toggleMute}
              className="p-2 text-gray-600 hover:text-purple-600 transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>

        {/* Hidden Audio Element */}
        {audio.audioUrl && audio.audioUrl.trim() !== '' && (
          <audio
            ref={audioRef}
            src={audio.audioUrl}
            preload="metadata"
            crossOrigin="anonymous"
          />
        )}
      </div>
    </div>
  )
}

