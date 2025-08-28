## Handoff: Decodable Illustration Pipeline (Image Generation + QA + Consistency)

Purpose
- Locks in the current image pipeline behind /api/compile-book
- Written for a new engineer joining the project (turnover-ready)
- Scope: prompting, anchoring, auto-variant selection, QA, repair retry, and ops

Outcomes
- Consistent multi-page characters (identity + wardrobe + species)
- Pages depict requested actions with correct body mechanics
- Transparent best-of-N selection with per-variant QA signals


## Quick Start

Prerequisites
- Node 18+ and npm
- .env.local with:
  - GOOGLE_GENERATIVE_AI_API_KEY
  - IMAGE_MODEL_MAIN (e.g., imagen-4.0-generate-001)
  - IMAGE_QA_MODEL (recommended: gemini-2.5-flash)

Run
- Build: npm run build
- Start (local): npx next start -p 3003

Smoke Test (3 pages; standing → running → sitting)
- POST http://localhost:3003/api/compile-book
- Minimal request body fields (see “API Contract”)
- Response returns variantUrls, pickedVariantIndex, qaScores, and storyId


## Architecture Overview

High-level flow
1) Generate style bible + style/system tokens
2) Generate story JSON; run decodability validation + up to 3 repairs
3) For each page:
   - Build prompt from Character DNA + wardrobe lock + consistency + co-occurrence + action cues (with lens/shot) + species lock
   - Set reference anchoring
     - Page 1: generate v0/v1 → auto-pick a “keeper” → becomes reference for next page(s)
     - Page 2+: referenceType SUBJECT by default (permits pose change)
     - If QA flags wardrobe/species/action on a seated page, do one repair retry with STYLE_AND_SUBJECT and re-pick
   - Generate images via Imagen (variants)
   - Score variants via vision QA (Gemini) → auto-pick best
   - Rolling anchor: winner becomes reference for the next page
   - Upload all variants to storage; return URLs + pick + QA

Key modules (reference for onboarding)
- app/api/compile-book/route.ts (orchestrator; anchoring, QA, repair)
- lib/prompts/actions.ts (action/lens/shot micro-prompts)
- lib/prompts/prompt-builder.ts (identity/wardrobe/consistency/negatives)
- lib/characters/dna.ts (Character DNA registry)
- lib/images/imagen-gemini.ts (Imagen SDK wrapper)
- lib/images/variant-qa.ts (Vision QA + scoring)
- lib/images/merge-variants.ts (best-of-3 collector)


## API Contract

Endpoint
- POST /api/compile-book

Request (selected fields)
- title, theme, patternId, maxPages
- activities: string[] per page (e.g., ["standing…", "light jog…", "sitting…"]) 
- anchorFrom: "auto" | "manual" (default: auto)
- anchorPolicy: "page1-only" | "rolling" (default: rolling)
- anchorVariantIndex: number (used if manual)
- sampleCount: baseline variants/page (service effectively ~2)
- sampleCountPage3: target 3 for seated pages (we attempt merge de-dupe)
- negativePrompt: appended negatives; we already add species/wardrobe safety

Response (selected fields)
- ok: boolean; debug.storyId
- book.pages[i]:
  - url: chosen variant URL (picked)
  - variantUrls: string[] (all variants)
  - pickedVariantIndex: number
  - qaScores: QAScore[] (per variant)
  - sampleCount: number actually used
- costInfo: approximate image cost metadata

QAScore (per variant)
- bothPresent: boolean
- wardrobeOk: boolean
- proportionsOk: boolean
- actionOk: boolean
- speciesOk: boolean (ears/tail/snout cues)
- artifactPenalty: number (0–1)
- totalScore: number (0–1)
- notes?: string


## Prompting Strategy (Locked)

Components
- Identity block: built from Character DNA (Sam_v1 fox; Emma_v1 rabbit)
- Wardrobe lock: DO NOT ALTER colors/garments; no substitutions; consistency across pages
- Consistency clause: identity, facial proportions, head-to-body ratio, physique, relative height/scale
- Co-occurrence: both characters appear together
- Negatives: no extra heads/limbs, no duplicate characters, no text overlays/logos, no jeans/backpacks, etc.
- Action micro-prompts + lens/shot:
  - Running: “35mm lens; medium shot; eye-level; 3/4 view; both mid‑stride; one foot off ground; elbows ~90°; slight forward lean; natural arm swing; leg-only motion blur; shadow under lifted foot; faces crisp”
  - Sitting: “35mm lens; medium shot; eye-level; slight lateral angle; hips on bench; knees ~90°; feet flat; hands engaged (holding plate)”
- Species lock:
  - Sam (fox): triangular ears; long bushy tail; slender snout
  - Emma (rabbit): long upright ears clearly visible; small round cotton tail; short/rounded muzzle; no bushy fox tail


## Anchoring Strategy (Defaults)

Defaults
- anchorFrom = auto (use auto-picked page 1 winner as reference)
- anchorPolicy = rolling (each page anchors from the prior page’s pick)

Reference type
- SUBJECT by default for big pose changes (running/sitting)
- STYLE_AND_SUBJECT only on a single repair retry if QA flags wardrobe/species/action on a seated page


## Auto-Selector (Vision QA) and Scoring

Model
- Gemini via @google/generative-ai; IMAGE_QA_MODEL=gemini-2.5-flash (recommended)

Checks per variant
- bothPresent, wardrobeOk, proportionsOk, actionOk, speciesOk, artifactPenalty, totalScore, notes

Weights (composite)
- bothPresent 0.35, wardrobeOk 0.20, proportionsOk 0.20, actionOk 0.10, speciesOk 0.15; subtract 0.1×artifactPenalty

Parser hardening
- Extract first JSON object from model output; if parsing fails, return deterministic fallback and include raw text in debug when requested

Selection
- Best variant by composite; ties currently favor the earliest equal index (tunable)


## Best-of-N and Repair Retry

Variants
- Imagen commonly returns 2 per call; seated pages may benefit from up to 3 → we attempt a short two-call merge (dedupe by base64) to reach 3 when needed

Repair retry (seated pages)
- If chosen seated variant fails QA (wardrobe/species/action), run a one-shot retry with STYLE_AND_SUBJECT and re-run QA selection


## Characters (DNA)

- Sam_v1: friendly cartoon red fox (triangular ears; bushy tail; wardrobe defined)
- Emma_v1: cheerful cartoon rabbit (long upright ears; small cotton tail; short/rounded muzzle; wardrobe defined; explicit “no bushy fox tail”)

Adding new characters
- Add to lib/characters/dna.ts with identity, physical, styleIdentity, behavioral, context
- Make species traits explicit (ears/tail/snout) and wardrobe unambiguous


## Configuration & Ops

Environment
- GOOGLE_GENERATIVE_AI_API_KEY (required)
- IMAGE_MODEL_MAIN (e.g., imagen-4.0-generate-001)
- IMAGE_QA_MODEL (e.g., gemini-2.5-flash)

Runtime
- Build: npm run build
- Start: npx next start -p 3003

Cost
- Imagen cost estimated per image; QA cost is tiny (fractions of a cent per graded image)

Runbook
- For Page 3 issues (species/wardrobe/pose):
  - Verify species lock + lens/shot cues in prompt
  - SUBJECT anchoring in first pass; repair retry escalates to STYLE_AND_SUBJECT if QA flags
  - Rolling anchor ensures the previous winner’s identity/wardrobe carries forward


## Extensibility

- Add actions in lib/prompts/actions.ts with clear mechanics + lens/shot
- Add characters in lib/characters/dna.ts (explicit species traits + wardrobe)
- Tune QA weights in lib/images/variant-qa.ts to favor action vs wardrobe vs species
- Optional: “no-pick” mode for gallery/testing (pickedVariantIndex=null)
- Optional: expose qaRaw in debug payloads to audit grader outputs


## Handoff Checklist

- .env.local updated with Google key; IMAGE_MODEL_MAIN; IMAGE_QA_MODEL=gemini-2.5-flash
- Server running on 3003
- POST /api/compile-book with activities + negatives
- Confirm variantUrls, pickedVariantIndex, qaScores in response
- Defaults in place: anchorFrom=auto; anchorPolicy=rolling; SUBJECT for pose; repair retry for seated pages
- DNA entries correct for species/wardrobe; action cues contain lens/shot


## Notes for Future Work

- Improve variant diversity: prompt jitter and better dedupe for seated pages
- Tighten JSON compliance further or adopt strict JSON mode utilities
- Consider tie-breaker strategies (e.g., prefer later variant on exact ties)

