import type { RuleConfig } from "./types"

export function buildOutlinePrompt(input: {
  title: string
  theme: string
  patternId: string
  pageCount: number
  sampleAllowed: string[]
}): string {
  return [
    `You are a decodable outline planner for early readers. Use only concepts expressible with allowed words.`,
    `Title: ${input.title}`,
    `Theme: ${input.theme}`,
    `Pattern: ${input.patternId}`,
    `Pages: ${input.pageCount}`,
    `Allowed sample (representative only): ${input.sampleAllowed.join(", ")}`,
    `Produce exactly ${input.pageCount} bullets, one per page, 5–12 words each, no commas. Format:`,
    `Page 1: ...`,
    `Page 2: ...`,
  ].join("\n")
}

export function buildDraftPagePrompt(input: {
  outlineBullet: string
  allowedWords: string[]
  rules: RuleConfig
}): string {
  const c = input.rules
  return [
    `You write decodable page text. If a word is not in ALLOWED_WORDS, do not invent a synonym. Use only ALLOWED_WORDS.`,
    `ALLOWED_WORDS: ${input.allowedWords.join(", ")}`,
    `Constraints: sentences ${c.maxSentencesPerPage}; tokens per sentence ${c.sentenceLengthBounds.min}–${c.sentenceLengthBounds.max}; punctuation: ${Array.from(c.allowedPunctuation).join(" ")}; proper nouns: ${c.disallowProperNouns ? "disallowed" : "allowed"}.`,
    `Outline: ${input.outlineBullet}`,
    `Output: page text only. No explanations.`,
  ].join("\n")
}

export function buildRepairPrompt(input: {
  originalText: string
  violations: { token: string; reason: string }[]
  allowedWords: string[]
  rules: RuleConfig
  strategy: "minimal" | "rewrite"
}): string {
  const v = input.violations.map(v => `token="${v.token}", reason="${v.reason}"`).join("\n")
  if (input.strategy === "minimal") {
    return [
      `You are a repair agent. Replace only offending tokens. Keep all other tokens intact.`,
      `Original: ${input.originalText}`,
      `Violations:\n${v}`,
      `ALLOWED_WORDS: ${input.allowedWords.join(", ")}`,
      `If any token is not repairable with ALLOWED_WORDS, write [UNK] in its place.`,
      `Output: repaired page text only.`,
    ].join("\n")
  } else {
    return [
      `Rewrite the page under the same constraints; prioritize clarity and decodability.`,
      `Original: ${input.originalText}`,
      `ALLOWED_WORDS: ${input.allowedWords.join(", ")}`,
      `Output: final page text only.`,
    ].join("\n")
  }
}

