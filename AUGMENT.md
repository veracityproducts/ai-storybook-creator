## AUGMENT.md — Rules, Guardrails, and Operating Doctrine (for the Agent)

This document is the authoritative operating manual for this repository. It encodes design rules, constraints, defaults, and procedures I (the Augment Agent) must follow. It is optimized for precision, not simplicity.


## 1) Scope and Ownership

Owns
- Image pipeline: prompt assembly, reference anchoring, variant generation, QA scoring/selection, seated-page repair, storage
- (Planned) Text pipeline: decodable drafting, validation against approved words, repair strategies

Non-goals
- End-user UI (lives in the main app). This repo exposes headless services / SDKs


## 2) Architectural Principles

- Separation of concerns: Libraries (pure) vs Services (thin HTTP) vs Apps (orchestrators only)
- Dependency injection: No deep reads of process.env in core functions; accept configs/adapters in function args
- Deterministic fallbacks: Never return null for core signals (qaScores, decisions). Provide safe defaults
- Repair not retry-by-default: One bounded repair attempt (STYLE_AND_SUBJECT) for seated pages when QA flags
- Idempotence and reproducibility: Surfaces accept explicit seeds/options when available; maintain storyId for traceability
- Observability-first: Always log model, variant counts, selections, and page indexes (within privacy constraints)


## 3) Defaults (Locked)

Anchoring
- anchorFrom = auto (page 1 winner anchors subsequent pages)
- anchorPolicy = rolling (each page anchors from prior page’s pick)
- referenceType default = SUBJECT; only escalate to STYLE_AND_SUBJECT during repair on QA failure (wardrobe/species/action)

Prompting
- Identity block from Character DNA
- Wardrobe lock: DO NOT ALTER colors/garments; no substitutions
- Consistency: facial proportions, head-to-body ratio, physique, relative height/scale across pages
- Action cues with lens/shot:
  - Running: 35mm; medium; eye-level; 3/4 view; mid‑stride; foot off ground; elbows ~90°; slight forward lean; leg-only motion blur; shadow under lifted foot; crisp faces
  - Sitting: 35mm; medium; eye-level; slight lateral angle; hips on bench; knees ~90°; feet flat; hands engaged
- Species lock:
  - Emma (rabbit): long upright ears above head; small cotton tail; short/rounded muzzle; never bushy fox tail
  - Sam (fox): triangular ears; long bushy tail; slender snout

QA (Vision Grader)
- Model: gemini-2.5-flash (env overridable)
- QAScore fields: bothPresent, wardrobeOk, proportionsOk, actionOk, speciesOk, artifactPenalty, totalScore, notes
- Scoring weights: bothPresent 0.35; wardrobeOk 0.20; proportionsOk 0.20; actionOk 0.10; speciesOk 0.15; composite − 0.1×artifactPenalty
- JSON-only enforcement with extraction; if parsing fails, emit deterministic fallback and optionally include qaRaw

Variants
- Service frequently returns 2 variants per call. For seated pages, attempt best-of-3 via a two-call merge with de-duplication; if still <3 unique, proceed


## 4) Service Contracts (External)

Image Service
- POST /compile-story → { pages: [{ variantUrls, pickedVariantIndex, qaScores, url }], storyId, costInfo }
- POST /compile-page → { variantUrls, pickedVariantIndex, qaScores, url }
- Health: GET /health; Version: GET /version

Text Service (planned)
- POST /draft-story → { story, meta }
- POST /validate → { pass, violations[] }
- POST /repair → { story, pass, iterations }

SDKs
- @clients/image: compileStory(), compilePage()
- @clients/text: draft(), validate(), repair()


## 5) Internal Module Boundaries

- lib/prompts: builders for identity, wardrobe lock, consistency, negatives, action cues, species lock
- lib/characters: Character DNA registry (Sam_v1, Emma_v1, … Lily_v1, Ollie_v1)
- lib/images/imagen-gemini: Imagen wrapper (generateImagenImage)
- lib/images/variant-qa: Vision QA scorer/picker (pickBestVariant)
- lib/images/merge-variants: best-of-N collector with de-duplication
- app/api/compile-book/route.ts: Orchestrator (to be extracted to packages/pipeline-image)


## 6) Prompting Canon

Identity block (composeDNA)
- Use CharacterDNA: name, identity, physical, styleIdentity, behavioral, context

Wardrobe lock
- Per character: "<name> wardrobe: <styleIdentity>. DO NOT ALTER colors or garments; no substitutions; enforce wardrobe consistency across all pages."

Consistency
- "Reuse exact character identity from previous pages; maintain facial proportions, head-to-body ratio, physique, and relative height/scale as prior pages; poses may change to depict the action."

Species lock (examples)
- Fox vs Rabbit rules as above. For new species, define at least ears, tail, snout as disambiguators

Action cues
- Running/Sitting as above. Adding new actions requires:
  1) Body mechanics (objective cues)
  2) Camera recipe (lens, shot, angle, height)
  3) Negative posture constraints (what must not happen)

Negatives library (non-exhaustive)
- no extra limbs; no extra heads; no duplicates; no text overlays; no logos; avoid harsh shadows; no jeans; no backpacks; do not omit co-characters


## 7) QA Doctrine

Rubric
- bothPresent: both characters in frame; scale within reasonable tolerance
- wardrobeOk: exact garments/colors as wardrobe lock
- proportionsOk: identity preservation; head-to-body ratio; relative height/scale vs prior pages
- actionOk: requested action mechanics clearly depicted
- speciesOk: ears/tail/snout match species rules
- artifactPenalty: extra limbs/heads, text, harsh shadows, deformations

Parser
- Extract first JSON object from the grader output; strict schema; if parse fails → deterministic fallback (never null)

Selection and ties
- Highest composite wins; tie-breakers stable (current: earlier index). May adopt policy: prefer later variant on exact ties (document via ADR)


## 8) Repair Policy (Seated Page)

Trigger
- If chosen seated variant fails any of wardrobeOk, speciesOk, actionOk

Action
- Re-run same prompt with STYLE_AND_SUBJECT anchoring (keeping reference image constant) to clamp wardrobe/materials; re-score and re-pick

Bounds
- Single repair attempt per seated page; do not chain multiple repairs


## 9) Decodability/Text Pipeline (Planned Rules)

- Data source: Supabase approved_words and pattern rules
- Validator: rejects out-of-scope words; flags violations with (pageIndex, token, reason)
- Repair: minimal span edits first; iteration cap; no introduction of out-of-scope vocabulary
- Agents: Use Gemini 2.0 via ai-sdk/google; deterministic prompts; record provenance of changes (optional)


## 10) Configuration and Secrets

Env
- GOOGLE_GENERATIVE_AI_API_KEY (both Imagen+Gemini)
- IMAGE_MODEL_MAIN (Imagen)
- IMAGE_QA_MODEL (Gemini; default gemini-2.5-flash)
- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (text pipeline only; never expose to browser)

Injection vs Env
- Core functions accept config objects; env reads are limited to service entry points


## 11) Observability and Reliability

Logging (min)
- storyId; model names; per-page variant count; pickedVariantIndex; referenceType used; whether repair triggered; QA composite summary

Timeouts
- Generation: enforce reasonable per-page timeout; fail fast on repeated transport errors
- QA: short timeouts; deterministic fallback on parse failure

Backoffs
- Merge-variants calls: small delay between calls; stop when min count achieved or after 2 tries


## 12) Testing Strategy

Unit tests
- Prompt builders: wardrobe/consistency/species lock assembly
- Variant QA: parser extraction, composite scoring, tie logic
- Merge-variants: de-duplication and min-count logic

Golden tests
- Small story fixtures by pattern; ensure stable QA selection behaviors

Smoke
- Compile single-page with stubbed generator and deterministic QA


## 13) Change Management

- Changes to weights, anchoring policy, repair triggers require ADR entries in docs/ADRS
- Maintain semantic versioning for SDKs (@clients/*)
- Document new actions/species additions in prompts and DNA registry


## 14) Rule Cards (IDs)

- R-IMG-001 Anchoring: SUBJECT for pose changes; STYLE_AND_SUBJECT only on repair retry
- R-IMG-002 Auto/Rolling: anchorFrom=auto; anchorPolicy=rolling (defaults)
- R-IMG-003 Lens/Shot: 35mm; medium; eye-level; 3/4 (run), lateral (sit)
- R-IMG-004 Species: Rabbit vs Fox ear/tail/snout constraints enforced
- R-IMG-005 Wardrobe: DO NOT ALTER garments/colors across pages
- R-IMG-006 QA Weights: 0.35/0.20/0.20/0.10/0.15 minus 0.1×artifactPenalty
- R-IMG-007 Repair: One attempt with STYLE_AND_SUBJECT if seated QA fails
- R-TXT-001 Decodability: Approved words only; minimal-span repair first


## 15) Monorepo/Packages Guidance (when extracted)

- apps/: image-service, text-service (thin HTTP)
- packages/: pipeline-image, pipeline-text, prompts, characters, storage, types, clients
- Workspaces: use tsconfig base paths; avoid env reads inside packages


## 16) Links

- Handoff walkthrough: docs/Illustration-Pipeline-Handoff.md
- ADRs: docs/ADRS

