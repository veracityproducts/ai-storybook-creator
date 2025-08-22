// Deterministic decodability validator
import { PhonicsConfig, Story, ValidationReport } from "./schemas"

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z\s.!?,]/g, " ") // keep limited punctuation visible; strip others
    .split(/\s+/)
    .filter(Boolean)
}

export function validateStoryDecodability(story: Story, cfg: PhonicsConfig): ValidationReport {
  const approved = new Set(cfg.approvedWords.map(w => w.toLowerCase()))
  const hearts = new Set(cfg.heartWords.map(w => w.toLowerCase()))
  const banned = new Set(cfg.bannedWords.map(w => w.toLowerCase()))
  const allowedPunc = new Set(cfg.allowedPunctuation)

  const issues: string[] = []
  const offending = new Set<string>()

  // Check each page
  for (let i = 0; i < story.pages.length; i++) {
    const page = story.pages[i]

    // Sentence count (naive by punctuation)
    const sentences = page.text.split(/(?<=[.!?])/).filter(s => s.trim().length > 0)
    if (sentences.length < 1 || sentences.length > cfg.maxSentencesPerPage) {
      issues.push(`Page ${i + 1}: sentence count ${sentences.length} out of bounds`)
    }

    // Punctuation check
    const punctMatches = page.text.match(/[.!?,]/g) || []
    for (const p of punctMatches) {
      if (!allowedPunc.has(p)) {
        issues.push(`Page ${i + 1}: punctuation '${p}' not allowed`)
      }
    }

    // Word decodability
    const words = tokenize(page.text)
    for (const w of words) {
      if (/[.!?,]/.test(w)) continue // skip punctuation remnants
      if (banned.has(w)) {
        offending.add(w)
        issues.push(`Page ${i + 1}: banned word '${w}'`)
      } else if (!(approved.has(w) || hearts.has(w))) {
        offending.add(w)
      }
    }
  }

  if (offending.size) {
    issues.push(`Out-of-lexicon words: ${Array.from(offending).join(", ")}`)
  }

  return {
    valid: issues.length === 0 && offending.size === 0,
    issues,
    offendingWords: Array.from(offending),
  }
}

