import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import {
  generateStyleBible,
  generateStyleTokens,
  loadImageSystemTokens,
  generatePageImagePrompt,
  generateStoryJSON,
  repairStoryJSON,
} from "@/lib/decodability/generation"
import { validateStoryDecodability } from "@/lib/decodability/validate"
import { generateImagenImage } from "@/lib/images/imagen-gemini"
import { uploadBase64Image, buildImagePath } from "@/lib/storage/supabase"
import type { PhonicsConfig } from "@/lib/decodability/schemas"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any))

    // CVC phonics configuration
    const cvcConfig: PhonicsConfig = {
      patternId: "cvc-short-a",
      graphemesAllowed: ["a", "m", "s", "t", "p", "n", "c", "d"],
      approvedWords: [
        "am", "an", "at", "as",
        "sap", "sat", "tap", "map", "nap", "cap", "can",
        "mad", "sad", "tan", "pan", "cat", "mat", "man", "pat", "and", "sand"
      ],
      heartWords: ["the", "I", "to", "a"],
      bannedWords: [],
      maxSentencesPerPage: 2,
      allowedPunctuation: [".", "!", "?"],
      properNounsPolicy: "none",
      // Character mappings using animal characters (bypasses human child content filters)
      // Map generic terms to specific character descriptions from Style Bible
      characterMappings: {
        "man": "Sam, a friendly cartoon red fox character with red-orange fur, white chest and belly, bushy tail with white tip, oval face with pronounced cheekbones, large triangular ears with black tips, small black nose, large almond-shaped brown eyes with cheerful expression, wearing a bright blue baseball cap, green t-shirt with small white paw print, and sturdy brown hiking boots",
        "Sam": "Sam, a friendly cartoon red fox character with red-orange fur, white chest and belly, bushy tail with white tip, oval face with pronounced cheekbones, large triangular ears with black tips, small black nose, large almond-shaped brown eyes with cheerful expression, wearing a bright blue baseball cap, green t-shirt with small white paw print, and sturdy brown hiking boots",
        "I": "Sam, a friendly cartoon red fox character with red-orange fur, white chest and belly, bushy tail with white tip, oval face with pronounced cheekbones, large triangular ears with black tips, small black nose, large almond-shaped brown eyes with cheerful expression, wearing a bright blue baseball cap, green t-shirt with small white paw print, and sturdy brown hiking boots"
      },
    }

    const title = body.title || "Sam at Camp"
    const theme = body.theme || "Sam sets up a mat and a tent at camp"
    const ageRange = body.ageRange || "4-7"
    const storyId = body.storyId || nanoid(10)

    // 1) Generate Style Bible and tokens
    const styleBible = await generateStyleBible(title, theme)
    const styleTokens = await generateStyleTokens(styleBible)
    const systemTokens = await loadImageSystemTokens()

    // 2) Generate decodable story JSON
    let story = await generateStoryJSON({
      ...cvcConfig,
      title,
      theme,
      ageRange,
    })

    // 3) Validate decodability
    let validationReport = validateStoryDecodability(story, cvcConfig)
    let repairAttempts = 0
    const maxRepairAttempts = 3

    // 4) Repair if needed
    while (!validationReport.valid && repairAttempts < maxRepairAttempts) {
      repairAttempts++
      story = await repairStoryJSON(story, cvcConfig, validationReport.offendingWords)
      validationReport = validateStoryDecodability(story, cvcConfig)
    }

    // 5) Generate images for each page with reference image consistency
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY env var")

    const images = []
    let referenceImageBase64 = null

    // Limit to 2 pages for complete story test
    const pagesToGenerate = Math.min(story.pages.length, 2)

    for (let i = 0; i < pagesToGenerate; i++) {
      const page = story.pages[i]

      // Build final image prompt with character mappings
      const pageBody = await generatePageImagePrompt(styleBible, page.text, systemTokens, cvcConfig.characterMappings)
      // Add consistent style anchoring to every prompt
      const styleAnchor = "Bright vibrant 3D animation with smooth textures, warm daylight lighting, clean polished rendering quality."
      let finalPrompt = `${styleAnchor} ${pageBody} ${styleTokens} ${systemTokens}`.trim()

      // Generate image with Imagen 4 Fast
      const imageOptions: any = {
        apiKey,
        model: "imagen-4.0-fast-generate-001",
        aspectRatio: "3:4",
        personGeneration: "allow_adult",
      }

      // NO reference image - rely on detailed character descriptions for consistency

      console.log(`Generating image ${i + 1}/${pagesToGenerate}:`, finalPrompt.substring(0, 100) + "...")

      const { base64, mimeType } = await generateImagenImage(finalPrompt, imageOptions)

      // No reference image storage needed

      // Upload to Supabase Storage (public)
      const ext = mimeType.split("/")[1] || "png"
      const key = buildImagePath(storyId, i, ext)
      const { url } = await uploadBase64Image(base64, mimeType, key, { makePublic: true, upsert: true })

      images.push({
        pageIndex: i,
        text: page.text,
        pageBody,
        finalPrompt,
        url,
        mimeType,
        usedReference: false,
      })
    }

    return NextResponse.json({
      ok: true,
      title,
      theme,
      ageRange,
      storyId,
      cvcConfig,
      styleBible,
      styleTokens,
      systemTokens,
      story: {
        title: story.title,
        pages: story.pages.slice(0, pagesToGenerate), // Only generated pages
        moral: story.moral,
      },
      validationReport,
      repairAttempts,
      images,
      consistencyInfo: {
        totalPages: pagesToGenerate,
        referenceImageUsed: referenceImageBase64 !== null,
        pagesWithReference: images.filter(img => img.usedReference).length,
      },
      costInfo: {
        imagesGenerated: images.length,
        costPerImage: 0.02, // USD for Imagen 4 Fast
        totalImageCost: images.length * 0.02,
        currency: "USD",
        model: "imagen-4.0-fast-generate-001"
      }
    })
  } catch (err: any) {
    console.error("/api/cvc-smoke error", err)
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 })
  }
}
