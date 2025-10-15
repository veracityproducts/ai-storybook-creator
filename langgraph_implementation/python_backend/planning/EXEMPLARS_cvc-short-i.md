# Exemplars — CVC Short I (beginner)

Pattern constraints (summary)
- Sentences/page: 1–2
- Allowed punctuation: . ! ?
- Use only approvedWords ∪ heartWords for this pattern (see lib/phonics-patterns.ts)

Phrase chips (pattern-safe)
- Nouns: pig, bin, lid, pin
- Verbs: sit, dig, dip, tip
- Func: I, it, is, in, the, a

Micro-story A (5 pages)
- Page 1: "I sit. It is big."
- Page 2: "The pig is in a bin."
- Page 3: "I dig. It is in."
- Page 4: "I dip. I tip it."
- Page 5: "Is it in?"  (question cadence example if '?' allowed)

Micro-story B (5 pages)
- Page 1: "A pig is in. It is big."
- Page 2: "I sit. I sit in it."
- Page 3: "I dig. I did it." (If "did" not allowed, use "I dig. It is in.")
- Page 4: "A lid is in a bin."
- Page 5: "I tip a bin. It is in."

Notes
- Always validate with your deterministic validator; swap any token not present in your approvedWords for CVC Short I.
- Keep 3–8 tokens per sentence; two sentences per page maximum by default.
