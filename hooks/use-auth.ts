"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { data: null, error: new Error("Supabase not configured") }
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { data, error }
    },
    [supabase]
  )

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { data: null, error: new Error("Supabase not configured") }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      return { data, error }
    },
    [supabase]
  )

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return { data: null, error: new Error("Supabase not configured") }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { data, error }
  }, [supabase])

  const signInWithGithub = useCallback(async () => {
    if (!supabase) return { data: null, error: new Error("Supabase not configured") }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { data, error }
  }, [supabase])

  const signOut = useCallback(async () => {
    if (!supabase) return { error: new Error("Supabase not configured") }
    const { error } = await supabase.auth.signOut()
    return { error }
  }, [supabase])

  const resetPassword = useCallback(
    async (email: string) => {
      if (!supabase) return { data: null, error: new Error("Supabase not configured") }
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      return { data, error }
    },
    [supabase]
  )

  return {
    user,
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithGithub,
    signOut,
    resetPassword,
  }
}
