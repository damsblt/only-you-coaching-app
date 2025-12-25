import Link from "next/link"
import { 
  Play, 
  Users, 
  Star, 
  ArrowRight,
  Video,
  Music,
  CheckCircle,
  Building2,
  Heart,
  Target,
  Dumbbell,
  Sparkles,
  Award,
  UserCheck,
  Activity,
  TrendingDown,
  Trophy,
  Circle
} from "lucide-react"
import VideoPreviewButton from "../components/VideoPreviewButton"
import { Button } from "@/components/ui/Button"
import Testimonials from "@/components/Testimonials"
import PartnersCarousel from "@/components/PartnersCarousel"

// Vidéo sélectionnée pour la page d'accueil (depuis S3 AWS)
const featuredVideo = {
  id: "27367524-7afb-450b-ac77-06c7ce1eca27",
  title: "1 fente avant fente arrière poids du corps",
  description: "Exercice de fente au poids du corps pour renforcer les jambes et les fessiers",
  thumbnail: "https://only-you-coaching.s3.eu-north-1.amazonaws.com/thumbnails/1-fente-avant-fente-arrière-poids-du-corps-thumb.jpg",
  videoUrl: "https://only-you-coaching.s3.eu-north-1.amazonaws.com/Video/groupes-musculaires/fessiers-jambes/1-fente-avant-fente-arrière-poids-du-corps-mp4",
  duration: 120,
  difficulty: "INTERMEDIATE",
  category: "Fessiers et jambes",
  region: "fessiers-jambes",
  muscleGroups: ["Fessiers", "Quadriceps", "Ischio-jambiers"],
  startingPosition: "Debout, pieds écartés largeur des épaules",
  movement: "Effectuer une fente avant puis une fente arrière en alternant les jambes",
  intensity: "Intermédiaire",
  theme: "Fente",
  series: "3x12 répétitions par jambe",
  constraints: "Aucune",
  tags: ["fente", "poids du corps", "jambes", "fessiers"],
  isPublished: true
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Hero Section */}
      <section className="relative bg-hero-gradient dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-700 pt-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <p className="text-accent-500 dark:text-accent-400 uppercase tracking-wider text-sm font-semibold">
                  ENTRAINEMENT SPORTIF PERSONNALISÉ
                </p>
                <h1 className="text-4xl md:text-6xl font-bold text-black dark:text-white leading-tight">
                  Un Coach, Une Passion : Faire De Votre Remise En Forme Un Succès !
                </h1>
                <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl">
                  Transformez votre corps et votre esprit grâce à des cours de Pilates personnalisés, 
                  des méditations guidées et un accompagnement professionnel.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <Link
                  href="/souscriptions/personnalise"
                  className="curved-button inline-flex items-center justify-center px-8 py-4 bg-footer-500 text-white font-semibold shadow-organic hover:shadow-floating transition-all transform hover:scale-105 hover:bg-footer-600"
                >
                  JE VEUX UN ABONNEMENT !
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center curved-card bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 border border-secondary-200 dark:border-gray-600">
                  <Users className="w-5 h-5 text-accent-500 dark:text-accent-400 mr-2" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">500+ élèves</span>
                </div>
                <div className="flex items-center curved-card bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 border border-secondary-200 dark:border-gray-600">
                  <Star className="w-5 h-5 text-accent-500 dark:text-accent-400 mr-2" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">4.9/5 étoiles</span>
                </div>
                <div className="flex items-center curved-card bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 border border-secondary-200 dark:border-gray-600">
                  <Video className="w-5 h-5 text-accent-500 dark:text-accent-400 mr-2" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">100+ vidéos</span>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Circular video preview container */}
              <div className="relative w-full aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-secondary-200 to-accent-200 shadow-organic"></div>
                <div className="relative w-full h-full rounded-full overflow-hidden border-8 border-white/50 shadow-floating">
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary-100 to-accent-100">
                    <div className="w-full h-full rounded-full overflow-hidden">
                      {/* Vidéo statique sans lecteur - extrait à 30 secondes */}
                      <video
                        src={`${featuredVideo.videoUrl}#t=30`}
                        poster={featuredVideo.thumbnail}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover rounded-full"
                        preload="metadata"
                        style={{ 
                          objectPosition: 'center',
                          filter: 'brightness(1.1) contrast(1.05)'
                        }}
                      >
                        Votre navigateur ne supporte pas la lecture vidéo.
                      </video>
                      
                      {/* Overlay avec bouton play pour ouvrir le lecteur complet */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                        <VideoPreviewButton videoId={featuredVideo.id} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave divider at bottom */}
        <div className="wave-divider-bottom"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-800 relative overflow-hidden transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <p className="text-accent-500 dark:text-accent-400 uppercase tracking-wider text-sm font-semibold mb-4">
              UNE APPROCHE UNIQUE
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4">
              Pourquoi Only You Coaching ?
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mt-6">
              3 raisons pour découvrir une nouvelle manière de faire du sport :
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 curved-card bg-white dark:bg-gray-700 border-2 border-secondary-100 dark:border-gray-600 hover:shadow-organic transition-all group">
              <div className="w-20 h-20 border-2 border-accent-500 dark:border-accent-400 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Award className="w-10 h-10 text-accent-500 dark:text-accent-400" />
              </div>
              <h3 className="text-xl font-semibold text-black dark:text-white mb-4">Certification<br />Qualitop</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                Grâce à ce label vous bénéficiez d&apos;un <strong>remboursement partiel</strong> auprès de vos 
                caisses maladies complémentaires. Ce label est également la garantie d&apos;un 
                accompagnement de qualité.
              </p>
            </div>

            <div className="text-center p-8 curved-card bg-white dark:bg-gray-700 border-2 border-secondary-100 dark:border-gray-600 hover:shadow-organic transition-all group">
              <div className="w-20 h-20 border-2 border-accent-500 dark:border-accent-400 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Heart className="w-10 h-10 text-accent-500 dark:text-accent-400" />
              </div>
              <h3 className="text-xl font-semibold text-black dark:text-white mb-4">Approche<br />Holistique</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                Ma méthode d&apos;entraînement se distingue par l&apos;association de <strong>renforcement musculaire</strong> profond, 
                d&apos;une <strong>nutrition</strong> adaptée à chacun, et une <strong>mise en priorité de l&apos;être humain 
                et ses besoins</strong>.
              </p>
            </div>

            <div className="text-center p-8 curved-card bg-white dark:bg-gray-700 border-2 border-secondary-100 dark:border-gray-600 hover:shadow-organic transition-all group">
              <div className="w-20 h-20 border-2 border-accent-500 dark:border-accent-400 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <UserCheck className="w-10 h-10 text-accent-500 dark:text-accent-400" />
              </div>
              <h3 className="text-xl font-semibold text-black dark:text-white mb-4">Programmes<br />Personnalisés</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                Chaque client reçoit une attention particulière avec des <strong>programmes sur mesure</strong>. 
                En fonction de votre objectif, j&apos;adapte mes méthodes à vos besoins spécifiques pour 
                des résultats durables.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />

      {/* Partners Carousel Section */}
      <PartnersCarousel />

      {/* Programmes Section */}
      <section className="py-20 bg-hero-gradient dark:bg-gray-900 relative overflow-hidden transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <p className="text-accent-500 dark:text-accent-400 uppercase tracking-wider text-sm font-semibold mb-4">
              JE RÉSERVE MON COACHING !
            </p>
            <p className="text-accent-500 dark:text-accent-400 uppercase tracking-wider text-sm font-semibold mb-4">
              DÉCOUVREZ MES
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4">
              Programmes Adaptés À Tous !
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mt-6">
              Que vous ayez un niveau avancé ou débutant, mes programmes s&apos;adaptent à vous (et non l&apos;inverse !)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Programme 1: Remise En Forme */}
            <div className="curved-card bg-white dark:bg-gray-700 p-8 hover:shadow-organic transition-all transform hover:scale-105 border-2 border-secondary-100 dark:border-gray-600">
              <div className="w-16 h-16 border-2 border-accent-500 dark:border-accent-400 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Activity className="w-8 h-8 text-accent-500 dark:text-accent-400" />
              </div>
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-black dark:text-white mb-2">Remise En Forme</h3>
                <p className="text-sm text-accent-500 dark:text-accent-400 font-semibold uppercase mb-4">
                  EN LIGNE & ACCOMPAGNÉ
                </p>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-6 text-center">
                Programme d&apos;entraînement associant renforcement musculaire et cardio-vasculaire.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <ArrowRight className="w-4 h-4 text-accent-500 dark:text-accent-400 mr-2 mt-1 flex-shrink-0" />
                  <span>EXERCICES FONCTIONNELS & PERSONNALISÉS</span>
                </li>
                <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <ArrowRight className="w-4 h-4 text-accent-500 dark:text-accent-400 mr-2 mt-1 flex-shrink-0" />
                  <span>RENFORCEMENT DES MUSCLES PROFONDS</span>
                </li>
              </ul>
              <Link
                href="/programmes"
                className="block text-center text-accent-500 dark:text-accent-400 font-semibold hover:underline"
              >
                EN SAVOIR PLUS
              </Link>
            </div>

            {/* Programme 2: Perte De Poids */}
            <div className="curved-card bg-white dark:bg-gray-700 p-8 hover:shadow-organic transition-all transform hover:scale-105 border-2 border-secondary-100 dark:border-gray-600">
              <div className="w-16 h-16 border-2 border-accent-500 dark:border-accent-400 rounded-full flex items-center justify-center mb-6 mx-auto">
                <TrendingDown className="w-8 h-8 text-accent-500 dark:text-accent-400" />
              </div>
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-black dark:text-white mb-2">Perte De Poids</h3>
                <p className="text-sm text-accent-500 dark:text-accent-400 font-semibold uppercase mb-4">
                  EN LIGNE & ACCOMPAGNÉ
                </p>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-6 text-center">
                Programme d&apos;entraînement efficace et accessible à tous visant à faire augmenter la combustion des graisses.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <ArrowRight className="w-4 h-4 text-accent-500 dark:text-accent-400 mr-2 mt-1 flex-shrink-0" />
                  <span>SUIVI ALIMENTAIRE ADAPTÉ</span>
                </li>
                <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <ArrowRight className="w-4 h-4 text-accent-500 dark:text-accent-400 mr-2 mt-1 flex-shrink-0" />
                  <span>EXERCICES FONCTIONNELS</span>
                </li>
                <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <ArrowRight className="w-4 h-4 text-accent-500 dark:text-accent-400 mr-2 mt-1 flex-shrink-0" />
                  <span>ADAPTÉ AUX BESOINS DE CHACUN</span>
                </li>
              </ul>
              <Link
                href="/programmes"
                className="block text-center text-accent-500 dark:text-accent-400 font-semibold hover:underline"
              >
                EN SAVOIR PLUS
              </Link>
            </div>

            {/* Programme 3: Spécifiques Sportifs */}
            <div className="curved-card bg-white dark:bg-gray-700 p-8 hover:shadow-organic transition-all transform hover:scale-105 border-2 border-secondary-100 dark:border-gray-600">
              <div className="w-16 h-16 border-2 border-accent-500 dark:border-accent-400 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Trophy className="w-8 h-8 text-accent-500 dark:text-accent-400" />
              </div>
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-black dark:text-white mb-2">Spécifiques Sportifs</h3>
                <p className="text-sm text-accent-500 dark:text-accent-400 font-semibold uppercase mb-4">
                  EN PRÉSENTIEL
                </p>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-6 text-center">
                Programmes de renforcement musculaire adaptés à la biomécanique du mouvement de chaque sport.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <ArrowRight className="w-4 h-4 text-accent-500 dark:text-accent-400 mr-2 mt-1 flex-shrink-0" />
                  <span>TRAVAIL HORS MACHINE</span>
                </li>
                <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <ArrowRight className="w-4 h-4 text-accent-500 dark:text-accent-400 mr-2 mt-1 flex-shrink-0" />
                  <span>TRAVAIL SUR L&apos;ENDURANCE MUSCULAIRE ET LA PROPRIOCEPTION</span>
                </li>
                <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <ArrowRight className="w-4 h-4 text-accent-500 dark:text-accent-400 mr-2 mt-1 flex-shrink-0" />
                  <span>CIRCUITS TRAINING INTENSES ET EFFICACES</span>
                </li>
                <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <ArrowRight className="w-4 h-4 text-accent-500 dark:text-accent-400 mr-2 mt-1 flex-shrink-0" />
                  <span>ADAPTÉ POUR TOUS NIVEAUX</span>
                </li>
              </ul>
              <Link
                href="/programmes"
                className="block text-center text-accent-500 dark:text-accent-400 font-semibold hover:underline"
              >
                EN SAVOIR PLUS
              </Link>
            </div>

            {/* Pilates */}
            <div className="curved-card bg-white dark:bg-gray-700 p-8 hover:shadow-organic transition-all transform hover:scale-105 border-2 border-secondary-100 dark:border-gray-600">
              <div className="w-16 h-16 border-2 border-accent-500 dark:border-accent-400 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Circle className="w-8 h-8 text-accent-500 dark:text-accent-400" />
              </div>
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-black dark:text-white mb-2">Pilates</h3>
                <p className="text-sm text-accent-500 dark:text-accent-400 font-semibold uppercase mb-4">
                  EN PRÉSENTIEL
                </p>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-6 text-center">
                Méthode douce visant à renforcer le corps et principalement la sangle abdominale.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <ArrowRight className="w-4 h-4 text-accent-500 dark:text-accent-400 mr-2 mt-1 flex-shrink-0" />
                  <span>AMÉLIORATION DE VOTRE POSTURE</span>
                </li>
                <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <ArrowRight className="w-4 h-4 text-accent-500 dark:text-accent-400 mr-2 mt-1 flex-shrink-0" />
                  <span>TRAVAIL DE LA SOUPLESSE</span>
                </li>
                <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <ArrowRight className="w-4 h-4 text-accent-500 dark:text-accent-400 mr-2 mt-1 flex-shrink-0" />
                  <span>RENFORCEMENT DES MUSCLES PROFONDS</span>
                </li>
              </ul>
              <Link
                href="/programmes"
                className="block text-center text-accent-500 dark:text-accent-400 font-semibold hover:underline"
              >
                EN SAVOIR PLUS
              </Link>
            </div>

            {/* Golf */}
            <div className="curved-card bg-white dark:bg-gray-700 p-8 hover:shadow-organic transition-all transform hover:scale-105 border-2 border-secondary-100 dark:border-gray-600">
              <div className="w-16 h-16 border-2 border-accent-500 dark:border-accent-400 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Target className="w-8 h-8 text-accent-500 dark:text-accent-400" />
              </div>
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-black dark:text-white mb-2">Golf</h3>
                <p className="text-sm text-accent-500 dark:text-accent-400 font-semibold uppercase mb-4">
                  EN PRÉSENTIEL
                </p>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-6 text-center">
                Entraînement qui apporte des solutions aux problèmes liés à la pratique du golf.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <ArrowRight className="w-4 h-4 text-accent-500 dark:text-accent-400 mr-2 mt-1 flex-shrink-0" />
                  <span>TRAVAIL SUR LE TRANSFÈRE DE POIDS, LA POSTURE ET LA STABILITÉ</span>
                </li>
                <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <ArrowRight className="w-4 h-4 text-accent-500 dark:text-accent-400 mr-2 mt-1 flex-shrink-0" />
                  <span>AMÉLIORATION DE L&apos;ÉQUILIBRE ET DE LA CONCENTRATION</span>
                </li>
                <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <ArrowRight className="w-4 h-4 text-accent-500 dark:text-accent-400 mr-2 mt-1 flex-shrink-0" />
                  <span>MOBILISATION ARTICULAIRE</span>
                </li>
                <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <ArrowRight className="w-4 h-4 text-accent-500 dark:text-accent-400 mr-2 mt-1 flex-shrink-0" />
                  <span>ADAPTÉ POUR TOUS NIVEAUX</span>
                </li>
              </ul>
              <Link
                href="/programmes"
                className="block text-center text-accent-500 dark:text-accent-400 font-semibold hover:underline"
              >
                EN SAVOIR PLUS
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Section */}
      <section className="py-20 bg-white dark:bg-gray-800 relative overflow-hidden transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="w-20 h-20 border-2 border-accent-500 dark:border-accent-400 rounded-full flex items-center justify-center mb-6">
                <Building2 className="w-10 h-10 text-accent-500 dark:text-accent-400" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-6">
                Coaching sportif en entreprise
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                Investissez dans le capital humain de votre entreprise en offrant un accompagnement sportif personnalisé à vos collaborateurs. Un programme de coaching en entreprise adapté permet d&apos;améliorer le bien-être au travail, de réduire l&apos;absentéisme et d&apos;augmenter la productivité de vos équipes.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                Nos programmes sur mesure s&apos;intègrent facilement à votre organisation et s&apos;adaptent aux contraintes de votre secteur d&apos;activité.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-footer-500 text-white font-semibold shadow-organic hover:shadow-floating transition-all transform hover:scale-105 curved-button hover:bg-footer-600"
              >
                Nous contacter
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
            <div className="order-1 md:order-2">
              <div className="curved-card bg-hero-gradient dark:bg-gray-700 p-8 border-2 border-secondary-100 dark:border-gray-600">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-accent-500 dark:text-accent-400 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-black dark:text-white mb-1">Bien-être au travail</h3>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">Amélioration de la santé physique et mentale de vos collaborateurs</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-accent-500 dark:text-accent-400 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-black dark:text-white mb-1">Réduction de l&apos;absentéisme</h3>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">Des équipes plus en forme et plus présentes</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-accent-500 dark:text-accent-400 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-black dark:text-white mb-1">Augmentation de la productivité</h3>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">Performance accrue grâce à une meilleure condition physique</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-accent-500 dark:text-accent-400 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-black dark:text-white mb-1">Programmes sur mesure</h3>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">Adaptation à vos contraintes et à votre secteur d&apos;activité</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simplified Pricing Section */}
      <section className="py-20 bg-hero-gradient dark:bg-gray-900 relative overflow-hidden transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <p className="text-accent-500 dark:text-accent-400 uppercase tracking-wider text-sm font-semibold mb-4">
              TARIFS
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4">
              Une Offre Pour Chacun !
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              Votre abonnement est pour une durée déterminée, indiquée lors de la souscription, et ne peut pas être résilié avant son terme. Vous serez prélevé du coût de l&apos;abonnement mensuellement jusqu&apos;à son expiration, date à laquelle il sera automatiquement résilié.
            </p>
          </div>

          {/* Two CTA Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Présentiel CTA */}
            <Link
              href="/subscriptions/personnalise"
              className="curved-card bg-white dark:bg-gray-800 p-8 hover:shadow-organic transition-all transform hover:scale-105 border-2 border-secondary-200 dark:border-gray-600 text-center group"
            >
              <div className="w-20 h-20 border-2 border-accent-500 dark:border-accent-400 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-10 h-10 text-accent-500 dark:text-accent-400" />
              </div>
              <h3 className="text-2xl font-bold text-black dark:text-white mb-4">
                Mon Coaching Personnalisé En Présentiel
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Accompagnement personnalisé avec appels de coaching et programmes sur mesure
              </p>
              <div className="inline-flex items-center text-accent-500 dark:text-accent-400 font-semibold group-hover:translate-x-2 transition-transform">
                Découvrir les offres
                <ArrowRight className="ml-2 w-5 h-5" />
              </div>
            </Link>

            {/* Online CTA */}
            <Link
              href="/souscriptions/autonomie"
              className="curved-card bg-white dark:bg-gray-800 p-8 hover:shadow-organic transition-all transform hover:scale-105 border-2 border-secondary-200 dark:border-gray-600 text-center group"
            >
              <div className="w-20 h-20 border-2 border-accent-500 dark:border-accent-400 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Video className="w-10 h-10 text-accent-500 dark:text-accent-400" />
              </div>
              <h3 className="text-2xl font-bold text-black dark:text-white mb-4">
                Abonnements Online
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Autonomie totale avec accès à toute la bibliothèque de contenus
              </p>
              <div className="inline-flex items-center text-accent-500 dark:text-accent-400 font-semibold group-hover:translate-x-2 transition-transform">
                Découvrir les offres
                <ArrowRight className="ml-2 w-5 h-5" />
              </div>
            </Link>
          </div>

          {/* Help CTA */}
          <div className="text-center">
            <Link
              href="/contact"
              className="inline-flex items-center text-accent-500 dark:text-accent-400 font-semibold hover:underline"
            >
              J&apos;AI BESOIN D&apos;AIDE POUR CHOISIR MON COACHING !
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-br from-accent-500 via-accent-600 to-burgundy-600 rounded-2xl shadow-2xl p-10 md:p-12 mb-12 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Prêt à transformer votre vie ?
              </h2>
              
              <p className="text-xl text-white/90 mb-8">
                Rejoignez des milliers de personnes qui ont déjà découvert les bienfaits du Pilates.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  href="/souscriptions/personnalise"
                  variant="white"
                  size="lg"
                  className="group shadow-xl"
                >
                  Commencer l&apos;essai gratuit
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
