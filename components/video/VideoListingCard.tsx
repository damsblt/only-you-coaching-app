"use client"

import { useState } from "react"
import { Play, Clock, Star, Info } from "lucide-react"
import { formatDuration, getDifficultyColor, getDifficultyLabel } from "@/lib/utils"

interface Video {
  id: string
  title: string
  description: string
  thumbnail: string
  videoUrl: string
  duration: number
  difficulty: string
  category: string
  muscleGroups: string[]
  tags: string[]
  isPublished: boolean
}

interface VideoListingCardProps {
  video: Video
  onPlay: (video: Video) => void
  onInfo?: (video: Video) => void
  className?: string
  variant?: 'grid' | 'list' | 'mobile'
}

export default function VideoListingCard({ 
  video, 
  onPlay, 
  onInfo,
  className = "",
  variant = 'grid'
}: VideoListingCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getVariantClasses = () => {
    switch (variant) {
      case 'mobile':
        return "w-full aspect-video bg-gray-900 rounded-lg overflow-hidden relative group cursor-pointer"
      case 'list':
        return "w-full h-24 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative group cursor-pointer flex"
      case 'grid':
      default:
        return "w-full aspect-video bg-gray-900 rounded-lg overflow-hidden relative group cursor-pointer"
    }
  }

  const getThumbnailClasses = () => {
    switch (variant) {
      case 'mobile':
        return "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      case 'list':
        return "w-32 h-full object-cover flex-shrink-0"
      case 'grid':
      default:
        return "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
    }
  }

  const getContentClasses = () => {
    switch (variant) {
      case 'mobile':
        return "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent p-4 flex flex-col justify-end"
      case 'list':
        return "flex-1 p-4 flex flex-col justify-center"
      case 'grid':
      default:
        return "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent p-4 flex flex-col justify-end"
    }
  }

  const getTitleClasses = () => {
    switch (variant) {
      case 'mobile':
        return "text-white text-lg font-bold mb-1 line-clamp-2"
      case 'list':
        return "text-gray-900 text-base font-semibold mb-1 line-clamp-1"
      case 'grid':
      default:
        return "text-white text-lg font-bold mb-1 line-clamp-2"
    }
  }

  const getDescriptionClasses = () => {
    switch (variant) {
      case 'mobile':
        return "text-gray-200 text-sm mb-2 line-clamp-2"
      case 'list':
        return "text-gray-600 text-sm mb-2 line-clamp-1"
      case 'grid':
      default:
        return "text-gray-200 text-sm mb-2 line-clamp-2"
    }
  }

  return (
    <div 
      className={`${getVariantClasses()} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPlay(video)}
    >
      {/* Thumbnail */}
      <div className="relative w-full h-full">
        <img
          src={video.thumbnail}
          alt={video.title}
          className={getThumbnailClasses()}
        />
        
        {/* Play Overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
            <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Duration Badge */}
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDuration(video.duration)}
        </div>

        {/* Difficulty Badge */}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium text-white ${getDifficultyColor(video.difficulty)}`}>
          {getDifficultyLabel(video.difficulty)}
        </div>
      </div>

      {/* Content */}
      <div className={getContentClasses()}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className={getTitleClasses()}>
              {video.title}
            </h3>
            <p className={getDescriptionClasses()}>
              {video.description}
            </p>
            
            {/* Video Info */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-300 bg-gray-700/50 px-2 py-1 rounded">
                {video.category}
              </span>
              
              {/* Muscle Groups - Limited for mobile */}
              {video.muscleGroups && video.muscleGroups.length > 0 && (
                <div className="flex gap-1">
                  {video.muscleGroups.slice(0, variant === 'mobile' ? 2 : 3).map((muscle, index) => (
                    <span
                      key={index}
                      className="text-xs text-gray-300 bg-white/20 px-2 py-1 rounded"
                    >
                      {muscle}
                    </span>
                  ))}
                  {video.muscleGroups.length > (variant === 'mobile' ? 2 : 3) && (
                    <span className="text-xs text-gray-300 bg-white/20 px-2 py-1 rounded">
                      +{video.muscleGroups.length - (variant === 'mobile' ? 2 : 3)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Info Button */}
          {onInfo && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onInfo(video)
              }}
              className="ml-2 p-2 text-white/70 hover:text-white transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
