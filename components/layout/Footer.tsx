import Link from "next/link"
import { 
  Facebook, 
  Instagram, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin,
  Heart
} from "lucide-react"

export function Footer() {
  return (
    <footer className="relative bg-burgundy-gradient dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-900 text-white overflow-hidden transition-colors">
      {/* Smooth curved top edge using CSS clip-path */}
      <div className="absolute top-0 left-0 w-full h-8 bg-burgundy-500 dark:bg-gray-800" 
           style={{
             clipPath: 'ellipse(75% 100% at 50% 100%)',
             transform: 'translateY(-50%)'
           }}>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Only You Coaching</h3>
            <p className="text-white/90 dark:text-gray-300 text-sm leading-relaxed">
              Découvrez le Pilates avec Marie-Line. Vidéos de coaching, méditations et séances en ligne pour tous les niveaux.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white/80 dark:text-gray-400 hover:text-white dark:hover:text-white transition-colors rounded-full hover:bg-white/10 dark:hover:bg-white/20 p-2">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/80 dark:text-gray-400 hover:text-white dark:hover:text-white transition-colors rounded-full hover:bg-white/10 dark:hover:bg-white/20 p-2">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/80 dark:text-gray-400 hover:text-white dark:hover:text-white transition-colors rounded-full hover:bg-white/10 dark:hover:bg-white/20 p-2">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Liens rapides</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/videos" className="text-white/90 dark:text-gray-300 hover:text-white dark:hover:text-white transition-colors text-sm flex items-center">
                  Vidéos de Pilates
                </Link>
              </li>
              <li>
                <Link href="/programmes" className="text-white/90 dark:text-gray-300 hover:text-white dark:hover:text-white transition-colors text-sm flex items-center">
                  Programmes Prédéfinis
                </Link>
              </li>
              <li>
                <Link href="/meditation" className="text-white/90 dark:text-gray-300 hover:text-white dark:hover:text-white transition-colors text-sm flex items-center">
                  Méditations
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/90 dark:text-gray-300 hover:text-white dark:hover:text-white transition-colors text-sm flex items-center">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/subscriptions" className="text-white/90 dark:text-gray-300 hover:text-white dark:hover:text-white transition-colors text-sm flex items-center">
                  Abonnements
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-3">
              <a href="mailto:info@only-you-coaching.com" className="flex items-start space-x-3 text-white/90 dark:text-gray-300 hover:text-white dark:hover:text-white transition-colors">
                <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm">info@only-you-coaching.com</span>
              </a>
              <a href="tel:+41762508024" className="flex items-start space-x-3 text-white/90 dark:text-gray-300 hover:text-white dark:hover:text-white transition-colors">
                <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm">+41 (0)76 250 80 24</span>
              </a>
              <div className="flex items-start space-x-3 text-white/90 dark:text-gray-300">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Suisse</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/30 dark:border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/90 dark:text-gray-300 text-sm">
              © 2025 Only You Coaching. Tous droits réservés.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="/privacy" className="text-white/90 dark:text-gray-300 hover:text-white dark:hover:text-white transition-colors text-sm">
                Politique de confidentialité
              </Link>
              <Link href="/terms" className="text-white/90 dark:text-gray-300 hover:text-white dark:hover:text-white transition-colors text-sm">
                Conditions d&apos;utilisation
              </Link>
              <Link href="/cookies" className="text-white/90 dark:text-gray-300 hover:text-white dark:hover:text-white transition-colors text-sm">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

