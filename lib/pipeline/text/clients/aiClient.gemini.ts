// Real AIClient backed by Vercel AI SDK + Google Gemini provider
// Requires packages (not installed here):
//   npm install ai @ai-sdk/google
// Reads API key from GOOGLE_GENERATIVE_AI_API_KEY by default.

import type { AIClient, PatternId, RuleConfig, Violation } from "../types"
import { buildOutlinePrompt, buildDraftPagePrompt, buildRepairPrompt } from "../prompts"

// Lazy imports so this file doesn't crash TS builds when deps aren't installed
let generateTextFn: any
let googleProvider: any
async function ensureProviders() {
  if (!generateTextFn || !googleProvider) {
    const { generateText } = await import("ai")
    const { google } = await import("@ai-sdk/google")
    generateTextFn = generateText
    googleProvider = google
  }
}

function parseOutline(text: string, pageCount: number): string[] {
  const lines = text
    .split(/\r?\n+/)
    .map(l => l.trim())
    .filter(Boolean)
  const out: string[] = []
  for (const l of lines) {
    const m = l.match(/^Page\s*(\d+)\s*:\s*(.*)$/i)
    if (m) out[Number(m[1]) - 1] = m[2]
    else out.push(l)
    if (out.length >= pageCount) break
  }
  while (out.length < pageCount) out.push("(outline)")
  return out.slice(0, pageCount)
}

export class GeminiAIClient implements AIClient {
  constructor(private config: { model?: string; apiKey?: string } = {}) {}

  private async model() {
    await ensureProviders()
    const key = this.config.apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!key) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY")
    return googleProvider(this.config.model || "gemini-2.0-flash", { apiKey: key })
  }

  async outline(input: { title: string; theme: string; patternId: PatternId; pageCount: number; sampleAllowed: string[] }): Promise<string[]> {
    const prompt = buildOutlinePrompt(input)
    const { text } = await generateTextFn({ model: await this.model(), prompt })
    return parseOutline(text, input.pageCount)
  }

  async draftPage(input: { outlineBullet: string; allowedWords: string[]; rules: RuleConfig }): Promise<string> {
    const prompt = buildDraftPagePrompt(input)
    const { text } = await generateTextFn({ model: await this.model(), prompt })
    return text.trim().replace(/\s+/g, " ")
  }

  async repairPage(input: { originalText: string; violations: Violation[]; allowedWords: string[]; rules: RuleConfig; strategy: "minimal" | "rewrite" }): Promise<string> {
    const prompt = buildRepairPrompt({
      originalText: input.originalText,
      violations: input.violations,
      allowedWords: input.allowedWords,
      rules: input.rules,
      strategy: input.strategy,
    })
    const { text } = await generateTextFn({ model: await this.model(), prompt })
    return text.trim().replace(/\s+/g, " ")
  }
}

