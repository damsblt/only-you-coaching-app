"use client"

import { Star, Quote } from "lucide-react"
import { useEffect, useState } from "react"

interface Testimonial {
  name: string
  text: string
  photo?: string
}

const testimonials: Testimonial[] = [
  {
    name: "JEAN YVES",
    text: "L'entraînement proposé par Marie-Line m'a été extrêmement bénéfique. Sa manière de renforcer la musculature interne, particulièrement au niveau des jambes et de mon genou affaibli m'a apporté un grand soulagement. Marie-Line est une personne très sympathique dotée d'une grande empathie. Elle sait être exigeante avec calme et douceur. C'est une coach idéale.",
  },
  {
    name: "LUCIENNE",
    text: "Depuis plusieurs années, je bénéficie du coaching de Marie-Line. C'est une professionnelle expérimentée, attentive et fiable qui s'adapte aux besoins particuliers de chacun de ses clients. Mes problèmes de dos ne sont d'ailleurs plus qu'un vieux souvenir. Marie-Line a toujours répondu parfaitement à mes attentes.",
  },
  {
    name: "VALERIE",
    text: "J'ai un suivi de coaching avec Marie-line depuis passé 10 ans. Elle est vraiment une personne extraordinaire, à l'écoute de nos bobos, de notre corps, etc…Elle adapte systématiquement les exercices en fonction de nos besoins. J'ai commencé le coaching pour des raisons de mal au fond du dos. Depuis plus de 10 ans, je ne sais plus ce que c'est d'avoir mal au dos.",
  },
  {
    name: "TRISTAN",
    text: "J'ai été coaché par Marie-Line pendant plusieurs années et cela m'a été bénéfique sur de nombreux aspects. J'ai premièrement appris à contrôler mon corps en profondeur avec des corrections posturales spécifiques à chaque exercice. Marie-Line a été une clé dans ma progression et elle m'a permis d'être plus performant que jamais auparavant.",
  },
  {
    name: "YVONNE",
    text: "Je me suis entraînée pour la première fois avec Marie Line il y a 16 ans, alors que j'étais enceinte de mon premier enfant. Pendant ces 13 années, l'entraînement a toujours été très varié, avec des exercices toujours nouveaux et intéressants. Je ne peux que recommander Marie Line comme entraîneur personnel, car elle est très professionnelle, sympathique, pleine d'humour et sensible.",
  },
  {
    name: "PIERRE ANDRE",
    text: "Je suis très heureux de recommander chaleureusement ma coach personnelle qui m'accompagne depuis 2003. Marie-Line est très compétente dans son domaine et une personne super sympa toujours à l'écoute de mes besoins et objectifs. Si vous cherchez une coach dévouée et bienveillante, ne cherchez pas plus loin, c'est la bonne personne.",
  }
]

export default function Testimonials() {
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const [failedPhotos, setFailedPhotos] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Fetch signed URLs for testimonial photos
    const fetchPhotoUrls = async () => {
      // Only run on client side
      if (typeof window === 'undefined') {
        return
      }

      try {
        const names = testimonials.map(t => t.name).join(',')
        
        // Use environment variable in production, fallback to window.location.origin
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
        
        // Validate baseUrl
        if (!baseUrl) {
          console.warn('⚠️ No base URL available for fetching testimonial photos')
          return
        }
        
        const apiUrl = `${baseUrl}/api/testimonials/photos?names=${encodeURIComponent(names)}`
        
        console.log('📸 Fetching testimonial photos from:', apiUrl)
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Add cache control to prevent stale data
          cache: 'no-store',
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Failed to fetch photo URLs:', response.status, errorText)
          // Don't throw - gracefully handle the error by showing fallback avatars
          return
        }
        
        const data = await response.json()
        console.log('✅ Received photo URLs for:', Object.keys(data.photos || {}))
        
        if (data.photos && Object.keys(data.photos).length > 0) {
          // Log each URL for debugging
          Object.entries(data.photos).forEach(([name, url]) => {
            console.log(`  - ${name}: ${url?.substring(0, 80)}...`)
          })
          setPhotoUrls(data.photos)
        } else {
          console.warn('⚠️ No photo URLs received from API. Response:', data)
        }
      } catch (error) {
        // Handle network errors gracefully
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          console.warn('⚠️ Network error fetching testimonial photos. This may be due to:', {
            reason: 'API route unavailable or network issue',
            suggestion: 'Photos will use fallback avatars'
          })
        } else {
          console.error('❌ Error fetching photo URLs:', error)
        }
        // Don't set failed photos here - let the image onError handle it
        // The component will gracefully show fallback avatars
      }
    }

    fetchPhotoUrls()
  }, [])
  return (
    <section className="py-20 bg-white dark:bg-gray-800 relative overflow-hidden transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <p className="text-accent-500 dark:text-accent-400 uppercase tracking-wider text-sm font-semibold mb-4">
            TÉMOIGNAGES CLIENTS
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4">
            Ce Que Disent Nos Clients
          </h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mt-6">
            Découvrez les expériences de ceux qui ont transformé leur vie grâce à notre coaching personnalisé
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="curved-card bg-white dark:bg-gray-700 p-6 hover:shadow-organic transition-all transform hover:scale-105 border-2 border-secondary-100 dark:border-gray-600 flex flex-col"
            >
              {/* Quote Icon */}
              <div className="mb-4">
                <Quote className="w-8 h-8 text-accent-500 dark:text-accent-400 opacity-50" />
              </div>

              {/* Testimonial Text */}
              <p className="text-gray-700 dark:text-gray-300 mb-6 flex-grow leading-relaxed text-sm">
                &quot;{testimonial.text}&quot;
              </p>

              {/* Author Info */}
              <div className="flex items-center gap-4 pt-4 border-t border-secondary-200 dark:border-gray-600">
                {photoUrls[testimonial.name] && !failedPhotos.has(testimonial.name) ? (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-accent-500 dark:border-accent-400">
                    <img
                      src={photoUrls[testimonial.name]}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        console.error(`❌ Failed to load image for ${testimonial.name}`)
                        console.error('Image URL:', photoUrls[testimonial.name]?.substring(0, 100))
                        console.error('Error event:', e)
                        // Mark this photo as failed to show fallback
                        setFailedPhotos(prev => new Set(prev).add(testimonial.name))
                      }}
                      onLoad={() => {
                        console.log(`✅ Successfully loaded image for ${testimonial.name}`)
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full flex-shrink-0 border-2 border-accent-500 dark:border-accent-400 bg-gradient-to-br from-accent-200 to-accent-400 dark:from-accent-600 dark:to-accent-800 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-black dark:text-white text-sm">
                    {testimonial.name}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-3 h-3 fill-accent-500 dark:fill-accent-400 text-accent-500 dark:text-accent-400"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

