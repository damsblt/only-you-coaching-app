import { createClient } from '@supabase/supabase-js'

// Environment validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// Client for browser-side operations (uses anon key) - Auth disabled
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    debug: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
})

// Admin client for server-side operations (uses service role key) - Auth disabled
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey, // Fallback to anon key if service key not available
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-server'
      }
    }
  }
)

// Helper function to check if we're in a server environment
export const isServer = typeof window === 'undefined'

// Get the appropriate client based on environment
export const getSupabaseClient = () => {
  return isServer ? supabaseAdmin : supabase
}

// Safe auth method wrapper to handle AuthSessionMissingError
const safeAuthCall = async <T>(authMethod: () => Promise<T>): Promise<T | null> => {
  try {
    return await authMethod()
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthSessionMissingError') {
      return null
    }
    throw error
  }
}

// Auth helper functions
export const auth = {
  // Sign up with email and password
  async signUp(email: string, password: string, name?: string, planId?: string) {
    try {
      // Créer l'utilisateur avec Supabase (gère l'authentification et l'email)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
            role: 'USER',
            planId: planId || null // Store planId in user metadata
          },
          // URL de redirection pour la confirmation Supabase avec planId
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback${planId ? `?planId=${planId}` : ''}`
        }
      })

      if (data.user && !error) {
        console.log('Utilisateur créé, email de confirmation envoyé par Supabase')
        if (planId) {
          console.log('PlanId included in confirmation email:', planId)
        }
      }

      return { data, error }
    } catch (signUpError) {
      console.error('Erreur lors de l\'inscription:', signUpError)
      return { 
        data: null, 
        error: { 
          message: 'Erreur lors de l\'inscription. Veuillez réessayer.', 
          status: 500 
        } 
      }
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Sign in with Google
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { data, error }
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const result = await safeAuthCall(() => supabase.auth.getUser())
      if (result) {
        return { user: result.data.user, error: result.error }
      }
      return { user: null, error: null }
    } catch (error) {
      return { user: null, error }
    }
  },

  // Get current session
  async getSession() {
    try {
      const result = await safeAuthCall(() => supabase.auth.getSession())
      if (result) {
        return { session: result.data.session, error: result.error }
      }
      return { session: null, error: null }
    } catch (error) {
      return { session: null, error }
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

