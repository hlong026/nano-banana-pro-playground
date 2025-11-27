"use client"

import { createClient } from "./client"
import type { Generation } from "@/components/image-combiner/types"

const PAGE_SIZE = 20

export interface DbGeneration {
  id: string
  user_id: string
  prompt: string
  image_url: string | null
  model: string | null
  aspect_ratio: string | null
  image_size: string | null
  status: string
  error: string | null
  created_at: string
}

function dbToGeneration(db: DbGeneration): Generation {
  return {
    id: db.id,
    prompt: db.prompt,
    imageUrl: db.image_url || undefined,
    model: db.model || undefined,
    aspectRatio: db.aspect_ratio || undefined,
    imageSize: db.image_size || undefined,
    status: db.status as "loading" | "complete" | "error",
    error: db.error || undefined,
    createdAt: db.created_at,
    timestamp: new Date(db.created_at).getTime(),
  }
}

export async function fetchGenerations(page = 0): Promise<{ data: Generation[]; hasMore: boolean }> {
  try {
    const supabase = createClient()
    if (!supabase) return { data: [], hasMore: false }
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      // Silently return empty if not authenticated or Supabase not configured
      return { data: [], hasMore: false }
    }

    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data, error } = await supabase
      .from("generations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to + 1) // 多取一条判断是否有更多

    if (error) {
      // Only log in development, silently fail in production
      if (process.env.NODE_ENV === "development") {
        console.warn("Supabase not configured or table not created. Using local storage fallback.")
      }
      return { data: [], hasMore: false }
    }

    const hasMore = data.length > PAGE_SIZE
    const generations = (hasMore ? data.slice(0, PAGE_SIZE) : data).map(dbToGeneration)

    return { data: generations, hasMore }
  } catch (error) {
    // Catch any unexpected errors and return empty
    if (process.env.NODE_ENV === "development") {
      console.warn("Error in fetchGenerations:", error)
    }
    return { data: [], hasMore: false }
  }
}

export async function createGeneration(generation: Omit<Generation, "id" | "createdAt">): Promise<Generation | null> {
  try {
    const supabase = createClient()
    if (!supabase) return null
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return null
    }

    const { data, error } = await supabase
      .from("generations")
      .insert({
        user_id: user.id,
        prompt: generation.prompt,
        image_url: generation.imageUrl || null,
        model: generation.model || null,
        aspect_ratio: generation.aspectRatio || null,
        image_size: generation.imageSize || null,
        status: generation.status,
        error: generation.error || null,
      })
      .select()
      .single()

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Could not save to database, using local storage fallback")
      }
      return null
    }

    return dbToGeneration(data)
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Error in createGeneration:", error)
    }
    return null
  }
}

export async function updateGeneration(id: string, updates: Partial<Generation>): Promise<boolean> {
  try {
    const supabase = createClient()
    if (!supabase) return false
    
    const dbUpdates: Partial<DbGeneration> = {}
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl || null
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.error !== undefined) dbUpdates.error = updates.error || null

    const { error } = await supabase
      .from("generations")
      .update(dbUpdates)
      .eq("id", id)

    if (error) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

export async function deleteGeneration(id: string): Promise<boolean> {
  try {
    const supabase = createClient()
    if (!supabase) return false

    const { error } = await supabase
      .from("generations")
      .delete()
      .eq("id", id)

    if (error) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

export async function clearAllGenerations(): Promise<boolean> {
  try {
    const supabase = createClient()
    if (!supabase) return false
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return false
    }

    const { error } = await supabase
      .from("generations")
      .delete()
      .eq("user_id", user.id)

    if (error) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}
