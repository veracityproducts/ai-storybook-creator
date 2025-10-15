from pydantic import BaseModel
from typing import List, Optional

class PreviewRequest(BaseModel):
    patternId: str = "blends-initial"
    title: str
    theme: str
    pageCount: int = 5
    sampleCount: int = 1
    threeShot: bool = False
    heartWords: Optional[List[str]] = None
    whitelist: Optional[List[str]] = None

class PageResponse(BaseModel):
    index: int
    text: str
    imageBase64: str
    mimeType: str

class PreviewResponse(BaseModel):
    ok: bool
    title: str
    validation: dict
    pages: List[PageResponse]

