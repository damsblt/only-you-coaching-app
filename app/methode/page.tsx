'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowRight, Heart, Sparkles, Target, BookOpen, HelpCircle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import PageHeader from '@/components/layout/PageHeader'

// Dynamic import pour la galerie (chargement d'images S3)
const Gallery = dynamic(() => import('@/components/Gallery'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="w-full h-48 rounded-2xl bg-gray-200 animate-pulse" />
      ))}
    </div>
  ),
})

interface FAQItem {
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    question: "Quels Résultats Les Clients Ont-ils Obtenus ?",
    answer: "Vivre un mode de vie sain est un engagement à long terme qui continuera à vous récompenser avec des résultats. Les clients ont atteint un large éventail d'objectifs de santé et de remise en forme en travaillant avec moi, notamment se sentir énergisé et moins fatigué ; se sentir plus confiant, plus à l'aise dans leurs vêtements et d'élargir leur savoir-faire en matière de santé et de remise en forme. Voici quelques résultats clients récents : \"J'apprends à ne plus me priver, à retrouver joie et plaisir dans la nourriture ainsi que dans le mouvement ! En plus d'avoir enfin réussi à changer ma morphologie en perdant ma graisse, je vais maintenant régulièrement au fitness, j'adore m'entraîner et, honnêtement, j'ai changé ma perception de ce dont je suis capable.\" \"Je me sens fort et TOUS mes maux et douleurs ont disparu. Fini les genoux et le dos endoloris. Vraiment génial. Je n'abandonnerai jamais l'entraînement en proprioception qui allie efficacité et challenge !\" \"La façon dont je ressens mon corps a considérablement changé. Je me sens plus confiant, j'ai plus d'énergie et je me sens plus fort.\""
  },
  {
    question: "Quelle Methode Est Utilisée Dans Un Programme Perte De Poids ?",
    answer: "Ma méthode repose sur une approche holistique unique qui combine plus de 30 ans d'expérience en fitness, Pilates, nutrition et bien-être. Je m'engage à travailler avec chaque personne de manière consciente et respectueuse, en me concentrant sur les muscles profonds grâce à la technique proprioceptive. Mon approche intègre trois piliers fondamentaux : le renforcement musculaire profond, l'alimentation équilibrée et le bien-être mental. Cette compréhension profonde me permet de créer des programmes véritablement personnalisés qui s'adaptent à vos besoins spécifiques. Grâce à mes 30 années de méditation du Raja Yoga et de transformation personnelle, j'aborde mon travail de manière holistique. Spécialisée dans le renforcement des chaînes musculaires profondes, je crois fermement en l'efficacité de cette méthode, soutenue par des recherches médicales qui prouvent leurs bienfaits pour le corps et l'esprit. En intégrant des exercices proprioceptifs, mes clients ont perdu en moyenne deux fois plus de poids que ceux suivant des programmes traditionnels, tout en améliorant leur force, flexibilité et équilibre. J'ai également créé des audios de coaching mental pour renforcer l'image de soi et des audios de développement personnel. L'importance d'une alimentation saine et équilibrée est également essentielle pour optimiser les résultats."
  },
  {
    question: "Je Suis Novice Dans Le Domaine Du Fitness, Cela Fonctionnera-t-il Pour Moi ?",
    answer: "Oui ! J'accompagne une variété de clients, de tous âges et de tous horizons, qui ont débuté leur parcours en matière d'exercice et de nutrition. Après tout, nous avons tous été novices à un moment donné, n'est-ce pas ? Pour maximiser vos résultats, je vous recommande vivement d'opter pour un suivi à domicile. Cela vous permettra de bénéficier d'une correction précise de votre posture et de votre technique tout au long de votre programme. Ensemble, nous veillerons à ce que chaque mouvement soit juste et efficace !"
  },
  {
    question: "Dois-je acheter du matériel ?",
    answer: "Si vous allez vous entraîner principalement à la maison, vous devrez peut-être acheter quelques équipements (je vous aiderais à choisir). Un ensemble de bandes de résistance à 10 CHF, un ballon et quelques haltères, seront un excellent point de départ. Si vous vous entraînez dans une salle de fitness ou un centre de sport, vous n'aurez pas besoin d'équipement supplémentaire."
  },
  {
    question: "A Qui Ce Coaching n'Est \"Pas\" Destiné ?",
    answer: "Mon coaching n'est pas pour vous si : vous recherchez une solution de santé et de remise en forme rapide, ou si vous n'êtes pas prêt à faire le travail nécessaire pour atteindre vos objectifs. Beaucoup de gens veulent des résultats rapides lorsqu'il s'agit de perdre du poids, ce qui peut les amener à prendre des mesures extrêmes telles que faire des heures de cardio tous les jours ou manger très peu de calories. Ces pratiques peuvent certes entraîner une perte de poids rapide à court terme, mais le problème est qu'elles ne sont pas viables à long terme. Les études ont montré que la grande majorité des personnes qui ont recours à de telles stratégies finissent par reprendre tout le poids qu'elles ont perdu, et finissent souvent par être encore plus lourdes qu'au début. Pour perdre du poids de manière saine et durable, vous devriez viser un taux modéré de perte de poids, entre 0,5% et 1% du poids corporel total par semaine."
  },
  {
    question: "Est-Il Possible d'Essayer La Méthode Avant De Prendre Un Abonnement ?",
    answer: "Oui ! Vous pouvez essayer gratuitement 1 vidéo / groupe musculaire. Retrouvez toutes les vidéos sur la page d'essaie gratuit."
  },
  {
    question: "Quelle Est La Prochaine Etape Pour Travailler Ensemble ?",
    answer: "Une seule conversation pourrait-elle changer votre vie ? Découvrez-le en prenant rendez-vous avec moi pour une consultation gratuite. Je vous aiderai à vous décider sur le choix de votre programme. Vous pouvez également remplir mon formulaire et je vous contacterai sous peu et cela sans aucune obligation d'engagement."
  },
  {
    question: "Quels Sont Les Bénéfices D'un Coaching En Ligne ?",
    answer: "Vous obtiendrez un programme d'entraînement personnalisé créé spécifiquement pour vous et vos objectifs. Je travaillerai avec les ressources dont vous disposez déjà (matériel), y compris votre propre maison, votre salle de sport. Vous bénéficierez également d'un suivi nutritionnel où vous apporterez des petits changements - mais puissants - au fil des semaines. Ajoutez à cela vous aurez la possibilité de visionner vos exercices grâce à une bibliothèque mise à disposition sous forme de vidéo. Vous bénéficierez également des avantages suivants : votre propre entraîneur personnel, un soutien individuel continu, un plan d'entraînement et nutritionnel personnalisé à suivre, une assistance SMS et mail illimitée pour répondre à vos questions, appel vidéo sur WhatsApp, Telegram ou Zoom avec votre coach pour une résolution plus approfondie des problèmes ou de la définition d'objectifs."
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
      <PageHeader
        imageS3Key="Photos/Training/ok (3).JPG"
        title="Ma méthode"
        subtitle="Only You Coaching – une approche holistique sur mesure alliant exercice physique, nutrition et travail mental pour transformer durablement le corps et l'esprit"
        height="fullScreen"
      />
      <Section 
        gradient="soft"
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

        {/* Gallery Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-10 mb-12 border border-gray-100 dark:border-gray-700">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-100 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-accent-600" />
              <span className="text-sm font-semibold text-accent-600 uppercase tracking-wide">Galerie</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              En Action
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Quelques moments capturés lors de mes séances de coaching personnalisées
            </p>
          </div>
          
          <Gallery />
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

