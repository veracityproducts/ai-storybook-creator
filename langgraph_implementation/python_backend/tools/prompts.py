from typing import Any, Dict, List, Optional
import random

# Detailed pose/composition variations for each page to prevent repetition
# These create variety WITHIN the same scene
ANIMAL_POSE_VARIATIONS = [
    # Page 0 variations
    [
        "sitting upright facing forward, alert posture, ears perked",
        "sitting at three-quarter angle, looking slightly to the side",
        "sitting with body angled left, head turned toward viewer",
        "sitting relaxed with weight shifted to one side",
    ],
    # Page 1 variations
    [
        "lying down stretched out, relaxed pose",
        "sitting with back to viewer, head turned over shoulder",
        "crouching low to ground, playful stance",
        "sitting upright from side view, profile visible",
    ],
    # Page 2 variations
    [
        "standing on all fours, mid-stride or walking",
        "sitting curled up, compact pose",
        "stretching with front paws extended forward",
        "sitting tall with chest out, proud posture",
    ],
    # Page 3 variations
    [
        "lying on side, fully relaxed",
        "curled in a ball, sleeping position",
        "sitting hunched over, drowsy posture",
        "lying with head resting on paws",
    ],
]

# Scene variations per animal - DIFFERENT specific details for each page
# Like Ben/Kim prompts: each page gets a unique scene description within the same environment
STORY_SCENE_VARIATIONS = {
    "cat": [
        "cozy living room corner near a window with soft afternoon light, cushion on the floor",
        "same living room, near a low bookshelf with warm side lighting",
        "living room center with a small rug, natural daylight from window",
        "living room by the couch with gentle evening light, peaceful atmosphere",
    ],
    "pig": [
        "muddy barnyard near the fence, morning sunlight, hay visible in background",
        "barnyard center with water trough, midday light, wooden fence behind",
        "barnyard corner with hay bales stacked, warm afternoon glow",
        "barnyard near the barn door, golden hour light, peaceful setting",
    ],
    "dog": [
        "sunny backyard near the fence, green grass, morning light",
        "backyard center with a ball nearby, bright midday sun",
        "backyard under a tree with dappled shade, afternoon warmth",
        "backyard near the porch steps, golden hour light",
    ],
    "pup": [
        "cozy indoor space near a dog bed, hardwood floor, soft morning light from window",
        "same room near a food bowl, warm natural lighting",
        "indoor space by a toy basket, afternoon sunlight streaming in",
        "cozy corner with blanket, gentle evening light, peaceful mood",
    ],
    "hen": [
        "rustic chicken coop near the perch, straw on ground, morning light filtering through",
        "coop center with nesting box visible, soft daylight",
        "coop corner with scattered grain, warm afternoon glow",
        "coop near the door opening, golden hour light, calm atmosphere",
    ],
    "fox": [
        "forest clearing with fallen leaves, morning dappled sunlight through trees",
        "clearing center near a fallen log, bright midday forest light",
        "forest edge with tree trunks visible, afternoon warm glow",
        "clearing with moss-covered ground, golden hour light filtering through branches",
    ],
}

# Camera angles for variety
CAMERA_ANGLES = ["eye-level", "slightly high angle looking down", "slightly low angle looking up", "straight-on at subject height"]
SHOT_TYPES = ["medium shot", "medium-close shot", "medium-wide shot"]

def _get_detailed_pose_and_action(text: str, page_index: int, animal_type: str = None) -> Dict[str, str]:
    """
    Generate highly specific pose and action descriptions to ensure variety.
    Uses page index to get DIFFERENT scene variations (like Ben/Kim prompts).
    Returns subject, action, animal_type, and specific_scene.
    """
    text_lower = text.lower().strip()

    # Common animal subjects in CVC readers - match reference images exactly
    animals = {
        "cat": "fat orange tabby cat with round body",
        "pig": "pink pig",
        "dog": "brown dog",
        "pup": "small brown puppy",
        "hen": "red hen",
        "fox": "orange fox",
    }

    # Find animal in text or use provided animal_type
    subject = "the animal"
    if not animal_type:
        for animal_key, animal_desc in animals.items():
            if animal_key in text_lower:
                subject = animal_desc
                animal_type = animal_key
                break
    else:
        subject = animals.get(animal_type, "the animal")

    # Get SPECIFIC scene variation for this page (different for each page, like Ben/Kim)
    scene_variations = STORY_SCENE_VARIATIONS.get(animal_type, [
        "simple indoor space with natural lighting",
        "same space with different angle, warm light",
        "indoor area with soft afternoon glow",
        "cozy corner with gentle evening light",
    ])
    specific_scene = scene_variations[page_index % len(scene_variations)]

    # Get pose variation for this page
    pose_options = ANIMAL_POSE_VARIATIONS[page_index % len(ANIMAL_POSE_VARIATIONS)]
    pose = pose_options[0]  # Use first option for consistency, but each page has different options

    # Build detailed action based on text + pose
    action_detail = ""
    if "sat" in text_lower or "sit" in text_lower:
        action_detail = f"{subject} is sitting calmly. Pose: {pose}."
    elif "nap" in text_lower or "sleep" in text_lower:
        # Use page 3 poses which are sleep-oriented
        sleep_poses = ANIMAL_POSE_VARIATIONS[3]
        pose = sleep_poses[page_index % len(sleep_poses)]
        action_detail = f"{subject} is sleeping or napping. Pose: {pose}."
    elif "run" in text_lower or "ran" in text_lower:
        action_detail = f"{subject} is running. Pose: running with legs in motion, dynamic stance."
    elif "play" in text_lower:
        action_detail = f"{subject} is playing. Pose: playful stance, energetic body language."
    elif "eat" in text_lower or "ate" in text_lower:
        action_detail = f"{subject} is eating. Pose: head lowered toward food, eating posture."
    elif "pat" in text_lower and "cat" in text_lower:
        # For petting action, add human interaction
        action_detail = f"A gentle human hand is petting {subject}. Pose: {pose}."
    elif "dig" in text_lower:
        action_detail = f"{subject} is digging. Pose: crouched with front paws digging into ground."
    elif "hop" in text_lower:
        action_detail = f"{subject} is hopping. Pose: mid-hop with body lifted off ground."
    else:
        action_detail = f"Pose: {pose}."

    return {"subject": subject, "action": action_detail, "specific_scene": specific_scene, "animal_type": animal_type}

async def page_prompt(*, pageText: str, pageIndex: int = 0,
                      appearanceSummary: Optional[Dict[str, Any]] = None,
                      threeShot: bool = False, hasHumanCharacters: bool = True,
                      animalType: str = None) -> str:
    """
    Generate camera-ready prompt for a story page.

    Strategy (matching successful Ben/Kim approach):
    - Each page gets a DIFFERENT specific scene description (not just "living room" repeated)
    - Specific actions/poses for each page
    - Reference images guide identity/style (no rolling conditioning with previous page)
    - This creates natural story flow with variety
    """

    if not hasHumanCharacters:
        # Animal/object story mode: SPECIFIC scene variations per page (like Ben/Kim)
        parsed = _get_detailed_pose_and_action(pageText, pageIndex, animal_type=animalType)
        subject = parsed["subject"]
        action_detail = parsed["action"]
        specific_scene = parsed["specific_scene"]  # DIFFERENT for each page

        # Vary camera angle and shot type for each page
        angle = CAMERA_ANGLES[pageIndex % len(CAMERA_ANGLES)]
        shot = SHOT_TYPES[pageIndex % len(SHOT_TYPES)]

        return " ".join([
            f"SUBJECT: {subject} — lock identity, body shape, and coloring to match the reference images exactly.",
            f"Scene: {specific_scene}.",
            f"Action: {action_detail}",
            f"Camera: {shot}, 35mm lens, {angle}, natural color, soft focus background.",
            f"Composition: subject clearly visible; expressive and natural; clean background; no text, no logos, no watermarks.",
        ])

    # Human character mode: lock identity and wardrobe with specific scenes
    # Vary scenes for Ben/Kim stories
    human_scenes = [
        "city park entrance with trees and path, early afternoon daylight",
        "wooden park bench with soft dappled sunlight through trees",
        "grassy area in park with flowers, natural daylight",
        "park path with trees in background, golden hour lighting",
        "playground area with equipment in soft focus, bright daylight",
    ]

    scene = human_scenes[pageIndex % len(human_scenes)]
    angle = CAMERA_ANGLES[pageIndex % len(CAMERA_ANGLES)]

    if threeShot:
        return " ".join([
            "SUBJECT: BEN and SUBJECT: KIM — lock identity and wardrobe to the reference images.",
            "Introduce a third SUBJECT: a taller, heavier-set male friend with the same illustrative style; keep his identity and wardrobe consistent across pages.",
            f"Scene: {scene}.",
            f"Camera: medium three-shot, 35mm lens, {angle}, natural color.",
            f"Action from story: {pageText}",
            "Composition: all three faces visible; varied poses and expressions matching the action; no extra people; absolutely no text, no words, no letters, no captions on the image.",
        ])
    else:
        return " ".join([
            "SUBJECT: BEN and SUBJECT: KIM — lock identity and wardrobe to the reference images.",
            f"Scene: {scene}.",
            f"Camera: medium two-shot, 35mm lens, {angle}, natural color.",
            f"Action from story: {pageText}",
            "Composition: both faces visible; natural poses and expressions matching the action; no extra people; absolutely no text, no words, no letters, no captions on the image.",
        ])

