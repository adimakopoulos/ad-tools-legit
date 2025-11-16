import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (cancelled) return

      console.log('[Auth] event', event, newSession)

      setSession(newSession)

      if (newSession?.user) {
        // fire-and-forget
        loadProfile(newSession.user, cancelled)
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const loadProfile = async (user, cancelledFlag) => {
    try {
      console.log('[Auth] loadProfile for', user.id)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (cancelledFlag) return

      if (error) {
        console.error('[Auth] loadProfile error:', error)
        return
      }

      if (!data) {
        console.log('[Auth] no profile, creating')
        const { data: created, error: insertError } = await supabase
          .from('profiles')
          .insert({ user_id: user.id, email: user.email })
          .select('*')
          .single()

        if (insertError) {
          console.error('[Auth] create profile error:', insertError)
          return
        }

        setProfile(created)
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('[Auth] loadProfile crashed', err)
    }
  }

  const value = {
    session,
    profile,
    loading,
    isVerified: !!session?.user?.email_confirmed_at,
    isAdmin: profile?.role === 'admin',
  }

  console.log('[Auth] context value', value)

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
