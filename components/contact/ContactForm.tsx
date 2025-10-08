"use client"

import { useState } from "react"
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react"

interface FormData {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simuler l'envoi du formulaire
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setIsSubmitted(true)
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false)
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      })
    }, 3000)
  }

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
          Message envoyé !
        </h3>
        <p className="text-gray-600">
          Merci pour votre message. Marie-Line vous répondra dans les plus brefs délais.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Contactez Marie-Line
        </h2>
        <p className="text-gray-600">
          Avez-vous des questions sur le Pilates ? Besoin d'aide pour choisir un programme ? 
          N'hésitez pas à nous contacter !
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nom complet *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              placeholder="Votre nom complet"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              placeholder="votre@email.com"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              placeholder="+41 XX XXX XX XX"
            />
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Sujet *
            </label>
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            >
              <option value="">Sélectionnez un sujet</option>
              <option value="question">Question générale</option>
              <option value="programme">Choix de programme</option>
              <option value="technique">Question technique</option>
              <option value="abonnement">Abonnement</option>
              <option value="autre">Autre</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
            placeholder="Décrivez votre question ou votre demande..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Envoi en cours...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Envoyer le message</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export function ContactInfo() {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
        <h3 className="text-xl font-semibold text-primary-900 mb-4">
          Informations de contact
        </h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Mail className="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
            <div>
              <p className="text-primary-800 font-medium">Email</p>
              <a 
                href="mailto:info@only-you-coaching.com" 
                className="text-primary-600 hover:text-primary-700 transition-colors"
              >
                info@only-you-coaching.com
              </a>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Phone className="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
            <div>
              <p className="text-primary-800 font-medium">Téléphone</p>
              <a 
                href="tel:+41762508024" 
                className="text-primary-600 hover:text-primary-700 transition-colors"
              >
                +41 (0)76 250 80 24
              </a>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
            <div>
              <p className="text-primary-800 font-medium">Localisation</p>
              <p className="text-primary-600">Suisse</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-xl p-6 border border-secondary-200">
        <h3 className="text-xl font-semibold text-secondary-900 mb-4">
          Horaires de réponse
        </h3>
        <div className="space-y-2 text-secondary-800">
          <p><span className="font-medium">Lundi - Vendredi:</span> 9h00 - 18h00</p>
          <p><span className="font-medium">Samedi:</span> 9h00 - 12h00</p>
          <p><span className="font-medium">Dimanche:</span> Fermé</p>
        </div>
        <p className="text-sm text-secondary-600 mt-4">
          Nous nous efforçons de répondre à tous les messages dans les 24 heures.
        </p>
      </div>
    </div>
  )
}


