# Decodable Services Summary

This document summarizes the services, SDKs, and internal modules used to perform each main function in the decodable reader pipeline.

## Legend
- Service: Third-party API or SDK
- Module: Local code module in this repo
- File: Source file path in this repo

---

## 1) Phonics Pattern Selection & Enforcement
- Purpose: Define and enforce the phonics scope-and-sequence for decodability
- Module: Phonics Pattern Registry
- File: `lib/phonics-patterns.ts`
- Key Functions:
  - `PHONICS_PATTERNS` — Static registry of supported patterns
  - `getPhonicsPattern(id)` — Lookup by ID
  - `createPhonicsConfig(patternId, characterMappings?)` — Build PhonicsConfig with defaults
  - `getDefaultCharacterMappings()` — Canonical characters (Sam the fox, Emma the rabbit, etc.)
- Consumed by:
  - API: `app/api/compile-book/route.ts`
  - UI: `components/phonics-pattern-selector.tsx`, `app/book/page.tsx`

---

## 2) Story Authoring (Text Generation)
- Purpose: Generate strictly decodable story JSON
- Service: Google Gemini 2.0 via `ai-sdk`
- SDK: `@ai-sdk/google` + `ai` (`generateText`, `generateObject`)
- Module: Story Generation
- File: `lib/decodability/generation.ts`
- Key Functions:
  - `generateStoryJSON(cfg)` — Uses prompts `prompts/system.md` + `prompts/story-json.md` and validates with `StorySchema`
  - `loadPrompt(name)` — Loads prompt templates from `/prompts`
- Inputs:
  - `PhonicsConfig` (from pattern or request)
  - `title`, `theme`, `ageRange`
- Output:
  - `Story` (typed via `lib/decodability/schemas.ts`)

---

## 3) Style Bible + Style Tokens (Visual Consistency)
- Purpose: Derive a repeatable visual style for all illustrations
- Service: Google Gemini 2.0 via `ai-sdk`
- Module: Style Generation
- File: `lib/decodability/generation.ts`
- Key Functions:
  - `generateStyleBible(title, theme)` — Prompt: `prompts/style-bible.md`
  - `generateStyleTokens(styleBible)` — Prompt: `prompts/style-tokens.md`
  - `loadImageSystemTokens()` — Constant modifiers from `prompts/image-system-tokens.md`
- Output:
  - `styleBible` (string)
  - `styleTokens` (comma-delimited string)
  - `imageSystemTokens` (string)

---

## 4) Image Prompt Authoring (Per Page)
- Purpose: Convert page text into a concise illustration prompt
- Service: Google Gemini 2.0 via `ai-sdk`
- Module: Page Prompt Generation
- File: `lib/decodability/generation.ts`
- Key Function:
  - `generatePageImagePrompt(styleBible, pageText, imageSystemTokens, characterMappings?)`
    - Replaces character names with detailed descriptors for consistency
- Output:
  - Short, vivid image prompt body string

---

## 5) Image Generation (Illustrations)
- Purpose: Generate high-quality images for each page
- Service: Google Imagen 4 Fast
- SDK: `@google/genai` (Google GenAI SDK)
- Module: Imagen Helper
- File: `lib/images/imagen-gemini.ts`
- Key Function:
  - `generateImagenImage(prompt, config)` — Calls `ai.models.generateImages`
- Config Used:
  - `model: "imagen-4.0-fast-generate-001"`
  - `aspectRatio: "3:4"`
  - `personGeneration: "allow_adult"`
- Output:
  - `{ base64, mimeType }`

---

## 6) Image Storage (Public URLs)
- Purpose: Persist generated images and expose public URLs
- Service: Supabase Storage (Public bucket)
- SDK: `@supabase/supabase-js`
- Module: Storage Helper
- File: `lib/storage/supabase` (referenced from `compile-book`)
- Key Functions (implied from usage):
  - `uploadBase64Image(base64, mimeType, key, { makePublic, upsert })`
  - `buildImagePath(storyId, pageIndex, ext)`
- Output:
  - `{ url }` — Public URL to the uploaded asset

---

## 7) Decodability Validation & Repair
- Purpose: Ensure story is strictly decodable per selected pattern
- Module: Deterministic Validator + Repair Agent
- Files:
  - Validator: `lib/decodability/validate.ts`
  - Schemas: `lib/decodability/schemas.ts`
  - Repair (LLM): `lib/decodability/generation.ts` + `prompts/guardrail-repair.md`
- Key Functions:
  - `validateStoryDecodability(story, cfg)` — Deterministic check
  - Repair loop (in `compile-book`): up to 3 LLM repair attempts as needed
- Services Used:
  - Validation: Pure TypeScript
  - Repair: Google Gemini 2.0 via `ai-sdk`

---

## 8) Book Compilation API
- Purpose: Orchestrate end-to-end generation for a full book
- Framework: Next.js Route Handler (Node runtime)
- File: `app/api/compile-book/route.ts`
- Responsibilities:
  - Parse request and build `PhonicsConfig` (pattern or manual)
  - Generate style bible/tokens/system tokens
  - Generate story JSON
  - Validate and repair if needed
  - Generate and upload page images
  - Assemble final `book` object with `costInfo` and `metadata`
- External Services Invoked:
  - Gemini 2.0 (style, story, prompts)
  - Imagen 4 Fast (images)
  - Supabase Storage (hosting)

---

## 9) Reader UI (Web)
- Purpose: Display the compiled book and enable PDF export
- Framework: Next.js + React + Tailwind + shadcn/ui
- Files:
  - Component: `components/book-reader.tsx`
  - Page: `app/book/page.tsx`
  - UI Elements: `components/ui/*` (button, card, badge, etc.)
- Features:
  - Fullscreen reading mode
  - Page navigation controls and dots
  - Image loading indicators
  - Cost/moral footer

---

## 10) PDF Export
- Purpose: Export a compiled book as a high-quality PDF
- Library: `jspdf` (primary), `html2canvas` (for image capture if needed)
- Module: PDF Exporter
- File: `lib/pdf-export.ts`
- Key Class/Function:
  - `BookPDFExporter(book, options)` → `exportToPDF()`
  - `exportBookToPDF(book, options?)` convenience wrapper
- Output:
  - Saved PDF file with cover, pages, and back cover

---

## 11) Notifications & UX
- Purpose: User feedback during long operations
- Library: `sonner`
- Files:
  - Provider: `components/ui/sonner.tsx`
  - Usage: `app/book/page.tsx` (toast on success/error)

---

## 12) Configuration & Environment
- Environment Variables:
  - `GOOGLE_GENERATIVE_AI_API_KEY` — Required for Gemini/Imagen
- Styling/Framework:
  - Tailwind config: `tailwind.config.ts`, base CSS: `app/globals.css`
- Routing/Runtime:
  - Next.js 15 Route Handlers and App Router

---

## 13) Cost Model
- Image generation cost tracked per book
- Source: `compile-book` response `costInfo`
  - `costPerImage: 0.02` (Imagen 4 Fast)
  - `totalImageCost: images * 0.02`

---

## Quick Map: Function → Service
- Write story text → Gemini 2.0 (ai-sdk)
- Create visual style → Gemini 2.0 (ai-sdk)
- Derive style tokens → Gemini 2.0 (ai-sdk)
- Author per-page image prompt → Gemini 2.0 (ai-sdk)
- Generate images → Imagen 4 Fast (@google/genai)
- Store images → Supabase Storage (@supabase/supabase-js)
- Validate decodability → Local TypeScript (deterministic)
- Repair violations → Gemini 2.0 (ai-sdk)
- Compile book → Next.js route handler
- Display reader → React + shadcn/ui
- Export PDF → jsPDF (+ html2canvas if needed)
- Notify user → sonner



---

## Optional Upgrades by Service (excluding Supabase, ai-sdk, @google/genai)

Below are recommended, optional upgrades for the non-LLM/storage layers to increase reliability, print fidelity, and UX.

### Next.js Orchestration (Route Handlers)
- Stream progress via SSE for long-running jobs, or switch to background jobs (Vercel Queues) with polling
- Add rate limiting and idempotency keys to dedupe repeated submissions
- Consider Edge Runtime for short, compute-light tasks (e.g., style tokens)

### PDF Export (jsPDF + html2canvas)
- Server-side render with Playwright/Puppeteer for print-perfect PDFs (fonts, pagination)
- Adopt @react-pdf/renderer for componentized PDF UIs and deterministic page breaks
- Post-process with pdf-lib (merge, bookmarks, embed fonts/images, metadata)

### Reader UI (React + shadcn/ui + Tailwind)
- Add Framer Motion for page transitions and reduced motion accessibility
- Enable pinch-zoom/pan on images (react-zoom-pan-pinch) and keyboard/swipe navigation
- Internationalization with next-intl and RTL support

### Validation Engine (TypeScript)
- Add morphology guards (-ing/-ed) and per-page unique word limits
- Package the validator as a standalone library with tests and fixtures

### Notifications (sonner)
- Integrate Sentry (error tracking + session replay) and surface actionable toasts
- Implement progress toasts linked to background job states

### Observability & Performance
- Vercel Analytics for page usage; custom events for Generate/PDF actions
- OpenTelemetry traces around the compile-book pipeline
- Redis (Upstash) caching for style bibles/tokens to reduce LLM calls
