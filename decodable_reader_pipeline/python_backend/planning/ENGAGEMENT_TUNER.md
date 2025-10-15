# Engagement Tuner (Deterministic Rubric)

Goals
- Encourage motion, concrete imagery, light surprise/questions, and avoid monotony.
- Never break decodability; only choose among already-constrained candidates.

Rubric (per page)
- +0.30 motion verb present (from a small allowed list per pattern)
- +0.20 concrete noun present (from a small allowed list per theme/pattern)
- +0.20 question cadence hit (every N pages when '?' is allowed)
- −0.20 repeated sentence duplicate (exact match with any prior page)
- −0.10 mechanical uniformity (every sentence exactly min or max tokens)

Recommended parameters
- question_every_n = 3 (if '?' is allowed in pattern)
- repetitive_ngram = 2 (small n-gram window for quick monotony check)
- max_repetition = 2 occurrences allowed before penalty

Python (pseudocode you can drop in)
```python path=null start=null
import re
from typing import List, Set, Tuple

def _tokens(s: str) -> List[str]:
    return re.findall(r"[A-Za-z']+|[.!?]", s)

def has_any(words: Set[str], pool: Set[str]) -> bool:
    return any(w in pool for w in words)

def score_page(
    text: str,
    *,
    motion_verbs: Set[str],
    concrete_nouns: Set[str],
    allow_question: bool,
    page_index: int,
    question_every_n: int = 3,
    sentence_len_bounds: Tuple[int, int] = (3, 8),
    prior_sentences: Set[str] = frozenset(),
) -> float:
    toks = [t.lower() for t in _tokens(text) if t.strip()]
    words = {t for t in toks if re.match(r"^[A-Za-z']+$", t)}
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]

    score = 0.0
    # Motion verb
    if has_any(words, motion_verbs):
        score += 0.30
    # Concrete noun
    if has_any(words, concrete_nouns):
        score += 0.20
    # Question cadence
    if allow_question and (question_every_n > 0) and ((page_index + 1) % question_every_n == 0):
        if any(s.endswith('?') for s in sentences):
            score += 0.20
    # Repetition penalty (exact sentence repeat)
    if any(s.lower() in prior_sentences for s in sentences):
        score -= 0.20
    # Mechanical uniformity penalty
    min_len, max_len = sentence_len_bounds
    if sentences:
        lens = [len([w for w in _tokens(s) if re.match(r"^[A-Za-z']+$", w)]) for s in sentences]
        if all(l == min_len or l == max_len for l in lens):
            score -= 0.10
    return score

def pick_best_of_k(
    candidates: List[str],
    *,
    motion_verbs: Set[str],
    concrete_nouns: Set[str],
    allow_question: bool,
    page_index: int,
    prior_sentences_global: List[str],
    question_every_n: int = 3,
    sentence_len_bounds: Tuple[int, int] = (3, 8),
) -> Tuple[int, float]:
    prior = set(s.lower() for s in prior_sentences_global)
    best_i, best_score = 0, float('-inf')
    for i, text in enumerate(candidates):
        s = score_page(
            text,
            motion_verbs=motion_verbs,
            concrete_nouns=concrete_nouns,
            allow_question=allow_question,
            page_index=page_index,
            question_every_n=question_every_n,
            sentence_len_bounds=sentence_len_bounds,
            prior_sentences=prior,
        )
        if s > best_score:
            best_i, best_score = i, s
    return best_i, best_score
```

Usage notes
- Only compare candidates already produced under ALLOWED_WORDS and structure constraints.
- Keep motion_verbs and concrete_nouns tiny (5–15 each) and pattern/theme-specific.
- Always run the deterministic decodability validator after selecting a winner.
