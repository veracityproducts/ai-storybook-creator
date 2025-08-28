import type { AIClient, DraftOptions, Story } from "./types"
import { buildOutlinePrompt, buildDraftPagePrompt } from "./prompts"

export async function draftStory(
  ai: AIClient,
  opts: { title: string; theme: string; patternId: string } & DraftOptions,
  allowedWords: string[]
): Promise<Story> {
  const outline = await ai.outline({
    title: opts.title,
    theme: opts.theme,
    patternId: opts.patternId,
    pageCount: opts.pageCount,
    sampleAllowed: allowedWords.slice(0, 60),
  })

  const pages: Story["pages"] = []
  for (let i = 0; i < opts.pageCount; i++) {
    const text = await ai.draftPage({
      outlineBullet: outline[i] || "",
      allowedWords,
      rules: {
        allowedWords: new Set(allowedWords),
        allowedPunctuation: new Set([".", "?", "!"]),
        disallowProperNouns: true,
        contractionsAllowed: false,
        morphology: { plural_s: true, past_ed: false, gerund_ing: true },
        sentenceLengthBounds: opts.sentenceLengthBounds || { min: 3, max: 8 },
        maxSentencesPerPage: opts.maxSentencesPerPage || 2,
        properNounsWhitelist: new Set<string>(opts.whitelist || []),
      },
    })
    pages.push({ index: i, text })
  }

  return { title: opts.title, theme: opts.theme, patternId: opts.patternId, pages }
}

