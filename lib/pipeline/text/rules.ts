import type { RuleConfig, Violation, Story } from "./types"

export function defaultRuleConfig(): RuleConfig {
  return {
    allowedWords: new Set<string>(),
    allowedPunctuation: new Set([".", "?", "!"]),
    disallowProperNouns: true,
    contractionsAllowed: false,
    morphology: { plural_s: true, past_ed: false, gerund_ing: true },
    sentenceLengthBounds: { min: 3, max: 8 },
    maxSentencesPerPage: 2,
    properNounsWhitelist: new Set<string>(),
  }
}

export function tokenize(text: string): { tokens: string[]; spans: Array<[number, number]> } {
  const tokens: string[] = []
  const spans: Array<[number, number]> = []
  let i = 0
  const re = /[^\s]+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const raw = m[0]
    tokens.push(raw)
    spans.push([m.index, m.index + raw.length])
    i++
  }
  return { tokens, spans }
}

export function toCanonical(token: string): string {
  return token
    .normalize("NFKC")
    .replace(/[“”‘’]/g, '"')
    .replace(/[—–]/g, "-")
    .replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "")
    .toLowerCase()
}

export function validateStory(story: Story, rules: RuleConfig): Violation[] {
  const violations: Violation[] = []
  for (const page of story.pages) {
    const v = validatePage(page.text, rules, page.index)
    violations.push(...v)
  }
  return violations
}

export function validatePage(text: string, rules: RuleConfig, pageIndex = 0): Violation[] {
  const out: Violation[] = []
  const { tokens } = tokenize(text)

  // Basic structure: sentence count and length bounds
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean)
  if (sentences.length > rules.maxSentencesPerPage) {
    out.push({ pageIndex, token: "<sentences>", reason: "structure", note: "too many sentences" })
  }
  for (const s of sentences) {
    const len = s.split(/\s+/).filter(Boolean).length
    if (len < rules.sentenceLengthBounds.min || len > rules.sentenceLengthBounds.max) {
      out.push({ pageIndex, token: s, reason: "length" })
    }
  }

  // Token-level checks
  for (const t of tokens) {
    const canon = toCanonical(t)
    if (!canon) continue
    if (!rules.allowedWords.has(canon)) {
      out.push({ pageIndex, token: canon, reason: "out_of_scope" })
      continue
    }
    // morphology (simple heuristics)
    if (!rules.morphology.plural_s && /[a-z]s$/.test(canon)) out.push({ pageIndex, token: canon, reason: "morphology" })
    if (!rules.morphology.past_ed && /[a-z]ed$/.test(canon)) out.push({ pageIndex, token: canon, reason: "morphology" })
    if (!rules.morphology.gerund_ing && /[a-z]ing$/.test(canon)) out.push({ pageIndex, token: canon, reason: "morphology" })
  }

  // Punctuation: allow only configured set
  const badPunct = (text.match(/[^A-Za-z0-9\s]/g) || []).filter(ch => !rules.allowedPunctuation.has(ch))
  for (const p of badPunct) out.push({ pageIndex, token: p, reason: "punctuation" })

  return out
}

