# Ben/Kim Approach Fix — Natural Story Flow

**Date:** 2025-10-14  
**Issue:** Images were either too static (exact same pose/scene) or too random (completely different environments). First image was just the reference image copy.

## Root Cause

The animal story prompts were NOT following the successful Ben/Kim pattern:

### ❌ What We Were Doing Wrong

1. **Generic scene descriptions** - "cozy living room" repeated for all 4 pages
2. **Rolling conditioning** - Including previous page image made pages 2-4 copy each other
3. **Vague prompts** - Not enough specific details per page

### ✅ What Ben/Kim Did Right

Looking at `scripts/preview-story-direct.js`:

```javascript
const panels = [
  'SUBJECT: BEN and SUBJECT: KIM — lock identity and wardrobe to the reference images. Scene: a city park entrance, early afternoon daylight. Medium two-shot, 35mm lens, eye-level, natural color. Ben and Kim face each other smiling. Composition: both heads fully in frame, balanced spacing, neutral background; no text, no logos, no third person.',
  
  'SUBJECT: BEN and SUBJECT: KIM — keep identity and wardrobe from references. Scene: wooden bench in the park, soft daylight. Medium two-shot, 35mm lens, eye-level. Pose: hips contacting bench; knees ~90°; feet flat; hands visible. Composition: both faces visible; no text; no extra people.',
  
  // ... more panels with DIFFERENT specific scenes
]

// ALL character refs passed to EVERY panel (no rolling conditioning)
for (let i = 0; i < panels.length; i++) {
  const { base64, mimeType } = await generateImage(genAI, panels[i], refs)  // Same refs every time
}
```

**Key insights:**
1. **Each panel has a DIFFERENT, SPECIFIC scene** - "park entrance" → "wooden bench" → "near park exit"
2. **Specific actions/poses** - "face each other smiling" → "hips contacting bench; knees ~90°"
3. **ALL refs passed to EVERY panel** - No rolling conditioning with previous images
4. **Detailed camera/composition** - Consistent format but varied angles

## Solution Applied

### 1. Created Scene Variation Arrays

**Before:**
```python
STORY_BASE_SCENES = {
    "cat": "cozy living room with a soft cushion, warm natural light from a nearby window, simple furniture in soft focus",
    # Same scene description for all pages
}
```

**After:**
```python
STORY_SCENE_VARIATIONS = {
    "cat": [
        "cozy living room corner near a window with soft afternoon light, cushion on the floor",
        "same living room, near a low bookshelf with warm side lighting",
        "living room center with a small rug, natural daylight from window",
        "living room by the couch with gentle evening light, peaceful atmosphere",
    ],
    # Each page gets a DIFFERENT specific scene within the same environment
}
```

### 2. Removed Rolling Conditioning for Animal Stories

**Before:**
```python
# Pages 2+: included previous page image
if i > 1:
    refs.append({"base64": prev["base64"], "mimeType": prev.get("mimeType", "image/png")})
```

**After:**
```python
# Animal story: use SAME refs for every page (animal + group, NO previous page)
# This matches the Ben/Kim approach where all character refs are passed to every panel
refs = []
if animal:
    animal_ref = self._load_animal_ref(animal)
    if animal_ref:
        refs.append(animal_ref)

if animal_group:
    refs.append(animal_group)

# NO previous page - let the specific scene descriptions create variety
```

### 3. Simplified Prompt Structure

**Before:**
```python
return " ".join([
    f"SUBJECT: {subject} — lock identity...",
    f"STYLE REFERENCE: maintain the illustrative style...",
    f"IMPORTANT: Use a completely different pose...",  # Fighting against rolling conditioning
    f"{action_detail}",
    f"Scene: {base_scene}. Keep this environment consistent.",  # Generic scene
    f"Camera: {shot}, 35mm lens, {angle}...",
    f"Composition: subject clearly visible...",
    f"Story context (do not render as text): \"{pageText}\"",
])
```

**After:**
```python
return " ".join([
    f"SUBJECT: {subject} — lock identity, body shape, and coloring to match the reference images exactly.",
    f"Scene: {specific_scene}.",  # DIFFERENT for each page
    f"Action: {action_detail}",
    f"Camera: {shot}, 35mm lens, {angle}, natural color, soft focus background.",
    f"Composition: subject clearly visible; expressive and natural; clean background; no text, no logos, no watermarks.",
])
```

Cleaner, more like Ben/Kim format.

### 4. Animal Type Detection from Title

**Problem:** "Pat sat." doesn't contain "cat", so page 1 had no animal reference.

**Solution:**
```python
# Detect the main animal character from the title
story_animal = self._detect_animal_from_title(title)  # "Pat the Cat" → "cat"

# Use as fallback for all pages
animal = self._detect_animal_in_text(page_text, fallback_animal=story_animal)
```

## Example: Pat the Cat Prompts

### Page 1: "Pat sat."
```
SUBJECT: fat orange tabby cat with round body — lock identity, body shape, and coloring to match the reference images exactly.
Scene: cozy living room corner near a window with soft afternoon light, cushion on the floor.
Action: fat orange tabby cat with round body is sitting calmly. Pose: sitting upright facing forward, alert posture, ears perked.
Camera: medium shot, 35mm lens, eye-level, natural color, soft focus background.
Composition: subject clearly visible; expressive and natural; clean background; no text, no logos, no watermarks.
```

### Page 2: "The cat sat."
```
SUBJECT: fat orange tabby cat with round body — lock identity, body shape, and coloring to match the reference images exactly.
Scene: same living room, near a low bookshelf with warm side lighting.
Action: fat orange tabby cat with round body is sitting calmly. Pose: lying down stretched out, relaxed pose.
Camera: medium-close shot, 35mm lens, slightly high angle looking down, natural color, soft focus background.
Composition: subject clearly visible; expressive and natural; clean background; no text, no logos, no watermarks.
```

### Page 3: "Pat pat the cat."
```
SUBJECT: fat orange tabby cat with round body — lock identity, body shape, and coloring to match the reference images exactly.
Scene: living room center with a small rug, natural daylight from window.
Action: A gentle human hand is petting fat orange tabby cat with round body. Pose: standing on all fours, mid-stride or walking.
Camera: medium-wide shot, 35mm lens, slightly low angle looking up, natural color, soft focus background.
Composition: subject clearly visible; expressive and natural; clean background; no text, no logos, no watermarks.
```

### Page 4: "The cat naps."
```
SUBJECT: fat orange tabby cat with round body — lock identity, body shape, and coloring to match the reference images exactly.
Scene: living room by the couch with gentle evening light, peaceful atmosphere.
Action: fat orange tabby cat with round body is sleeping or napping. Pose: lying on side, fully relaxed.
Camera: medium shot, 35mm lens, straight-on at subject height, natural color, soft focus background.
Composition: subject clearly visible; expressive and natural; clean background; no text, no logos, no watermarks.
```

## Reference Strategy

**Every page gets the SAME refs:**
1. pat-the-fat-cat-reference.jpg (character identity)
2. animal-group.jpg (artistic style)

**NO previous page images** - The specific scene descriptions create variety naturally.

## Expected Results

✅ **Page 1:** Cat in living room corner near window  
✅ **Page 2:** Same cat, near bookshelf (DIFFERENT location, DIFFERENT pose)  
✅ **Page 3:** Same cat, center of room with human hand petting (DIFFERENT location, DIFFERENT action)  
✅ **Page 4:** Same cat, by couch sleeping (DIFFERENT location, DIFFERENT pose)  

**Cohesive story flow:**
- Same cat throughout (identity locked by refs)
- Same living room environment (but different specific locations)
- Different poses and actions per page (driven by specific scene descriptions)
- Natural progression (not random scenes, not identical copies)

## Key Takeaway

**Match the successful Ben/Kim pattern:**
1. ✅ Specific scene variations per page (not generic repeated descriptions)
2. ✅ All character refs passed to every page (no rolling conditioning)
3. ✅ Detailed action/pose descriptions per page
4. ✅ Clean, structured prompt format

This creates natural story flow with variety while maintaining character consistency.

