"use client"

import { useState, useEffect } from "react"
import { ArrowRight } from "lucide-react"
import { AudioCard } from "@/components/audio/AudioCard"
import { AudioPlayer } from "@/components/audio/AudioPlayer"
import { Section } from "@/components/ui/Section"
import { Button } from "@/components/ui/Button"
import { Audio } from "@/types"
import ProtectedContent from "@/components/ProtectedContent"
import PageHeader from "@/components/layout/PageHeader"

export default function CoachingMentalPage() {
  const [selectedAudio, setSelectedAudio] = useState<Audio | null>(null)
  const [audios, setAudios] = useState<Audio[]>([])
  const [loading, setLoading] = useState(true)
  const [thumbnailImages, setThumbnailImages] = useState<string[]>([])

  // Fetch thumbnail images and audios from S3
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch thumbnail images and audios in parallel
        // Add cache-busting timestamp to ensure fresh data from Neon
        const timestamp = Date.now()
        const [thumbnailsResponse, audioResponse1, audioResponse2] = await Promise.all([
          fetch('/api/gallery/list-folder-images?folder=Photos/Illustration/coaching mental'),
          fetch(`/api/audio?category=Coaching Mental&_t=${timestamp}`, { cache: 'no-store' }),
          fetch(`/api/audio?category=Coaching mental&_t=${timestamp}`, { cache: 'no-store' })
        ])
        
        // Get thumbnail images (store S3 keys instead of URLs)
        let imageKeys: string[] = []
        if (thumbnailsResponse.ok) {
          const thumbnailsData = await thumbnailsResponse.json()
          // Store S3 keys instead of URLs for proper S3Image component usage
          imageKeys = thumbnailsData.images?.map((img: { key: string }) => img.key) || []
        }
        setThumbnailImages(imageKeys)
        
        // Get audios
        const [data1, data2] = await Promise.all([
          audioResponse1.ok ? audioResponse1.json() : [],
          audioResponse2.ok ? audioResponse2.json() : []
        ])
        
        // Combine and deduplicate by id
        const allAudios = [...(data1 || []), ...(data2 || [])]
        const uniqueAudios = Array.from(
          new Map(allAudios.map((audio: Audio) => [audio.id, audio])).values()
        )
        
        // Map thumbnail S3 keys to audios by index
        const audiosWithThumbnails = uniqueAudios.map((audio: Audio, index: number) => ({
          ...audio,
          thumbnail: imageKeys[index] || audio.thumbnail
        }))
        
        setAudios(audiosWithThumbnails)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <>
        <PageHeader
          imageS3Key="Photos/Illustration/vitaly-gariev-gnBMTzKGA3U-unsplash.jpg"
          title="Coaching Mental"
          subtitle="Chargement de votre collection de coaching mental..."
          height="fullScreen"
        />
        <Section gradient="soft">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </Section>
      </>
    )
  }

  return (
    <>
      <PageHeader
        imageS3Key="Photos/Illustration/vitaly-gariev-gnBMTzKGA3U-unsplash.jpg"
        title="Coaching Mental"
        subtitle="Découvrez notre collection de coaching mental pour développer votre confiance et améliorer votre état d'esprit."
        height="fullScreen"
      />
      <Section gradient="soft">
      <ProtectedContent feature="audioLibrary">
        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {audios.length} session{audios.length !== 1 ? "s" : ""} de coaching mental disponible{audios.length !== 1 ? "s" : ""}
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
              Explorez une sélection de nos sessions de coaching mental, vidéos et recettes premium pour vous donner un avant-goût de ce qui vous attend !
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
