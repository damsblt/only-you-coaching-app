"use client"

import { useState } from "react"
import { Play, Target, ChevronDown, ChevronUp } from "lucide-react"
import { getDifficultyColor, getDifficultyLabel } from "@/lib/utils"
import { formatIntensity } from "@/utils/formatIntensity"

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
  targeted_muscles?: string[]
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
  const [isExpanded, setIsExpanded] = useState(false)

  // Fonction pour obtenir la couleur du label d'intensité
  const getIntensityColor = (intensity: string | undefined) => {
    if (!intensity) return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
    
    const lower = intensity.toLowerCase()
    if (lower.includes('tout niveau')) {
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
    }
    if (lower.includes('débutant') && !lower.includes('intermédiaire')) {
      return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
    }
    if (lower.includes('débutant et intermédiaire')) {
      return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
    }
    if (lower === 'intermédiaire' || (lower.includes('intermédiaire') && !lower.includes('avancé') && !lower.includes('débutant'))) {
      return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
    }
    if (lower.includes('intermédiaire et avancé')) {
      return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
    }
    if (lower === 'avancé' || (lower.includes('avancé') && !lower.includes('intermédiaire') && !lower.includes('très'))) {
      return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
    }
    if (lower.includes('très avancé')) {
      return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
    }
    return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
  }

  return (
    <div
      data-video-id={video.id}
      className="curved-card bg-white dark:bg-gray-800 shadow-organic hover:shadow-floating transition-all cursor-pointer group overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col h-full"
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
      <div className="p-6 flex flex-col flex-grow">
        {/* Title */}
        <h3 className="font-semibold text-accent-500 dark:text-accent-400 mb-3 line-clamp-2 group-hover:text-secondary-500 dark:group-hover:text-secondary-400 transition-colors">
          {video.title}
        </h3>

        {/* Intensity Label/Sticker */}
        {video.intensity && (
          <div className="mb-4">
            <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold ${getIntensityColor(video.intensity)}`}>
              {formatIntensity(video.intensity)}
            </span>
          </div>
        )}

        {/* Expandable Metadata Section */}
        {isExpanded && (
          <div className="space-y-3 mb-4 text-sm flex-grow">
          {/* Muscle cible */}
          {((video.targeted_muscles && video.targeted_muscles.length > 0) || (video.muscleGroups && video.muscleGroups.length > 0)) && (
            <div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">Muscle cible: </span>
              <span className="text-gray-600 dark:text-gray-400">
                {video.targeted_muscles && video.targeted_muscles.length > 0
                  ? (Array.isArray(video.targeted_muscles) ? video.targeted_muscles.join(', ') : video.targeted_muscles)
                  : (Array.isArray(video.muscleGroups) ? video.muscleGroups.join(', ') : video.muscleGroups)}
              </span>
            </div>
          )}

          {/* Position départ */}
          {video.startingPosition && (
            <div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">Position départ: </span>
              <span className="text-gray-600 dark:text-gray-400">{video.startingPosition}</span>
            </div>
          )}

          {/* Mouvement */}
          {video.movement && (
            <div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">Mouvement: </span>
              <span className="text-gray-600 dark:text-gray-400">{video.movement}</span>
            </div>
          )}

          {/* Intensité et Série */}
          <div className="flex flex-wrap gap-4">
            {video.intensity && (
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Intensité: </span>
                <span className="text-gray-600 dark:text-gray-400">{formatIntensity(video.intensity)}</span>
              </div>
            )}
            {video.series && (
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Série: </span>
                <span className="text-gray-600 dark:text-gray-400">{video.series}</span>
              </div>
            )}
          </div>

          {/* Contre-indication */}
          {video.constraints && video.constraints !== "Aucune" && (
            <div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">Contre-indication: </span>
              <span className="text-gray-600 dark:text-gray-400">{video.constraints}</span>
            </div>
          )}
          {(!video.constraints || video.constraints === "Aucune") && (
            <div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">Contre-indication: </span>
              <span className="text-gray-600 dark:text-gray-400">Aucune</span>
            </div>
          )}
          </div>
        )}

        {/* Expand/Collapse Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
          className="mb-4 text-sm text-gray-600 dark:text-gray-400 hover:text-accent-500 dark:hover:text-accent-400 transition-colors flex items-center gap-1 self-start"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span>Masquer les détails</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              <span>Voir les détails</span>
            </>
          )}
        </button>

        {/* Action Button */}
        <button
          onClick={() => onPlay(video)}
          className="w-full curved-button text-white font-semibold py-3 px-6 text-center block hover:shadow-floating transition-all flex items-center justify-center gap-2 mt-auto"
          style={{ backgroundColor: '#39334D' }}
        >
          <Play className="w-4 h-4" />
          Regarder
        </button>
      </div>
    </div>
  )
}
