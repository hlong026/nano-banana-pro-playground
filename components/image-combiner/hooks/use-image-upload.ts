"use client"

import { useState, useRef } from "react"

const MAX_IMAGES = 8

export function useImageUpload() {
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [isConvertingHeic, setIsConvertingHeic] = useState(false)
  const [heicProgress, setHeicProgress] = useState(0)

  const showToast = useRef<((message: string, type?: "success" | "error") => void) | null>(null)

  const validateImageFormat = (file: File): boolean => {
    const supportedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
      "image/gif",
      "image/bmp",
      "image/tiff",
    ]

    if (supportedTypes.includes(file.type.toLowerCase())) {
      return true
    }

    const fileName = file.name.toLowerCase()
    const supportedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".gif", ".bmp", ".tiff"]
    return supportedExtensions.some((ext) => fileName.endsWith(ext))
  }

  const compressImage = async (file: File, maxWidth = 1280, quality = 0.75): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      const img = new Image()

      img.onload = () => {
        let { width, height } = img
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height
            height = maxWidth
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              resolve(file)
            }
          },
          "image/jpeg",
          quality,
        )
      }

      img.src = URL.createObjectURL(file)
    })
  }

  const convertHeicToPng = async (file: File): Promise<File> => {
    try {
      setHeicProgress(0)
      const progressInterval = setInterval(() => {
        setHeicProgress((prev) => (prev >= 95 ? prev : prev + Math.random() * 15 + 5))
      }, 50)

      const { heicTo } = await import("heic-to")
      setHeicProgress(70)

      const convertedBlob = await heicTo({
        blob: file,
        type: "image/jpeg",
        quality: 0.9,
      })

      setHeicProgress(90)
      const convertedFile = new File([convertedBlob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
        type: "image/jpeg",
      })

      clearInterval(progressInterval)
      setHeicProgress(100)
      await new Promise((resolve) => setTimeout(resolve, 200))

      return convertedFile
    } catch (error) {
      console.error("HEIC conversion error:", error)
      throw new Error("Could not convert HEIC image. Please try using a different image format.")
    }
  }

  const handleImageUpload = async (file: File) => {
    if (images.length >= MAX_IMAGES) {
      showToast.current?.(`Maximum ${MAX_IMAGES} images allowed.`, "error")
      return
    }

    if (!validateImageFormat(file)) {
      showToast.current?.("Please select a valid image file.", "error")
      return
    }

    let processedFile = file
    const isHeic =
      file.type.toLowerCase().includes("heic") ||
      file.type.toLowerCase().includes("heif") ||
      file.name.toLowerCase().endsWith(".heic") ||
      file.name.toLowerCase().endsWith(".heif")

    if (isHeic) {
      try {
        setIsConvertingHeic(true)
        processedFile = await convertHeicToPng(file)
        setIsConvertingHeic(false)
      } catch (error) {
        setIsConvertingHeic(false)
        showToast.current?.("Error converting HEIC image. Please try a different format.", "error")
        return
      }
    }

    try {
      processedFile = await compressImage(processedFile)
    } catch (error) {
      console.error("Error compressing image:", error)
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setImages((prev) => [...prev, processedFile])
      setImagePreviews((prev) => [...prev, result])
    }
    reader.onerror = () => {
      showToast.current?.("Error reading the image file. Please try again.", "error")
    }
    reader.readAsDataURL(processedFile)
  }

  const handleMultipleImageUpload = async (files: FileList) => {
    const currentCount = images.length
    const remainingSlots = MAX_IMAGES - currentCount
    if (remainingSlots <= 0) {
      showToast.current?.(`Maximum ${MAX_IMAGES} images allowed.`, "error")
      return
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots)
    const processedFiles: File[] = []
    const processedPreviews: string[] = []

    for (const file of filesToProcess) {
      if (!validateImageFormat(file)) {
        showToast.current?.("Please select a valid image file.", "error")
        continue
      }

      let processedFile = file
      const isHeic =
        file.type.toLowerCase().includes("heic") ||
        file.type.toLowerCase().includes("heif") ||
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif")

      if (isHeic) {
        try {
          setIsConvertingHeic(true)
          processedFile = await convertHeicToPng(file)
          setIsConvertingHeic(false)
        } catch (error) {
          setIsConvertingHeic(false)
          showToast.current?.("Error converting HEIC image. Please try a different format.", "error")
          continue
        }
      }

      try {
        processedFile = await compressImage(processedFile)
      } catch (error) {
        console.error("Error compressing image:", error)
      }

      const preview = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = () => reject(new Error("Failed to read file"))
        reader.readAsDataURL(processedFile)
      }).catch(() => null)

      if (preview) {
        processedFiles.push(processedFile)
        processedPreviews.push(preview)
      }
    }

    // Batch update state once
    if (processedFiles.length > 0) {
      setImages((prev) => [...prev, ...processedFiles])
      setImagePreviews((prev) => [...prev, ...processedPreviews])
    }

    if (files.length > remainingSlots) {
      showToast.current?.(`Only ${remainingSlots} images added. Maximum ${MAX_IMAGES} images allowed.`, "error")
    }
  }

  const handleUrlChange = (url: string, index: number) => {
    setImageUrls((prev) => {
      const newUrls = [...prev]
      newUrls[index] = url
      return newUrls
    })
    setImagePreviews((prev) => {
      const newPreviews = [...prev]
      newPreviews[index] = url
      return newPreviews
    })
  }

  const clearImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const clearAllImages = () => {
    setImages([])
    setImagePreviews([])
    setImageUrls([])
  }

  return {
    images,
    imagePreviews,
    imageUrls,
    isConvertingHeic,
    heicProgress,
    handleImageUpload,
    handleMultipleImageUpload,
    handleUrlChange,
    clearImage,
    clearAllImages,
    showToast,
    maxImages: MAX_IMAGES,
  }
}
