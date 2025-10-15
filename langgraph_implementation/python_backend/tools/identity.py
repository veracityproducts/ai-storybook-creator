from typing import Any, Dict, List

async def summarize_appearance(image: Dict[str, str]) -> Dict[str, Any]:
    # Placeholder: return simple tokens; wire Gemini vision later
    return {
        "subjects": [
            {"slot": "A", "description": "short brown hair; blue tee; stripe joggers"},
            {"slot": "B", "description": "long dark hair; red dress"},
        ],
        "globalNotes": "daylight; medium shot; clean background",
    }

async def rolling_conditioning(prev_images: List[Dict[str, str]], seed_refs: List[Dict[str, str]] | None = None) -> List[Dict[str, str]]:
    # Merge prior chosen panels as refs
    refs = []
    for img in prev_images:
        refs.append({"base64": img.get("base64"), "mimeType": img.get("mimeType", "image/png")})
    for s in (seed_refs or []):
        refs.append(s)
    return refs

async def compare_identity(prev: Dict[str, str], nxt: Dict[str, str]) -> Dict[str, Any]:
    # Placeholder: assume OK; wire Gemini vision compare later
    return {"sameIdentityOk": True, "notes": "placeholder compare"}

