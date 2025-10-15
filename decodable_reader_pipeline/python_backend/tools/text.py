from typing import Any, Dict, List, Tuple

# Placeholders wired to your TS logic later or to Python ports.

async def config_phonics(cfg: Dict[str, Any]) -> Dict[str, Any]:
    # Normalize config
    pattern_id = cfg.get("patternId")
    max_len = int(cfg.get("maxWordLen", 4))
    heart = [str(w) for w in cfg.get("heartWords", ["I","a","the","to"])]
    whitelist = [str(w).lower() for w in cfg.get("whitelist", [])]
    max_sents = int(cfg.get("maxSentencesPerPage", 2))
    return {
        "patternId": pattern_id,
        "maxWordLen": max_len,
        "heartWords": heart,
        "whitelist": whitelist,
        "maxSentencesPerPage": max_sents,
    }

async def story_generate(cfg: Dict[str, Any], title: str, theme: str, page_count: int, predefined_pages: list = None) -> Dict[str, Any]:
    # If predefined pages provided (from readers.json), use them
    if predefined_pages:
        return {"title": title, "pages": predefined_pages}

    # Otherwise, minimal stub story
    pages = []
    for i in range(page_count):
        pages.append({"index": i, "text": "I see Ben. I see Kim." if i == 0 else "Ben and Kim play."})
    return {"title": title, "pages": pages}

async def story_validate(story: Dict[str, Any], cfg: Dict[str, Any]) -> Dict[str, Any]:
    # Minimal stub validator; replace with your decodability validator
    issues: List[str] = []
    for p in story.get("pages", []):
        if p.get("text") is None or len(p.get("text").strip()) == 0:
            issues.append(f"page {p.get('index', 0)+1}: empty")
    return {"valid": len(issues) == 0, "offendingWords": [], "issues": issues}

async def story_repair(story: Dict[str, Any], cfg: Dict[str, Any], max_passes: int = 1) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    # No-op repair; return same story for now
    report = await story_validate(story, cfg)
    return story, report

