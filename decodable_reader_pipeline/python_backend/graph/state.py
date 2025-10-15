from pydantic import BaseModel
from typing import Any, Dict, List, Optional

class GraphState(BaseModel):
    pattern_id: str
    title: str
    theme: str
    page_count: int = 5
    max_word_len: int = 4
    heart_words: List[str] = ["I","a","the","to"]
    whitelist: List[str] = []
    three_shot: bool = False
    sample_count: int = 1

    story: Optional[Dict[str, Any]] = None
    validation: Optional[Dict[str, Any]] = None
    pages: List[Dict[str, Any]] = []
    appearance: Optional[Dict[str, Any]] = None

