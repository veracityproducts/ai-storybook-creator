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
import { uploadBase64Image, buildImagePath, buildVariantImagePath } from "@/lib/storage/supabase"
import type { PhonicsConfig } from "@/lib/decodability/schemas"
import { createPhonicsConfig } from "@/lib/phonics-patterns"
import { Sam_v1, Emma_v1 } from "@/lib/characters/dna"
import { buildCoOccurrenceText, buildFinalPrompt, buildNegativePrompt, buildIdentityBlock, buildConsistencyClause, buildWardrobeLock } from "@/lib/prompts/prompt-builder"
import { getActionCues } from "@/lib/prompts/actions"
import { compilePage as compileImagePage } from "@/lib/pipeline/image/compilePage"

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


    // Reference anchoring: allow selecting which variant of page 1 to anchor to (default v0)
    // Anchor behavior controls
    const anchorFrom: "manual" | "auto" = (body.anchorFrom === "manual" ? "manual" : "auto")
    const anchorPolicy: "page1-only" | "rolling" = (body.anchorPolicy === "page1-only" ? "page1-only" : "rolling")

    const anchorVariantIndex = Math.min(Math.max(Number.isInteger(body.anchorVariantIndex) ? body.anchorVariantIndex : 0, 0), 3)
    let referenceImageBase64: string | null = null

    for (let i = 0; i < pagesToGenerate; i++) {
      const page = story.pages[i]
      console.log(`[COMPILE-BOOK] Generating image ${i + 1}/${pagesToGenerate}...`)

      try {
        // Build final image prompt with character mappings
        const pageBody = await generatePageImagePrompt(styleBible, page.text, systemTokens, phonicsConfig.characterMappings)

        // Optional per-page action/pose directive (e.g., standing, running, sitting)
        const activityList: string[] = Array.isArray(body.activities) ? body.activities : []
        const actionText = activityList[i] ? String(activityList[i]) : ""

        // Action-specific hints (positive + negative) to force pose change
        let actionPositive = ""
        let actionNegative = ""
        const lowerAct = actionText.toLowerCase()
        if (lowerAct.includes("run") || lowerAct.includes("jog")) {
          actionPositive = " Depict running: both characters mid-stride; one foot off the ground for each; elbows bent about 90 degrees; slight forward lean; subtle motion blur on legs only; natural arm swing; appropriate shadows under lifted feet."
          actionNegative = "no standing still; not both feet planted; not arms hanging at sides"
        } else if (lowerAct.includes("sit")) {
          actionPositive = " Depict sitting: both characters seated with hips contacting the bench, knees bent ~90 degrees, feet resting on the ground; hands engaged (e.g., holding the cake plate together)."
          actionNegative = "no standing posture; not both characters upright with legs straight"
        } else if (lowerAct.includes("stand")) {
          // standing is allowed; no extra negatives
        }

        const actionDirective = actionText
          ? ` CRITICAL: Override any default or reference pose. Set action/pose: ${actionText}. Maintain identical facial proportions and body physique while performing this action.`
          : ""
        const { positive: cuePos, negative: cueNeg } = getActionCues(actionText)
        const pageBodyWithAction = `${pageBody}${actionDirective}${cuePos || actionPositive}`.trim()
        const styleAnchor = "Bright vibrant 3D animation with smooth textures, warm daylight lighting, clean polished rendering quality."
        const cast = [Sam_v1, Emma_v1] // TODO: derive dynamically from mappings
        const identityBlock = buildIdentityBlock(cast)
        const coOccurrence = buildCoOccurrenceText(cast)
        const consistency = buildConsistencyClause()
        const wardrobeLock = buildWardrobeLock(cast)
        const negative = buildNegativePrompt(cast, body.negativePrompt)
        const isSitting = lowerAct.includes("sit") || lowerAct.includes("seated") || lowerAct.includes("bench")
        const speciesNeg = isSitting ? "no species morphing; no triangular fox ears on Emma; no elongated fox snout on Emma; no bushy fox tail on Emma; Emma must have long upright rabbit ears visible and a small round cotton tail" : ""
        const negativeWithAction = (cueNeg || actionNegative || speciesNeg) ? `${negative}${cueNeg ? ", " + cueNeg : ""}${actionNegative ? ", " + actionNegative : ""}${speciesNeg ? ", " + speciesNeg : ""}` : negative
        // Species locks for clarity (prevents morphing)
        const speciesLock = ` Sam is a fox: long bushy tail, triangular ears, slender snout. Emma is a rabbit: long upright ears, small round cotton tail; no bushy fox tail. Do not change species.`
        const finalPrompt = buildFinalPrompt(`${styleAnchor} ${consistency} ${wardrobeLock} ${speciesLock}`, identityBlock, pageBodyWithAction, styleTokens, systemTokens, coOccurrence, negativeWithAction)

        // For big pose changes (e.g., sitting), prefer SUBJECT to allow pose change while keeping identity
        const refConfig = referenceImageBase64
          ? { referenceImage: referenceImageBase64, referenceImageConfig: { referenceType: "SUBJECT" } }
          : {}

        // Generate image with Imagen 4 Fast
        const imageOptions: any = {
          apiKey,
          model: process.env.IMAGE_MODEL_MAIN || "imagen-4.0-generate-001",
          aspectRatio: "3:4",
          personGeneration: "allow_adult",
          ...(referenceImageBase64 ? (refConfig as any) : {}),
        }

        const baseSamples = Math.min(Math.max(body.sampleCount ?? 2, 1), 4)
        imageOptions.numberOfImages = (i === 2 ? 3 : baseSamples)

        // Generate + QA via pipeline (no upload yet). Also best-effort ensure 3 variants on page 3
        const resPage = await compileImagePage({
          storyId,
          pageIndex: i,
          finalPrompt,
          imageOptions,
          castNames: cast.map(c => c.name),
          wardrobeSummary: `${cast.map(c => `${c.name}: ${c.styleIdentity}`).join("; ")}`,
          actionText: actionText || undefined,
          desiredMinVariants: i === 2 ? 3 : undefined,
          apiKey,
          upload: false,
        })

        let allVariants = resPage.variants
        let pickedVariantIndex = resPage.pickedVariantIndex
        let qaScores: any = resPage.qaScores
        let qaRaw: string[] = resPage.qaRaw || []

        // If this is page 1 and using manual anchoring, set the selected variant as the reference for subsequent pages
        if (i === 0 && anchorFrom === "manual") {
          const pickIndex = Math.min(Math.max(anchorVariantIndex, 0), allVariants.length - 1)
          const picked = allVariants[pickIndex]
          referenceImageBase64 = picked.base64
        }

        // Upload to Supabase Storage (public)

        // Repair retry: if seated page fails wardrobe/species/action per QA, retry once with STYLE_AND_SUBJECT
        try {
          const pickedScore = Array.isArray(qaScores) ? qaScores[pickedVariantIndex] : undefined
          const needsRepair = !!(isSitting && pickedScore && (!pickedScore.wardrobeOk || !pickedScore.bothPresent || !pickedScore.actionOk))
          if (needsRepair && referenceImageBase64) {
            const repairRef = { referenceImage: referenceImageBase64, referenceImageConfig: { referenceType: "STYLE_AND_SUBJECT" } }
            const repairOptions: any = { ...imageOptions, ...(repairRef as any) }
            const { base64: rBase, mimeType: rMime, variants: rVars } = await (await import("@/lib/images/imagen-gemini")).generateImagenImage(finalPrompt, repairOptions)

            // Ensure qaScores non-null fallback
            if (!qaScores || (Array.isArray(qaScores) && qaScores.length === 0)) {
              qaScores = [{ bothPresent: false, wardrobeOk: false, proportionsOk: false, actionOk: false, speciesOk: false, artifactPenalty: 0.5, totalScore: 0, notes: "parse-failed" }]
            }

            let repaired = (rVars && rVars.length > 0 ? rVars : [{ base64: rBase, mimeType: rMime }])
            // Re-run QA on repaired set
            try {
              const wardrobeSummary = `${cast.map(c => `${c.name}: ${c.styleIdentity}`).join("; ")}`
              const qa2 = await (await import("@/lib/images/variant-qa")).pickBestVariant(repaired, {
                apiKey,
                requiredCharacters: cast.map(c => c.name),
                wardrobeSummary,
                actionText: actionText || undefined,
              })
              allVariants = repaired
              pickedVariantIndex = qa2.bestIndex ?? 0
              qaScores = qa2.scores
            } catch { }
          }
        } catch { }


        // After auto-pick, update reference if anchorFrom=auto (page1) or rolling
        if ((anchorFrom === "auto" && i === 0) || (anchorPolicy === "rolling")) {
          const chosenRef = allVariants[pickedVariantIndex] || allVariants[0]
          referenceImageBase64 = chosenRef.base64
        }

        const urls: string[] = []
        for (let v = 0; v < allVariants.length; v++) {
          const vimg = allVariants[v]
          const vext = (vimg.mimeType || "image/png").split("/")[1] || "png"
          const vkey = v === 0 ? buildImagePath(storyId, i, vext) : buildVariantImagePath(storyId, i, v, vext)
          const uploaded = await uploadBase64Image(vimg.base64, vimg.mimeType || "image/png", vkey, { makePublic: true, upsert: true })
          urls.push(uploaded.url)
        }

        // Final safety: ensure qaScores non-null before pushing
        if (!qaScores || (Array.isArray(qaScores) && qaScores.length === 0)) {
          qaScores = [{ bothPresent: false, wardrobeOk: false, proportionsOk: false, actionOk: false, speciesOk: false, artifactPenalty: 0.5, totalScore: 0, notes: "parse-failed" }]
        }


        const chosen = allVariants[pickedVariantIndex] || allVariants[0]
        const url = urls[pickedVariantIndex] || urls[0]

        images.push({
          pageIndex: i,
          text: page.text,
          url,
          mimeType: (chosen.mimeType || "image/png"),
          sampleCount: imageOptions.numberOfImages,
          variantUrls: urls,
          pickedVariantIndex,
          qaScores,
          qaRaw,
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
