'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Profile, UserRole } from '@/types'
import { isDemoMode, MOCK_HEAD, MOCK_TUTOR, MOCK_PENDING_TUTOR, MOCK_MEMBER } from '@/lib/mockData'

interface AuthState {
  profile: Profile | null
  loading: boolean
  initialized: boolean
}

interface AuthContextValue extends AuthState {
  isHead: boolean
  isTutor: boolean
  isMember: boolean
  isApproved: boolean
  canManageContent: boolean
  isAuthenticated: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signUpWithEmail: (email: string, password: string, name: string, role?: UserRole) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  // Demo mode helpers
  demoSignIn: (role: 'head' | 'tutor' | 'tutor_pending' | 'member') => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const DEMO_PROFILE_KEY = 'simi_demo_profile'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    profile: null,
    loading: true,
    initialized: false,
  })

  const demo = isDemoMode()

  // Load demo profile from localStorage
  const loadDemoProfile = useCallback(() => {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem(DEMO_PROFILE_KEY)
    if (!stored) return null
    try {
      return JSON.parse(stored) as Profile
    } catch {
      localStorage.removeItem(DEMO_PROFILE_KEY)
      return null
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    async function init() {
      if (demo) {
        const demoProfile = loadDemoProfile()
        setState({ profile: demoProfile, loading: false, initialized: true })
        return
      }

      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*, plan:plans(*)')
            .eq('id', session.user.id)
            .single()

          if (error) {
            console.error('[auth/init] Failed to fetch profile:', error)
            setState({ profile: null, loading: false, initialized: true })
            return
          }
          setState({ profile: profile as Profile, loading: false, initialized: true })
        } else {
          setState({ profile: null, loading: false, initialized: true })
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*, plan:plans(*)')
              .eq('id', session.user.id)
              .single()
            setState(prev => ({ ...prev, profile: profile as Profile | null }))
          } else {
            setState(prev => ({ ...prev, profile: null }))
          }
        })

        return () => subscription.unsubscribe()
      } catch (err) {
        console.error('[auth/init] Error:', err)
        setState({ profile: null, loading: false, initialized: true })
      }
    }

    init()
  }, [demo, loadDemoProfile])

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    if (demo) {
      const profile = MOCK_MEMBER
      localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profile))
      setState(prev => ({ ...prev, profile }))
      return { error: null }
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }
      return { error: null }
    } catch {
      return { error: 'An unexpected error occurred. Please try again.' }
    }
  }, [demo])

  const signUpWithEmail = useCallback(async (
    email: string,
    password: string,
    name: string,
    role: UserRole = 'member'
  ): Promise<{ error: string | null }> => {
    if (demo) {
      const isTutorRole = role === 'tutor'
      const profile: Profile = {
        ...MOCK_MEMBER,
        email,
        name,
        role,
        approval_status: isTutorRole ? 'pending' : 'approved',
        id: `${role}-${Date.now()}`,
      }
      localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profile))
      setState(prev => ({ ...prev, profile }))
      return { error: null }
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role,
          },
        },
      })
      if (error) return { error: error.message }
      return { error: null }
    } catch {
      return { error: 'An unexpected error occurred. Please try again.' }
    }
  }, [demo])

  const signInWithGoogle = useCallback(async () => {
    if (demo) return

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
    } catch (err) {
      console.error('[auth/google] Error:', err)
    }
  }, [demo])

  const signOut = useCallback(async () => {
    if (demo) {
      localStorage.removeItem(DEMO_PROFILE_KEY)
      setState(prev => ({ ...prev, profile: null }))
      return
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.auth.signOut()
      setState(prev => ({ ...prev, profile: null }))
    } catch (err) {
      console.error('[auth/signOut] Error:', err)
    }
  }, [demo])

  const refreshProfile = useCallback(async () => {
    if (demo) {
      const demoProfile = loadDemoProfile()
      setState(prev => ({ ...prev, profile: demoProfile }))
      return
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, plan:plans(*)')
          .eq('id', session.user.id)
          .single()
        setState(prev => ({ ...prev, profile: profile as Profile | null }))
      }
    } catch (err) {
      console.error('[auth/refresh] Error:', err)
    }
  }, [demo, loadDemoProfile])

  const demoSignIn = useCallback((type: 'head' | 'tutor' | 'tutor_pending' | 'member') => {
    let profile: Profile = MOCK_MEMBER
    if (type === 'head') profile = MOCK_HEAD
    else if (type === 'tutor') profile = MOCK_TUTOR
    else if (type === 'tutor_pending') profile = MOCK_PENDING_TUTOR

    localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profile))
    setState(prev => ({ ...prev, profile }))
  }, [])

  const isHead = state.profile?.role === 'head'
  const isTutor = state.profile?.role === 'tutor' || state.profile?.role === 'head'
  const isMember = state.profile?.role === 'member'
  const isApproved = state.profile?.approval_status === 'approved' || isHead
  const canManageContent = isHead || (state.profile?.role === 'tutor' && state.profile?.approval_status === 'approved')

  const value: AuthContextValue = {
    ...state,
    isHead,
    isTutor,
    isMember,
    isApproved,
    canManageContent,
    isAuthenticated: state.profile !== null,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    refreshProfile,
    demoSignIn,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
