import type { DBClient, PatternId, RuleConfig } from "../types"

export class StubDBClient implements DBClient {
  async getApprovedWords(patternId: PatternId): Promise<string[]> {
    // Small fake bank; replace with Supabase-backed client later
    const bank: Record<string, string[]> = {
      "cvce-long-a": ["sam", "emma", "make", "bake", "cake", "we", "they", "at", "and", "a", "the", "wait", "taste", "share", "smile"],
    }
    return (bank[patternId] || ["a", "an", "and", "at", "we"]).map(w => w.toLowerCase())
  }

  async getRuleConfig(patternId: PatternId): Promise<Partial<RuleConfig> | null> {
    return {
      contractionsAllowed: false,
      morphology: { plural_s: true, past_ed: false, gerund_ing: true },
      sentenceLengthBounds: { min: 3, max: 8 },
      maxSentencesPerPage: 2,
    }
  }
}

