from pydantic import BaseModel
from typing import List, Tuple

class ValidationReport(BaseModel):
    valid: bool
    offending_words: List[str] = []
    issues: List[str] = []

class GuardrailAgent:
    """Decodability guardrail: validates and minimally repairs a story."""

    def validate(self, story: dict, cfg: dict) -> ValidationReport:
        # Placeholder; connect to your validator
        pages = story.get("pages", [])
        issues: List[str] = []
        offending: List[str] = []
        # Minimal structure check; decodability logic to be implemented
        for i, p in enumerate(pages):
            text = (p.get("text") or "").strip()
            if not text:
                issues.append(f"page {i+1}: empty text")
        return ValidationReport(valid=len(issues) == 0, offending_words=sorted(set(offending)), issues=issues)

    def repair(self, story: dict, cfg: dict, max_passes: int = 1) -> Tuple[dict, ValidationReport]:
        current = story
        report = self.validate(current, cfg)
        passes = 0
        while not report.valid and passes < max_passes:
            # Minimal no-op repair placeholder
            passes += 1
            report = self.validate(current, cfg)
        return current, report

