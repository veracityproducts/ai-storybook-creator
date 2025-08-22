# Prompt Library for Decodable Readers

This folder contains production-ready prompt templates for Gemini 2.0 tailored to decodable readers with a strict phonics scope-and-sequence. Each template is portable and can be used with ai-sdk or the Google official SDK.

How to use
- Perform variable substitution before sending to the model. Variables are shown as ${likeThis}.
- For multi-step flows, pass outputs from prior steps (e.g., outline, style bible) into later prompts.
- Always enforce a strict output schema in code and validate deterministically after the model returns text.

Files
- system.md — global system instruction
- outline.md — optional outline (planning) prompt
- story-json.md — strict JSON story generation
- guardrail-validate.md — LLM validator for explanations
- guardrail-repair.md — LLM repair to rewrite with allowed words
- style-bible.md — one-time style bible per story (now ends with a “Style Tokens” line)
- style-tokens.md — distills Style Bible to a single-line “Style Tokens” string
- image-system-tokens.md — constant modifiers appended to every image prompt
- image-page.md — returns a single-line “page prompt body”; final prompt is page body + Style Tokens + System Tokens
- alt-text.md — decodable alt text for accessibility

Imagen 3 usage (Gemini API)
- Model: imagen-3.0-generate-001 (or current)
- Aspect ratio: choose and reuse; portrait recommended for books (e.g., 4:5 like 1536×1920)
- Guidance scale: start at 5.0; tune 4–7
- Safety: safety_filter_level "BLOCK_LOW_AND_ABOVE" (or stricter); person_generation set per policy
- Consistency: prepend the same Style Tokens and System Tokens to all page prompts; keep wording stable

Notes
- Keep ApprovedWords/HeartWords/BannedWords lowercase in both prompts and validation.
- The true pass/fail gate should be your deterministic validator, not the LLM. The LLM validator is for explainability and repair guidance.
- You can start with Gemini and swap providers later; prompts remain compatible.

