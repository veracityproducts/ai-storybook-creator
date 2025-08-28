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
- If an action/pose is provided, depict that action clearly (e.g., running mid-stride, seated on a bench); do not default to standing if the action is specified
- Add 1-2 background details that support the scene
- If the page text or theme implies recurring characters, explicitly include all such characters in frame (full-body, similar scale); do not omit them
- Be extremely descriptive to ensure character consistency
- Single paragraph only, no extra commentary

Return exactly one paragraph (the page prompt body). The final prompt sent to the image model will be:
[PAGE_PROMPT_BODY] + " " + [STYLE_TOKENS] + " " + [IMAGE_SYSTEM_TOKENS]
