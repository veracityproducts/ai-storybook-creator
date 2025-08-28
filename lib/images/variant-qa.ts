import { GoogleGenerativeAI } from "@google/generative-ai"

export type VariantImage = { base64: string; mimeType?: string }
export type QAScore = {
  bothPresent: boolean
  wardrobeOk: boolean
  proportionsOk: boolean
  actionOk: boolean
  speciesOk: boolean
  artifactPenalty: number
  totalScore: number
  notes?: string
}

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{")
  if (start === -1) return null
  let depth = 0
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

export async function pickBestVariant(
  variants: VariantImage[],
  options: {
    apiKey: string
    model?: string
    requiredCharacters: string[]
    wardrobeSummary: string // concatenated wardrobe lock text
    actionText?: string
  }
): Promise<{ bestIndex: number; scores: QAScore[]; raw?: string[] }> {
  const genAI = new GoogleGenerativeAI(options.apiKey)
  const model = genAI.getGenerativeModel({ model: options.model || process.env.IMAGE_QA_MODEL || "gemini-2.0-flash-lite" })

  const scores: QAScore[] = []
  const raw: string[] = []

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i]

    const system = [
      `You are a strict visual QA grader for children's book illustrations.`,
      `Return EXACTLY ONE JSON object on a single line with keys: bothPresent (boolean), wardrobeOk (boolean), proportionsOk (boolean), actionOk (boolean), speciesOk (boolean), artifactPenalty (0-1), totalScore (0-1), notes (string).`,
      `Do not include any extra text, explanations, code fences, or markdown—only the JSON object.`,
      `Characters expected: ${options.requiredCharacters.join(", ")}.`,
      `Wardrobe must match: ${options.wardrobeSummary}.`,
      `Species check: Emma is a rabbit—long upright ears clearly visible above the head; small round cotton tail; short, rounded muzzle. Sam is a fox—triangular ears; long bushy tail; slender snout. Penalize any mismatch (e.g., triangular fox ears or bushy fox tail on Emma; long upright rabbit ears on Sam).`,
      `If action is provided, ensure it is clearly depicted: ${options.actionText || "(none)"}.`,
      `Penalize artifacts such as extra heads/limbs, text overlays, brand logos, harsh shadows, deformed anatomy.`,
      `Scoring rubric (0-1): bothPresent 0.35, wardrobeOk 0.20, proportionsOk 0.20, actionOk 0.10, speciesOk 0.15; subtract artifactPenalty; clamp totalScore to [0,1].`,
      `Example: {"bothPresent":true,"wardrobeOk":true,"proportionsOk":true,"actionOk":true,"speciesOk":true,"artifactPenalty":0.0,"totalScore":0.92,"notes":"clear sitting; rabbit ears visible; wardrobe matched"}`,
    ].join("\n")

    const res = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: system },
            { inlineData: { data: v.base64, mimeType: v.mimeType || "image/png" } },
          ],
        },
      ],
    })

    let parsed: QAScore = {
      bothPresent: false,
      wardrobeOk: false,
      proportionsOk: false,
      actionOk: false,
      speciesOk: false,
      artifactPenalty: 0.5,
      totalScore: 0,
      notes: "parse-failed",
    }

    try {
      let txt = res.response.text().trim()
      const jsonCandidate = extractFirstJsonObject(txt)
      if (jsonCandidate) txt = jsonCandidate
      raw.push(txt)
      parsed = JSON.parse(txt) as QAScore
    } catch (e) {
      // keep default parsed but capture raw for debugging
      try { raw.push(res.response.text().trim()) } catch { }
    }

    // Clamp values
    parsed.artifactPenalty = Math.max(0, Math.min(1, parsed.artifactPenalty || 0))
    parsed.totalScore = Math.max(0, Math.min(1, parsed.totalScore || 0))

    scores.push(parsed)
  }

  // Choose best by weighted score: reflect species and action importance, penalize artifacts
  let bestIndex = 0
  let bestScore = -Infinity
  for (let i = 0; i < scores.length; i++) {
    const s = scores[i]
    const base = (s.bothPresent ? 0.35 : 0) + (s.wardrobeOk ? 0.20 : 0) + (s.proportionsOk ? 0.20 : 0) + (s.actionOk ? 0.10 : 0) + (s.speciesOk ? 0.15 : 0)
    const composite = Math.max(0, Math.min(1, base)) - (s.artifactPenalty ?? 0) * 0.1
    if (composite > bestScore) {
      bestScore = composite
      bestIndex = i
    }
  }

  return { bestIndex, scores, raw }
}

