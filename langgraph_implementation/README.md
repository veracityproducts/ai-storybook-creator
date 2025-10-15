# Decodable Reader Generator — LangGraph/Pydantic AI Implementation

A Python service that generates 20 research-based decodable readers with consistent, high-quality images using Gemini 2.5 Flash Image.

## Features

- **20 Pre-Built Readers** across 4 sets (CVC → Digraphs → Initial Blends → Final Blends)
- **Artistic Style Continuity** — Ben/Kim reference images anchor style even for non-human-character stories
- **Decodability Validation** — Enforces phonics scope/sequence and heart word constraints
- **Character Consistency** — Rolling conditioning maintains identity across pages
- **QA Scoring** — Automated quality assessment for generated images

## Quick Start

### 1. Install Dependencies

```bash
cd langgraph_implementation/python_backend
pip install -r requirements.txt
```

### 2. Set Environment Variables

Create `.env` in `python_backend/`:

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

### 3. Generate a Single Reader

```bash
# By ID
python scripts/generate_reader.py --reader-id reader-01

# By title
python scripts/generate_reader.py --title "Pat the Cat"

# By set and index
python scripts/generate_reader.py --set 1 --index 0
```

Output: `tmp/readers/reader-01/page-1.png`, `page-2.png`, ..., `metadata.json`

### 4. Generate All Readers

```bash
# All 20 readers
python scripts/generate_all_readers.py

# Only Set 1 (CVC readers)
python scripts/generate_all_readers.py --set 1

# Range
python scripts/generate_all_readers.py --start reader-05 --end reader-10
```

## The 20 Readers

### Set 1: CVC Readers (Short Vowels Only)
1. **Pat the Cat** — Short a with simple consonants
2. **Big Pig** — Short i
3. **Hot Dog** — Short o
4. **Bud the Pup** — Short u
5. **Red Hen** — Short e

### Set 2: Digraph Readers (CVC + Digraphs)
6. **Chip and Chop** — ch digraph
7. **Fish Wish** — sh digraph
8. **This and That** — th digraph
9. **Duck Luck** — ck spelling pattern
10. **Ring a Song** — ng and nk digraphs

### Set 3: Initial Blend Readers (CVC + Digraphs + Initial Blends)
11. **Frog on a Log** — R-blends (fr, gr, br, cr, tr)
12. **Sled Fun** — L-blends (sl, bl, cl, fl, gl, pl)
13. **Snack Stop** — S-blends (sn, sp, st, sk, sm, sw)
14. **Drip Drop** — Mixed initial blends
15. **Trent and Brent** — Comprehensive initial blends review

### Set 4: Final Blend Readers (All Previous Patterns + Final Blends)
16. **Camp Quest** — Final blends (mp, st, nd, nt, nk)
17. **The Stamp Shop** — Final blends (st, mp, ft, pt)
18. **Kind Skunk** — Final blends (nk, nd, nt, ft, lt)
19. **Band Land** — Final blends (nd, nt, st, mp, ft)
20. **West Wind Quest** — Comprehensive review

## Architecture

### Agents
- **OrchestratorAgent** — Owns the end-to-end DAG (text → images → QA)
- **GuardrailAgent** — Validates decodability and repairs violations

### Tools
- **Text+Phonics** — `config_phonics`, `story_generate`, `story_validate`, `story_repair`
- **Prompting** — `page_prompt` (with human-character detection)
- **Identity/Continuity** — `summarize_appearance`, `rolling_conditioning`, `compare_identity`
- **Images** — `image_generate` (Gemini 2.5 Flash Image), `qa_score_and_pick`
- **Utilities** — `detect_human_characters`, `reader_loader`

### Key Innovation: Artistic Style Continuity

When human characters (Ben, Kim, etc.) are **not** mentioned in the decodable text, the system still includes Ben/Kim reference images in the conditioning stack to preserve artistic style (color palette, line work, rendering technique).

**Example:**
- **Reader 1: "Pat the Cat"** — No human characters, but images maintain the same illustrative style as Ben/Kim
- **Reader 15: "Trent and Brent"** — Human characters present, so identity + wardrobe are locked

This ensures visual consistency across all 20 readers.

## API Endpoint

Start the FastAPI server:

```bash
cd python_backend
uvicorn api.endpoints:app --reload --port 8000
```

### POST `/preview/compile-blends-illustrated`

**Request:**
```json
{
  "patternId": "cvc-short-a",
  "title": "Pat the Cat",
  "theme": "A cat named Pat",
  "pageCount": 4,
  "sampleCount": 1,
  "threeShot": false,
  "heartWords": ["the", "a", "I"],
  "whitelist": []
}
```

**Response:**
```json
{
  "ok": true,
  "title": "Pat the Cat",
  "validation": {"valid": true, "offendingWords": [], "issues": []},
  "pages": [
    {
      "index": 0,
      "text": "Pat sat.",
      "imageBase64": "...",
      "mimeType": "image/png"
    }
  ]
}
```

## File Structure

```
langgraph_implementation/
├── PLAN.md                          # Architecture document
├── README.md                        # This file
├── data/
│   └── readers.json                 # All 20 readers (text + metadata)
├── python_backend/
│   ├── agents/
│   │   ├── orchestrator_agent.py    # Main DAG
│   │   └── guardrail_agent.py       # Decodability validation
│   ├── tools/
│   │   ├── text.py                  # Phonics config, generate, validate, repair
│   │   ├── prompts.py               # Camera-ready prompts
│   │   ├── gemini_image.py          # Image generation
│   │   ├── identity.py              # Appearance, rolling conditioning
│   │   ├── qa.py                    # QA scoring
│   │   ├── text_analysis.py         # Human character detection
│   │   └── reader_loader.py         # Load readers from JSON
│   ├── graph/
│   │   ├── state.py                 # Graph state model
│   │   └── workflow.py              # Tools facade + orchestrator builder
│   ├── api/
│   │   ├── models.py                # Request/response models
│   │   └── endpoints.py             # FastAPI routes
│   └── requirements.txt
└── scripts/
    ├── generate_reader.py           # Generate single reader
    └── generate_all_readers.py      # Batch generation
```

## Next Steps

1. **Wire Real Decodability Logic** — Replace placeholder validation/repair with your existing TS logic or Python ports
2. **Add Ben/Kim Reference Images** — Replace `placeholder_ben` and `placeholder_kim` with actual base64-encoded images
3. **Implement QA Scoring** — Wire Gemini vision for automated quality assessment
4. **Add Storage** — Optional Supabase upload for generated images
5. **Test & Iterate** — Generate Set 1 (5 readers) and refine prompts/QA thresholds

## Research Foundation

These readers follow evidence-based guidelines:
- **80-90% decodability** (Pugh et al., 2023)
- **Systematic phonics progression** (CVC → digraphs → blends)
- **Heart word integration** (10-15 irregular words before formal phonics)
- **Gradual sentence complexity** (3-5 words → 8-12+ words)

See `decodable-text.md` for full research citations and implementation guidelines.

## Cost Estimation

Per reader (4-5 pages):
- **Text generation**: <$0.01 (Gemini 2.0 Flash Lite)
- **Image generation**: ~$0.05-$0.25 (4-5 images × Gemini 2.5 Flash Image)
- **Total per reader**: ~$0.05-$0.30

All 20 readers: ~$1-$6 total (depending on region/pricing).

## License

MIT

