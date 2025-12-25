import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, ArrowRight, Sparkles, Heart, Target, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import Gallery from '@/components/Gallery'
import S3Image from '@/components/S3Image'
import PageHeader from '@/components/layout/PageHeader'

export const metadata: Metadata = {
  title: 'À propos - Marie-Line Pilates',
  description: 'Découvrez Marie-Line Bouley, votre coach sportif avec plus de 30 ans d\'expérience en fitness, Pilates, nutrition et bien-être holistique',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <PageHeader
        imageS3Key="Photos/Training/ok (8).JPG"
        title="À propos"
        subtitle="Découvrez Marie-Line Bouley, votre coach sportif avec plus de 30 ans d'expérience en fitness, Pilates, nutrition et bien-être holistique"
        height="fullScreen"
      />
      <Section 
        gradient="soft"
      >
        {/* Header Section */}
        <div className="text-center mb-16">
          <p className="text-accent-500 uppercase tracking-wider text-sm font-semibold mb-4">
            RENCONTREZ LA COACH
          </p>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-8">
            Marie-Line Bouley
          </h1>
          {/* Portrait Photo */}
          <div className="flex justify-center mb-8">
            <div className="relative w-64 h-64 rounded-full overflow-hidden shadow-xl border-4 border-white dark:border-gray-800">
              <Image
                src="/about/marie-line-portrait.jpg"
                alt="Marie-Line Bouley, coach sportif"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>

        {/* Qualifications */}
        <div className="bg-gradient-to-br from-white dark:from-gray-800 to-accent-50/30 dark:to-accent-900/20 rounded-2xl shadow-xl p-8 mb-12 border border-accent-100/50 dark:border-accent-800/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-accent-500/10 rounded-lg">
              <Sparkles className="w-6 h-6 text-accent-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mes Qualifications</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'Pilates instructeur',
              'Nutrition-sport et performance',
              'Golf physio trainer',
              'Neuro psycho nutrition',
              'Brain gym'
            ].map((qualification, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/60 dark:bg-gray-700/60 hover:bg-white dark:hover:bg-gray-700 transition-colors">
                <div className="w-2 h-2 rounded-full bg-accent-500 flex-shrink-0"></div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">{qualification}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8 mb-12">
          {/* Introduction */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-shadow duration-300">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-100 rounded-full mb-4">
                <BookOpen className="w-4 h-4 text-accent-600" />
                <span className="text-sm font-semibold text-accent-600">Mon parcours et expérience</span>
              </div>
            </div>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Je m'appelle Marie-Line et je suis coach sportif indépendante depuis plus de 15 ans, 
              avec une expérience de 30 ans dans le domaine de la forme et du fitness.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Depuis l'âge de 12 ans, je suis une passionnée de sport, d'anatomie et de spiritualité. 
              Tout a commencé lorsque j'ai été sélectionnée en équipe de Bourgogne en tant que joueuse 
              de basketball à l'âge de 13 ans. Cette expérience m'a aidée à découvrir la discipline, 
              la détermination et l'envie de devenir coach sportif. J'ai d'ailleurs passé un BAFA en 
              jeu physique et sport à cet âge-là !
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              À 15 ans, les portes du CREPS de Dijon en sport-étude se sont ouvertes pour moi. 
              Cependant, en raison des problèmes financiers de mes parents, j'ai dû renoncer à cette 
              opportunité et j'ai arrêté la compétition et le sport. Déçue et contrariée, cette pause 
              a engendré une prise de poids de 10 kg.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              J'essayai tout ce qui était proposé dans les magasins, régime Atkin, mayo, etc... 
              Je perdais du poids et je reprenais tout en quelques mois, voire plus ! C'est alors que 
              j'ai commencé à m'intéresser à l'alimentation, à l'exercice physique mais aussi à la 
              spiritualité qui m'a beaucoup aidée. C'est ainsi que je suis devenue végétarienne, par 
              respect et sensibilité pour les animaux.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Cette période de remise en question m'a fait prendre conscience à quel point l'exercice 
              physique et la spiritualité étaient des remèdes qui m'ont permis de sortir d'un contexte 
              familial très difficile. Je n'avais pas encore retrouvé mon poids de forme mais je me 
              sentais beaucoup mieux physiquement mais aussi mentalement.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              À l'âge de 19 ans, j'ai décidé de quitter la maison pour le Valais et j'ai commencé par 
              travailler en station.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              À 24 ans, ma vie a pris un tournant décisif lorsque j'ai pu m'inscrire dans une salle 
              de fitness et financer mes premières formations en tant que coach de fitness. La pratique 
              régulière de l'activité physique et mon alimentation équilibrée m'ont permis de perdre les 
              quelques kilos qui me restaient et depuis je n'ai plus repris un kilo.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Convaincue de mon choix professionnel, j'ai enchaîné naturellement avec d'autres formations 
              telles que : Instructeur fitness en groupe collectif, Instructeur de fitness, Personal trainer.
            </p>
          </div>

          {/* Career Peak */}
          <div className="bg-gradient-to-r from-accent-50 dark:from-accent-900/20 to-white dark:to-gray-800 rounded-2xl shadow-xl p-8 md:p-10 border-l-4 border-accent-500">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-accent-500/10 rounded-lg flex-shrink-0">
                <Target className="w-6 h-6 text-accent-500" />
              </div>
              <div>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-2 font-medium">
                  En 1996, j'ai atteint le sommet de ma carrière en devenant présentatrice pour les congrès 
                  de fitness et j'ai été nommée <span className="text-accent-600 font-bold">fitness instructeur de l'année</span>, le fruit d'un long travail.
                </p>
              </div>
            </div>
          </div>

          {/* Philosophy */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100 dark:border-gray-700">
            <div className="grid md:grid-cols-2 gap-8 items-center mb-8">
              <div>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-100 rounded-full mb-4">
                    <Heart className="w-4 h-4 text-accent-600" />
                    <span className="text-sm font-semibold text-accent-600">Approche Holistique</span>
                  </div>
                </div>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  Aujourd'hui, je peux affirmer que j'aime aider les gens à atteindre la santé, le bien-être 
                  et leurs objectifs. Je m'engage à aborder mon travail de manière holistique grâce à mes 
                  <span className="font-semibold text-accent-600"> 30 années de méditation du Raja Yoga</span> et de transformation personnelle.
                </p>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  La clé de ma motivation est de travailler en conscience et avec respect envers chaque personne. 
                  Ce que j'aime beaucoup dans ma méthode de travail est que je me concentre sur les muscles 
                  profonds en utilisant la technique proprioceptive. Par ailleurs, je m'engage également à rester 
                  à la pointe des dernières recherches en matière de fitness et de nutrition afin d'obtenir les 
                  meilleurs résultats possibles pour mes clients.
                </p>
              </div>
              <div className="relative w-full h-80 rounded-2xl overflow-hidden shadow-xl group">
                <S3Image
                  s3Key="Photos/Training/THIERRY DOS SUR BALLON.png"
                  alt="Marie-Line en action de coaching"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  fallbackSrc="/about/coaching-1.jpg"
                />
              </div>
            </div>
            
            {/* Additional coaching images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="relative w-full h-64 rounded-2xl overflow-hidden shadow-lg group">
                <Image
                  src="/about/coaching-4.jpg"
                  alt="Séance de coaching personnalisée"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="relative w-full h-64 rounded-2xl overflow-hidden shadow-lg group">
                <S3Image
                  s3Key="Photos/Training/vlcsnap-2025-11-03-13h14m30s098.png"
                  alt="Marie-Line coachant ses clients"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  fallbackSrc="/about/coaching-3.jpg"
                />
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="relative bg-gradient-to-br from-accent-500 via-accent-600 to-burgundy-600 rounded-2xl shadow-2xl p-10 md:p-12 mb-12 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center gap-2 mb-6">
                <Heart className="w-5 h-5 text-white/90" />
                <span className="text-white/90 uppercase tracking-wider text-sm font-semibold">
                  Rejoignez l'aventure
                </span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Transformez Votre Vie Dès Aujourd'hui
              </h2>
              
              <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-3xl mx-auto mb-8">
                Rejoignez-moi dans cette aventure pour atteindre votre plein potentiel physique, mental et 
                spirituel. Ensemble, nous pouvons créer un duo soudé et engagé dans le bien-être global. 
                Faisons de votre bonheur notre priorité absolue.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  href="/methode"
                  variant="white"
                  size="lg"
                  className="group shadow-xl"
                >
                  Découvrir ma méthode
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
              
              <div className="mt-8 flex flex-wrap justify-center gap-6 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span>Programmes personnalisés</span>
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

          {/* Gratitude Section */}
          <div className="bg-gradient-to-br from-gray-50 dark:from-gray-800 to-white dark:to-gray-700 rounded-2xl shadow-xl p-8 md:p-10 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-accent-500/10 rounded-lg flex-shrink-0">
                <Heart className="w-6 h-6 text-accent-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Reconnaissance Professionnelle</h3>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  Je tiens à exprimer ma profonde gratitude envers <span className="font-semibold text-accent-600">IFAS International</span>, une école de formation 
                  professionnelle qui m'a offert l'opportunité d'y être formée, mais également d'y exercer en 
                  tant que formatrice et présentatrice nationale lors de leur congrès à Morges. C'est avec fierté 
                  que j'ai reçu le titre de <span className="font-semibold text-accent-600">meilleur instructeur fitness de l'année</span>, un témoignage de l'engagement 
                  et du professionnalisme que nous partageons.
                </p>
              </div>
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
          
          <Gallery
            localImages={[
              '/about/coaching-6.jpg',
              '/about/coaching-7.jpg',
              '/about/coaching-8.jpg',
              '/about/coaching-9.jpg',
              '/about/coaching-10.jpg',
              '/about/coaching-11.jpg',
              '/about/coaching-12.jpg',
              '/about/coaching-13.jpg',
              '/about/coaching-14.jpg',
              '/about/coaching-15.jpg',
              '/about/coaching-16.jpg',
            ]}
          />
        </div>

        {/* Where to Find Me Section */}
        <div className="bg-gradient-to-br from-white dark:from-gray-800 to-accent-50/30 dark:to-accent-900/20 rounded-2xl shadow-xl p-8 md:p-10 mb-12 border border-accent-100/50 dark:border-accent-800/50">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-100 rounded-full mb-4">
              <MapPin className="w-4 h-4 text-accent-600" />
              <span className="text-sm font-semibold text-accent-600 uppercase tracking-wide">Locations</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Où Me Retrouver
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              En plus de votre domicile, vous pourrez également me trouver à :
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-8">
            {['Conthey', 'Sion', 'Martigny'].map((city, index) => (
              <div 
                key={index}
                className="text-center p-8 rounded-2xl bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border-2 border-accent-100/50 dark:border-accent-800/50 hover:border-accent-300 dark:hover:border-accent-600 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-500/10 rounded-full mb-4 group-hover:bg-accent-500/20 transition-colors">
                  <MapPin className="w-8 h-8 text-accent-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-accent-600 transition-colors">{city}</h3>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </div>
  )
}

