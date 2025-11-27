"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Generation } from "../types"
import { useAuth } from "@/hooks/use-auth"
import * as db from "@/lib/supabase/generations"

const STORAGE_KEY = "nb2_generations"
const MAX_STORED = 50

// Local storage functions for non-logged-in users
function getLocalGenerations(): Generation[] {
  try {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error("Error loading generations from localStorage:", error)
    return []
  }
}

function saveLocalGenerations(generations: Generation[]) {
  try {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(generations.slice(0, MAX_STORED)))
  } catch (error) {
    console.error("Error saving generations to localStorage:", error)
  }
}

function deleteLocalGeneration(id: string) {
  try {
    const current = getLocalGenerations()
    const updated = current.filter((g) => g.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error("Error deleting generation from localStorage:", error)
  }
}

function clearLocalGenerations() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("Error clearing localStorage:", error)
  }
}

export function usePersistentHistory(onToast?: (message: string, type: "success" | "error") => void) {
  const { user, loading: authLoading } = useAuth()
  const [generations, setGenerations] = useState<Generation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Load generations when user state changes
  useEffect(() => {
    if (authLoading) return

    const loadGenerations = async () => {
      setIsLoading(true)
      setPage(0)

      if (user) {
        // User is logged in - fetch from Supabase
        const { data, hasMore: more } = await db.fetchGenerations(0)
        if (isMountedRef.current) {
          setGenerations(data)
          setHasMore(more)
        }
      } else {
        // Not logged in - use localStorage
        const localGens = getLocalGenerations()
        if (isMountedRef.current) {
          setGenerations(localGens)
          setHasMore(false)
        }
      }

      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }

    loadGenerations()
  }, [user, authLoading])

  const loadMore = useCallback(async () => {
    if (!user || isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    const nextPage = page + 1
    const { data, hasMore: more } = await db.fetchGenerations(nextPage)
    
    if (isMountedRef.current) {
      setGenerations((prev) => [...prev, ...data])
      setHasMore(more)
      setPage(nextPage)
      setIsLoadingMore(false)
    }
  }, [user, page, isLoadingMore, hasMore])

  const addGeneration = useCallback(
    async (generation: Generation) => {
      if (user) {
        // Save to Supabase
        const saved = await db.createGeneration({
          prompt: generation.prompt,
          imageUrl: generation.imageUrl,
          model: generation.model,
          aspectRatio: generation.aspectRatio,
          imageSize: generation.imageSize,
          status: generation.status,
          error: generation.error,
        })
        
        if (saved) {
          setGenerations((prev) => [saved, ...prev])
          return saved
        } else {
          onToast?.("Failed to save generation", "error")
          // Fallback to local state
          setGenerations((prev) => [generation, ...prev])
          return generation
        }
      } else {
        // Save to localStorage
        const localGens = getLocalGenerations()
        const updated = [generation, ...localGens].slice(0, MAX_STORED)
        saveLocalGenerations(updated)
        setGenerations((prev) => [generation, ...prev])
        return generation
      }
    },
    [user, onToast]
  )

  const updateGeneration = useCallback(
    async (id: string, updates: Partial<Generation>) => {
      // Update local state immediately
      setGenerations((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
      )

      if (user) {
        // Sync to Supabase
        const success = await db.updateGeneration(id, updates)
        if (!success) {
          console.error("Failed to sync generation update to database")
        }
      } else {
        // Update localStorage
        const localGens = getLocalGenerations()
        const updated = localGens.map((g) => (g.id === id ? { ...g, ...updates } : g))
        saveLocalGenerations(updated)
      }
    },
    [user]
  )

  const deleteGeneration = useCallback(
    async (id: string) => {
      setGenerations((prev) => prev.filter((g) => g.id !== id))

      if (user) {
        const success = await db.deleteGeneration(id)
        if (!success) {
          onToast?.("Failed to delete generation", "error")
        }
      } else {
        deleteLocalGeneration(id)
      }
    },
    [user, onToast]
  )

  const clearHistory = useCallback(async () => {
    setGenerations([])

    if (user) {
      const success = await db.clearAllGenerations()
      if (!success) {
        onToast?.("Failed to clear history", "error")
      }
    } else {
      clearLocalGenerations()
    }
  }, [user, onToast])

  return {
    generations,
    setGenerations,
    addGeneration,
    updateGeneration,
    clearHistory,
    deleteGeneration,
    isLoading,
    hasMore,
    loadMore,
    isLoadingMore,
  }
}
