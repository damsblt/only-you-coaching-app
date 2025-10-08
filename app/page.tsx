import Link from "next/link"
import { 
  Play, 
  Users, 
  Star, 
  ArrowRight,
  Video,
  Music,
  Calendar,
  CheckCircle
} from "lucide-react"
import { pricingPlans } from "../data/pricingPlans"

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
                  href="/subscriptions"
                  className="curved-button inline-flex items-center justify-center px-8 py-4 bg-accent-500 text-white font-semibold shadow-organic hover:shadow-floating transition-all transform hover:scale-105"
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
              {/* Circular image container like the reference site */}
              <div className="relative w-full aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-secondary-200 to-accent-200 shadow-organic"></div>
                <div className="relative w-full h-full rounded-full overflow-hidden border-8 border-white/50 shadow-floating">
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary-100 to-accent-100 flex items-center justify-center">
                    <div className="w-24 h-24 bg-white/90 rounded-full flex items-center justify-center shadow-floating">
                      <Play className="w-8 h-8 text-accent-500 ml-1" />
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
                <Video className="w-10 h-10 text-accent-500 dark:text-accent-400" />
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
                <Music className="w-10 h-10 text-accent-500 dark:text-accent-400" />
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
                <Calendar className="w-10 h-10 text-accent-500 dark:text-accent-400" />
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

      {/* Plans & Subscription Section */}
      <section className="py-20 bg-primary-50 dark:bg-gray-900 relative overflow-hidden transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <p className="text-accent-500 dark:text-accent-400 uppercase tracking-wider text-sm font-semibold mb-4">
              JE RÉSERVE MON COACHING !
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4">
              Découvrez Mes Programmes Adaptés À Tous !
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mt-6">
              Que vous ayez un niveau avancé ou débutant, mes programmes s&apos;adaptent à vous (et non l&apos;inverse !)
            </p>
          </div>

          {/* Personalized Coaching Plans */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-black dark:text-white mb-8 text-center">
              {pricingPlans.personalized.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingPlans.personalized.plans.map((plan, index) => (
                <div key={index} className="curved-card bg-white dark:bg-gray-800 p-8 hover:shadow-organic transition-all transform hover:scale-105 border-2 border-secondary-200 dark:border-gray-600">
                  <div className="text-center mb-6">
                    <h4 className="text-xl font-bold text-black dark:text-white mb-2">{plan.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">DURÉE: {plan.duration}</p>
                    <div className="text-3xl font-bold text-accent-500 dark:text-accent-400">{plan.price}</div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-accent-500 dark:text-accent-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/subscriptions"
                    className="w-full curved-button bg-accent-500 dark:bg-accent-600 text-white font-semibold py-3 px-6 text-center block hover:shadow-floating transition-all"
                  >
                    Choisir ce plan
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Online Autonomy Plans */}
          <div>
            <h3 className="text-2xl font-bold text-black dark:text-white mb-8 text-center">
              {pricingPlans.online.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingPlans.online.plans.map((plan, index) => (
                <div key={index} className="curved-card bg-white dark:bg-gray-800 p-8 hover:shadow-organic transition-all transform hover:scale-105 border-2 border-secondary-200 dark:border-gray-600">
                  <div className="text-center mb-6">
                    <h4 className="text-xl font-bold text-black dark:text-white mb-2">{plan.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">DURÉE: {plan.duration}</p>
                    <div className="text-3xl font-bold text-accent-500 dark:text-accent-400">{plan.price}</div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-accent-500 dark:text-accent-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/subscriptions"
                    className="w-full curved-button bg-accent-500 dark:bg-accent-600 text-white font-semibold py-3 px-6 text-center block hover:shadow-floating transition-all"
                  >
                    Choisir ce plan
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-burgundy-gradient dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-700 relative overflow-hidden transition-colors">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à transformer votre vie ?
          </h2>
          <p className="text-xl text-white/90 dark:text-gray-300 mb-8">
            Rejoignez des milliers de personnes qui ont déjà découvert les bienfaits du Pilates.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/subscriptions"
              className="curved-button inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-100 text-burgundy-500 dark:text-gray-800 font-semibold shadow-organic hover:shadow-floating transition-all transform hover:scale-105"
            >
              Commencer l&apos;essai gratuit
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/booking"
              className="curved-button inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold bg-white/10 dark:bg-gray-800/20 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-100 hover:text-burgundy-500 dark:hover:text-gray-800 transition-all"
            >
              <Calendar className="mr-2 w-5 h-5" />
              Réserver une séance
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
