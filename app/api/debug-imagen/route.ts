import { NextResponse } from "next/server"
import { generateImagenImage } from "@/lib/images/imagen-gemini"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const prompts = body.prompts || [
      "A simple red apple",
      "Sam smiling",
      "Cut-paper style",
      "Digital cut-paper",
      "Pastel palette",
      "Soft daylight",
      "Clear silhouettes", 
      "Striped shirt",
      "Small backpack",
      "Standing by tree",
      "Sam smiling in striped shirt",
      "Cut-paper, pastel, smooth",
      "Sam smiling in a striped shirt with a small backpack",
      "Digital cut-paper; pastel palette; flat textures",
    ]
    
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY env var")

    const results = []
    
    for (const prompt of prompts) {
      console.log(`Testing prompt: "${prompt}"`)
      
      try {
        const { base64, mimeType } = await generateImagenImage(prompt, {
          apiKey,
          model: "imagen-3.0-generate-002",
          aspectRatio: "1:1",
          personGeneration: "allow_adult",
        })
        
        results.push({
          prompt,
          success: true,
          base64Length: base64.length,
          mimeType,
        })
        console.log(`✅ SUCCESS: "${prompt}"`)
        
      } catch (err: any) {
        results.push({
          prompt,
          success: false,
          error: err.message,
        })
        console.log(`❌ FAILED: "${prompt}" - ${err.message}`)
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return NextResponse.json({
      ok: true,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      }
    })
    
  } catch (err: any) {
    console.error("/api/debug-imagen error", err)
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 })
  }
}
