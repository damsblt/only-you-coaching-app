"use client"

import { useState, useEffect } from "react"
import { Play, Users, Target, Zap, ArrowRight } from "lucide-react"
import { Section } from "@/components/ui/Section"
import { Button } from "@/components/ui/Button"
import ProtectedContent from "@/components/ProtectedContent"
import { useSimpleAuth } from "@/components/providers/SimpleAuthProvider"
import Link from "next/link"

interface Video {
  id: string
  title: string
  description: string
  detailedDescription: string
  thumbnail: string
  videoUrl: string
  duration: number
  difficulty: string
  category: string
  region: string
  muscleGroups: string[]
  startingPosition: string
  movement: string
  intensity: string
  theme: string
  series: string
  constraints: string
  tags: string[]
  isPublished: boolean

  updatedAt: string
}

interface RegionCard {
  id: string
  name: string
  displayName: string
  description: string
  icon: React.ReactNode
  color: string
  videoCount: number
  thumbnail: string
}

export default function ProgrammesPage() {
  const [regions, setRegions] = useState<RegionCard[]>([])
  const [loading, setLoading] = useState(true)
  
  // Use the auth context instead of direct auth calls
  const { user, loading: authLoading } = useSimpleAuth()

  // Define region cards with their metadata
  const regionCards: RegionCard[] = [
    {
      id: "abdos",
      name: "abdos",
      displayName: "Abdos",
      description: "Renforcez vos abdominaux avec des exercices ciblés",
      icon: <Target className="h-8 w-8" />,
      color: "bg-blue-500",
      videoCount: 0,
      thumbnail: ""
    },
    {
      id: "brule-graisse",
      name: "brule-graisse", 
      displayName: "Brûle Graisse",
      description: "Programme intensif pour brûler les graisses",
      icon: <Zap className="h-8 w-8" />,
      color: "bg-red-500",
      videoCount: 0,
      thumbnail: ""
    },
    {
      id: "haute-intensite",
      name: "haute-intensite",
      displayName: "Haute Intensité", 
      description: "Entraînements cardio haute intensité",
      icon: <Zap className="h-8 w-8" />,
      color: "bg-orange-500",
      videoCount: 0,
      thumbnail: ""
    },
    {
      id: "machine",
      name: "machine",
      displayName: "Machine",
      description: "Exercices avec machines spécialisées",
      icon: <Target className="h-8 w-8" />,
      color: "bg-purple-500",
      videoCount: 0,
      thumbnail: ""
    },
    {
      id: "rehabilitation-dos",
      name: "rehabilitation-dos",
      displayName: "Réhabilitation du Dos",
      description: "Exercices thérapeutiques pour le dos",
      icon: <Users className="h-8 w-8" />,
      color: "bg-teal-500",
      videoCount: 0,
      thumbnail: ""
    },
    {
      id: "cuisses-abdos-fessiers",
      name: "cuisses-abdos-fessiers",
      displayName: "Cuisses, Abdos, Fessiers",
      description: "Tonifiez le bas du corps",
      icon: <Target className="h-8 w-8" />,
      color: "bg-indigo-500",
      videoCount: 0,
      thumbnail: ""
    },
    {
      id: "dos-abdos",
      name: "dos-abdos",
      displayName: "Dos & Abdos",
      description: "Renforcez le tronc complet",
      icon: <Target className="h-8 w-8" />,
      color: "bg-cyan-500",
      videoCount: 0,
      thumbnail: ""
    },
    {
      id: "femmes",
      name: "femmes",
      displayName: "Femmes",
      description: "Programmes spécialement conçus pour les femmes",
      icon: <Users className="h-8 w-8" />,
      color: "bg-rose-500",
      videoCount: 0,
      thumbnail: ""
    },
    {
      id: "homme",
      name: "homme",
      displayName: "Homme",
      description: "Programmes adaptés aux hommes",
      icon: <Users className="h-8 w-8" />,
      color: "bg-slate-500",
      videoCount: 0,
      thumbnail: ""
    },
    {
      id: "jambes",
      name: "jambes",
      displayName: "Jambes",
      description: "Renforcez et tonifiez vos jambes",
      icon: <Target className="h-8 w-8" />,
      color: "bg-emerald-500",
      videoCount: 0,
      thumbnail: ""
    },
    {
      id: "cuisses-abdos",
      name: "cuisses-abdos",
      displayName: "Cuisses & Abdos",
      description: "Ciblez cuisses et abdominaux",
      icon: <Target className="h-8 w-8" />,
      color: "bg-violet-500",
      videoCount: 0,
      thumbnail: ""
    }
  ]

  // Fetch video counts and thumbnails for each region
  useEffect(() => {
    async function fetchVideoData() {
      try {
        setLoading(true)
        
        const updatedRegions = await Promise.all(
          regionCards.map(async (region) => {
            try {
              const response = await fetch(`/api/videos?videoType=programmes&region=${region.name}`)
              if (response.ok) {
                const videos = await response.json()
                // Get the first video's thumbnail as the region thumbnail
                const thumbnail = videos.length > 0 ? videos[0].thumbnail : ""
                return { ...region, videoCount: videos.length, thumbnail }
              }
            } catch (error) {
              console.error(`Error fetching videos for ${region.name}:`, error)
            }
            return { ...region, videoCount: 0, thumbnail: "" }
          })
        )
        
        // Sort regions alphabetically by displayName
        const sortedRegions = updatedRegions.sort((a, b) => 
          a.displayName.localeCompare(b.displayName, 'fr', { sensitivity: 'base' })
        )
        
        setRegions(sortedRegions)
      } catch (error) {
        console.error('Error fetching video data:', error)
        setRegions(regionCards)
      } finally {
        setLoading(false)
      }
    }

    fetchVideoData()
  }, [])


  if (loading || authLoading) {
    return (
      <Section gradient="soft" title="Programmes Prédéfinis" subtitle="Chargement de vos programmes...">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Section>
    )
  }

  return (
    <>
      <Section 
        gradient="soft" 
        title="Programmes Prédéfinis" 
        subtitle="Des entraînements complets en vidéo, conçus pour vous guider vers vos objectifs fitness, étape par étape."
      >
        {/* Introduction - Visible to all */}
        <div className="mb-12 text-center">
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            Le coaching en ligne est le moyen le plus efficace pour atteindre vos objectifs de perte de poids, remise en forme et santé. Déterminer votre moment et votre endroit pour pratiquer, et profiter d'un contact par email avec votre coach en cas de question.
          </p>
        </div>

        <ProtectedContent 
          feature="predefinedPrograms" 
          userId={user?.id}
        >
          {/* Region Cards Grid */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-accent-500 dark:text-accent-400 mb-8 text-center">
              Nos Programmes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {regions.map((region) => (
                <Link
                  key={region.id}
                  href={`/programmes/${region.name}`}
                  className="group block"
                >
                  <div className="curved-card bg-white dark:bg-gray-800 shadow-organic hover:shadow-floating transition-all cursor-pointer border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {/* Thumbnail with Play Button */}
                    <div className="relative aspect-video bg-neutral-200 dark:bg-gray-700 overflow-hidden leading-none text-[0]">
                      {region.thumbnail ? (
                        <img 
                          src={region.thumbnail} 
                          alt={region.displayName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className={`${region.color} w-full h-full flex items-center justify-center relative`}>
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                          <div className="relative z-10 p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            {region.icon}
                          </div>
                        </div>
                      )}
                      
                      {/* Video Count Badge */}
                      <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white px-3 py-1.5 rounded-full text-xs font-semibold">
                        {region.videoCount} vidéos
                      </div>
                      
                      {/* Play Button Overlay on Hover */}
                      <div className="absolute inset-0 bg-accent-500/0 group-hover:bg-accent-500/20 transition-all duration-300 flex items-center justify-center">
                        <div className="w-14 h-14 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-floating">
                          <Play className="w-6 h-6 text-secondary-500 ml-1" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Card Content */}
                    <div className="p-6">
                      {/* Title */}
                      <h3 className="font-semibold text-accent-500 dark:text-accent-400 mb-3 line-clamp-2 group-hover:text-secondary-500 dark:group-hover:text-secondary-400 transition-colors">
                        {region.displayName}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4 line-clamp-2">
                        {region.description}
                      </p>
                      
                      {/* Action Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          window.location.href = `/programmes/${region.name}`
                        }}
                        className="w-full curved-button bg-gradient-to-r from-secondary-500 to-accent-500 dark:from-secondary-600 dark:to-accent-600 text-white font-semibold py-3 px-6 text-center block hover:shadow-floating transition-all flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Voir le programme
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </ProtectedContent>

        {/* Free Trial CTA Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="relative bg-gradient-to-br from-accent-500 via-accent-600 to-burgundy-600 rounded-2xl shadow-2xl p-10 md:p-12 mb-12 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Découvrez plus avec notre essai gratuit
              </h2>
              
              <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-3xl mx-auto mb-8">
                Explorez une sélection de nos programmes, vidéos, audios et recettes premium pour vous donner un avant-goût de ce qui vous attend !
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  href="/essai-gratuit"
                  variant="white"
                  size="lg"
                  className="group shadow-xl"
                >
                  Essayer gratuitement
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
