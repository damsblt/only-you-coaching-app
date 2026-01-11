import Link from "next/link"
import { ArrowRight, Users, Heart, Target } from "lucide-react"
import { Section } from "@/components/ui/Section"
import { Button } from "@/components/ui/Button"

export default function CoachingPresentielPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <Section gradient="soft">
        <div className="max-w-4xl mx-auto text-center">
          {/* Subtitle */}
          <p className="text-accent-500 dark:text-accent-400 uppercase tracking-wider text-sm font-semibold mb-6">
            DÉCOUVREZ
          </p>

          {/* Main Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black dark:text-white mb-12 leading-tight">
            Mon Coaching Personnalisé En Présentiel
          </h1>

          {/* Descriptive Paragraphs */}
          <div className="space-y-6 mb-12 text-left max-w-3xl mx-auto">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Le coaching en présentiel se distingue par son authenticité et son efficacité où chaque échange est teinté de nuances humaines, et où votre posture et votre technique seront au cœur de mes préoccupations.
            </p>

            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Vous êtes unique à mes yeux ! Ce sur-mesure augmente considérablement l&apos;impact de chaque séance car je m&apos;adapterai instantanément à votre besoin du moment. Vous bénéficiez d&apos;un soutien immédiat, de retours constructifs et d&apos;une motivation renouvelée à chaque rencontre.
            </p>

            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              En choisissant le coaching en présentiel, vous investissez dans un parcours transformateur, où chaque session vous rapproche un peu plus de vos objectifs.
            </p>
          </div>

          {/* Call to Action Text */}
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Pour découvrir mes tarifs ainsi que mes offres sur mesure et les avantages exclusifs que je vous propose, n&apos;hésitez pas à me contacter directement - je serais ravis de vous fournir toutes les informations dont vous avez besoin !
          </p>

          {/* Call to Action Button */}
          <div className="flex justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center text-accent-500 dark:text-accent-400 font-semibold text-lg uppercase tracking-wide hover:underline transition-all group"
            >
              JE PRENDS CONTACT
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </div>
      </Section>

      {/* Benefits Section */}
      <Section gradient="neutral">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4">
              Les Avantages du Coaching en Présentiel
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Un accompagnement personnalisé qui fait la différence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="curved-card bg-white dark:bg-gray-800 p-8 text-center hover:shadow-organic transition-all transform hover:scale-105 border-2 border-secondary-100 dark:border-gray-600">
              <div className="w-20 h-20 border-2 border-accent-500 dark:border-accent-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-accent-500 dark:text-accent-400" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-4">
                Accompagnement Personnalisé
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                Chaque séance est adaptée à vos besoins spécifiques du moment, avec un suivi immédiat de votre posture et de votre technique.
              </p>
            </div>

            <div className="curved-card bg-white dark:bg-gray-800 p-8 text-center hover:shadow-organic transition-all transform hover:scale-105 border-2 border-secondary-100 dark:border-gray-600">
              <div className="w-20 h-20 border-2 border-accent-500 dark:border-accent-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-accent-500 dark:text-accent-400" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-4">
                Corrections en Temps Réel
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                Retours constructifs instantanés pour optimiser chaque mouvement et maximiser l&apos;efficacité de vos exercices.
              </p>
            </div>

            <div className="curved-card bg-white dark:bg-gray-800 p-8 text-center hover:shadow-organic transition-all transform hover:scale-105 border-2 border-secondary-100 dark:border-gray-600">
              <div className="w-20 h-20 border-2 border-accent-500 dark:border-accent-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-accent-500 dark:text-accent-400" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-4">
                Motivation Renouvelée
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                Un soutien constant et une présence humaine qui vous pousse à dépasser vos limites dans un environnement bienveillant.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Final CTA Section */}
      <Section gradient="neutral">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative bg-gradient-to-br from-accent-500 via-accent-600 to-burgundy-600 rounded-2xl shadow-2xl p-10 md:p-12 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Prêt à commencer votre transformation ?
              </h2>
              
              <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed">
                Contactez-moi dès aujourd&apos;hui pour découvrir mes tarifs et mes offres sur mesure. Je serais ravie de vous accompagner dans votre parcours vers une meilleure santé et un bien-être optimal.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  href="/contact"
                  variant="white"
                  size="lg"
                  className="group shadow-xl"
                >
                  JE PRENDS CONTACT
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}
