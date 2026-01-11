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
  const [mentalCoachingAudio, setMentalCoachingAudio] = useState<Audio | null>(null)
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null)
  const [selectedAudio, setSelectedAudio] = useState<Audio | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFreeTrialContent = async () => {
      try {
        setLoading(true)

        // Fetch videos from programmes (same as /programmes page)
        // Use videoType=programmes and get first video from different programme regions
        const programmeRegions = ['abdos', 'brule-graisse', 'haute-intensite', 'machine']
        const videoPromises = programmeRegions.map(async (region) => {
          try {
            const response = await fetch(`/api/videos?videoType=programmes&region=${region}`)
            if (response.ok) {
              const data = await response.json()
              // API returns array directly
              const videos = Array.isArray(data) ? data : (data.videos || [])
              return videos.length > 0 ? videos[0] : null
            }
            return null
          } catch (error) {
            console.error(`Error fetching video for programme region ${region}:`, error)
            return null
          }
        })

        // Fetch one meditation audio (try multiple category variations)
        const audioPromise = Promise.all([
          fetch('/api/audio?category=Méditation Guidée'),
          fetch('/api/audio?category=meditation_guidee'),
          fetch('/api/audio') // Fallback: get all and filter
        ])
          .then(([res1, res2, res3]) => Promise.all([
            res1.ok ? res1.json() : [],
            res2.ok ? res2.json() : [],
            res3.ok ? res3.json() : []
          ]))
          .then(([data1, data2, data3]) => {
            // Combine all results
            const allAudios = [
              ...(Array.isArray(data1) ? data1 : []),
              ...(Array.isArray(data2) ? data2 : []),
              ...(Array.isArray(data3) ? data3 : [])
            ]
            
            // Filter for meditation guidée category (check multiple variations)
            const meditationAudios = allAudios.filter((audio: Audio) => 
              audio.category === "meditation_guidee" || 
              audio.category === "Méditation Guidée" ||
              audio.category?.toLowerCase().includes('meditation')
            )
            
            // Deduplicate by id
            const uniqueAudios = Array.from(
              new Map(meditationAudios.map((audio: Audio) => [audio.id, audio])).values()
            )
            
            return uniqueAudios.length > 0 ? uniqueAudios[0] : null
          })
          .catch((error) => {
            console.error('Error fetching meditation audio:', error)
            return null
          })

        // Fetch one coaching mental audio (try both category variations)
        const mentalCoachingPromise = Promise.all([
          fetch('/api/audio?category=Coaching Mental'),
          fetch('/api/audio?category=Coaching mental')
        ])
          .then(([res1, res2]) => Promise.all([
            res1.ok ? res1.json() : [],
            res2.ok ? res2.json() : []
          ]))
          .then(([data1, data2]) => {
            const allAudios = [...(Array.isArray(data1) ? data1 : []), ...(Array.isArray(data2) ? data2 : [])]
            // Deduplicate by id
            const uniqueAudios = Array.from(
              new Map(allAudios.map((audio: Audio) => [audio.id, audio])).values()
            )
            return uniqueAudios.length > 0 ? uniqueAudios[0] : null
          })
          .catch((error) => {
            console.error('Error fetching coaching mental audio:', error)
            return null
          })

        // Fetch one recipe
        const recipePromise = fetch('/api/recipes')
          .then((res) => {
            if (!res.ok) {
              console.error('Recipes API response not ok:', res.status, res.statusText)
              return { recipes: [] }
            }
            return res.json()
          })
          .then((data) => {
            console.log('Recipes API response:', data)
            const recipes = data.recipes || (Array.isArray(data) ? data : [])
            console.log('Parsed recipes:', recipes.length, recipes)
            return recipes.length > 0 ? recipes[0] : null
          })
          .catch((error) => {
            console.error('Error fetching recipe:', error)
            return null
          })

        // Wait for all promises
        const [video1, video2, video3, video4, audioData, mentalCoachingData, recipeData] = await Promise.all([
          ...videoPromises,
          audioPromise,
          mentalCoachingPromise,
          recipePromise
        ])

        // Filter out null values and set videos
        const fetchedVideos = [video1, video2, video3, video4].filter((v): v is VideoData => v !== null)
        setVideos(fetchedVideos)
        setAudio(audioData)
        setMentalCoachingAudio(mentalCoachingData)
        setRecipe(recipeData)
        
        // Log for debugging
        console.log('Free trial content loaded:', {
          videos: fetchedVideos.length,
          meditationAudio: audioData ? audioData.title : 'none',
          coachingMentalAudio: mentalCoachingData ? mentalCoachingData.title : 'none',
          recipe: recipeData ? recipeData.title : 'none'
        })
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
    <div id="top" className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <Section 
        gradient="soft" 
        title="Essai Gratuit" 
        subtitle="Découvrez une sélection de notre contenu premium pour vous donner un avant-goût de ce qui vous attend !"
      >
        {/* Introduction */}
        <div className="mb-12 text-center">
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            Profitez de cet essai gratuit pour explorer nos vidéos d'entraînement, nos audios de méditation guidée, 
            nos sessions de coaching mental et nos recettes nutritives. Tous nos contenus sont conçus pour vous accompagner 
            dans votre parcours vers une meilleure santé et un bien-être optimal.
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

        {/* Audio Section - Méditation Guidée */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-accent-500 dark:text-accent-400 mb-8 text-center">
            Méditation Guidée
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

        {/* Audio Section - Coaching Mental */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-accent-500 dark:text-accent-400 mb-8 text-center">
            Coaching Mental
          </h2>
          {mentalCoachingAudio ? (
            <div className="max-w-md mx-auto">
              <AudioCard
                audio={mentalCoachingAudio}
                onClick={() => setSelectedAudio(mentalCoachingAudio)}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Découvrez nos sessions de coaching mental pour renforcer votre mental et optimiser vos performances.
              </p>
              <Button
                href="/coaching-mental"
                variant="primary"
                size="md"
              >
                Découvrir le coaching mental
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
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

