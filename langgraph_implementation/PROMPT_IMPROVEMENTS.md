# Prompt Improvements — Dynamic Scene & Action-Based Generation

**Date:** 2025-10-14  
**Issue:** Initial Set 1 images were high-quality but repetitive — characters in same spots with same expressions across all pages

## Problem Analysis

### Original Prompts (Too Generic)
```
STYLE REFERENCE: maintain the illustrative style, color palette, line work, and lighting from the reference images.
SUBJECT: Pat sat.
Shot: medium shot, Lens: 35mm, Angle: eye-level.
Composition: subject clearly visible, no text/watermarks, clean background.
Subject clearly visible; no text/watermarks; clean background matching reference style.
```

**Issues:**
- No specific scene description
- No action details
- Same camera angle every page
- Generic composition instructions
- Result: Static, repetitive images

### Successful Prompts (From preview-story-direct.js)
```
SUBJECT: BEN and SUBJECT: KIM — lock identity and wardrobe to the reference images.
Scene: a city park entrance, early afternoon daylight.
Medium two-shot, 35mm lens, eye-level, natural color.
Ben and Kim face each other smiling.
Composition: both heads fully in frame, balanced spacing, neutral background; no text, no logos, no third person.
```

**Success factors:**
- Specific scene with lighting details
- Clear action/pose instructions
- Varied camera angles across pages
- Detailed composition guidance
- Result: Dynamic, story-appropriate images

## Solution Implemented

### 1. Scene Variety System
Created rotating scene pools for different story types:

**Animal/Object Stories:**
- "cozy indoor setting with soft natural light from a window"
- "sunny outdoor garden with flowers and grass"
- "simple room interior with warm lighting"
- "park setting with trees in soft focus background"
- "backyard scene with fence and greenery"
- "kitchen or home interior with natural daylight"
- "outdoor patio or porch with afternoon light"
- "living room with comfortable furniture and warm tones"

**Human Character Stories:**
- "city park entrance with trees and path, early afternoon daylight"
- "wooden park bench with soft dappled sunlight through trees"
- "grassy area in park with flowers, natural daylight"
- "park path with trees in background, golden hour lighting"
- "playground area with equipment in soft focus, bright daylight"

### 2. Action Parsing
Extract subject and action from decodable text:

```python
def _parse_animal_action(text: str) -> Dict[str, str]:
    # "Pat sat." → {"subject": "orange tabby cat", "action": "sitting comfortably"}
    # "The cat naps." → {"subject": "orange tabby cat", "action": "napping or sleeping peacefully"}
    # "Pat pat the cat." → {"subject": "orange tabby cat", "action": "being petted gently"}
```

### 3. Camera Angle Rotation
Vary camera angles by page index:
- Page 0: eye-level
- Page 1: slightly high angle
- Page 2: slightly low angle
- Page 3: straight-on
- (cycles for longer stories)

### 4. Animal Reference Integration
- Load animal-specific reference images from `ai_docs/animal-references/`
- Combine with Ben/Kim refs for style consistency
- Animal ref first (for identity), then style refs

**Mapping:**
- cat → pat-the-fat-cat-reference.jpg
- pig → sid-the-pig-reference.jpg
- dog/pup → gus-the-pup-reference.jpg
- hen → meg-the-hen-reference.jpg
- fox → dot-the-fox-reference.jpg

## New Prompt Structure

### Animal Story Example (Pat the Cat, Page 1)
```
STYLE REFERENCE: maintain the illustrative style, color palette, line work, and lighting from the reference images.
SUBJECT: orange tabby cat — sitting comfortably.
Scene: cozy indoor setting with soft natural light from a window.
Camera: medium shot, 35mm lens, eye-level, natural color, soft focus background.
Composition: subject clearly visible and engaged in action; expressive pose; no text/watermarks; clean background.
Page text for context: "Pat sat."
```

### Animal Story Example (Pat the Cat, Page 2)
```
STYLE REFERENCE: maintain the illustrative style, color palette, line work, and lighting from the reference images.
SUBJECT: orange tabby cat — sitting comfortably.
Scene: sunny outdoor garden with flowers and grass.
Camera: medium-close shot, 35mm lens, slightly high angle, natural color, soft focus background.
Composition: subject clearly visible and engaged in action; expressive pose; no text/watermarks; clean background.
Page text for context: "The cat sat."
```

### Animal Story Example (Pat the Cat, Page 3)
```
STYLE REFERENCE: maintain the illustrative style, color palette, line work, and lighting from the reference images.
SUBJECT: orange tabby cat — being petted gently.
Scene: simple room interior with warm lighting.
Camera: full shot showing environment, 35mm lens, slightly low angle, natural color, soft focus background.
Composition: subject clearly visible and engaged in action; expressive pose; no text/watermarks; clean background.
Page text for context: "Pat pat the cat."
```

### Human Character Example (Ben and Kim)
```
SUBJECT: BEN and SUBJECT: KIM — lock identity and wardrobe to the reference images.
Scene: city park entrance with trees and path, early afternoon daylight.
Camera: medium two-shot, 35mm lens, eye-level, natural color.
Action from text: I see Ben. I see Kim.
Composition: both faces visible; natural poses and expressions matching the action; no extra people; no text/watermarks.
```

## Key Improvements

### ✅ Scene Variety
- Each page gets a different scene from the rotation pool
- Scenes include specific lighting details (soft natural light, dappled sunlight, golden hour)
- Indoor/outdoor variety

### ✅ Action-Based Composition
- Text is parsed to extract meaningful actions
- Actions inform pose and expression
- "sitting comfortably" vs "being petted gently" vs "napping peacefully"

### ✅ Camera Angle Rotation
- Prevents repetitive framing
- eye-level → slightly high → slightly low → straight-on
- Shot types also vary: medium shot, medium-close shot, full shot

### ✅ Reference Image Strategy
- **Animal stories:** Animal ref (identity) + Ben/Kim refs (style)
- **Human stories:** Ben/Kim refs (identity + style)
- Rolling conditioning includes previous page for continuity

### ✅ Context Preservation
- Original decodable text included as "Page text for context"
- Ensures generated image relates to the specific page
- Helps model understand the narrative flow

## Expected Results

### Before (Generic Prompts)
- ❌ Cat in same position across all 4 pages
- ❌ Same background/lighting
- ❌ Same camera angle
- ❌ Static, repetitive feel

### After (Dynamic Prompts)
- ✅ Cat in varied positions (sitting indoors, sitting outdoors, being petted, napping)
- ✅ Different scenes (indoor with window light, outdoor garden, room interior, etc.)
- ✅ Varied camera angles (eye-level, high, low, straight-on)
- ✅ Dynamic, story-appropriate feel

## Testing

Regenerated reader-01 (Pat the Cat) with new prompts:
```bash
rm -rf tmp/readers/reader-01
python3 langgraph_implementation/scripts/generate_reader.py --reader-id reader-01
```

**Status:** ✅ Generated successfully  
**Output:** tmp/readers/reader-01/ (4 pages)

Review images to verify:
1. Scene variety across pages
2. Action-appropriate poses
3. Camera angle variation
4. Artistic style consistency maintained

## Next Steps

1. **Review reader-01 images** — Verify improvements in variety and storytelling
2. **Adjust action parsing** — Add more action keywords if needed
3. **Expand scene pools** — Add more scene variety if 8 options isn't enough
4. **Test with other readers** — Verify prompts work for pig, dog, hen, etc.
5. **Regenerate Set 1** — Apply improvements to all 5 CVC readers

## Code Changes

### Files Modified
- `langgraph_implementation/python_backend/tools/prompts.py` — Complete rewrite with scene pools, action parsing, camera rotation
- `langgraph_implementation/python_backend/agents/orchestrator_agent.py` — Added animal ref loading, detection, and integration
- `langgraph_implementation/python_backend/graph/workflow.py` — Updated facade signature

### New Functions
- `_parse_animal_action(text)` — Extract subject and action from decodable text
- `_load_animal_ref(animal_name)` — Load animal reference images
- `_detect_animal_in_text(text)` — Identify which animal is the subject

### Reference Images Used
- **Style anchors:** ben-ref-1.png, kim-ref.png (from ai_docs/images-2.5-flash-test/)
- **Animal identity:** pat-the-fat-cat-reference.jpg, sid-the-pig-reference.jpg, etc. (from ai_docs/animal-references/)

