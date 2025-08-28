import type { CompilePageInput, PageImageResult, ImageVariant } from "./types"
import { pickBestVariant } from "@/lib/images/variant-qa"
import { uploadBase64Image, buildImagePath, buildVariantImagePath } from "@/lib/storage/supabase"
import { generateImagenImage } from "@/lib/images/imagen-gemini"

export async function compilePage(input: CompilePageInput & { apiKey: string; upload?: boolean }): Promise<PageImageResult> {
  const { base64, mimeType, variants } = await generateImagenImage(input.finalPrompt, input.imageOptions)
  let allVariants: ImageVariant[] = (variants && variants.length > 0 ? variants : [{ base64, mimeType }])

  // Ensure desired min variants (best-effort)
  if (input.desiredMinVariants && allVariants.length < input.desiredMinVariants) {
    try {
      const { ensureVariants } = await import("@/lib/images/merge-variants")
      const more = await ensureVariants(input.finalPrompt, input.imageOptions, input.desiredMinVariants)
      const existing = new Set(allVariants.map(v => v.base64))
      for (const v of more) if (!existing.has(v.base64)) allVariants.push(v)
    } catch { }
  }

  // Auto-pick best variant using vision QA
  let pickedVariantIndex = 0
  let qaScores: any[] = []
  let qaRaw: string[] = []
  try {
    const qa = await pickBestVariant(allVariants, {
      apiKey: input.apiKey,
      requiredCharacters: input.castNames,
      wardrobeSummary: input.wardrobeSummary,
      actionText: input.actionText || undefined,
    })
    pickedVariantIndex = qa.bestIndex ?? 0
    qaScores = qa.scores || []
    qaRaw = qa.raw || []
  } catch {
    // deterministic fallback applied below
  }

  if (!qaScores || qaScores.length === 0) {
    qaScores = [{ bothPresent: false, wardrobeOk: false, proportionsOk: false, actionOk: false, speciesOk: false, artifactPenalty: 0.5, totalScore: 0, notes: "parse-failed" }]
  }

  // Optionally upload all variants (default true)
  const doUpload = input.upload !== false
  const urls: string[] = []
  if (doUpload) {
    for (let v = 0; v < allVariants.length; v++) {
      const vimg = allVariants[v]
      const vext = (vimg.mimeType || "image/png").split("/")[1] || "png"
      const vkey = v === 0 ? buildImagePath(input.storyId, input.pageIndex, vext) : buildVariantImagePath(input.storyId, input.pageIndex, v, vext)
      const uploaded = await uploadBase64Image(vimg.base64, vimg.mimeType || "image/png", vkey, { makePublic: true, upsert: true })
      urls.push(uploaded.url)
    }
  }

  const chosen = allVariants[pickedVariantIndex] || allVariants[0]
  const chosenUrl = doUpload ? (urls[pickedVariantIndex] || urls[0]) : ""

  return {
    variants: allVariants,
    urls,
    pickedVariantIndex,
    qaScores,
    qaRaw,
    chosenUrl,
    chosenMimeType: chosen.mimeType || "image/png",
    chosenBase64: chosen.base64,
    variantCount: allVariants.length,
  }
}

