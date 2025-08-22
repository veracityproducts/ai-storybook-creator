User
Create a decodable reader titled “${title}” for ages ${ageRange} about: ${theme}.

Phonics constraints:
- Graphemes allowed: ${graphemesAllowed}
- Only use words from ApprovedWords or HeartWords. Do not use BannedWords.
- Sentences per page: 1–${maxSentencesPerPage}. Keep sentences short and concrete.
- Allowed punctuation: ${allowedPunctuation}.
- Proper nouns policy: ${properNounsPolicy}.
- Maintain decodability; avoid morphology not introduced.
- If it is impossible to express a concept with the allowed lexicon, simplify or choose an alternative using only Allowed words.

Return JSON only with this shape:
{
  "pages": [
    { "text": "..." , "imagePrompt": "..." }
  ],
  "moral": "..."
}

Notes:
- The “imagePrompt” should describe a consistent, child-friendly scene that matches the page text. No text overlays or letters in the image.
- Keep vocabulary tightly within ApprovedWords ∪ HeartWords.

ApprovedWords (lowercase): ${approvedWords}
HeartWords (lowercase): ${heartWords}
BannedWords (lowercase): ${bannedWords}

