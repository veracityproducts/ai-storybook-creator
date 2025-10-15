from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from ..tools.text_analysis import detect_human_characters
import base64
import os

class PageOutput(BaseModel):
    index: int
    text: str
    imageBase64: Optional[str] = None
    mimeType: Optional[str] = None
    qa: Optional[Dict[str, Any]] = None

class PreviewResult(BaseModel):
    ok: bool
    title: str
    validation: Dict[str, Any]
    pages: List[PageOutput]

class OrchestratorAgent:
    """Owns the end-to-end DAG: generate → validate/repair → prompt → render → QA/pick."""

    def __init__(self, tools: Any, guardrail) -> None:
        self.tools = tools
        self.guardrail = guardrail
        self._seed_refs_cache = None
        self._animal_refs_cache = {}
        self._animal_group_ref = None

    def _load_seed_refs(self):
        """Load Ben/Kim reference images once and cache"""
        if self._seed_refs_cache is not None:
            return self._seed_refs_cache

        refs = []
        # Path relative to project root
        base_path = os.path.join(os.path.dirname(__file__), "../../../ai_docs/images-2.5-flash-test")

        for img_name in ["ben-ref-1.png", "kim-ref.png"]:
            img_path = os.path.join(base_path, img_name)
            if os.path.exists(img_path):
                with open(img_path, "rb") as f:
                    b64 = base64.b64encode(f.read()).decode("utf-8")
                    refs.append({"base64": b64, "mimeType": "image/png"})

        self._seed_refs_cache = refs
        return refs

    def _load_animal_group_ref(self):
        """Load the animal group reference image for style context"""
        if self._animal_group_ref is not None:
            return self._animal_group_ref

        base_path = os.path.join(os.path.dirname(__file__), "../../../ai_docs/animal-references")
        img_path = os.path.join(base_path, "animal-group.jpg")

        if os.path.exists(img_path):
            with open(img_path, "rb") as f:
                b64 = base64.b64encode(f.read()).decode("utf-8")
                self._animal_group_ref = {"base64": b64, "mimeType": "image/jpeg"}
                return self._animal_group_ref

        return None

    def _load_animal_ref(self, animal_name: str):
        """Load animal reference image (e.g., 'cat', 'pig', 'dog')"""
        if animal_name in self._animal_refs_cache:
            return self._animal_refs_cache[animal_name]

        # Map animal names to reference files
        animal_files = {
            "cat": "pat-the-fat-cat-reference.jpg",
            "pig": "sid-the-pig-reference.jpg",
            "dog": "gus-the-pup-reference.jpg",
            "pup": "gus-the-pup-reference.jpg",
            "hen": "meg-the-hen-reference.jpg",
            "fox": "dot-the-fox-reference.jpg",
        }

        if animal_name not in animal_files:
            return None

        base_path = os.path.join(os.path.dirname(__file__), "../../../ai_docs/animal-references")
        img_path = os.path.join(base_path, animal_files[animal_name])

        if os.path.exists(img_path):
            with open(img_path, "rb") as f:
                b64 = base64.b64encode(f.read()).decode("utf-8")
                ref = {"base64": b64, "mimeType": "image/jpeg"}
                self._animal_refs_cache[animal_name] = ref
                return ref

        return None

    def _detect_animal_from_title(self, title: str):
        """Detect which animal is the subject from the story title"""
        import re
        title_lower = title.lower()
        # Check for whole words to avoid false matches
        # Order matters: check longer/more specific terms first
        animals = ["cat", "pig", "hen", "fox", "pup", "dog"]
        for animal in animals:
            # Use word boundaries to match whole words
            if re.search(r'\b' + animal + r'\b', title_lower):
                return animal
        return None

    def _detect_animal_in_text(self, text: str, fallback_animal: str = None):
        """Detect which animal is the subject of the page, with fallback"""
        import re
        text_lower = text.lower()
        # Check for whole words to avoid false matches (e.g., "Pat" shouldn't match "pup")
        # Order matters: check longer/more specific terms first
        animals = ["cat", "pig", "hen", "fox", "pup", "dog"]
        for animal in animals:
            # Use word boundaries to match whole words
            if re.search(r'\b' + animal + r'\b', text_lower):
                return animal
        # If no animal found in text, use fallback (from title)
        return fallback_animal

    async def run_preview(self, *, pattern_id: str, title: str, theme: str, page_count: int = 5,
                          max_word_len: int = 4, heart_words: Optional[List[str]] = None,
                          whitelist: Optional[List[str]] = None, three_shot: bool = False,
                          sample_count: int = 1, predefined_pages: Optional[list] = None) -> PreviewResult:
        heart_words = heart_words or ["I", "a", "the", "to"]
        whitelist = whitelist or []

        cfg = await self.tools.config_phonics(dict(
            patternId=pattern_id,
            maxWordLen=max_word_len,
            heartWords=heart_words,
            whitelist=whitelist,
            maxSentencesPerPage=2,
        ))

        story = await self.tools.story_generate(cfg, title, theme, page_count, predefined_pages)
        report = await self.tools.story_validate(story, cfg)

        attempts = 0
        while not report["valid"] and attempts < 3:
            story, report = await self.tools.story_repair(story, cfg, max_passes=1)
            attempts += 1

        pages_out: List[PageOutput] = []

        # Load Ben/Kim reference images
        seed_refs = self._load_seed_refs()

        # Detect the main animal character from the title (for stories like "Pat the Cat" where page 1 is "Pat sat.")
        story_animal = self._detect_animal_from_title(title)

        # Page 1 (seed identity or style)
        page1_text = story["pages"][0]["text"]
        has_humans_p1 = detect_human_characters(page1_text, whitelist)

        # For animal stories: use animal refs ONLY (no Ben/Kim)
        # For human stories: use Ben/Kim refs
        refs_for_page1 = []
        if not has_humans_p1:
            # Animal story: specific animal + group for style
            # Use title to detect animal if not in page text
            animal = self._detect_animal_in_text(page1_text, fallback_animal=story_animal)
            animal_group = self._load_animal_group_ref()

            if animal:
                animal_ref = self._load_animal_ref(animal)
                if animal_ref:
                    refs_for_page1.append(animal_ref)

            # Animal group provides the style context (not Ben/Kim)
            if animal_group:
                refs_for_page1.append(animal_group)
        else:
            # Human story: use Ben/Kim refs
            refs_for_page1 = seed_refs.copy()

        prompt1 = await self.tools.prompt_page(
            pageText=page1_text,
            pageIndex=0,
            appearanceSummary=None,
            threeShot=three_shot,
            hasHumanCharacters=has_humans_p1,
            animalType=story_animal if not has_humans_p1 else None,
        )
        variants1 = await self.tools.image_generate(prompt1, refs=refs_for_page1, n=max(1, min(sample_count, 4)))
        pick1 = await self.tools.image_qa_score_and_pick(variants1, requiredSubjects=(3 if three_shot else 2) if has_humans_p1 else 1, wardrobeSummary="(seed)")
        chosen1 = variants1[pick1["bestIndex"]]
        appearance = await self.tools.identity_summarize_appearance(chosen1) if has_humans_p1 else None
        pages_out.append(PageOutput(index=0, text=page1_text, imageBase64=chosen1["base64"], mimeType=chosen1.get("mimeType") or "image/png", qa=pick1))

        prev = chosen1
        for i in range(1, len(story["pages"])):
            page_text = story["pages"][i]["text"]
            has_humans = detect_human_characters(page_text, whitelist)

            # Build refs based on story type
            # KEY INSIGHT: Like Ben/Kim prompts, pass ALL character refs to EVERY page (no rolling conditioning)
            if not has_humans:
                # Animal story: use SAME refs for every page (animal + group, NO previous page)
                # This matches the Ben/Kim approach where all character refs are passed to every panel
                animal = self._detect_animal_in_text(page_text, fallback_animal=story_animal)
                animal_group = self._load_animal_group_ref()

                refs = []
                if animal:
                    animal_ref = self._load_animal_ref(animal)
                    if animal_ref:
                        refs.append(animal_ref)

                # Animal group for style
                if animal_group:
                    refs.append(animal_group)

                # NO previous page - let the specific scene descriptions create variety
            else:
                # Human story: use Ben/Kim refs + rolling conditioning
                refs = await self.tools.identity_rolling_conditioning([prev], seed_refs=seed_refs)

            prompt = await self.tools.prompt_page(
                pageText=page_text,
                pageIndex=i,
                appearanceSummary=appearance if has_humans else None,
                threeShot=three_shot,
                hasHumanCharacters=has_humans,
                animalType=story_animal if not has_humans else None,
            )
            variants = await self.tools.image_generate(prompt, refs=refs, n=max(1, min(sample_count, 4)))
            pick = await self.tools.image_qa_score_and_pick(variants, requiredSubjects=(3 if three_shot else 2) if has_humans else 1, wardrobeSummary=str(appearance) if appearance else "(style-only)")
            chosen = variants[pick["bestIndex"]]
            cmp = await self.tools.identity_compare(prev, chosen)
            if not cmp.get("sameIdentityOk") and sample_count > 1 and has_humans:
                # retry once with stronger rolling conditioning (only for human-character pages)
                refs2 = await self.tools.identity_rolling_conditioning([prev], seed_refs=seed_refs)
                variants2 = await self.tools.image_generate(prompt, refs=refs2, n=max(1, min(sample_count, 4)))
                pick2 = await self.tools.image_qa_score_and_pick(variants2, requiredSubjects=(3 if three_shot else 2), wardrobeSummary=str(appearance))
                chosen = variants2[pick2["bestIndex"]]
                pages_out.append(PageOutput(index=i, text=page_text, imageBase64=chosen["base64"], mimeType=chosen.get("mimeType") or "image/png", qa=pick2))
            else:
                pages_out.append(PageOutput(index=i, text=page_text, imageBase64=chosen["base64"], mimeType=chosen.get("mimeType") or "image/png", qa=pick))
            prev = chosen

        return PreviewResult(ok=report["valid"], title=story.get("title") or title, validation=report, pages=pages_out)

