"use client"

import { Play, Clock, Music } from "lucide-react"
import { Audio } from "@/types"
import { formatDuration } from "@/lib/utils"

interface AudioCardProps {
  audio: Audio
  onClick: () => void
}

export function AudioCard({ audio, onClick }: AudioCardProps) {
  return (
    <div 
      className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group transform hover:-translate-y-1"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square bg-gradient-to-br from-indigo-100 to-purple-100 rounded-t-2xl overflow-hidden">
        <img
          src={audio.thumbnail || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"}
          alt={audio.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
          <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Play className="w-8 h-8 ml-1" style={{ color: '#39334D' }} />
          </div>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-3 right-3 bg-black bg-opacity-75 text-white text-xs px-3 py-1 rounded-full flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          {formatDuration(audio.duration)}
        </div>

        {/* Music Icon */}
        <div className="absolute top-3 left-3 w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
          <Music className="w-4 h-4" style={{ color: '#39334D' }} />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="font-semibold text-gray-900 text-center line-clamp-2 group-hover:text-burgundy-600 transition-colors">
          {audio.title}
        </h3>
      </div>
    </div>
  )
}

