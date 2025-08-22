import { generateImagenImage } from "./images/imagen-gemini"
import { buildImagePath, uploadBase64Image } from "./storage/supabase"

/**
 * Generate an image based on a prompt using Imagen 3 via the Gemini API,
 * then upload to Supabase Storage and return the public URL.
 */
export async function generateImage(
  prompt: string,
  storyId: string,
  pageIndex: number,
  _previousImages: string[] = [],
  _previousPrompts: string[] = [],
): Promise<string> {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY")

    // Portrait aspect ratio and default guidance/safety per our setup
    const { base64, mimeType } = await generateImagenImage(prompt, {
      apiKey,
      model: "imagen-3.0-generate-001",
      aspectRatio: "4:5",
      guidanceScale: 5.0,
      safetyFilterLevel: "BLOCK_LOW_AND_ABOVE",
      personGeneration: "ALLOW_ADULT",
    })

    const ext = mimeType.split("/")[1] || "png"
    const key = buildImagePath(storyId, pageIndex, ext)
    const { url } = await uploadBase64Image(base64, mimeType, key, { makePublic: true, upsert: true })
    return url
  } catch (error) {
    console.error(`[IMAGE-GEN] Error generating image:`, error)
    return `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(prompt.substring(0, 30))}`
  }
}
