User
Rewrite the following story JSON so that it is 100% decodable given ApprovedWords and HeartWords and obeys all constraints. Replace any offending or out-of-scope words with semantically-similar words chosen strictly from ApprovedWords; if none exist, simplify the sentence. Preserve the story’s intent.

Constraints:
- Use only ApprovedWords or HeartWords. Do not use BannedWords.
- Keep sentence count, punctuation, and style constraints.
- Keep page structure identical (same number of pages).

Story (invalid):
[STORY_JSON]

Offending words (lowercase): ${offendingWords}
ApprovedWords (lowercase): ${approvedWords}
HeartWords (lowercase): ${heartWords}
BannedWords (lowercase): ${bannedWords}

Return JSON of the same shape.

