# Decodable Reader Orchestrator (Gemini-only) — Architecture and Implementation Plan

## FEATURE
A Python service (FastAPI + LangGraph + PydanticAI) that generates a 5-page decodable reader and matching images with high identity continuity using Gemini 2.5 Flash Image (now stable and generally available). The pipeline enforces a strict phonics scope/sequence (e.g., initial blends), vocabulary constraints (words < 5 letters, heart words, whitelist), and two sentences per page, then renders one image per page. Identity continuity is maintained without predefined characters using:
- Rolling conditioning: include previous panel(s) as references
- Appearance tokens: concise wardrobe/body descriptors extracted from the first chosen panel

MVP endpoint (preview only):
- POST /preview/compile-blends-illustrated
- Input: patternId, title, theme, pageCount=5, sampleCount, threeShot (bool), heartWords, whitelist
- Output: { ok, title, validation, pages: [{ index, text, imageBase64, mimeType, qa? }] }

The design mirrors the working example in prp/langgraph/PRPs/examples/langgraph-pydantic-ai-agents with:
- One Orchestrator agent (owns the DAG, calls tools)
- One Guardrail agent (authoritative decodability validator/repairer)
- Plain Python tools for text, prompts, identity/continuity, images, QA, and storage (optional)


## TOOLS
A) Text + Phonics
1) tool.config.phonics — Build PhonicsConfig with patternId and constraints; merge heartWords + whitelist; enforce maxWordLen and maxSentencesPerPage.
2) tool.story.generate_decodable — Draft a multi-page story obeying PhonicsConfig.
3) tool.story.validate — Validate decodability; return { valid, offendingWords[], issues[] }.
4) tool.story.repair — Minimal repairs up to N passes; return repaired story + final validation.

B) Prompting
5) tool.prompts.page_prompt — Camera-ready per-page prompt with SUBJECT-style slotting, lens (35mm), eye-level, composition rules, and appearanceSummary tokens. Supports threeShot (adds a taller, heavier-set male friend with consistent identity across pages).

C) Identity/Continuity
6) tool.identity.summarize_appearance — From chosen page-1 image, extract concise appearance tokens (per subject slot) using Gemini vision.
7) tool.identity.rolling_conditioning — For page N>1, include chosen image from N-1 (and optionally N-2) as inline references.
8) tool.identity.compare — Compare N vs N-1 for identity/wardrobe continuity; return { sameIdentityOk, notes }.

D) Images
9) tool.image.generate — Generate 1..N image variants via Gemini 2.5 Flash Image Preview, with optional inline refs.
10) tool.image.qa_score_and_pick — Score variants with generic continuity rubric (allPresent, sameIdentityOk, wardrobeConsistencyOk, proportionsOk, actionOk, artifactPenalty) and pick best.
11) tool.image.repair_with_roll — Retry page with stronger continuity (more prior refs; louder appearance tokens) if QA fails.

E) Storage (optional)
12) tool.storage.upload_image — Upload base64 to Supabase; return public URL. Not used in preview unless requested.

F) Utilities
13) tool.cost.estimate_run — Predictive cost only (pageCount × sampleCount × per-image rate). No billing calls.


## DEPENDENCIES (for RunContext)
- google-generativeai (Python): uses GOOGLE_GENERATIVE_AI_API_KEY; models gemini-2.5-flash-image (stable GA) and gemini-2.0-flash-lite (QA)
- fastapi and uvicorn (service endpoints)
- pydantic (schemas)
- langgraph (graph orchestration)
- httpx or requests (optional)
- python-dotenv (optional for local env)
- supabase-py (optional if using storage upload)
- logging/observability (stdlib logging; optional OpenTelemetry later)

Environment variables:
- GOOGLE_GENERATIVE_AI_API_KEY
- SUPABASE_URL, SUPABASE_SERVICE_ROLE, SUPABASE_BUCKET (optional)


## SYSTEM PROMPTS
Orchestrator Agent
- You are the Orchestrator Agent for a decodable reader pipeline. Your job is to produce a 5‑page decodable story and matching images that maintain subject identity consistently without predefined characters.
- Rules:
  - Enforce PhonicsConfig (scope/sequence), max word length, heart words, whitelist, and <=2 sentences/page.
  - Generate story → validate → repair up to cap.
  - Page 1: introduce subjects visually; use SUBJECT slotting; lens 35mm; eye-level; composition: all faces visible; no text/watermarks; no extra people.
  - Pages 2..N: preserve identity and wardrobe using rolling conditioning (include previous chosen panel as reference). For threeShot, include a taller, heavier-set male friend; keep his identity consistent across pages.
  - Generate 1..N variants; if N>1, run QA to pick the best; if continuity fails, retry once with stronger rolling conditioning.
  - Output JSON: { ok, title, validation, pages: [{ index, text, imageBase64, mimeType, qa? }] }.

Guardrail Agent
- You are the Guardrail Agent for decodability. Validate strictly and repair minimally.
- Validation returns { valid, offendingWords[], issues[] }.
- Repair makes the smallest changes to pass constraints while preserving meaning, page count, and sentence count; cap repair passes.

QA Judge (tool prompt)
- Score each variant with: allPresent, sameIdentityOk, wardrobeConsistencyOk, proportionsOk, actionOk, artifactPenalty, totalScore (weighted; clamp [0,1]). Return JSON only.

Appearance Summarizer (tool prompt)
- Extract short, stable appearance tokens per subject and optional global notes. Keep concise and visual (colors/patterns/hair/body type).

Continuity Comparator (tool prompt)
- Compare two images for “same subjects / same wardrobe” and return { sameIdentityOk, notes }.


## IMPLEMENTATION NOTES
- Start with a single preview endpoint (no storage) to mirror your current TS route behavior.
- Keep sampleCount low by default; enable 2–3 when robustness is needed.
- Add optional retries on continuity failure; otherwise return QA scores.
- Later: add storage upload and a book images-only compile endpoint once composition is ready.

## ARTISTIC STYLE CONTINUITY
**Critical constraint:** When human characters (Ben, Kim, or the third friend) are NOT explicitly mentioned in the decodable text, the generated images should still maintain the same illustrative style established by the Ben/Kim reference images. This ensures visual consistency across the entire book even when the story focuses on animals, objects, or other subjects.

**Implementation approach:**
- Always include Ben/Kim reference images in the conditioning stack (even for non-human-character pages) to preserve artistic style (color palette, line work, rendering technique, lighting).
- In the prompt, explicitly state: "Maintain the same illustrative style, color palette, and rendering technique as the reference images, even though human characters are not present in this scene."
- For pages without human characters, the prompt should focus on the decodable text subject (e.g., "Pat the Cat", "Big Pig", "Hot Dog") while anchoring to the artistic style.
- Example prompt structure for non-human pages:
  - "STYLE REFERENCE: maintain the illustrative style, color palette, line work, and lighting from the reference images."
  - "SUBJECT: [animal/object from decodable text, e.g., 'a big pig digging in a pit']"
  - "Scene: [context from text]. Camera: 35mm lens, eye-level, natural color."
  - "Composition: subject clearly visible; no text/watermarks; clean background matching reference style."

