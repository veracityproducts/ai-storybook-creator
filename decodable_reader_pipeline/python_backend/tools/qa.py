from typing import Any, Dict, List

async def qa_score_and_pick(variants: List[Dict[str, str]], *, requiredSubjects: int,
                            wardrobeSummary: str, actionText: str | None = None) -> Dict[str, Any]:
    # Placeholder rubric: pick first
    scores = [{
        "allPresent": True,
        "sameIdentityOk": True,
        "wardrobeConsistencyOk": True,
        "proportionsOk": True,
        "actionOk": True,
        "artifactPenalty": 0.0,
        "totalScore": 0.9,
        "notes": "placeholder",
    } for _ in variants]
    return {"bestIndex": 0, "scores": scores}

