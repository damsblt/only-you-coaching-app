"use client"

import { useState } from 'react'
import UnifiedVideoPlayer from '@/components/video/UnifiedVideoPlayer'

// Example video data
const exampleVideo = {
  id: 'example-video-1',
  title: 'Séance Pilates Débutant - Échauffement',
  description: 'Une séance douce pour commencer votre journée avec le Pilates',
  detailedDescription: 'Cette séance de 15 minutes vous permettra de vous échauffer en douceur. Parfait pour les débutants, elle inclut des exercices de respiration et des mouvements de base du Pilates.',
  thumbnail: '/api/placeholder/400/225',
  videoUrl: 'https://example.com/video.mp4',
  duration: 900, // 15 minutes in seconds
  difficulty: 'BEGINNER',
  category: 'Échauffement',
  region: 'France',
  muscleGroups: ['Abdominaux', 'Dos', 'Épaules'],
  startingPosition: 'Allongé sur le dos',
  movement: 'Mouvements lents et contrôlés',
  intensity: 'Faible',
  theme: 'Détente',
  series: 'Débutant',
  constraints: 'Aucune',
  tags: ['débutant', 'échauffement', 'détente'],
  isPublished: true
}

const exampleVideos = [
  exampleVideo,
  {
    ...exampleVideo,
    id: 'example-video-2',
    title: 'Séance Pilates Intermédiaire - Renforcement',
    difficulty: 'INTERMEDIATE',
    category: 'Renforcement',
    muscleGroups: ['Abdominaux', 'Dos', 'Jambes', 'Fessiers']
  },
  {
    ...exampleVideo,
    id: 'example-video-3',
    title: 'Séance Pilates Avancée - Intensité',
    difficulty: 'ADVANCED',
    category: 'Intensité',
    muscleGroups: ['Abdominaux', 'Dos', 'Jambes', 'Fessiers', 'Bras']
  }
]

export default function VideoPlayerExample() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [showPlayer, setShowPlayer] = useState(false)
  const [playerVariant, setPlayerVariant] = useState<'modal' | 'inline' | 'fullscreen'>('modal')

  const currentVideo = exampleVideos[currentVideoIndex]

  const handleNext = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % exampleVideos.length)
  }

  const handlePrevious = () => {
    setCurrentVideoIndex((prev) => (prev - 1 + exampleVideos.length) % exampleVideos.length)
  }

  const handleClose = () => {
    setShowPlayer(false)
  }

  return (
    <div className="p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Video Player Examples
        </h1>
        <p className="text-gray-600 mb-8">
          Examples of the new UnifiedVideoPlayer component with different variants
        </p>
      </div>

      {/* Variant Selector */}
      <div className="flex justify-center space-x-4 mb-8">
        <button
          onClick={() => setPlayerVariant('modal')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            playerVariant === 'modal'
              ? 'bg-rose-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Modal
        </button>
        <button
          onClick={() => setPlayerVariant('inline')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            playerVariant === 'inline'
              ? 'bg-rose-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Inline
        </button>
        <button
          onClick={() => setPlayerVariant('fullscreen')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            playerVariant === 'fullscreen'
              ? 'bg-rose-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Fullscreen
        </button>
      </div>

      {/* Video List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exampleVideos.map((video, index) => (
          <div
            key={video.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="aspect-video bg-gray-200 relative">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <button
                  onClick={() => {
                    setCurrentVideoIndex(index)
                    setShowPlayer(true)
                  }}
                  className="bg-white/20 backdrop-blur-sm rounded-full p-4 hover:bg-white/30 transition-colors"
                >
                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  video.difficulty === 'BEGINNER' ? 'bg-green-500/20 text-green-300' :
                  video.difficulty === 'INTERMEDIATE' ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-red-500/20 text-red-300'
                }`}>
                  {video.difficulty === 'BEGINNER' ? 'Débutant' :
                   video.difficulty === 'INTERMEDIATE' ? 'Intermédiaire' : 'Avancé'}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{video.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{video.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{video.category}</span>
                <span>{Math.floor(video.duration / 60)} min</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Inline Player Example */}
      {playerVariant === 'inline' && showPlayer && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Inline Player Example</h2>
          <div className="max-w-4xl mx-auto">
            <UnifiedVideoPlayer
              video={currentVideo}
              onClose={handleClose}
              onNext={handleNext}
              onPrevious={handlePrevious}
              currentIndex={currentVideoIndex}
              totalVideos={exampleVideos.length}
              variant="inline"
              autoPlay={false}
              muted={true}
              showDetails={true}
            />
          </div>
        </div>
      )}

      {/* Modal/Fullscreen Player */}
      {showPlayer && (playerVariant === 'modal' || playerVariant === 'fullscreen') && (
        <UnifiedVideoPlayer
          video={currentVideo}
          onClose={handleClose}
          onNext={handleNext}
          onPrevious={handlePrevious}
          currentIndex={currentVideoIndex}
          totalVideos={exampleVideos.length}
          variant={playerVariant}
          autoPlay={true}
          muted={true}
          showDetails={true}
        />
      )}

      {/* Usage Instructions */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Usage Instructions</h2>
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <strong>Modal Variant:</strong> Opens in a fullscreen overlay, perfect for video feeds and mobile viewing.
          </div>
          <div>
            <strong>Inline Variant:</strong> Embeds the player in the page, perfect for video cards and listings.
          </div>
          <div>
            <strong>Fullscreen Variant:</strong> Similar to modal but optimized for desktop fullscreen viewing.
          </div>
          <div>
            <strong>Mobile Optimizations:</strong> The player automatically handles touch events and prevents scroll conflicts on mobile devices.
          </div>
          <div>
            <strong>Auto-play:</strong> On mobile, videos must be muted to auto-play due to browser policies.
          </div>
        </div>
      </div>
    </div>
  )
}
