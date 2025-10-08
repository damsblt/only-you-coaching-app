"use client"

import { Heart, Plus, Share2, Play, Pause } from "lucide-react"
import { Video } from "@/types"
import { formatDuration, getDifficultyColor, getDifficultyLabel } from "@/lib/utils"

interface VideoFeedCardProps {
  video: Video
  isActive: boolean
  isPlaying: boolean
  isMuted: boolean
  onPlayPause: () => void
  onLike: () => void
  onAddToPlaylist: () => void
  onShare: () => void
}

export function VideoFeedCard({
  video,
  isActive,
  isPlaying,
  isMuted,
  onPlayPause,
  onLike,
  onAddToPlaylist,
  onShare
}: VideoFeedCardProps) {
  return (
    <div className="relative h-screen w-full snap-start flex items-center justify-center">
      {/* Video Background */}
      <div className="absolute inset-0 bg-gray-900">
        <img
          src={video.thumbnail || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop"}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30" />
      </div>

      {/* Play/Pause Overlay */}
      <div 
        className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
        onClick={onPlayPause}
      >
        {!isPlaying && (
          <div className="w-20 h-20 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all">
            <Play className="w-8 h-8 text-purple-600 ml-1" />
          </div>
        )}
      </div>

      {/* Video Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-20">
        <div className="max-w-md">
          <h2 className="text-2xl font-bold mb-2 line-clamp-2">{video.title}</h2>
          <p className="text-white/80 mb-4 line-clamp-2">{video.description}</p>
          
          <div className="flex items-center space-x-4 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(video.difficulty)}`}>
              {getDifficultyLabel(video.difficulty)}
            </span>
            <span className="text-white/80 text-sm">{video.category}</span>
            <span className="text-white/80 text-sm">{formatDuration(video.duration)}</span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {video.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-white/20 text-white text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute right-4 bottom-20 flex flex-col space-y-4 z-20">
        <button
          onClick={onLike}
          className="p-3 bg-rose-500/20 backdrop-blur-sm rounded-full text-white hover:bg-rose-500/40 transition-colors"
        >
          <Heart className="w-6 h-6" />
        </button>
        <button
          onClick={onAddToPlaylist}
          className="p-3 bg-rose-500/20 backdrop-blur-sm rounded-full text-white hover:bg-rose-500/40 transition-colors"
        >
          <Plus className="w-6 h-6" />
        </button>
        <button
          onClick={onShare}
          className="p-3 bg-rose-500/20 backdrop-blur-sm rounded-full text-white hover:bg-rose-500/40 transition-colors"
        >
          <Share2 className="w-6 h-6" />
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-30">
        <div 
          className="h-full bg-white transition-all duration-300"
          style={{ width: `${((Date.now() % 10000) / 10000) * 100}%` }}
        />
      </div>
    </div>
  )
}

