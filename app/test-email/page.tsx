'use client'

import { useState } from 'react'
// import { emailService } from '@/lib/email-client'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'

export default function TestEmailPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [email, setEmail] = useState('test@example.com')
  const [name, setName] = useState('Test User')

  const testConfirmationEmail = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      // const confirmationLink = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/signin?confirmed=true`
      // const result = await emailService.sendConfirmationEmail(email, name, confirmationLink)
      setResult({ success: false, error: 'Email service not implemented' })
    } catch (error) {
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testWelcomeEmail = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      // const result = await emailService.sendWelcomeEmail(email, name)
      setResult({ success: false, error: 'Email service not implemented' })
    } catch (error) {
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Section gradient="soft" title="Test Email" subtitle="Tester l'envoi d'emails avec Nodemailer">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Configuration de test</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de test
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="test@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de test
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Test User"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Tests d'envoi</h3>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={testConfirmationEmail} 
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Envoi...' : 'Test Email Confirmation'}
              </Button>
              <Button 
                onClick={testWelcomeEmail} 
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Envoi...' : 'Test Email Bienvenue'}
              </Button>
            </div>
          </div>
        </div>

        {result && (
          <div className={`p-6 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className={`text-lg font-semibold mb-2 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
              {result.success ? '✅ Email envoyé avec succès !' : '❌ Erreur d\'envoi'}
            </h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Configuration requise</h3>
          <p className="text-blue-700 text-sm mb-2">
            Assurez-vous d'avoir configuré ces variables dans votre <code>.env.local</code> :
          </p>
          <pre className="text-xs bg-blue-100 p-2 rounded">
{`GMAIL_USER="baletdamien@gmail.com"
GMAIL_APP_PASSWORD="xjvpgkesikxcfmyy"`}
          </pre>
        </div>
      </div>
    </Section>
  )
}
