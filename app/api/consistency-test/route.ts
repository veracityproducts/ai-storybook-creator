import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import {
  generateStyleBible,
  generateStyleTokens,
  loadImageSystemTokens,
  generatePageImagePrompt,
} from "@/lib/decodability/generation"
import { generateImagenImage } from "@/lib/images/imagen-gemini"
import { uploadBase64Image, buildImagePath } from "@/lib/storage/supabase"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any))

    const title = body.title || "Sam at Camp"
    const theme = body.theme || "Sam sets up a mat and a tent at camp"
    const storyId = body.storyId || nanoid(10)

    // Character mappings with detailed facial structure for consistency
    const characterMappings = {
      "Sam": "a friendly cartoon bear character with medium brown fur, round face with chubby cheeks, small black button nose, medium-sized round ears positioned high on head, large expressive brown eyes behind round wire-frame glasses, gentle smile showing small white teeth, wearing a red striped shirt, blue jeans, white sneakers",
      "Emma": "a cheerful cartoon rabbit character with soft light gray fur, oval-shaped face with pink inner ears, long upright ears with pink interior, small pink triangular nose, large bright blue eyes with long eyelashes, sweet smile, wearing a yellow sundress with small flower patterns, pink sandals",
      "Mom": "a caring adult fox character with reddish-brown fur, elegant pointed face with white chest markings, sharp triangular ears with black tips, narrow amber eyes with kind expression, small black nose, gentle motherly smile, wearing a blue blouse and khaki pants",
      "Dad": "a gentle adult wolf character with dark gray fur, strong square jaw, pointed ears standing erect, piercing but kind yellow eyes, black nose, confident smile, broad shoulders, wearing a green polo shirt and brown pants",
      "Alex": "a playful cartoon squirrel character with fluffy reddish-brown fur, small round face with prominent cheeks, tiny pointed ears, large curious dark eyes, small black nose, mischievous grin, bushy tail curled over back, wearing a purple t-shirt and gray shorts"
    }

    // 1) Generate 3D Animation Style Bible and tokens
    const styleBible = await generateStyleBible(title, theme)
    const styleTokens = await generateStyleTokens(styleBible)
    const systemTokens = await loadImageSystemTokens()

    // 2) Test scenarios for character consistency
    const testScenes = [
      "Sam sits on a mat by a tent",
      "Sam stands next to a tree with a backpack"
    ]

    // 3) Generate images for consistency testing using reference image approach
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY env var")

    const images = []
    let referenceImageBase64 = null

    for (let i = 0; i < testScenes.length; i++) {
      const sceneText = testScenes[i]

      // Build final image prompt with character mappings
      const pageBody = await generatePageImagePrompt(styleBible, sceneText, systemTokens, characterMappings)
      const finalPrompt = `${pageBody} ${styleTokens} ${systemTokens}`.trim()

      console.log(`Scene ${i + 1} prompt:`, finalPrompt.substring(0, 150) + "...")

      // Generate image with Imagen 3
      const imageOptions: any = {
        apiKey,
        model: "imagen-3.0-generate-002",
        aspectRatio: "3:4", // Portrait for book illustrations
        personGeneration: "allow_adult",
      }

      // Use reference image for consistency (after first image)
      if (referenceImageBase64) {
        imageOptions.referenceImage = referenceImageBase64
        imageOptions.referenceImageConfig = {
          referenceType: "STYLE_AND_SUBJECT" // Maintain both style and character
        }
        console.log(`Using reference image for scene ${i + 1}`)
      }

      const { base64, mimeType } = await generateImagenImage(finalPrompt, imageOptions)

      // Store first image as reference for subsequent generations
      if (i === 0) {
        referenceImageBase64 = base64
        console.log("Stored first image as reference for character consistency")
      }

      // Upload to Supabase Storage (public)
      const ext = mimeType.split("/")[1] || "png"
      const key = buildImagePath(storyId, i, ext)
      const { url } = await uploadBase64Image(base64, mimeType, key, { makePublic: true, upsert: true })

      images.push({
        sceneIndex: i,
        sceneText,
        pageBody,
        finalPrompt,
        url,
        mimeType,
        base64Length: base64.length,
        usedReference: i > 0,
      })
    }

    return NextResponse.json({
      ok: true,
      title,
      theme,
      storyId,
      styleBible,
      styleTokens,
      systemTokens,
      characterMappings,
      testScenes,
      images,
      consistencyTest: {
        purpose: "Test character consistency across multiple scenes with 3D animation style",
        scenes: testScenes.length,
        generatedImages: images.length,
      }
    })
  } catch (err: any) {
    console.error("/api/consistency-test error", err)
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 })
  }
}
