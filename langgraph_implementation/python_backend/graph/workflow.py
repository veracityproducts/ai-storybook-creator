from typing import Any, Dict
from .state import GraphState
from ..agents.orchestrator_agent import OrchestratorAgent
from ..agents.guardrail_agent import GuardrailAgent
from ..tools import text as text_tools
from ..tools import prompts as prompt_tools
from ..tools import gemini_image as image_tools
from ..tools import identity as ident_tools
from ..tools import qa as qa_tools

class ToolsFacade:
    async def config_phonics(self, cfg: Dict[str, Any]):
        return await text_tools.config_phonics(cfg)
    async def story_generate(self, cfg: Dict[str, Any], title: str, theme: str, page_count: int, predefined_pages=None):
        return await text_tools.story_generate(cfg, title, theme, page_count, predefined_pages)
    async def story_validate(self, story: Dict[str, Any], cfg: Dict[str, Any]):
        return await text_tools.story_validate(story, cfg)
    async def story_repair(self, story: Dict[str, Any], cfg: Dict[str, Any], max_passes: int = 1):
        return await text_tools.story_repair(story, cfg, max_passes)
    async def prompt_page(self, pageText: str, pageIndex: int = 0, appearanceSummary=None, threeShot: bool = False, hasHumanCharacters: bool = True, animalType: str = None):
        return await prompt_tools.page_prompt(pageText=pageText, pageIndex=pageIndex, appearanceSummary=appearanceSummary, threeShot=threeShot, hasHumanCharacters=hasHumanCharacters, animalType=animalType)
    async def image_generate(self, prompt: str, refs, n: int):
        return await image_tools.image_generate(prompt, refs, n)
    async def image_qa_score_and_pick(self, variants, **kwargs):
        return await qa_tools.qa_score_and_pick(variants, **kwargs)
    async def identity_summarize_appearance(self, image):
        return await ident_tools.summarize_appearance(image)
    async def identity_rolling_conditioning(self, prev, seed_refs=None):
        return await ident_tools.rolling_conditioning(prev, seed_refs)
    async def identity_compare(self, prev, nxt):
        return await ident_tools.compare_identity(prev, nxt)

async def build_orchestrator():
    tools = ToolsFacade()
    guard = GuardrailAgent()
    return OrchestratorAgent(tools, guard)

