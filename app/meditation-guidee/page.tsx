"use client"

import { useState, useEffect } from "react"
import { Play, Clock, Heart, Plus, ArrowRight } from "lucide-react"
import { AudioCard } from "@/components/audio/AudioCard"
import { AudioPlayer } from "@/components/audio/AudioPlayer"
import { Section } from "@/components/ui/Section"
import { Button } from "@/components/ui/Button"
import { Audio } from "@/types"
import ProtectedContent from "@/components/ProtectedContent"
import { useSimpleAuth } from "@/components/providers/SimpleAuthProvider"
import PageHeader from "@/components/layout/PageHeader"

export default function MeditationGuideePage() {
  const [selectedAudio, setSelectedAudio] = useState<Audio | null>(null)
  const [audios, setAudios] = useState<Audio[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useSimpleAuth()

  // Fetch audios from S3
  useEffect(() => {
    const fetchAudios = async () => {
      try {
        const response = await fetch('/api/audio')
        if (response.ok) {
          const data = await response.json()
          // Filter for meditation guidée category
          // Database uses 'meditation_guidee', but we also check for display name variations
          const meditationAudios = data.filter((audio: Audio) => 
            audio.category === "meditation_guidee" || 
            audio.category === "Méditation Guidée" ||
            audio.category?.toLowerCase().includes('meditation')
          )
          setAudios(meditationAudios)
        } else {
          console.error('Failed to fetch audios')
        }
      } catch (error) {
        console.error('Error fetching audios:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAudios()
  }, [])

  if (loading) {
    return (
      <Section gradient="soft" title="Méditation Guidée" subtitle="Chargement de votre collection de méditations guidées...">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Section>
    )
  }

  return (
    <>
      <PageHeader
        imageS3Key="Photos/Illustration/reverie-calme-femme-portant-ecouteurs-se-detendre-ecouter-livre-audio-dans-plantes-vertes-exotiques-surround.jpg"
        title="Méditation Guidée"
        subtitle="Découvrez notre collection de méditations guidées pour apaiser votre esprit et améliorer votre bien-être."
        height="fullScreen"
      />
      <Section gradient="soft">
      <ProtectedContent feature="audioLibrary">
        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {audios.length} méditation{audios.length !== 1 ? "s" : ""} guidée{audios.length !== 1 ? "s" : ""} disponible{audios.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Audio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {audios.map((audio) => (
            <AudioCard
              key={audio.id}
              audio={audio}
              onClick={() => setSelectedAudio(audio)}
            />
          ))}
        </div>

        {/* Audio Player Modal */}
        {selectedAudio && (
          <AudioPlayer
            audio={selectedAudio}
            onClose={() => setSelectedAudio(null)}
          />
        )}
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
              Explorez une sélection de nos méditations, vidéos et recettes premium pour vous donner un avant-goût de ce qui vous attend !
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
