'use client'

import { useState } from 'react'
import { ArrowRight, Heart, Sparkles, Target, BookOpen, HelpCircle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'

interface FAQItem {
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    question: "Qu'est-ce que la technique proprioceptive ?",
    answer: "La technique proprioceptive consiste à travailler les muscles profonds qui stabilisent votre corps. Cette approche améliore votre posture, prévient les blessures et développe une force fonctionnelle qui vous servira dans tous vos mouvements quotidiens."
  },
  {
    question: "Comment se déroulent les séances personnalisées ?",
    answer: "Chaque séance est adaptée à votre niveau, vos objectifs et vos contraintes physiques. Nous commençons par une évaluation de votre posture et de vos besoins, puis je crée un programme sur mesure qui évolue avec vos progrès."
  },
  {
    question: "Proposez-vous un accompagnement nutritionnel ?",
    answer: "Oui, en tant que spécialiste en nutrition-sport et performance, je vous accompagne dans l'optimisation de votre alimentation pour maximiser vos résultats. L'alimentation et l'exercice physique vont de pair dans ma méthode."
  },
  {
    question: "Quelle est la différence avec les cours de Pilates classiques ?",
    answer: "Ma méthode intègre non seulement le Pilates traditionnel, mais aussi la technique proprioceptive, l'accompagnement nutritionnel et une approche holistique du bien-être. C'est un accompagnement complet, pas seulement des exercices."
  },
  {
    question: "Combien de temps faut-il pour voir des résultats ?",
    answer: "Les premiers bénéfices se font généralement sentir dès les premières semaines : meilleure posture, plus d'énergie, meilleur sommeil. Pour des résultats durables et visibles, comptez environ 2 à 3 mois de pratique régulière."
  },
  {
    question: "Puis-je commencer si je suis débutant en Pilates ?",
    answer: "Absolument ! Ma méthode est adaptée à tous les niveaux. Je commence toujours par évaluer votre niveau et créer un programme progressif qui respecte votre corps et vos limites. Chaque exercice peut être adapté ou modifié selon vos besoins."
  },
  {
    question: "Comment la méditation s'intègre-t-elle dans votre méthode ?",
    answer: "La méditation fait partie intégrante de ma méthode car elle renforce la connexion corps-esprit. Avec plus de 30 ans de pratique du Raja Yoga, je vous guide vers une meilleure conscience de votre corps et de vos sensations pendant l'exercice."
  },
  {
    question: "Les séances se déroulent-elles en présentiel ou en ligne ?",
    answer: "Je propose les deux formats : séances en présentiel à domicile ou dans mes locaux à Conthey, Sion ou Martigny, ainsi que des programmes en ligne avec vidéos et suivi personnalisé. Vous choisissez le format qui vous convient le mieux."
  }
]

function FAQAccordionItem({ item, isOpen, onClick }: { item: FAQItem; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="bg-gradient-to-br from-gray-50 dark:from-gray-700 to-white dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden transition-all duration-300 hover:shadow-lg">
      <button
        onClick={onClick}
        className="w-full px-6 py-5 text-left flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 rounded-xl"
        aria-expanded={isOpen}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-4 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
          {item.question}
        </h3>
        <div 
          className={`flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        >
          <ChevronDown className="w-5 h-5 text-accent-600 dark:text-accent-400 transition-colors" />
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'
        }`}
        style={{
          transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out, margin-top 0.3s ease-in-out'
        }}
      >
        <div className="px-6 pb-5 pt-0">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function MethodePage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <Section 
        gradient="soft" 
        title="Ma méthode" 
        subtitle="Une approche holistique unique alliant Pilates, nutrition et bien-être pour transformer votre corps et votre esprit"
      >
        {/* Header Section */}
        <div className="text-center mb-16">
          <p className="text-accent-500 uppercase tracking-wider text-sm font-semibold mb-4">
            DÉCOUVREZ MON APPROCHE
          </p>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-8">
            La Méthode Marie-Line
          </h1>
        </div>

        {/* Main Content - Method Description */}
        <div className="space-y-8 mb-12">
          {/* Introduction to the Method */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-shadow duration-300">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-100 rounded-full mb-4">
                <BookOpen className="w-4 h-4 text-accent-600" />
                <span className="text-sm font-semibold text-accent-600">Ma philosophie</span>
              </div>
            </div>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Ma méthode repose sur une approche holistique unique qui combine plus de 30 ans d'expérience 
              en fitness, Pilates, nutrition et bien-être. Je m'engage à travailler avec chaque personne 
              de manière consciente et respectueuse, en me concentrant sur les muscles profonds grâce à 
              la technique proprioceptive.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Mon approche intègre trois piliers fondamentaux : le renforcement musculaire profond, 
              l'alimentation équilibrée et le bien-être mental. Cette combinaison unique permet non 
              seulement de transformer votre corps, mais aussi d'améliorer votre qualité de vie globale.
            </p>
          </div>

          {/* Method Pillars */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gradient-to-br from-white dark:from-gray-800 to-accent-50/30 dark:to-accent-900/20 rounded-2xl shadow-xl p-6 border border-accent-100/50 dark:border-accent-800/50 hover:shadow-2xl transition-shadow duration-300">
              <div className="p-3 bg-accent-500/10 rounded-lg w-fit mb-4">
                <Target className="w-8 h-8 text-accent-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Technique Proprioceptive
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Travail sur les muscles profonds pour renforcer la stabilité, améliorer la posture et 
                développer une force fonctionnelle durable.
              </p>
            </div>

            <div className="bg-gradient-to-br from-white dark:from-gray-800 to-accent-50/30 dark:to-accent-900/20 rounded-2xl shadow-xl p-6 border border-accent-100/50 dark:border-accent-800/50 hover:shadow-2xl transition-shadow duration-300">
              <div className="p-3 bg-accent-500/10 rounded-lg w-fit mb-4">
                <Heart className="w-8 h-8 text-accent-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Approche Nutritionnelle
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Accompagnement personnalisé en nutrition-sport et performance pour optimiser vos 
                résultats et maintenir un équilibre alimentaire sain.
              </p>
            </div>

            <div className="bg-gradient-to-br from-white dark:from-gray-800 to-accent-50/30 dark:to-accent-900/20 rounded-2xl shadow-xl p-6 border border-accent-100/50 dark:border-accent-800/50 hover:shadow-2xl transition-shadow duration-300">
              <div className="p-3 bg-accent-500/10 rounded-lg w-fit mb-4">
                <Sparkles className="w-8 h-8 text-accent-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Bien-être Holistique
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Intégration de la méditation et du développement personnel pour un bien-être physique, 
                mental et spirituel complet.
              </p>
            </div>
          </div>

          {/* Detailed Method Description */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Pourquoi cette méthode fonctionne
            </h2>
            <div className="space-y-4">
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                Ma méthode se distingue par son approche globale. Contrairement aux programmes classiques 
                qui se concentrent uniquement sur l'exercice physique, j'aborde chaque aspect de votre 
                bien-être : votre corps, votre alimentation et votre mental.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                Grâce à mes 30 années de méditation du Raja Yoga et de transformation personnelle, je 
                comprends l'importance de la connexion entre le corps et l'esprit. Cette compréhension 
                profonde me permet de créer des programmes véritablement personnalisés qui s'adaptent 
                à vos besoins spécifiques.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                Je m'engage également à rester à la pointe des dernières recherches en matière de fitness 
                et de nutrition, afin d'offrir les meilleurs résultats possibles à mes clients. Chaque 
                séance est pensée pour vous faire progresser de manière sécurisée et efficace.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-10 mb-12 border border-gray-100 dark:border-gray-700">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-100 rounded-full mb-4">
              <HelpCircle className="w-4 h-4 text-accent-600" />
              <span className="text-sm font-semibold text-accent-600 uppercase tracking-wide">Questions fréquentes</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              FAQ - Ma Méthode
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Trouvez les réponses aux questions les plus fréquentes sur ma méthode de coaching
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {faqItems.map((item, index) => (
              <FAQAccordionItem
                key={index}
                item={item}
                isOpen={openIndex === index}
                onClick={() => toggleFAQ(index)}
              />
            ))}
          </div>
        </div>

        {/* Call to Action Section */}
        <div className="relative bg-gradient-to-br from-accent-500 via-accent-600 to-burgundy-600 rounded-2xl shadow-2xl p-10 md:p-12 mb-12 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center gap-2 mb-6">
              <Heart className="w-5 h-5 text-white/90" />
              <span className="text-white/90 uppercase tracking-wider text-sm font-semibold">
                Prêt à commencer ?
              </span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Découvrez Ma Méthode Dès Aujourd'hui
            </h2>
            
            <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-3xl mx-auto mb-8">
              Transformez votre vie avec une approche holistique unique qui allie Pilates, nutrition 
              et bien-être. Rejoignez-moi dans cette aventure vers votre meilleure version de vous-même.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                href="/souscriptions/personnalise"
                variant="white"
                size="lg"
                className="group shadow-xl"
              >
                Choisir un abonnement
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                href="/contact"
                variant="outline"
                size="lg"
                className="border-2 border-white/30 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
              >
                Me contacter
              </Button>
            </div>
            
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>Méthode personnalisée</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span>Accompagnement dédié</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Résultats garantis</span>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}

