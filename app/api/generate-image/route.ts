import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const MAX_PROMPT_LENGTH = 5000
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const API_BASE_URL = "https://api.bltcy.ai"

const AVAILABLE_MODELS = ["nano-banana-2", "nano-banana"]

const AVAILABLE_IMAGE_SIZES = ["auto", "1k", "2k", "4k"]

interface GenerateImageResponse {
  url: string
  prompt: string
  description?: string
}

interface ErrorResponse {
  error: string
  message?: string
  details?: string
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.BLTCY_API_KEY

    if (!apiKey) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Configuration error",
          details: "No BLTCY_API_KEY configured. Please add BLTCY_API_KEY to environment variables.",
        },
        { status: 500 },
      )
    }

    const formData = await request.formData()
    const mode = formData.get("mode") as string
    const prompt = formData.get("prompt") as string
    const aspectRatio = formData.get("aspectRatio") as string
    const model = formData.get("model") as string
    const imageSize = formData.get("imageSize") as string

    if (!mode) {
      return NextResponse.json<ErrorResponse>({ error: "Mode is required" }, { status: 400 })
    }

    if (!prompt?.trim()) {
      return NextResponse.json<ErrorResponse>({ error: "Prompt is required" }, { status: 400 })
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json<ErrorResponse>(
        { error: `Prompt too long. Maximum ${MAX_PROMPT_LENGTH} characters allowed.` },
        { status: 400 },
      )
    }

    const validModel = AVAILABLE_MODELS.includes(model) ? model : "nano-banana"

    const aspectRatioMap: Record<string, string> = {
      "1:1": "1:1",
      "2:3": "2:3",
      "3:2": "3:2",
      "3:4": "3:4",
      "4:3": "4:3",
      "4:5": "4:5",
      "5:4": "5:4",
      "9:16": "9:16",
      "16:9": "16:9",
      "21:9": "21:9",
    }

    const finalAspectRatio = aspectRatioMap[aspectRatio] || "1:1"

    if (mode === "text-to-image") {
      const requestBody: Record<string, any> = {
        model: validModel,
        prompt: prompt,
        aspect_ratio: finalAspectRatio,
        response_format: "url",
      }

      if (imageSize && AVAILABLE_IMAGE_SIZES.includes(imageSize)) {
        requestBody.image_size = imageSize
      }

      const response = await fetch(`${API_BASE_URL}/v1/images/generations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("API Error Response:", JSON.stringify(errorData, null, 2))
        const errorMessage = typeof errorData.error === 'string' 
          ? errorData.error 
          : JSON.stringify(errorData.error || errorData)
        throw new Error(`${errorMessage}${errorData.message ? `: ${errorData.message}` : ""}`)
      }

      const data = await response.json()

      if (data.data && data.data.length > 0) {
        const imageUrl = data.data[0].url

        return NextResponse.json<GenerateImageResponse>({
          url: imageUrl,
          prompt: prompt,
        })
      } else {
        return NextResponse.json<ErrorResponse>(
          { error: "No image generated", details: "API did not return any images" },
          { status: 500 },
        )
      }
    } else if (mode === "image-editing") {
      const imageFiles = []
      let imageIndex = 1
      while (true) {
        const imageFile = formData.get(`image${imageIndex}`) as File | null
        if (!imageFile) break
        imageFiles.push({ file: imageFile, index: imageIndex })
        imageIndex++
      }

      const imageUrls = []
      imageIndex = 1
      while (true) {
        const imageUrl = formData.get(`image${imageIndex}Url`) as string | null
        if (!imageUrl) break
        imageUrls.push({ url: imageUrl, index: imageIndex })
        imageIndex++
      }

      const hasImages = imageFiles.length > 0 || imageUrls.length > 0

      if (!hasImages) {
        return NextResponse.json<ErrorResponse>(
          { error: "At least one image is required for editing mode" },
          { status: 400 },
        )
      }

      for (const { file, index } of imageFiles) {
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json<ErrorResponse>(
            { error: `Image ${index} too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB allowed.` },
            { status: 400 },
          )
        }
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          return NextResponse.json<ErrorResponse>(
            { error: `Image ${index} has invalid format. Allowed: JPEG, PNG, WebP, GIF` },
            { status: 400 },
          )
        }
      }

      const editFormData = new FormData()
      editFormData.append("model", validModel)
      editFormData.append("prompt", prompt)
      editFormData.append("response_format", "url")
      editFormData.append("aspect_ratio", finalAspectRatio)

      if (imageSize && AVAILABLE_IMAGE_SIZES.includes(imageSize)) {
        editFormData.append("image_size", imageSize)
      }

      for (const { file } of imageFiles) {
        editFormData.append("image", file)
      }

      for (const { url, index } of imageUrls) {
        try {
          const response = await fetch(url)
          const blob = await response.blob()
          editFormData.append("image", blob, `image${index}.png`)
        } catch (error) {
          return NextResponse.json<ErrorResponse>(
            {
              error: `Failed to fetch image${index} from URL`,
              details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 400 },
          )
        }
      }

      const editsResponse = await fetch(`${API_BASE_URL}/v1/images/edits`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: editFormData,
      })

      if (!editsResponse.ok) {
        const errorData = await editsResponse.json().catch(() => ({ error: "Unknown error" }))
        console.error("API Error Response:", JSON.stringify(errorData, null, 2))
        const errorMessage = typeof errorData.error === 'string' 
          ? errorData.error 
          : JSON.stringify(errorData.error || errorData)
        throw new Error(`${errorMessage}${errorData.message ? `: ${errorData.message}` : ""}`)
      }

      const data = await editsResponse.json()

      if (data.data && data.data.length > 0) {
        const imageUrl = data.data[0].url

        return NextResponse.json<GenerateImageResponse>({
          url: imageUrl,
          prompt: prompt,
        })
      } else {
        return NextResponse.json<ErrorResponse>(
          { error: "No image generated", details: "API did not return any images" },
          { status: 500 },
        )
      }
    } else {
      return NextResponse.json<ErrorResponse>(
        { error: "Invalid mode", details: "Mode must be 'text-to-image' or 'image-editing'" },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Error in generate-image route:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to generate image",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
