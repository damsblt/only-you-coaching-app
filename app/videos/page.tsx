"use client"

import { CheckCircle, ArrowRight, Video, BookOpen, Target } from "lucide-react"
import { Section } from "@/components/ui/Section"
import { Button } from "@/components/ui/Button"
import PageHeader from "@/components/layout/PageHeader"

export default function VideosPage() {
  const benefits = [
    "Accès à une vaste bibliothèque d'exercices de Pilates",
    "Programmes structurés pour tous les niveaux", 
    "Exercices ciblés par groupe musculaire",
    "Séquences complètes pour des séances efficaces",
    "Progression adaptée à votre niveau",
    "Démonstrations claires avec instructions détaillées"
  ]

  return (
    <>
      <PageHeader
        videoS3Key="Photos/Illustration/1860009_Lunges_Resistance Training_Exercise_1920x1080 (1).mp4"
        title="Explorez Nos Vidéos de Pilates"
        subtitle="Bibliothèque d'exercices et programmes structurés pour votre pratique"
        height="fullScreen"
      />
      <Section gradient="soft">
      
      {/* Introduction */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-8">
          Only You Coaching vous propose deux façons d'accéder à vos vidéos de Pilates : explorez notre bibliothèque complète d'exercices ciblés par groupe musculaire, ou suivez nos programmes prédéfinis structurés pour progresser à votre rythme.
        </p>
        
        <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          Que vous souhaitiez cibler un groupe musculaire spécifique ou suivre un parcours complet, nos vidéos vous accompagnent dans votre pratique du Pilates avec des démonstrations claires et des instructions détaillées.
        </p>
      </div>

      {/* Two Options */}
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Video className="w-8 h-8" style={{ color: '#A65959' }} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Bibliothèque de Vidéos
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Accédez à notre collection complète d'exercices de Pilates, organisés par groupe musculaire. Idéal pour cibler des zones spécifiques et créer vos propres séances personnalisées.
          </p>
          <Button
            href="/bibliotheque-videos"
            variant="primary"
            size="md"
            className="mt-4"
          >
            Explorer la Bibliothèque
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8" style={{ color: '#A65959' }} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Programmes Prédéfinis
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Suivez des programmes structurés conçus pour progresser efficacement. Chaque programme comprend une série d'exercices organisés selon votre niveau et vos objectifs.
          </p>
          <Button
            href="/programmes"
            variant="primary"
            size="md"
            className="mt-4"
          >
            Découvrir les Programmes
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-8 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
          Qu'allez-vous découvrir ?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: '#A65959' }} />
              <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-br from-accent-500 via-accent-600 to-burgundy-600 rounded-2xl shadow-2xl p-10 md:p-12 mb-12 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Prêt à commencer votre pratique du Pilates ?
            </h2>
            
            <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-3xl mx-auto mb-8">
              Découvrez nos abonnements et accédez à toutes nos vidéos et programmes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                href="/souscriptions/personnalise"
                variant="white"
                size="lg"
                className="group shadow-xl"
              >
                Découvrir nos Abonnements
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

