'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN'
  planId?: string
}

interface SimpleAuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, name?: string, planId?: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined)

// Helper function to check if user exists via API
const checkUserExists = async (email: string): Promise<{ user: User | null; exists: boolean }> => {
  try {
    const response = await fetch(`/api/simple-auth/user?email=${encodeURIComponent(email)}`)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Error checking user:', errorData)
      return { user: null, exists: false }
    }

    const data = await response.json()
    return { user: data.user || null, exists: data.exists || false }
  } catch (error: any) {
    console.error('Error checking user existence:', {
      message: error?.message || 'Unknown error',
      name: error?.name || null,
    })
    return { user: null, exists: false }
  }
}

// Helper function to create user in database via API
const createUserInDatabase = async (email: string, name: string, planId?: string): Promise<User | null> => {
  try {
    console.log('Attempting to create user in database:', { email, name })

    const response = await fetch('/api/simple-auth/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name, planId }),
    })

    const data = await response.json()

    if (!response.ok) {
      // Handle duplicate email error
      if (data.code === '23505' || response.status === 409) {
        const duplicateError: any = new Error(data.error || 'Un compte avec cet email existe déjà. Veuillez vous connecter.')
        duplicateError.code = '23505'
        throw duplicateError
      }

      // Handle other errors
      const error = new Error(data.error || 'Failed to create user')
      ;(error as any).code = data.code || 'UNKNOWN_ERROR'
      throw error
    }

    console.log('User created successfully in database:', data.user)
    return data.user
  } catch (error: any) {
    // Re-throw duplicate email errors so they can be handled by signUp
    if (error?.code === '23505') {
      throw error
    }
    
    // Better error logging
    const errorDetails = {
      message: error?.message || 'Unknown error',
      code: error?.code || 'NO_CODE',
      name: error?.name || null,
    }
    console.error('Error creating user:', errorDetails)
    
    // If database fails for other reasons, create a local user for testing
    console.log('Falling back to local user creation for testing')
    const userId = crypto.randomUUID()
    return {
      id: userId,
      email,
      name,
      role: 'USER',
      planId: planId || 'essentiel'
    }
  }
}

export function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing user in localStorage
    const savedUser = localStorage.getItem('simple-auth-user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Error parsing saved user:', error)
        localStorage.removeItem('simple-auth-user')
      }
    }
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      // Simple validation
      if (!email || !password) {
        return { success: false, error: 'Email and password are required' }
      }

      // Try to check if user exists via API
      try {
        const { user: existingUser, exists } = await checkUserExists(email)

        if (existingUser) {
          // User exists, sign them in
          setUser(existingUser)
          localStorage.setItem('simple-auth-user', JSON.stringify(existingUser))
          return { success: true }
        } else {
          // User doesn't exist, create a new one
          const newUser = await createUserInDatabase(email, email.split('@')[0])
          if (newUser) {
            setUser(newUser)
            localStorage.setItem('simple-auth-user', JSON.stringify(newUser))
            return { success: true }
          } else {
            return { success: false, error: 'Failed to create user' }
          }
        }
      } catch (dbError: any) {
        // Better error logging
        const errorDetails = {
          message: dbError?.message || 'Unknown error',
          code: dbError?.code || 'NO_CODE',
          name: dbError?.name || null,
        }
        console.error('Database connection failed, falling back to local user:', errorDetails)
        
        // Handle network errors
        if (dbError?.message?.includes('Failed to fetch') || dbError?.message?.includes('NetworkError')) {
          return { 
            success: false, 
            error: 'Impossible de se connecter à la base de données. Vérifiez votre connexion internet.' 
          }
        }
        
        // If database is completely unavailable, create a local user
        const newUser = await createUserInDatabase(email, email.split('@')[0])
        if (newUser) {
          setUser(newUser)
          localStorage.setItem('simple-auth-user', JSON.stringify(newUser))
          return { success: true }
        } else {
          return { success: false, error: 'Failed to create user' }
        }
      }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: 'Sign in failed' }
    }
  }

  const signUp = async (email: string, password: string, name?: string, planId?: string) => {
    try {
      // Simple validation
      if (!email || !password) {
        return { success: false, error: 'Email and password are required' }
      }

      // Create user in database (or fetch existing if duplicate)
      const newUser = await createUserInDatabase(email, name || email.split('@')[0], planId)
      if (newUser) {
        setUser(newUser)
        localStorage.setItem('simple-auth-user', JSON.stringify(newUser))
        return { success: true }
      } else {
        return { success: false, error: 'Failed to create user' }
      }
    } catch (error: any) {
      console.error('Sign up error:', error)
      
      // Provide more specific error messages
      if (error?.code === '23505') {
        return { success: false, error: 'Un compte avec cet email existe déjà. Veuillez vous connecter.' }
      }
      
      if (error?.message) {
        return { success: false, error: error.message }
      }
      
      return { success: false, error: 'Erreur lors de la création du compte' }
    }
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem('simple-auth-user')
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut
  }

  return (
    <SimpleAuthContext.Provider value={value}>
      {children}
    </SimpleAuthContext.Provider>
  )
}

export function useSimpleAuth() {
  const context = useContext(SimpleAuthContext)
  if (context === undefined) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider')
  }
  return context
}
