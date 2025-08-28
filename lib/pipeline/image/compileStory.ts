import type { CompilePageInput } from "./types"
import { compilePage } from "./compilePage"

export async function compileStory(
  pages: Array<Omit<CompilePageInput, "pageIndex" | "storyId">>,
  ctx: { storyId: string; apiKey: string; upload?: boolean }
): Promise<{
  pages: Array<{
    pickedVariantIndex: number
    variantUrls: string[]
    qaScores: any[]
    url: string
  }>
}> {
  const out: Array<{ pickedVariantIndex: number; variantUrls: string[]; qaScores: any[]; url: string }> = []
  for (let i = 0; i < pages.length; i++) {
    const res = await compilePage({ ...pages[i], pageIndex: i, storyId: ctx.storyId, apiKey: ctx.apiKey, upload: ctx.upload })
    out.push({ pickedVariantIndex: res.pickedVariantIndex, variantUrls: res.urls, qaScores: res.qaScores, url: res.chosenUrl })
  }
  return { pages: out }
}

