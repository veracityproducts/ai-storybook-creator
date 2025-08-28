import { CharacterDNA, composeDNA } from "@/lib/characters/dna"

export function buildIdentityBlock(cast: CharacterDNA[]): string {
  if (!cast || cast.length === 0) return ""
  // Verbatim Character DNA for all cast members to lock identity
  return cast.map(c => composeDNA(c)).join(" ")
}

export function buildCoOccurrenceText(cast: CharacterDNA[]): string {
  if (!cast || cast.length < 2) return ""
  const names = cast.map(c => c.name)
  const last = names.pop()!
  const joined = names.length ? `${names.join(", ")} and ${last}` : last
  return `Show exactly two characters: ${joined}, in the frame, full-body, similar scale; do not omit any character; do not duplicate characters; no third character.`
}

export function buildConsistencyClause(): string {
  return "Reuse the exact character identity from previous pages; maintain identical facial proportions, head-to-body ratio, overall physique, and relative height/scale as prior pages; poses and limb positions may change to depict the action."
}

export function buildWardrobeLock(cast: CharacterDNA[]): string {
  if (!cast || cast.length === 0) return ""
  const lines = cast.map(c => `${c.name} wardrobe: ${c.styleIdentity}. DO NOT ALTER colors or garments; no substitutions; enforce wardrobe consistency across all pages.`)
  return lines.join(" ")
}

export function buildNegativePrompt(cast: CharacterDNA[], userNegative?: string): string {
  const names = cast.map(c => c.name)
  const doNotOmit = names.length >= 2 ? `do not omit ${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}` : ""
  const base = "no extra limbs, no extra heads, no duplicate characters, no text overlays, no brand logos, no weapons, no frightening faces, no deformed anatomy, avoid harsh shadows"
  const wardrobe = "no backpacks, no jeans"
  const custom = userNegative?.trim() || ""
  return [base, wardrobe, doNotOmit, custom].filter(Boolean).join(", ")
}

export function buildFinalPrompt(
  styleAnchor: string,
  identityBlock: string,
  pageBody: string,
  styleTokens: string,
  systemTokens: string,
  coOccurrence: string,
  negative: string
): string {
  const neg = negative ? ` Negative prompt: ${negative}` : ""
  return `${styleAnchor} ${identityBlock} ${pageBody} ${coOccurrence} ${styleTokens} ${systemTokens}${neg}`.trim()
}

export function toComposedMappings(mappings: Record<string, string> | undefined, cast: CharacterDNA[]): Record<string, string> | undefined {
  if (!mappings) return undefined
  // For future: if mappings values are DNA IDs, map them to composed text using the cast
  const composed: Record<string, string> = {}
  for (const [k, v] of Object.entries(mappings)) {
    composed[k] = v
  }
  return composed
}

