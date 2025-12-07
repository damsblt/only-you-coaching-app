'use client'

import { useState, useEffect } from 'react'
import { Heart, ArrowRight } from 'lucide-react'
import EnhancedVideoCard from '@/components/video/EnhancedVideoCard'
import SimpleVideoPlayer from '@/components/video/SimpleVideoPlayer'
import { AudioCard } from '@/components/audio/AudioCard'
import { AudioPlayer } from '@/components/audio/AudioPlayer'
import RecipeCard from '@/components/recipe/RecipeCard'
import RecipeBookletViewer from '@/components/recipe/RecipeBookletViewer'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Audio, Recipe } from '@/types/cms'

interface VideoData {
  id: string
  title: string
  description: string
  detailedDescription?: string
  thumbnail: string
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
  createdAt?: string
  updatedAt?: string
}

export default function EssaiGratuitPage() {
  const [videos, setVideos] = useState<VideoData[]>([])
  const [audio, setAudio] = useState<Audio | null>(null)
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null)
  const [selectedAudio, setSelectedAudio] = useState<Audio | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFreeTrialContent = async () => {
      try {
        setLoading(true)

        // Fetch videos for different regions
        const videoRegions = ['abdos', 'dos', 'fessiers-jambes']
        const videoPromises = videoRegions.map(async (region) => {
          try {
            const response = await fetch(`/api/videos?region=${region}&videoType=muscle-groups`)
            if (response.ok) {
              const data = await response.json()
              // API returns array directly or wrapped in videos property
              const videos = Array.isArray(data) ? data : (data.videos || [])
              return videos.length > 0 ? videos[0] : null
            }
            return null
          } catch (error) {
            console.error(`Error fetching video for region ${region}:`, error)
            return null
          }
        })

        // Fetch machine-related video (try searching for "machine" or use "bande" as fallback)
        const machineVideoPromise = (async () => {
          try {
            // First try searching for "machine" in title or tags
            const searchResponse = await fetch(`/api/videos?search=machine&videoType=muscle-groups`)
            if (searchResponse.ok) {
              const searchData = await searchResponse.json()
              const videos = Array.isArray(searchData) ? searchData : (searchData.videos || [])
              if (videos.length > 0) {
                return videos[0]
              }
            }
            // Fallback to "bande" region if machine search fails
            const bandeResponse = await fetch(`/api/videos?region=bande&videoType=muscle-groups`)
            if (bandeResponse.ok) {
              const bandeData = await bandeResponse.json()
              const videos = Array.isArray(bandeData) ? bandeData : (bandeData.videos || [])
              return videos.length > 0 ? videos[0] : null
            }
            return null
          } catch (error) {
            console.error('Error fetching machine video:', error)
            return null
          }
        })()

        // Fetch one audio
        const audioPromise = fetch('/api/audio')
          .then((res) => res.ok ? res.json() : [])
          .then((data) => Array.isArray(data) ? data[0] : null)
          .catch((error) => {
            console.error('Error fetching audio:', error)
            return null
          })

        // Fetch one recipe
        const recipePromise = fetch('/api/recipes')
          .then((res) => res.ok ? res.json() : { recipes: [] })
          .then((data) => {
            const recipes = data.recipes || (Array.isArray(data) ? data : [])
            return recipes.length > 0 ? recipes[0] : null
          })
          .catch((error) => {
            console.error('Error fetching recipe:', error)
            return null
          })

        // Wait for all promises
        const [abdosVideo, dosVideo, jambesVideo, machineVideo, audioData, recipeData] = await Promise.all([
          ...videoPromises,
          machineVideoPromise,
          audioPromise,
          recipePromise
        ])

        // Filter out null values and set videos
        const fetchedVideos = [abdosVideo, dosVideo, jambesVideo, machineVideo].filter((v): v is VideoData => v !== null)
        setVideos(fetchedVideos)
        setAudio(audioData)
        setRecipe(recipeData)
      } catch (error) {
        console.error('Error fetching free trial content:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFreeTrialContent()
  }, [])

  if (loading) {
    return (
      <Section gradient="soft" title="Essai Gratuit" subtitle="Chargement de votre contenu d'essai gratuit...">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Section>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <Section 
        gradient="soft" 
        title="Essai Gratuit" 
        subtitle="Découvrez une sélection de notre contenu premium pour vous donner un avant-goût de ce qui vous attend !"
      >
        {/* Introduction */}
        <div className="mb-12 text-center">
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            Profitez de cet essai gratuit pour explorer nos vidéos d'entraînement, nos audios de méditation 
            et nos recettes nutritives. Tous nos contenus sont conçus pour vous accompagner dans votre parcours 
            vers une meilleure santé et un bien-être optimal.
          </p>
        </div>

        {/* Videos Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-accent-500 dark:text-accent-400 mb-8 text-center">
            Vidéos d'Entraînement
          </h2>
          {videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {videos.map((video) => (
                <EnhancedVideoCard
                  key={video.id}
                  video={video}
                  onPlay={setSelectedVideo}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                Les vidéos seront disponibles prochainement.
              </p>
            </div>
          )}
        </div>

        {/* Audio Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-accent-500 dark:text-accent-400 mb-8 text-center">
            Audio de Bien-être
          </h2>
          {audio ? (
            <div className="max-w-md mx-auto">
              <AudioCard
                audio={audio}
                onClick={() => setSelectedAudio(audio)}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                L'audio sera disponible prochainement.
              </p>
            </div>
          )}
        </div>

        {/* Recipe Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-accent-500 dark:text-accent-400 mb-8 text-center">
            Recette Nutritive
          </h2>
          {recipe ? (
            <div className="max-w-md mx-auto">
              <RecipeCard
                recipe={recipe}
                onClick={() => setSelectedRecipe(recipe)}
                viewMode="grid"
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                La recette sera disponible prochainement.
              </p>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-br from-accent-500 via-accent-600 to-burgundy-600 rounded-2xl shadow-2xl p-10 md:p-12 mb-12 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Prêt à continuer votre parcours ?
              </h2>
              
              <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-3xl mx-auto mb-8">
                Rejoignez-nous pour accéder à toute notre bibliothèque de contenus premium.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  href="/souscriptions/personnalise"
                  variant="white"
                  size="lg"
                  className="group shadow-xl"
                >
                  Voir les abonnements
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl">
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute -top-12 right-0 text-white hover:text-accent-400 transition-colors z-10"
            >
              <span className="text-2xl">✕</span>
            </button>
            <SimpleVideoPlayer
              video={selectedVideo}
              onClose={() => setSelectedVideo(null)}
              showDetails={true}
            />
          </div>
        </div>
      )}

      {/* Audio Player Modal */}
      {selectedAudio && (
        <AudioPlayer
          audio={selectedAudio}
          onClose={() => setSelectedAudio(null)}
        />
      )}

      {/* Recipe Viewer Modal */}
      {selectedRecipe && (
        <RecipeBookletViewer
          images={selectedRecipe.images?.length > 0 ? selectedRecipe.images : [selectedRecipe.image]}
          pdfUrl={selectedRecipe.pdfUrl}
          title={selectedRecipe.title}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  )
}

