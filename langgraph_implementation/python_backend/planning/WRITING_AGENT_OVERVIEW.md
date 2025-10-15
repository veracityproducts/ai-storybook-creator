# Writing Agent Overview — Decodable, Engaging, Safe

Purpose
- Produce engaging, decodable page text under strict phonics/lexicon constraints.
- Balance decodability with fun via micro “page-turn” beats, concrete nouns, and simple actions.

Core inputs to pass the model
- Pattern config (per request):
  - approvedWords, heartWords, bannedWords
  - allowedPunctuation, maxSentencesPerPage
  - morphology flags (plural_s, past_ed, gerund_ing) and proper-nouns policy (if using the text pipeline)
- Theme and title
- Page count and optional engagement preferences, e.g.:
  - preferQuestionsEvery: 3 (if "?" allowed)
  - preferActionVerbs: true
  - variation: 2 (k for best-of-k drafting)
- Character context (for image synergy; keep text within allowed words):
  - Character DNA summaries from lib/characters/dna.ts (or Python equivalents) as background context only

Data to prepare (no fine-tune required)
- Few-shot exemplars per pattern (3–5 micro-stories) that strictly obey constraints and feel lively.
- Positive/negative pairs labeled with a short rubric note (why engaging vs dull).
- Phrase/action chips: tiny, pattern-safe fragments (e.g., "a big pig", "at a log", "can sit", "in a bag").

Agent blueprint (multi-step)
1) Outline planner
   - Output: list of page beats using only concepts expressible with the allowed lexicon.
2) Page drafter
   - Draft 1–2 sentences/page using only ApprovedWords∪HeartWords; length 3–8 tokens.
3) Engagement tuner (light, deterministic)
   - Score per page for motion verb, concrete noun, occasional question, and novelty; minimally swap tokens within allowed words when score is low.
4) Deterministic validator + repair
   - Run strict validator; bounded repair loop; never ship failing text.
5) Optional image hint
   - Emit a tiny action cue per page (pattern-safe verbs) to inform pose selection downstream.

Prompt engineering pattern (summarized)
- System prompt: literacy-specialist role; hard rule: obey supplied lexicon/structure; JSON-only output.
- Developer constraints: inline pattern config and schema shape; include small “engagement checklist”.
- Few-shot: 1–2 short exemplars for the active patternId.
- Output schema: minimal JSON with pages[i].text.

Selection without fine-tuning
- Best-of-k page drafts (k=2–3), scored with a tiny rubric; pick highest score then pass to validator.
- Repair if validator flags any violation.

Integration in this repo (Python scaffold)
- Where: langgraph_implementation/python_backend
- Orchestrator: agents/orchestrator_agent.py
- Guardrails (replace stubs): agents/guardrail_agent.py
- Suggested changes:
  - Add an engagement scorer utility (see ENGAGEMENT_TUNER.md) and call it between draft and validate.
  - Store few-shot exemplars in planning/EXEMPLARS_*.md and load them by patternId.
  - Keep output format consistent with TS so both backends interoperate.

Checklist (implementation order)
- [ ] Port deterministic validator from TS to Python (or implement to parity).
- [ ] Add exemplars and phrase chips for top patterns.
- [ ] Implement engagement scorer and best-of-k selection for drafts.
- [ ] Add optional question cadence if '?' is allowed in the active pattern.
- [ ] Thread engagement options through API (pageCount, patternId, engagement prefs).
- [ ] Add basic unit tests (pytest) for validator, scorer, and orchestrator happy-path.

References
- docs/Story-Text-Pipeline-Plan.md — rule defaults
- lib/pipeline/text/rules.ts — full validator logic in TS
- lib/phonics-patterns.ts — pattern registry (approvedWords, heartWords, punctuation)
