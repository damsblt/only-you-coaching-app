"use client"

import Image from "next/image"

interface Partner {
  name: string
  logo: string
  alt: string
}

const partners: Partner[] = [
  {
    name: "IFAS ERPS",
    logo: "/partners/logo_ifas_ereps1-1.jpg",
    alt: "Logo IFAS ERPS"
  },
  {
    name: "Soulgames",
    logo: "/partners/logo-soulgames-2025-bleu-complet.svg",
    alt: "Logo Soulgames"
  },
  {
    name: "LogoFC",
    logo: "/partners/LogoFC_Official_transparent.png",
    alt: "Logo FC Official"
  },
  {
    name: "TATWA",
    logo: "/partners/TATWA.png",
    alt: "Logo TATWA"
  },
  {
    name: "Harmonis",
    logo: "/partners/Harmonis.jpeg",
    alt: "Logo Harmonis"
  },
  {
    name: "Harmonie",
    logo: "/partners/Harmonie.png",
    alt: "Logo Harmonie"
  }
]

export default function PartnersCarousel() {
  // Dupliquer les partenaires pour créer un effet de boucle infinie
  const duplicatedPartners = [...partners, ...partners]

  return (
    <section className="py-16 bg-white dark:bg-gray-800 relative overflow-hidden transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <p className="text-accent-500 dark:text-accent-400 uppercase tracking-wider text-sm font-semibold mb-4">
            NOS PARTENAIRES
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4">
            Ils Nous Font Confiance
          </h2>
        </div>

        {/* Carrousel Container */}
        <div className="relative w-full overflow-hidden">
          {/* Gradient overlays pour l'effet de fondu */}
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-white dark:from-gray-800 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-white dark:from-gray-800 to-transparent z-10 pointer-events-none"></div>

          {/* Carrousel animé */}
          <div className="partners-scroll">
            {duplicatedPartners.map((partner, index) => (
              <div
                key={`${partner.name}-${index}`}
                className="flex-shrink-0 mx-4 md:mx-8 flex items-center justify-center"
                style={{ width: "150px", height: "90px" }}
              >
                <div className="relative w-full h-full flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 opacity-70 hover:opacity-100">
                  <Image
                    src={partner.logo}
                    alt={partner.alt}
                    width={150}
                    height={90}
                    className="object-contain max-w-full max-h-full w-auto h-auto"
                    unoptimized={partner.logo.endsWith('.svg')}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

