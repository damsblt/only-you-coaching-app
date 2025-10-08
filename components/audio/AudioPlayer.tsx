"use client"

import { useState, useRef, useEffect } from "react"
import { X, Heart, Plus, Share2, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react"
import { Audio } from "@/types"
import { formatDuration } from "@/lib/utils"

interface AudioPlayerProps {
  audio: Audio
  onClose: () => void
}

export function AudioPlayer({ audio, onClose }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audioElement = audioRef.current
    if (!audioElement) return

    const updateTime = () => setCurrentTime(audioElement.currentTime)
    const handleEnded = () => setIsPlaying(false)

    audioElement.addEventListener('timeupdate', updateTime)
    audioElement.addEventListener('ended', handleEnded)

    return () => {
      audioElement.removeEventListener('timeupdate', updateTime)
      audioElement.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlayPause = () => {
    const audioElement = audioRef.current
    if (!audioElement) return

    if (isPlaying) {
      audioElement.pause()
    } else {
      audioElement.play()
    }
    setIsPlaying(!isPlaying)
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
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{audio.title}</h2>
            <p className="text-gray-600 mt-1">{audio.category}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <Heart className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-purple-600 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Audio Visualizer */}
        <div className="p-8 bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="flex items-center justify-center mb-8">
            <div className="w-48 h-48 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <img
                src={audio.thumbnail || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"}
                alt={audio.title}
                className="w-40 h-40 rounded-full object-cover"
              />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <input
              type="range"
              min="0"
              max={audio.duration}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(audio.duration)}</span>
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
              className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
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

        {/* Description */}
        <div className="p-6 border-t">
          <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {audio.description}
          </p>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {audio.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-purple-100 text-purple-600 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={audio.audioUrl}
          preload="metadata"
        />
      </div>
    </div>
  )
}

