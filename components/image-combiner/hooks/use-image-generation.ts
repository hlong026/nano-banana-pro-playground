"use client"

import type React from "react"

import { useState } from "react"
import type { Generation } from "../types"

interface UseImageGenerationProps {
  prompt: string
  aspectRatio: string
  model?: string
  imageSize?: string
  images: File[]
  imageUrls: string[]
  useUrls: boolean
  generations: Generation[]
  setGenerations: React.Dispatch<React.SetStateAction<Generation[]>>
  addGeneration: (generation: Generation) => Promise<Generation | void>
  onToast: (message: string, type?: "success" | "error") => void
  onImageUpload: (file: File) => Promise<void>
  onApiKeyMissing?: () => void
}

interface GenerateImageOptions {
  prompt?: string
  aspectRatio?: string
  model?: string
  imageSize?: string
  images?: File[]
  imageUrls?: string[]
  useUrls?: boolean
}

const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime)

    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.15)
  } catch (error) {
    console.log("Could not play sound:", error)
  }
}

export function useImageGeneration({
  prompt,
  aspectRatio,
  model = "nano-banana",
  imageSize = "auto",
  images,
  imageUrls,
  useUrls,
  generations,
  setGenerations,
  addGeneration,
  onToast,
  onImageUpload,
  onApiKeyMissing,
}: UseImageGenerationProps) {
  const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  const cancelGeneration = (generationId: string) => {
    const generation = generations.find((g) => g.id === generationId)
    if (generation?.abortController) {
      generation.abortController.abort()
    }

    setGenerations((prev) =>
      prev.map((gen) =>
        gen.id === generationId && gen.status === "loading"
          ? { ...gen, status: "error" as const, error: "Cancelled by user", progress: 0, abortController: undefined }
          : gen,
      ),
    )
    onToast("Generation cancelled", "error")
  }

  const generateImage = async (options?: GenerateImageOptions) => {
    const effectivePrompt = options?.prompt ?? prompt
    const effectiveAspectRatio = options?.aspectRatio ?? aspectRatio
    const effectiveModel = options?.model ?? model
    const effectiveImageSize = options?.imageSize ?? imageSize
    
    // Use provided images or default to current images
    const effectiveImages = options?.images ?? images
    const effectiveImageUrls = options?.imageUrls ?? imageUrls.filter(url => url !== "")

    if (!effectivePrompt.trim()) {
      onToast("Please enter a prompt", "error")
      return
    }

    const numVariations = 1
    const generationPromises = []

    for (let i = 0; i < numVariations; i++) {
      const generationId = `gen-${Date.now()}-${Math.random().toString(36).substring(7)}`
      const controller = new AbortController()

      const newGeneration: Generation = {
        id: generationId,
        status: "loading",
        progress: 0,
        imageUrl: null,
        prompt: effectivePrompt,
        timestamp: Date.now() + i,
        abortController: controller,
      }

      setGenerations((prev) => [newGeneration, ...prev])

      if (i === 0) {
        setSelectedGenerationId(generationId)
      }

      const progressInterval = setInterval(() => {
        setGenerations((prev) =>
          prev.map((gen) => {
            if (gen.id === generationId && gen.status === "loading") {
              const next =
                gen.progress >= 98
                  ? 98
                  : gen.progress >= 96
                    ? gen.progress + 0.2
                    : gen.progress >= 90
                      ? gen.progress + 0.5
                      : gen.progress >= 75
                        ? gen.progress + 0.8
                        : gen.progress >= 50
                          ? gen.progress + 1
                          : gen.progress >= 25
                            ? gen.progress + 1.2
                            : gen.progress + 1.5
              return { ...gen, progress: Math.min(next, 98) }
            }
            return gen
          }),
        )
      }, 100)

      const generationPromise = (async () => {
        try {
          const formData = new FormData()

          const hasImages = effectiveImages.length > 0 || effectiveImageUrls.length > 0
          const mode = hasImages ? "image-editing" : "text-to-image"

          formData.append("mode", mode)
          formData.append("prompt", effectivePrompt)
          formData.append("aspectRatio", effectiveAspectRatio)
          formData.append("model", effectiveModel)

          if (effectiveImageSize) {
            formData.append("imageSize", effectiveImageSize)
          }

          if (!useUrls) {
            effectiveImages.forEach((file, index) => {
              formData.append(`image${index + 1}`, file)
            })
          }

          if (useUrls) {
            effectiveImageUrls.forEach((url, index) => {
              if (url) {
                formData.append(`image${index + 1}Url`, url)
              }
            })
          }

          const response = await fetch("/api/generate-image", {
            method: "POST",
            body: formData,
            signal: controller.signal,
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }))

            if (errorData.error === "Configuration error" && errorData.details?.includes("BLTCY_API_KEY")) {
              clearInterval(progressInterval)
              setGenerations((prev) => prev.filter((gen) => gen.id !== generationId))
              onApiKeyMissing?.()
              return
            }

            throw new Error(`${errorData.error}${errorData.details ? `: ${errorData.details}` : ""}`)
          }

          const data = await response.json()

          clearInterval(progressInterval)

          if (data.url) {
            const completedGeneration: Generation = {
              id: generationId,
              status: "complete",
              progress: 100,
              imageUrl: data.url,
              prompt: effectivePrompt,
              timestamp: Date.now(),
              createdAt: new Date().toISOString(),
              aspectRatio: effectiveAspectRatio,
            }

            setGenerations((prev) => prev.filter((gen) => gen.id !== generationId))

            await addGeneration(completedGeneration)
          }

          if (selectedGenerationId === generationId) {
            setImageLoaded(true)
          }

          playSuccessSound()
        } catch (error) {
          console.error("Error in generation:", error)
          clearInterval(progressInterval)

          if (error instanceof Error && error.name === "AbortError") {
            return
          }

          const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

          setGenerations((prev) => prev.filter((gen) => gen.id !== generationId))

          onToast(`Error generating image: ${errorMessage}`, "error")
        }
      })()

      generationPromises.push(generationPromise)
    }

    await Promise.all(generationPromises)
  }

  const loadGeneratedAsInput = async () => {
    const selectedGeneration = generations.find((g) => g.id === selectedGenerationId)
    if (!selectedGeneration?.imageUrl) return

    try {
      const response = await fetch(selectedGeneration.imageUrl)
      const blob = await response.blob()
      const file = new File([blob], "generated-image.png", { type: "image/png" })

      await onImageUpload(file)
      onToast("Image loaded successfully", "success")
    } catch (error) {
      console.error("Error loading image as input:", error)
      onToast("Error loading image", "error")
    }
  }

  return {
    selectedGenerationId,
    setSelectedGenerationId,
    imageLoaded,
    setImageLoaded,
    generateImage,
    cancelGeneration,
    loadGeneratedAsInput,
  }
}
