"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession, signIn, signOut } from "next-auth/react"
import Image from "next/image"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { 
  Menu, 
  X, 
  User, 
  ShoppingCart, 
  Heart, 
  Calendar,
  Video,
  Music,
  BookOpen,
  Mail,
  Phone
} from "lucide-react"

export function Header() {
  const { data: session, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navigation = [
    { name: "ACCUEIL", href: "/" },
    { name: "À PROPOS", href: "/about" },
    { name: "ABONNEMENTS", href: "/subscriptions" },
    { name: "PROGRAMMES PRÉDÉFINIS", href: "/programmes" },
    { name: "ESSAI GRATUIT", href: "/videos" },
    { name: "VIDÉOS", href: "/videos" },
    { name: "AUDIOS", href: "/meditation" },
    { name: "RECETTES", href: "/recipes" },
    { name: "CONTACT", href: "/contact" },
  ]

  return (
    <header className="relative">
      {/* Top burgundy bar with contact info */}
      <div className="bg-burgundy-gradient dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-700 text-white py-3 px-4 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-sm gap-2">
          <a href="mailto:info@only-you-coaching.com" className="flex items-center hover:text-primary-50 dark:hover:text-gray-300 transition-colors">
            <Mail className="w-4 h-4 mr-2" />
            <span>info@only-you-coaching.com</span>
          </a>
          <a href="tel:+41762508024" className="flex items-center hover:text-primary-50 dark:hover:text-gray-300 transition-colors">
            <Phone className="w-4 h-4 mr-2" />
            <span>+41 (0)76 250 80 24</span>
          </a>
        </div>
      </div>
      
      {/* Main header with smooth curved bottom */}
      <div className="relative bg-white dark:bg-gray-800 shadow-md transition-colors">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Only You Coaching"
                width={160}
                height={48}
                className="rounded-[0.9rem] object-contain"
                style={{ width: "auto", height: "auto" }}
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navigation.slice(0, 9).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-black dark:text-gray-200 hover:text-accent-500 dark:hover:text-accent-400 px-3 py-2 text-xs font-medium transition-colors uppercase tracking-wide"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-3">
              <ThemeToggle />
              {status === "loading" ? (
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              ) : session ? (
                <div className="flex items-center space-x-2">
                  <Link
                    href="/profile"
                    className="p-2 text-gray-700 dark:text-gray-300 hover:text-accent-500 dark:hover:text-accent-400 transition-colors rounded-full hover:bg-primary-50 dark:hover:bg-gray-700"
                  >
                    <User className="w-5 h-5" />
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    href="/profile"
                    className="p-2 text-gray-700 dark:text-gray-300 hover:text-accent-500 dark:hover:text-accent-400 transition-colors rounded-full hover:bg-primary-50 dark:hover:bg-gray-700"
                  >
                    <User className="w-5 h-5" />
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center space-x-2">
              <ThemeToggle />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-accent-500 dark:hover:text-accent-400 transition-colors rounded-full hover:bg-primary-50 dark:hover:bg-gray-700"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-b-xl">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-accent-500 dark:hover:text-accent-400 text-sm font-medium transition-colors hover:bg-primary-50 dark:hover:bg-gray-700 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Smooth curved bottom edge using CSS clip-path */}
        <div className="absolute bottom-0 left-0 w-full h-8 bg-white dark:bg-gray-800" 
             style={{
               clipPath: 'ellipse(75% 100% at 50% 0%)',
               transform: 'translateY(50%)'
             }}>
        </div>
      </div>
    </header>
  )
}

