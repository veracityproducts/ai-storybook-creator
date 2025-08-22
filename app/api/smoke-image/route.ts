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
    const title: string = body.title || "Test ABC"
    const theme: string = body.theme || "A kid sets a tent at camp"
    const pageText: string = body.text || "a kid sits on a mat by a small tent"

    // 1) Style Bible -> Style Tokens
    const styleBible = await generateStyleBible(title, theme)
    const styleTokens = await generateStyleTokens(styleBible)
    const systemTokens = await loadImageSystemTokens()

    // 2) Page prompt body (concise)
    const pageBody = await generatePageImagePrompt(styleBible, pageText, systemTokens)
    const finalPrompt = `${pageBody} ${styleTokens} ${systemTokens}`.trim()

    // 3) Generate image with Imagen 3 (portrait)
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY env var")

    const { base64, mimeType } = await generateImagenImage(finalPrompt, {
      apiKey,
      model: "imagen-3.0-generate-001",
      aspectRatio: "4:5",
      guidanceScale: 5.0,
      safetyFilterLevel: "BLOCK_LOW_AND_ABOVE",
      personGeneration: "ALLOW_ADULT",
    })

    // 4) Upload to Supabase Storage (public)
    const storyId = body.storyId || nanoid(10)
    const ext = mimeType.split("/")[1] || "png"
    const key = buildImagePath(storyId, 0, ext)
    const { url } = await uploadBase64Image(base64, mimeType, key, { makePublic: true, upsert: true })

    return NextResponse.json({
      ok: true,
      title,
      theme,
      pageText,
      pageBody,
      styleTokens,
      systemTokens,
      finalPrompt,
      url,
      mimeType,
      storyId,
    })
  } catch (err: any) {
    console.error("/api/smoke-image error", err)
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 })
  }
}

