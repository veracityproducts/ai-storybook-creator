import { NextResponse } from "next/server"
import { generateImagenImage } from "@/lib/images/imagen-gemini"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const prompt = body.prompt || "A simple red apple on a white background"
    
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY env var")

    console.log("Testing Imagen with prompt:", prompt)

    const { base64, mimeType } = await generateImagenImage(prompt, {
      apiKey,
      model: "imagen-4.0-generate-001",
      aspectRatio: "1:1",
      personGeneration: "allow_adult",
    })

    return NextResponse.json({
      ok: true,
      prompt,
      mimeType,
      base64Length: base64.length,
      // Don't return full base64 in response to keep it small
      base64Preview: base64.substring(0, 100) + "...",
    })
  } catch (err: any) {
    console.error("/api/test-imagen error", err)
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 })
  }
}
