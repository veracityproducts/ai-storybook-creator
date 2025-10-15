# Prompt V2 Improvements — Highly Varied Poses + No Text

**Date:** 2025-10-14  
**Issue:** V1 prompts still produced repetitive poses (cat in same position across pages 1-2) and sometimes rendered text on images

## Key Changes

### 1. ✅ **Explicit "No Text" Instructions**
Added multiple layers of text prevention:
- `"absolutely no text, no words, no letters, no captions on the image"`
- `"Story context (do not render as text): \"{pageText}\""`
- Changed from "Page text for context" to make it clear the text is NOT to be rendered

### 2. ✅ **Highly Specific Pose Variations**
Created `ANIMAL_POSE_VARIATIONS` matrix with 4 different pose sets:

**Page 0 (Sitting poses):**
- "sitting upright facing forward, alert posture, ears perked"
- "sitting at three-quarter angle, looking slightly to the side"
- "sitting with body angled left, head turned toward viewer"
- "sitting relaxed with weight shifted to one side"

**Page 1 (Varied poses):**
- "lying down stretched out, relaxed pose"
- "sitting with back to viewer, head turned over shoulder"
- "crouching low to ground, playful stance"
- "sitting upright from side view, profile visible"

**Page 2 (Active poses):**
- "standing on all fours, mid-stride or walking"
- "sitting curled up, compact pose"
- "stretching with front paws extended forward"
- "sitting tall with chest out, proud posture"

**Page 3 (Sleep poses):**
- "lying on side, fully relaxed"
- "curled in a ball, sleeping position"
- "sitting hunched over, drowsy posture"
- "lying with head resting on paws"

### 3. ✅ **Animal Group Reference Added**
Now includes `animal-group.jpg` in conditioning stack:
- **Order:** Specific animal ref → Animal group (context) → Ben/Kim (style)
- Provides additional context for artistic style and character design
- Helps maintain consistency across all animal readers

### 4. ✅ **More Specific Scene Descriptions**
Upgraded from generic scenes to highly detailed environments:

**Before:**
- "cozy indoor setting with soft natural light from a window"

**After:**
- "cozy living room corner with a soft cushion and warm window light"
- "sunny garden patio with potted plants and dappled shade"
- "simple bedroom with a small rug and afternoon sunlight"
- "outdoor yard with green grass and a wooden fence in background"

### 5. ✅ **Action-Aware Pose Selection**
The `_get_detailed_pose_and_action()` function now:
- Detects action keywords in text (sat, nap, run, play, dig, hop, pat)
- Selects appropriate pose variations for that action
- For "nap" text → uses Page 3 sleep poses regardless of page index
- For "pat the cat" → adds "human hand gently petting" detail

## Example Prompts Generated

### Page 0: "Pat sat."
```
STYLE REFERENCE: maintain the illustrative style, color palette, line work, and lighting from the reference images.
SUBJECT: orange tabby cat.
Pose: sitting upright facing forward, alert posture, ears perked. The orange tabby cat is sitting calmly.
Scene: cozy living room corner with a soft cushion and warm window light.
Camera: medium shot, 35mm lens, eye-level, natural color, soft focus background.
Composition: subject clearly visible in the described pose; expressive and natural; clean background; absolutely no text, no words, no letters, no captions on the image.
Story context (do not render as text): "Pat sat."
```

### Page 1: "The cat sat."
```
STYLE REFERENCE: maintain the illustrative style, color palette, line work, and lighting from the reference images.
SUBJECT: orange tabby cat.
Pose: lying down stretched out, relaxed pose. The orange tabby cat is sitting calmly.
Scene: sunny garden patio with potted plants and dappled shade.
Camera: medium-close shot, 35mm lens, slightly high angle looking down, natural color, soft focus background.
Composition: subject clearly visible in the described pose; expressive and natural; clean background; absolutely no text, no words, no letters, no captions on the image.
Story context (do not render as text): "The cat sat."
```

### Page 2: "Pat pat the cat."
```
STYLE REFERENCE: maintain the illustrative style, color palette, line work, and lighting from the reference images.
SUBJECT: orange tabby cat.
Pose: standing on all fours, mid-stride or walking. A human hand is gently petting the orange tabby cat.
Scene: simple bedroom with a small rug and afternoon sunlight.
Camera: full shot showing more environment, 35mm lens, slightly low angle looking up, natural color, soft focus background.
Composition: subject clearly visible in the described pose; expressive and natural; clean background; absolutely no text, no words, no letters, no captions on the image.
Story context (do not render as text): "Pat pat the cat."
```

### Page 3: "The cat naps."
```
STYLE REFERENCE: maintain the illustrative style, color palette, line work, and lighting from the reference images.
SUBJECT: orange tabby cat.
Pose: lying on side, fully relaxed. The orange tabby cat is sleeping or napping.
Scene: outdoor yard with green grass and a wooden fence in background.
Camera: medium shot, 35mm lens, straight-on at subject height, natural color, soft focus background.
Composition: subject clearly visible in the described pose; expressive and natural; clean background; absolutely no text, no words, no letters, no captions on the image.
Story context (do not render as text): "The cat naps."
```

## Reference Image Strategy

### For Animal Stories (e.g., Pat the Cat)
**Conditioning stack order:**
1. **pat-the-fat-cat-reference.jpg** — Specific animal identity
2. **animal-group.jpg** — Group context and style
3. **ben-ref-1.png** — Artistic style anchor
4. **kim-ref.png** — Artistic style anchor
5. **Previous page image** — Rolling conditioning for continuity

### For Human Stories (e.g., Ben and Kim)
**Conditioning stack order:**
1. **ben-ref-1.png** — Character identity + style
2. **kim-ref.png** — Character identity + style
3. **Previous page image** — Rolling conditioning

## Expected Results

### ✅ Pose Variety
- **Page 0:** Cat sitting upright, alert, facing forward
- **Page 1:** Cat lying stretched out (completely different pose)
- **Page 2:** Cat standing/walking with human hand petting
- **Page 3:** Cat lying on side, sleeping

### ✅ Scene Variety
- **Page 0:** Living room corner with cushion
- **Page 1:** Garden patio with plants
- **Page 2:** Bedroom with rug
- **Page 3:** Outdoor yard with fence

### ✅ Camera Variety
- **Page 0:** Medium shot, eye-level
- **Page 1:** Medium-close, high angle
- **Page 2:** Full shot, low angle
- **Page 3:** Medium shot, straight-on

### ✅ No Text on Images
- Explicit instructions: "absolutely no text, no words, no letters, no captions"
- Context labeled as "do not render as text"
- Text will be rendered separately below images in the final layout

## Testing

Regenerated reader-01 (Pat the Cat) with V2 prompts:
```bash
rm -rf tmp/readers/reader-01
python3 langgraph_implementation/scripts/generate_reader.py --reader-id reader-01
```

**Status:** ✅ Generated successfully  
**Output:** tmp/readers/reader-01/ (4 pages)

**Review checklist:**
- [ ] Each page shows a distinctly different pose
- [ ] Scenes vary across pages (indoor/outdoor, different settings)
- [ ] Camera angles change (eye-level, high, low, straight-on)
- [ ] No text rendered on any images
- [ ] Artistic style consistent across all pages
- [ ] Cat identity maintained (orange tabby)

## Code Changes

### Files Modified
- `langgraph_implementation/python_backend/tools/prompts.py`
  - Added `ANIMAL_POSE_VARIATIONS` matrix (4 pose sets × 4 variations each)
  - Replaced `_parse_animal_action()` with `_get_detailed_pose_and_action()`
  - Added explicit "no text" instructions
  - Changed "Page text for context" to "Story context (do not render as text)"
  - More specific scene descriptions

- `langgraph_implementation/python_backend/agents/orchestrator_agent.py`
  - Added `_load_animal_group_ref()` method
  - Updated conditioning stack to include animal-group.jpg
  - Reference order: animal ref → group → style refs → rolling

### New Reference Images Used
- **animal-group.jpg** — Group context for all animal stories
- **pat-the-fat-cat-reference.jpg** — Cat identity
- **sid-the-pig-reference.jpg** — Pig identity
- **gus-the-pup-reference.jpg** — Dog/pup identity
- **meg-the-hen-reference.jpg** — Hen identity
- **dot-the-fox-reference.jpg** — Fox identity

## Next Steps

1. **Review reader-01 images** — Verify pose variety and no text
2. **Test other animals** — Generate reader-02 (Big Pig) to verify prompts work for different animals
3. **Adjust pose variations** — Add more options if needed
4. **Fine-tune action detection** — Add more action keywords if stories use different verbs
5. **Regenerate all Set 1** — Apply V2 prompts to all 5 CVC readers

