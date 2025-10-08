"use client"

import { Play, Heart, Plus } from "lucide-react"
import { Video } from "@/types"
import { getDifficultyColor, getDifficultyLabel } from "@/lib/utils"

interface VideoCardProps {
  video: Video
  onClick: () => void
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  return (
    <div 
      className="curved-card bg-white shadow-organic hover:shadow-floating transition-all cursor-pointer group overflow-hidden"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-neutral-200 overflow-hidden leading-none text-[0]">
        <img
          src={video.thumbnail || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop"}
          alt={video.title}
          className="block w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-accent-500/0 group-hover:bg-accent-500/20 transition-all duration-300 flex items-center justify-center">
          <div className="w-14 h-14 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-floating">
            <Play className="w-6 h-6 text-secondary-500 ml-1" />
          </div>
        </div>

        {/* Duration Badge removed per request */}

        {/* Difficulty Badge */}
        <div className={`absolute top-3 left-3 px-3 py-1.5 curved-button text-xs font-medium bg-white/90 backdrop-blur-sm ${getDifficultyColor(video.difficulty)}`}>
          {getDifficultyLabel(video.difficulty)}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="font-semibold text-accent-500 mb-3 line-clamp-2 group-hover:text-secondary-500 transition-colors">
          {video.title}
        </h3>
        
        <p className="text-sm text-accent-600 mb-4 line-clamp-2">
          {video.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-accent-600 bg-primary-100 px-3 py-1.5 curved-button">
            {video.category}
          </span>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-accent-400 hover:text-secondary-500 transition-colors curved-button hover:bg-secondary-50">
              <Heart className="w-4 h-4" />
            </button>
            <button className="p-2 text-accent-400 hover:text-secondary-500 transition-colors curved-button hover:bg-secondary-50">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

