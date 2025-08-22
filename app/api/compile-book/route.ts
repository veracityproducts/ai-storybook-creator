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
import { createPhonicsConfig, getPhonicsPattern } from "@/lib/phonics-patterns"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any))

    // Extract parameters
    const title = body.title || "My Decodable Story"
    const theme = body.theme || "A fun adventure story"
    const ageRange = body.ageRange || "4-7"
    const maxPages = Math.min(body.maxPages || 8, 12) // Limit to 12 pages max

    // Phonics configuration - use pattern system or fallback to manual config
    let phonicsConfig: PhonicsConfig

    if (body.patternId) {
      // Use phonics pattern system
      try {
        phonicsConfig = createPhonicsConfig(body.patternId, body.characterMappings)
        console.log(`[COMPILE-BOOK] Using phonics pattern: ${body.patternId}`)
      } catch (error) {
        console.warn(`[COMPILE-BOOK] Pattern '${body.patternId}' not found, using manual config`)
        phonicsConfig = createManualPhonicsConfig(body)
      }
    } else {
      // Fallback to manual configuration for backward compatibility
      phonicsConfig = createManualPhonicsConfig(body)
    }

    function createManualPhonicsConfig(body: any): PhonicsConfig {
      return {
        patternId: body.patternId || "cvc-short-a",
        graphemesAllowed: body.graphemesAllowed || ["a", "m", "s", "t", "p", "n", "c", "d"],
        approvedWords: body.approvedWords || [
          "am", "an", "at", "as", "sap", "sat", "tap", "map", "nap", "cap", "can",
          "mad", "sad", "tan", "pan", "cat", "mat", "man", "pat", "and", "sand"
        ],
        heartWords: body.heartWords || ["the", "I", "to", "a"],
        bannedWords: body.bannedWords || [],
        maxSentencesPerPage: body.maxSentencesPerPage || 2,
        allowedPunctuation: body.allowedPunctuation || [".", "!", "?"],
        properNounsPolicy: body.properNounsPolicy || "none",
        characterMappings: body.characterMappings || {
          "man": "Sam, a friendly cartoon red fox character with red-orange fur, white chest and belly, bushy tail with white tip, oval face with pronounced cheekbones, large triangular ears with black tips, small black nose, large almond-shaped brown eyes with cheerful expression, wearing a bright blue baseball cap, green t-shirt with small white paw print, and sturdy brown hiking boots",
          "Sam": "Sam, a friendly cartoon red fox character with red-orange fur, white chest and belly, bushy tail with white tip, oval face with pronounced cheekbones, large triangular ears with black tips, small black nose, large almond-shaped brown eyes with cheerful expression, wearing a bright blue baseball cap, green t-shirt with small white paw print, and sturdy brown hiking boots",
          "I": "Sam, a friendly cartoon red fox character with red-orange fur, white chest and belly, bushy tail with white tip, oval face with pronounced cheekbones, large triangular ears with black tips, small black nose, large almond-shaped brown eyes with cheerful expression, wearing a bright blue baseball cap, green t-shirt with small white paw print, and sturdy brown hiking boots"
        }
      }
    }

    const storyId = nanoid(10)

    console.log(`[COMPILE-BOOK] Starting compilation for "${title}"`)

    // 1) Generate Style Bible and tokens
    console.log("[COMPILE-BOOK] Generating style bible...")
    const styleBible = await generateStyleBible(title, theme)
    const styleTokens = await generateStyleTokens(styleBible)
    const systemTokens = await loadImageSystemTokens()

    // 2) Generate story content
    console.log("[COMPILE-BOOK] Generating story content...")
    let story = await generateStoryJSON({
      ...phonicsConfig,
      title,
      theme,
      ageRange,
    })

    // Limit pages to requested maximum
    if (story.pages.length > maxPages) {
      story.pages = story.pages.slice(0, maxPages)
    }

    // 3) Validate decodability
    console.log("[COMPILE-BOOK] Validating decodability...")
    let validationReport = validateStoryDecodability(story, phonicsConfig)
    let repairAttempts = 0

    // Repair if needed (max 3 attempts)
    while (!validationReport.valid && repairAttempts < 3) {
      console.log(`[COMPILE-BOOK] Repairing story (attempt ${repairAttempts + 1})...`)
      story = await repairStoryJSON(story, phonicsConfig, validationReport.offendingWords)
      validationReport = validateStoryDecodability(story, phonicsConfig)
      repairAttempts++
    }

    if (!validationReport.valid) {
      console.warn("[COMPILE-BOOK] Story still not valid after repairs, proceeding anyway")
    }

    // 4) Generate images
    console.log("[COMPILE-BOOK] Generating images...")
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY env var")

    const images: any[] = []
    const pagesToGenerate = story.pages.length

    for (let i = 0; i < pagesToGenerate; i++) {
      const page = story.pages[i]
      console.log(`[COMPILE-BOOK] Generating image ${i + 1}/${pagesToGenerate}...`)

      try {
        // Build final image prompt with character mappings
        const pageBody = await generatePageImagePrompt(styleBible, page.text, systemTokens, phonicsConfig.characterMappings)
        const styleAnchor = "Bright vibrant 3D animation with smooth textures, warm daylight lighting, clean polished rendering quality."
        const finalPrompt = `${styleAnchor} ${pageBody} ${styleTokens} ${systemTokens}`.trim()

        // Generate image with Imagen 4 Fast
        const imageOptions: any = {
          apiKey,
          model: "imagen-4.0-fast-generate-001",
          aspectRatio: "3:4",
          personGeneration: "allow_adult",
        }

        const { base64, mimeType } = await generateImagenImage(finalPrompt, imageOptions)

        // Upload to Supabase Storage (public)
        const ext = mimeType.split("/")[1] || "png"
        const key = buildImagePath(storyId, i, ext)
        const { url } = await uploadBase64Image(base64, mimeType, key, { makePublic: true, upsert: true })

        images.push({
          pageIndex: i,
          text: page.text,
          url,
          mimeType,
        })

      } catch (error) {
        console.error(`[COMPILE-BOOK] Error generating image ${i + 1}:`, error)
        // Add placeholder for failed images
        images.push({
          pageIndex: i,
          text: page.text,
          url: `/placeholder.svg?height=400&width=300&text=Page+${i + 1}`,
          mimeType: "image/svg+xml",
        })
      }
    }

    // 5) Compile final book data
    const compiledBook = {
      id: storyId,
      title: story.title,
      theme,
      ageRange,
      pages: images,
      moral: story.moral,
      costInfo: {
        imagesGenerated: images.filter(img => !img.url.includes('placeholder')).length,
        costPerImage: 0.02, // Imagen 4 Fast pricing
        totalImageCost: images.filter(img => !img.url.includes('placeholder')).length * 0.02,
        currency: "USD",
        model: "imagen-4.0-fast-generate-001"
      },
      metadata: {
        phonicsPattern: phonicsConfig.patternId,
        validationPassed: validationReport.valid,
        repairAttempts,
        generatedAt: new Date().toISOString(),
        styleBible: styleBible.substring(0, 200) + "...", // Truncated for response size
      }
    }

    console.log(`[COMPILE-BOOK] Compilation complete! Generated ${images.length} pages`)

    return NextResponse.json({
      ok: true,
      book: compiledBook,
      debug: {
        storyId,
        validationReport,
        repairAttempts,
        imagesGenerated: images.length,
        successfulImages: images.filter(img => !img.url.includes('placeholder')).length,
      }
    })

  } catch (err: any) {
    console.error("[COMPILE-BOOK] Error:", err)
    return NextResponse.json({
      ok: false,
      error: err?.message || String(err),
      details: "Failed to compile book. Please check your parameters and try again."
    }, { status: 500 })
  }
}
