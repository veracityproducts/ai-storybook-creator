# Exemplars — CVC Short A (beginner)

Pattern constraints (summary)
- Sentences/page: 1–2
- Allowed punctuation: . ! ?
- Use only approvedWords ∪ heartWords for this pattern (see lib/phonics-patterns.ts)

Phrase chips (pattern-safe)
- Nouns: cat, rat, bag, cap, pan, mat
- Verbs: sat, tap, pat, nap, ran, can (modal can is allowed as a word if present in approved list)
- Preps/func: at, a, the, I, to

Micro-story A (5 pages)
- Page 1: "A cat sat. A rat ran."
- Page 2: "A cat sat at a mat."
- Page 3: "A rat sat at a pan."
- Page 4: "A cat tap a cap."
- Page 5: "A cat and rat?"  (If "and" is not allowed in your config, use: "A cat at a mat?")

Micro-story B (5 pages)
- Page 1: "A bag sat. A cap sat."
- Page 2: "A cat sat at a bag."
- Page 3: "A rat ran at a bag."
- Page 4: "A cat pat a cat."
- Page 5: "A cat sat. A rat sat."

Notes
- Validate these with your deterministic validator; adjust any token not present in your approvedWords for this pattern.
- If a token like "and" is not in the approved list, replace with another allowed token or remove it while preserving simplicity.
