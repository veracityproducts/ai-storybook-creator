import type { DBClient, PatternId, RuleConfig } from "./types"

// Minimal in-memory cache keyed by patternId
const wordCache = new Map<PatternId, { words: string[]; ts: number }>()
const ruleCache = new Map<PatternId, { rules: Partial<RuleConfig>; ts: number }>()

export async function getApprovedWordsCached(db: DBClient, patternId: PatternId): Promise<string[]> {
  const cached = wordCache.get(patternId)
  if (cached && Date.now() - cached.ts < 5 * 60 * 1000) return cached.words
  const words = await db.getApprovedWords(patternId)
  wordCache.set(patternId, { words, ts: Date.now() })
  return words
}

export async function getRuleConfigCached(db: DBClient, patternId: PatternId): Promise<Partial<RuleConfig>> {
  const cached = ruleCache.get(patternId)
  if (cached && Date.now() - cached.ts < 5 * 60 * 1000) return cached.rules
  const rules = (await db.getRuleConfig(patternId)) || {}
  ruleCache.set(patternId, { rules, ts: Date.now() })
  return rules
}

