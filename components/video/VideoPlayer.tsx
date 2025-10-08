"use client"

import { useState, useRef, useEffect } from "react"
import { X, Heart, Plus, Share2, Volume2, VolumeX, Play, Pause, SkipBack, SkipForward } from "lucide-react"
import { Video } from "@/types"
import { formatDuration, getDifficultyColor, getDifficultyLabel } from "@/lib/utils"

interface VideoPlayerProps {
  video: Video
  onClose: () => void
}

export default function VideoPlayer({ video, onClose }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const updateTime = () => setCurrentTime(videoElement.currentTime)
    const updateDuration = () => setDuration(videoElement.duration)
    const handleEnded = () => setIsPlaying(false)

    videoElement.addEventListener('timeupdate', updateTime)
    videoElement.addEventListener('loadedmetadata', updateDuration)
    videoElement.addEventListener('ended', handleEnded)

    return () => {
      videoElement.removeEventListener('timeupdate', updateTime)
      videoElement.removeEventListener('loadedmetadata', updateDuration)
      videoElement.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlayPause = () => {
    const videoElement = videoRef.current
    if (!videoElement) return

    if (isPlaying) {
      videoElement.pause()
    } else {
      videoElement.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const newTime = parseFloat(e.target.value)
    videoElement.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const videoElement = videoRef.current
    if (!videoElement) return

    if (isMuted) {
      videoElement.volume = volume
      setIsMuted(false)
    } else {
      videoElement.volume = 0
      setIsMuted(true)
    }
  }

  const skipBackward = () => {
    const videoElement = videoRef.current
    if (!videoElement) return

    videoElement.currentTime = Math.max(0, videoElement.currentTime - 10)
  }

  const skipForward = () => {
    const videoElement = videoRef.current
    if (!videoElement) return

    videoElement.currentTime = Math.min(duration, videoElement.currentTime + 10)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{video.title}</h2>
            <div className="flex items-center space-x-4 mt-1">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(video.difficulty)}`}>
                {getDifficultyLabel(video.difficulty)}
              </span>
              <span className="text-sm text-gray-500">{video.category}</span>
              <span className="text-sm text-gray-500">{formatDuration(video.duration)}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-2 transition-colors ${isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
            >
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

        {/* Video Player */}
        <div className="relative aspect-video bg-gray-900">
          <video
            ref={videoRef}
            src={video.videoUrl}
            className="w-full h-full object-cover"
            poster={video.thumbnail || undefined}
            onClick={togglePlayPause}
          />
          
          {/* Play/Pause Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlayPause}
              className="p-4 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all transform hover:scale-110"
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-white text-sm mt-2">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 left-4 flex items-center space-x-4">
            <button
              onClick={skipBackward}
              className="p-2 text-white hover:text-gray-300 transition-colors"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            
            <button
              onClick={skipForward}
              className="p-2 text-white hover:text-gray-300 transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            
            <button
              onClick={toggleMute}
              className="p-2 text-white hover:text-gray-300 transition-colors"
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
              className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>

        {/* Description */}
        <div className="p-4 border-t">
          <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {video.description}
          </p>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {video.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}