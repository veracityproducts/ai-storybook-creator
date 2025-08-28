## Story Text Pipeline — Implementation Plan (Updated with Scaffolding)

Purpose
- Design and implement the decodable story generator with strict phonics scope.
- Keep modules framework-agnostic and DI-friendly so we can lift them into services/packages later.

Status: Scaffolded
- Types and contracts: lib/pipeline/text/types.ts
- Word bank + cache: lib/pipeline/text/wordbank.ts
- Validation engine: lib/pipeline/text/rules.ts
- Prompt builders: lib/pipeline/text/prompts.ts
- Authoring orchestrator: lib/pipeline/text/author.ts
- Repair loop: lib/pipeline/text/repair.ts
- Compile entrypoint: lib/pipeline/text/compile.ts
- AI client (stub): lib/pipeline/text/clients/aiClient.stub.ts
- AI client (Gemini via ai-sdk/google): lib/pipeline/text/clients/aiClient.gemini.ts
- DB client (stub): lib/pipeline/text/clients/dbClient.stub.ts
- DB client (Supabase): lib/pipeline/text/clients/dbClient.supabase.ts
- Example script: scripts/compile-text-example.ts

Public API to call now
- compileStoryText(ai, db, opts, maxAttemptsPerPage?) → { story, report }
- draftStory(ai, opts, allowedWords) → Story
- validateStory(story, rules) → Violation[]
- repairStory(ai, story, allowedWords, rules, maxAttemptsPerPage?) → { story, report }

AI and DB integrations
- AIClient
  - Use GeminiAIClient (aiClient.gemini.ts) with ai-sdk/google. Reads GOOGLE_GENERATIVE_AI_API_KEY.
- DBClient
  - Use SupabaseDBClient (dbClient.supabase.ts) with SUPABASE_URL and SUPABASE_SERVICE_ROLE(_KEY).

Prompts and flow
1) Outline → buildOutlinePrompt() → ai.outline() → string[] bullets
2) Per-page draft → buildDraftPagePrompt() → ai.draftPage()
3) Validate → validateStory()/validatePage()
4) Repair (bounded) → buildRepairPrompt() → ai.repairPage() (minimal, then rewrite)

Validation rules (defaults; overridable via pattern_rules)
- Allowed vocabulary only (approved_words by patternId)
- Sentences: 1–2 per page; 3–8 tokens each
- Allowed punctuation: . ? !
- Morphology toggles: plural -s, past -ed, gerund -ing
- No proper nouns unless whitelisted

How to try it locally (stubbed)
- ts-node scripts/compile-text-example.ts
- Or import compileStoryText with StubAIClient/StubDBClient in a test harness

How to switch to real AI/DB
- npm install ai @ai-sdk/google @supabase/supabase-js
- Replace stubs:
  - const ai = new GeminiAIClient({ model: "gemini-2.0-flash" })
  - const db = new SupabaseDBClient()
- Ensure env: GOOGLE_GENERATIVE_AI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE(_KEY)

Next steps (text pipeline)
- Add candidate suggestion helpers for minimal repair (edit distance, rime similarity)
- Add unit tests for rules/tokenization/morphology
- Optional: Expose /api/compile-story-text for local testing (thin route calling compileStoryText)

Image pipeline extraction (in progress)
- New modules created:
  - lib/pipeline/image/types.ts
  - lib/pipeline/image/compilePage.ts
  - lib/pipeline/image/compileStory.ts
- Current route still in control: app/api/compile-book/route.ts
- Note: compilePage currently uploads variants internally. We will decide whether to:
  - A) Keep uploads inside compilePage, and adapt route accordingly, or
  - B) Refactor compilePage to be pure (no side effects) and move uploads back to caller for precise anchoring + repair ordering.
- Recommendation: adopt B for maximal composability (anchor updates depend on chosen base64; repair currently happens pre-upload in the route). A small change to compilePage to return chosenBase64 and to optionally skip upload can support either strategy.

Planned wiring (low-risk)
- Adjust lib/pipeline/image/compilePage to optionally skip upload (upload=false) and return { variants, qaScores, pickedIndex } + chosenBase64.
- Modify route to call compilePage(upload=false), then keep existing repair + upload order; upload only the final chosen/repaired set.

Testing
- Add unit tests for text rules and prompts assembly
- Add a stubbed vision QA test for seating repair path in image pipeline

Ownership
- This plan lives here and is canonical for the text pipeline. The image pipeline refactor will reference these modules as we separate concerns.

