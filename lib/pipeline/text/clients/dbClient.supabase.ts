// Supabase-backed DBClient implementation
// Uses service role key (server-side only). Schema assumptions:
// - approved_words(word text, pattern_id text)
// - pattern_rules(pattern_id text primary key, config jsonb)

import { createClient } from "@supabase/supabase-js"
import type { DBClient, PatternId, RuleConfig } from "../types"

function getClient() {
  const url = process.env.SUPABASE_URL as string
  const key = (process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY) as string
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE[_KEY]")
  return createClient(url, key)
}

export class SupabaseDBClient implements DBClient {
  async getApprovedWords(patternId: PatternId): Promise<string[]> {
    const sb = getClient()
    const { data, error } = await sb
      .from("approved_words")
      .select("word")
      .eq("pattern_id", patternId)
      .order("word", { ascending: true })
    if (error) throw error
    return (data || []).map((r: any) => String(r.word).toLowerCase())
  }

  async getRuleConfig(patternId: PatternId): Promise<Partial<RuleConfig> | null> {
    const sb = getClient()
    const { data, error } = await sb
      .from("pattern_rules")
      .select("config")
      .eq("pattern_id", patternId)
      .maybeSingle()
    if (error) throw error
    if (!data?.config) return null

    const cfg = data.config as any
    const out: Partial<RuleConfig> = {}
    if (cfg.allowedPunctuation) out.allowedPunctuation = new Set<string>(cfg.allowedPunctuation)
    if (cfg.disallowProperNouns !== undefined) out.disallowProperNouns = !!cfg.disallowProperNouns
    if (cfg.contractionsAllowed !== undefined) out.contractionsAllowed = !!cfg.contractionsAllowed
    if (cfg.morphology) {
      out.morphology = {
        plural_s: !!cfg.morphology.plural_s,
        past_ed: !!cfg.morphology.past_ed,
        gerund_ing: !!cfg.morphology.gerund_ing,
      }
    }
    if (cfg.sentenceLengthBounds) out.sentenceLengthBounds = cfg.sentenceLengthBounds
    if (cfg.maxSentencesPerPage !== undefined) out.maxSentencesPerPage = cfg.maxSentencesPerPage
    if (cfg.properNounsWhitelist) out.properNounsWhitelist = new Set<string>(cfg.properNounsWhitelist.map((w: string) => w.toLowerCase()))
    return out
  }
}

