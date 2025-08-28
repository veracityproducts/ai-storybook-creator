import type { ImagenConfig } from "./imagen-gemini"
import { generateImagenImage } from "./imagen-gemini"

// Fetch additional variants if the service caps numberOfImages per call.
export async function ensureVariants(
  prompt: string,
  cfg: ImagenConfig,
  minCount: number
): Promise<Array<{ base64: string; mimeType: string }>> {
  const results: Array<{ base64: string; mimeType: string }> = []
  const dedupe = new Set<string>()

  let remaining = minCount
  let first = true

  while (remaining > 0) {
    const batchSize = Math.min(cfg.numberOfImages || 1, remaining)
    const { base64, mimeType, variants } = await generateImagenImage(prompt, { ...cfg, numberOfImages: batchSize })
    const arr = variants && variants.length ? variants : [{ base64, mimeType }]
    for (const v of arr) {
      // De-dupe by base64 since service can repeat
      if (!dedupe.has(v.base64)) {
        dedupe.add(v.base64)
        results.push({ base64: v.base64, mimeType: v.mimeType })
      }
    }
    remaining = minCount - results.length
    // Prevent tight loop
    if (first) first = false
    else await new Promise(r => setTimeout(r, 150))
    if (!first && arr.length === 0) break
  }

  return results
}

