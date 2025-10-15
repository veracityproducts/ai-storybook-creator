from fastapi import FastAPI
from .models import PreviewRequest, PreviewResponse, PageResponse
from ..graph.workflow import build_orchestrator

app = FastAPI()

@app.post("/preview/compile-blends-illustrated", response_model=PreviewResponse)
async def preview_compile(req: PreviewRequest):
    orch = await build_orchestrator()
    result = await orch.run_preview(
        pattern_id=req.patternId,
        title=req.title,
        theme=req.theme,
        page_count=req.pageCount,
        max_word_len=4,
        heart_words=req.heartWords or ["I","a","the","to"],
        whitelist=req.whitelist or [],
        three_shot=req.threeShot,
        sample_count=req.sampleCount,
    )
    pages = [PageResponse(index=p.index, text=p.text, imageBase64=p.imageBase64 or "", mimeType=p.mimeType or "image/png") for p in result.pages]
    return PreviewResponse(ok=result.ok, title=result.title, validation=result.validation, pages=pages)

