"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import Image from "next/image"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { useSimpleAuth } from "@/components/providers/SimpleAuthProvider"
import { Button } from "@/components/ui/Button"
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
  Phone,
  LogOut,
  LogIn
} from "lucide-react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user, loading, signOut } = useSimpleAuth()

  // Ensure component is mounted before using portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  const handleSignInClick = () => {
    // Sauvegarder la page actuelle avant de rediriger vers la connexion
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search
      // Ne pas sauvegarder si on est déjà sur la page de connexion
      if (!currentPath.startsWith('/auth/')) {
        localStorage.setItem('returnUrl', currentPath)
      }
    }
  }

  const navigation = [
    { name: "ACCUEIL", href: "/" },
    { 
      name: "À PROPOS", 
      href: "/about",
      subItems: [
        { name: "Ma Méthode", href: "/methode" }
      ]
    },
    { 
      name: "ABONNEMENTS", 
      subItems: [
        { name: "Coaching Personnalisé", href: "/souscriptions/personnalise" },
        { name: "Autonomie en ligne", href: "/souscriptions/autonomie" }
      ]
    },
    { 
      name: "VIDÉOS", 
      href: "/videos",
      subItems: [
        { name: "Bibliothèque de Vidéos", href: "/bibliotheque-videos" },
        { name: "Programmes Prédéfinis", href: "/programmes" }
      ]
    },
    { 
      name: "AUDIOS", 
      href: "/audio",
      subItems: [
        { name: "Méditation Guidée", href: "/meditation-guidee" },
        { name: "Coaching Mental", href: "/coaching-mental" }
      ]
    },
    { name: "RECETTES", href: "/recettes" },
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
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Only You Coaching"
                width={120}
                height={36}
                className="rounded-[0.9rem] object-contain max-h-10"
                style={{ width: "auto", height: "auto" }}
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1" role="navigation">
              {navigation.map((item) => (
                <div key={item.name} className="relative group">
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="text-black dark:text-gray-200 hover:text-accent-500 dark:hover:text-accent-400 px-3 py-2 text-xs font-medium transition-colors uppercase tracking-wide flex items-center"
                    >
                      {item.name}
                      {item.subItems && (
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </Link>
                  ) : (
                    <span className="text-black dark:text-gray-200 px-3 py-2 text-xs font-medium uppercase tracking-wide flex items-center cursor-default">
                      {item.name}
                      {item.subItems && (
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </span>
                  )}
                  {item.subItems && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:text-accent-500 dark:hover:text-accent-400 hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors"
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-3">
              <ThemeToggle />
              {loading ? (
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              ) : user ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Bonjour, {user.name || user.email?.split('@')[0]}
                  </span>
                  {user.role === 'ADMIN' && (
                    <Button
                      href="/admin/users"
                      variant="primary"
                      size="sm"
                      className="text-xs"
                    >
                      Admin
                    </Button>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-gray-700 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Se déconnecter"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    href="/auth/signin-simple"
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-1"
                    onClick={handleSignInClick}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Se connecter</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center space-x-2">
              <ThemeToggle />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-accent-500 dark:hover:text-accent-400 transition-colors rounded-full hover:bg-primary-50 dark:hover:bg-gray-700"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Right Sidebar Menu - Rendered via Portal to ensure it's above all elements */}
          {isMenuOpen && mounted && createPortal(
            <>
              {/* Backdrop overlay */}
              <div 
                className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[99998] lg:hidden transition-opacity duration-300"
                onClick={() => setIsMenuOpen(false)}
                aria-hidden="true"
              />
              
              {/* Sidebar */}
              <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-800 shadow-2xl z-[99999] lg:hidden transform translate-x-0 transition-transform duration-300 ease-in-out overflow-y-auto">
                <div className="flex flex-col h-full">
                  {/* Sidebar Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Menu</h2>
                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className="p-2 text-gray-700 dark:text-gray-300 hover:text-accent-500 dark:hover:text-accent-400 transition-colors rounded-full hover:bg-primary-50 dark:hover:bg-gray-700"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Navigation Links */}
                  <nav className="flex-1 px-4 py-4 space-y-1">
                    {navigation.map((item) => (
                      <div key={item.name}>
                        {item.href ? (
                          <Link
                            href={item.href}
                            className="block px-4 py-3 text-gray-700 dark:text-gray-200 hover:text-accent-500 dark:hover:text-accent-400 hover:bg-primary-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors rounded-lg"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {item.name}
                          </Link>
                        ) : (
                          <span className="block px-4 py-3 text-gray-700 dark:text-gray-200 text-sm font-medium cursor-default">
                            {item.name}
                          </span>
                        )}
                        {item.subItems && (
                          <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                            {item.subItems.map((subItem) => (
                              <Link
                                key={subItem.name}
                                href={subItem.href}
                                className="block px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-accent-500 dark:hover:text-accent-400 text-sm transition-colors hover:bg-primary-50 dark:hover:bg-gray-700 rounded-lg"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                {subItem.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </nav>
                  
                  {/* Auth Section */}
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    {loading ? (
                      <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                    ) : user ? (
                      <div className="space-y-3">
                        <div className="text-sm text-gray-700 dark:text-gray-200">
                          Bonjour, <span className="font-medium">{user.name || user.email?.split('@')[0]}</span>
                        </div>
                        {user.role === 'ADMIN' && (
                          <Button
                            href="/admin/users"
                            variant="primary"
                            size="sm"
                            fullWidth
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Admin Dashboard
                          </Button>
                        )}
                        <button
                          onClick={() => {
                            handleSignOut()
                            setIsMenuOpen(false)
                          }}
                          className="flex items-center justify-center space-x-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors w-full"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Se déconnecter</span>
                        </button>
                      </div>
                    ) : (
                      <Button
                        href="/auth/signin-simple"
                        variant="ghost"
                        size="sm"
                        fullWidth
                        className="flex items-center justify-center space-x-2"
                        onClick={() => {
                          handleSignInClick()
                          setIsMenuOpen(false)
                        }}
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Se connecter</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>,
            document.body
          )}
        </div>
        
      </div>
    </header>
  )
}

