import type { AIClient, PatternId, RuleConfig, Violation } from "../types"
import { buildOutlinePrompt, buildDraftPagePrompt, buildRepairPrompt } from "../prompts"

// Stub AIClient for development: wire to Gemini later via ai-sdk/google.
// Replace console.log calls with real model invocation and response parsing.

export class StubAIClient implements AIClient {
  async outline(input: { title: string; theme: string; patternId: PatternId; pageCount: number; sampleAllowed: string[] }): Promise<string[]> {
    const prompt = buildOutlinePrompt(input)
    console.log("[AI.outline]", prompt.slice(0, 240) + "…")
    // Naive: return trivial bullets matching pageCount
    return Array.from({ length: input.pageCount }, (_, i) => `Page ${i + 1} about ${input.theme}`)
  }

  async draftPage(input: { outlineBullet: string; allowedWords: string[]; rules: RuleConfig }): Promise<string> {
    const prompt = buildDraftPagePrompt(input)
    console.log("[AI.draftPage]", prompt.slice(0, 240) + "…")
    // Naive: produce a tiny sentence using allowed words if possible
    const base = input.allowedWords.slice(0, 8)
    const line = base.length >= 4 ? `${base[0]} ${base[1]} ${base[2]} ${base[3]}.` : `a a a.`
    return line.replace(/\s+/g, " ")
  }

  async repairPage(input: { originalText: string; violations: Violation[]; allowedWords: string[]; rules: RuleConfig; strategy: "minimal" | "rewrite" }): Promise<string> {
    const prompt = buildRepairPrompt({ originalText: input.originalText, violations: input.violations, allowedWords: input.allowedWords, rules: input.rules, strategy: input.strategy })
    console.log("[AI.repairPage]", input.strategy, prompt.slice(0, 240) + "…")
    // Naive: remove violating tokens and collapse spaces; if rewrite, return simple sentence
    if (input.strategy === "rewrite") {
      const base = input.allowedWords.slice(0, 6)
      return base.length >= 3 ? `${base[0]} ${base[1]} ${base[2]}.` : "a a a."
    }
    let out = input.originalText
    for (const v of input.violations) out = out.replace(new RegExp(`\\b${v.token}\\b`, "gi"), "")
    return out.replace(/\s+/g, " ").trim()
  }
}

