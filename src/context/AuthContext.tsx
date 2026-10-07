import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

export type AuthState = 'INITIALIZING' | 'PROFILE_LOADING' | 'READY'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  authState: AuthState
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [authState, setAuthState] = useState<AuthState>('INITIALIZING')

  const isMountedRef = useRef(true)
  const pendingProfileUserId = useRef<string | null>(null)

  // Robust profile fetcher with 5-second timeout and metadata fallback
  const fetchProfileWithFallback = async (userId: string, metadata?: any): Promise<Profile> => {
    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error('Profile query timeout')), 5000)
    )

    const fetchPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.warn('Profile fetch warning:', error.message)
          return null
        }
        return data as Profile
      })

    try {
      const result = await Promise.race([fetchPromise, timeoutPromise])
      if (result) return result
    } catch (err) {
      console.warn('Profile query timed out or failed:', err)
    }

    // Safe fallback profile derived from user metadata
    return {
      id: userId,
      role: metadata?.role === 'authority' ? 'authority' : 'citizen',
      full_name: metadata?.full_name || 'User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  useEffect(() => {
    isMountedRef.current = true

    // Step 1: Initial Session Check
    const initSession = async () => {
      try {
        const { data: { session: existingSession }, error } = await supabase.auth.getSession()

        if (!isMountedRef.current) return

        if (error) {
          console.warn('getSession error:', error.message)
        }

        if (existingSession?.user) {
          setSession(existingSession)
          setUser(existingSession.user)
          setAuthState('PROFILE_LOADING')

          pendingProfileUserId.current = existingSession.user.id
          const prof = await fetchProfileWithFallback(
            existingSession.user.id,
            existingSession.user.user_metadata
          )

          if (!isMountedRef.current) return
          setProfile(prof)
        } else {
          setSession(null)
          setUser(null)
          setProfile(null)
        }
      } catch (err) {
        console.warn('Session initialization unexpected error:', err)
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
          setAuthState('READY')
        }
      }
    }

    initSession()

    // Step 2: Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMountedRef.current) return

        // Skip INITIAL_SESSION since initSession already handled it
        if (event === 'INITIAL_SESSION') return

        if (newSession?.user) {
          setSession(newSession)
          setUser(newSession.user)

          // Fetch profile if not already loaded for this user
          if (pendingProfileUserId.current !== newSession.user.id) {
            pendingProfileUserId.current = newSession.user.id
            setAuthState('PROFILE_LOADING')
            const prof = await fetchProfileWithFallback(
              newSession.user.id,
              newSession.user.user_metadata
            )
            if (isMountedRef.current) {
              setProfile(prof)
            }
          }

          if (isMountedRef.current) {
            setLoading(false)
            setAuthState('READY')
          }
        } else {
          pendingProfileUserId.current = null
          setSession(null)
          setUser(null)
          setProfile(null)
          setLoading(false)
          setAuthState('READY')
        }
      }
    )

    return () => {
      isMountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    setAuthState('PROFILE_LOADING')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setLoading(false)
        setAuthState('READY')
        return { error: error as Error | null }
      }

      if (data.user) {
        setUser(data.user)
        setSession(data.session)
        pendingProfileUserId.current = data.user.id
        const prof = await fetchProfileWithFallback(data.user.id, data.user.user_metadata)
        setProfile(prof)
      }

      setLoading(false)
      setAuthState('READY')
      return { error: null }
    } catch (err: any) {
      setLoading(false)
      setAuthState('READY')
      return { error: err }
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        setLoading(false)
        return { error: error as Error | null }
      }

      if (data.user) {
        setUser(data.user)
        setSession(data.session)
        pendingProfileUserId.current = data.user.id
        const prof = await fetchProfileWithFallback(data.user.id, data.user.user_metadata)
        setProfile(prof)
      }

      setLoading(false)
      setAuthState('READY')
      return { error: null }
    } catch (err: any) {
      setLoading(false)
      return { error: err }
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn('Sign out warning:', e)
    } finally {
      pendingProfileUserId.current = null
      setUser(null)
      setSession(null)
      setProfile(null)
      setLoading(false)
      setAuthState('READY')
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const prof = await fetchProfileWithFallback(user.id, user.user_metadata)
      setProfile(prof)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        authState,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
