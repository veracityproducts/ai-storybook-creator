User
Using this Style Bible:
[STYLE_BIBLE]

Also given these constant Image System Tokens (append to every final prompt):
[IMAGE_SYSTEM_TOKENS]

Generate one detailed "page prompt body" for this page:
- Page text: "${text}"
- START with "A children's book illustration of" to establish legitimate context
- Use the EXACT character descriptions from the Style Bible (50+ words per character)
- Include every detail: facial structure, ear placement, eye shape/color, nose details, clothing, accessories
- CRITICAL: Maintain precise facial proportions and feature placement for character consistency
- Add 1-2 background details that support the scene
- Be extremely descriptive to ensure character consistency
- Single paragraph only, no extra commentary

Return exactly one paragraph (the page prompt body). The final prompt sent to the image model will be:
[PAGE_PROMPT_BODY] + " " + [STYLE_TOKENS] + " " + [IMAGE_SYSTEM_TOKENS]
