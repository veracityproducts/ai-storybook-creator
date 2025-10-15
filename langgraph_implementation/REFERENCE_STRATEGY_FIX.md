# Reference Strategy Fix — Separate Animal & Human Refs

**Date:** 2025-10-14  
**Issue:** First image showed Ben (human boy) instead of the cat because Ben/Kim references were being used for animal stories

## Root Cause

The original strategy used Ben/Kim references for **all** stories to maintain "artistic style":
- Animal stories: Animal ref + Ben/Kim refs (for style)
- Human stories: Ben/Kim refs

**Problem:** The model was confused by human references when generating animal stories, sometimes producing human characters instead of animals.

## Solution

**Completely separate reference strategies** for animal vs. human stories:

### Animal Stories (e.g., Pat the Cat, Big Pig)
**References used:**
1. **Specific animal ref** (e.g., pat-the-fat-cat-reference.jpg) — Character identity
2. **animal-group.jpg** — Artistic style context
3. **Previous page** — Rolling conditioning for continuity

**NO Ben/Kim references** — They confuse the model

### Human Stories (e.g., Ben and Kim adventures)
**References used:**
1. **ben-ref-1.png** — Character identity + style
2. **kim-ref.png** — Character identity + style
3. **Previous page** — Rolling conditioning

## Code Changes

### orchestrator_agent.py — Page 1 References

**Before:**
```python
# For animal stories, add animal reference + animal group + Ben/Kim for style
refs_for_page1 = seed_refs.copy()  # Always started with Ben/Kim
if not has_humans_p1:
    animal_ref = self._load_animal_ref(animal)
    refs_for_page1 = [animal_ref] + seed_refs  # Ben/Kim still included
```

**After:**
```python
# For animal stories: use animal refs ONLY (no Ben/Kim)
refs_for_page1 = []
if not has_humans_p1:
    # Animal story: specific animal + group for style
    animal_ref = self._load_animal_ref(animal)
    if animal_ref:
        refs_for_page1.append(animal_ref)
    
    # Animal group provides the style context (not Ben/Kim)
    animal_group = self._load_animal_group_ref()
    if animal_group:
        refs_for_page1.append(animal_group)
else:
    # Human story: use Ben/Kim refs
    refs_for_page1 = seed_refs.copy()
```

### orchestrator_agent.py — Subsequent Pages

**Before:**
```python
# Build refs: rolling conditioning + seed refs (always included Ben/Kim)
refs = await self.tools.identity_rolling_conditioning([prev], seed_refs=seed_refs)
if not has_humans:
    # Added animal refs on top of Ben/Kim
    refs = [animal_ref, animal_group] + refs
```

**After:**
```python
if not has_humans:
    # Animal story: use animal refs + rolling conditioning (NO Ben/Kim)
    refs = []
    if animal_ref:
        refs.append(animal_ref)
    if animal_group:
        refs.append(animal_group)
    # Add previous page for continuity
    refs.append({"base64": prev["base64"], "mimeType": prev.get("mimeType", "image/png")})
else:
    # Human story: use Ben/Kim refs + rolling conditioning
    refs = await self.tools.identity_rolling_conditioning([prev], seed_refs=seed_refs)
```

## Prompt Changes

### Emphasized Character Identity Match

**Before:**
```python
animals = {
    "cat": "orange tabby cat",
    ...
}
```

**After:**
```python
animals = {
    "cat": "fat orange tabby cat with round body",  # Matches reference exactly
    ...
}
```

### Subject Line Reordered

**Before:**
```
STYLE REFERENCE: maintain the illustrative style...
SUBJECT: orange tabby cat.
```

**After:**
```
SUBJECT: fat orange tabby cat with round body — lock identity, body shape, and coloring to match the reference images exactly.
STYLE REFERENCE: maintain the illustrative style...
```

Putting SUBJECT first with explicit identity lock instruction.

## Reference Image Strategy Summary

### Pat the Cat (Animal Story)
**Page 1 refs:**
1. pat-the-fat-cat-reference.jpg
2. animal-group.jpg

**Page 2-4 refs:**
1. pat-the-fat-cat-reference.jpg
2. animal-group.jpg
3. Previous page image

**Total:** 2-3 refs per page, NO human references

### Ben and Kim Story (Human Story)
**Page 1 refs:**
1. ben-ref-1.png
2. kim-ref.png

**Page 2-4 refs:**
1. ben-ref-1.png
2. kim-ref.png
3. Previous page image

**Total:** 2-3 refs per page, NO animal references

## Expected Results

### ✅ Correct Subject
- **Page 1:** Fat orange tabby cat (NOT Ben)
- **Page 2:** Same cat, different pose
- **Page 3:** Same cat, different pose
- **Page 4:** Same cat, different pose

### ✅ Matches Reference Images
- Body shape: Fat/round (matches pat-the-fat-cat-reference.jpg)
- Coloring: Orange tabby
- Style: Matches animal-group.jpg illustrative style

### ✅ Style Consistency
- All pages maintain the same illustrative style from animal-group.jpg
- No human character style bleeding into animal stories

## Testing

Regenerated reader-01 (Pat the Cat) with corrected reference strategy:
```bash
rm -rf tmp/readers/reader-01
python3 langgraph_implementation/scripts/generate_reader.py --reader-id reader-01
```

**Status:** ✅ Generated successfully  
**Output:** tmp/readers/reader-01/ (4 pages)

**Review checklist:**
- [ ] Page 1 shows a fat orange tabby cat (NOT Ben)
- [ ] Cat body shape is round/fat matching reference
- [ ] Cat coloring is orange tabby
- [ ] All 4 pages show the same cat in different poses
- [ ] Style matches animal-group.jpg
- [ ] No human characters appear in any images
- [ ] No text rendered on images

## Key Insight

**Don't mix reference types!**
- Animal stories need animal references for both identity AND style
- Human stories need human references for both identity AND style
- Mixing them confuses the model and produces incorrect subjects

The animal-group.jpg reference provides all the style context needed for animal stories — no need for Ben/Kim references at all.

