"use client"

import { CheckCircle, ArrowRight, Music, Brain, Heart } from "lucide-react"
import { Section } from "@/components/ui/Section"
import { Button } from "@/components/ui/Button"
import PageHeader from "@/components/layout/PageHeader"

export default function AudioPage() {
  const benefits = [
    "Réduction du stress et de l'anxiété",
    "Amélioration du bien-être mental et émotionnel", 
    "Renforcement de la résilience",
    "Augmentation du bonheur et de la satisfaction",
    "Renforcement des relations",
    "Amélioration de la concentration et de la clarté mentale"
  ]

  return (
    <>
      <PageHeader
        imageS3Key="Photos/Illustration/vitaly-gariev-gnBMTzKGA3U-unsplash.jpg"
        title="Améliorez Votre Bien-être Mental et Émotionnel"
        subtitle="Découvrez nos programmes exclusifs de méditation guidée et de coaching mental"
        height="fullScreen"
      />
      <Section gradient="soft">
      
      {/* Introduction */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-8">
          Only You Coaching propose un programme de méditation guidée sur des musiques douces et relaxantes ainsi qu'un programme de coaching mental qui vous accompagnera dans votre activité sportive. Tout cela dans le but d'améliorer votre bien-être mental et émotionnel.
        </p>
        
        <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          À travers ces sessions guidées, vous avez accès à des méditations efficaces qui vous aideront à trouver un équilibre intérieur et à renforcer votre connexion avec vous-même. Idéale pour compléter votre parcours de fitness et de bien-être, la méditation guidée est un outil puissant pour votre épanouissement personnel.
        </p>
      </div>

      {/* Two Programs */}
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Music className="w-8 h-8" style={{ color: '#A65959' }} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Méditation Guidée
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Plongez dans des séances apaisantes, accompagnées de musiques douces et relaxantes, conçues pour vous aider à lâcher prise et à retrouver la sérénité.
          </p>
          <Button
            href="/meditation-guidee"
            variant="primary"
            size="md"
            className="mt-4"
          >
            Découvrir
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Brain className="w-8 h-8" style={{ color: '#A65959' }} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Coaching Mental
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Bénéficiez d'un accompagnement personnalisé pour renforcer votre mental, optimiser vos performances et vous soutenir efficacement dans votre activité sportive.
          </p>
          <Button
            href="/coaching-mental"
            variant="primary"
            size="md"
            className="mt-4"
          >
            Découvrir
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-8 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
          Qu'allez-vous apprendre ?
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
              Prêt à transformer votre quotidien ?
            </h2>
            
            <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-3xl mx-auto mb-8">
              Découvrez nos abonnements et commencez votre parcours vers un bien-être durable.
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
