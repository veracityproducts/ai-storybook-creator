User
Validate this story JSON against the decodability contract:
- Each page’s words must all be in ApprovedWords ∪ HeartWords
- Forbidden if in BannedWords
- Punctuation limited to ${allowedPunctuation}
- Proper nouns policy: ${properNounsPolicy}
- Sentence count per page: 1–${maxSentencesPerPage}
- No out-of-scope morphology

Story:
[STORY_JSON]

ApprovedWords (lowercase): ${approvedWords}
HeartWords (lowercase): ${heartWords}
BannedWords (lowercase): ${bannedWords}

Return JSON:
{
  "valid": boolean,
  "issues": string[],
  "offendingWords": string[]
}

Note: The code-level validator still decides pass/fail; you produce the human-readable report.

