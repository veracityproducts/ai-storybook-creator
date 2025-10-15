import os
from typing import Any, Dict, List
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

async def image_generate(prompt: str, refs: List[Dict[str, str]] | None = None, n: int = 1,
                         model: str = "gemini-2.5-flash-image") -> List[Dict[str, str]]:
    import base64
    genai.configure(api_key=os.environ.get("GOOGLE_GENERATIVE_AI_API_KEY"))
    m = genai.GenerativeModel(model_name=model)
    parts: List[Dict[str, Any]] = [{"text": prompt}]
    for r in refs or []:
        parts.append({"inline_data": {"data": r.get("base64"), "mime_type": r.get("mimeType", "image/png")}})
    out: List[Dict[str, str]] = []
    count = max(1, min(int(n), 8))
    for _ in range(count):
        res = m.generate_content(contents=[{"role":"user","parts": parts}])
        # extract first inline image
        found = None
        for cand in (res.candidates or []):
            for p in getattr(cand.content, "parts", []) or []:
                inline = getattr(p, "inline_data", None)
                if inline and getattr(inline, "data", None):
                    # Convert bytes to base64 string if needed
                    img_data = inline.data
                    if isinstance(img_data, bytes):
                        img_data = base64.b64encode(img_data).decode("utf-8")
                    found = {"base64": img_data, "mimeType": inline.mime_type or "image/png"}
                    break
            if found:
                break
        if not found:
            # try text fallback
            try:
                txt = res.text or ""
                import re
                mth = re.search(r"data:(image/[a-zA-Z+]+);base64,([A-Za-z0-9+/=]+)", txt)
                if mth:
                    found = {"base64": mth.group(2), "mimeType": mth.group(1)}
            except Exception:
                pass
        if not found:
            raise RuntimeError("Gemini did not return an inline image")
        out.append(found)
    return out

