"use client"

import { useState } from "react"
import { Play, Target } from "lucide-react"
import { getDifficultyColor, getDifficultyLabel } from "@/lib/utils"

interface EnhancedVideo {
  id: string
  title: string
  description: string
  detailedDescription?: string
  thumbnail: string | null | undefined
  videoUrl: string
  duration: number
  difficulty: string
  category: string
  region?: string
  muscleGroups: string[]
  startingPosition?: string
  movement?: string
  intensity?: string
  theme?: string
  series?: string
  constraints?: string
  tags: string[]
  isPublished: boolean
}

interface EnhancedVideoCardProps {
  video: EnhancedVideo
  onPlay: (video: EnhancedVideo) => void
}

export default function EnhancedVideoCard({ video, onPlay }: EnhancedVideoCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="curved-card bg-white dark:bg-gray-800 shadow-organic hover:shadow-floating transition-all cursor-pointer group overflow-hidden border border-gray-100 dark:border-gray-700"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail with Play Button */}
      <div className="relative aspect-video bg-neutral-200 dark:bg-gray-700 overflow-hidden leading-none text-[0]">
        <img
          src={video.thumbnail || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop"}
          alt={video.title}
          className="block w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop"
          }}
        />
        <div className="absolute inset-0 bg-accent-500/0 group-hover:bg-accent-500/20 transition-all duration-300 flex items-center justify-center">
          <button onClick={() => onPlay(video)} className="w-14 h-14 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-floating">
            <Play className="w-6 h-6 text-secondary-500 ml-1" />
          </button>
        </div>
        
        {/* Duration Badge removed per request */}

        {/* Difficulty Badge */}
        <div className={`absolute top-3 left-3 px-3 py-1.5 curved-button text-xs font-medium bg-white/90 backdrop-blur-sm ${getDifficultyColor(video.difficulty)}`}>
          {getDifficultyLabel(video.difficulty)}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title */}
        <h3 className="font-semibold text-accent-500 dark:text-accent-400 mb-3 line-clamp-2 group-hover:text-secondary-500 dark:group-hover:text-secondary-400 transition-colors">
          {video.title}
        </h3>

        {/* Simple Metadata */}
        <div className="space-y-2 mb-4">
          {/* Region as pill badge */}
          {video.region && (
            <div className="text-xs text-accent-600 dark:text-accent-400 bg-primary-100 dark:bg-primary-900/30 px-3 py-1.5 inline-flex items-center gap-1 curved-button">
              <Target className="w-3 h-3" />
              <span>{video.region}</span>
            </div>
          )}
          
        </div>

        {/* Action Button */}
        <button
          onClick={() => onPlay(video)}
          className="w-full curved-button text-white font-semibold py-3 px-6 text-center block hover:shadow-floating transition-all flex items-center justify-center gap-2"
          style={{ backgroundColor: '#39334D' }}
        >
          <Play className="w-4 h-4" />
          Regarder
        </button>
      </div>
    </div>
  )
}
