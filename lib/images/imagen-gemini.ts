// Helper to generate images with Google's new GenAI SDK (Imagen 3)
// Requires: npm install @google/genai

import { GoogleGenAI } from "@google/genai"

export type ImagenConfig = {
  apiKey: string
  model?: string // default: "imagen-3.0-generate-002"
  numberOfImages?: number // 1
  aspectRatio?: string // e.g., "3:4" for portrait, "1:1", "4:3", "9:16", "16:9"
  personGeneration?: string // e.g., "allow_adult" or per policy
  referenceImage?: string // base64 encoded reference image for consistency
  referenceImageConfig?: {
    referenceType?: string // e.g., "STYLE_AND_SUBJECT", "STYLE", "SUBJECT"
  }
}

export async function generateImagenImage(
  prompt: string,
  cfg: ImagenConfig
): Promise<{ base64: string; mimeType: string }> {
  const {
    apiKey,
    model = "imagen-3.0-generate-002",
    numberOfImages = 1,
    aspectRatio = "3:4",
    personGeneration = "allow_adult",
    referenceImage,
    referenceImageConfig,
  } = cfg

  const ai = new GoogleGenAI({ apiKey })

  console.log("Imagen prompt length:", prompt.length)
  console.log("Imagen prompt:", prompt.substring(0, 200) + "...")
  if (referenceImage) {
    console.log("Using reference image for consistency")
  }

  // Build config object
  const config: any = {
    numberOfImages,
    aspectRatio,
    personGeneration,
  }

  // Add reference image if provided
  if (referenceImage && referenceImageConfig) {
    config.referenceImage = {
      imageBytes: referenceImage,
      ...referenceImageConfig,
    }
  }

  const response = await ai.models.generateImages({
    model,
    prompt,
    config,
  })

  console.log("Imagen response:", JSON.stringify(response, null, 2))

  if (!response.generatedImages || response.generatedImages.length === 0) {
    throw new Error("No images generated")
  }

  const generatedImage = response.generatedImages[0]
  if (!generatedImage.image?.imageBytes) {
    throw new Error("No image data in generated image")
  }

  return {
    base64: generatedImage.image.imageBytes,
    mimeType: generatedImage.image.mimeType || "image/png",
  }
}

