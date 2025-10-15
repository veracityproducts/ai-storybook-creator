# Decodable Reader Generator — Sequential Python Pipeline

**Status:** ✅ Production-ready | **Model:** Gemini 2.5 Flash Image (stable GA)

A **completely self-contained, portable Python pipeline** that generates 20 research-based decodable readers with consistent, high-quality images.

**Architecture:** Sequential async Python workflow (not graph-based) using OrchestratorAgent, Pydantic validation, and Gemini 2.5 Flash Image.

## 🎯 Self-Contained & Portable

**Everything needed is in this directory:**
- ✅ All Python code (agents, tools, workflows)
- ✅ All reference images (`reference_images/animals/` + `reference_images/humans/`)
- ✅ All reader definitions (`data/readers.json` - 20 readers across 4 sets)
- ✅ All documentation and examples

**No dependencies on parent Next.js app or legacy code.** You can copy this entire directory to a new project and it will work.

## Technology Stack

- **Sequential async Python** - OrchestratorAgent with linear workflow (not graph-based)
- **Gemini 2.5 Flash Image** - Image generation with reference conditioning
- **Pydantic** - Data validation and type safety
- **Python 3.13+**

**Note:** Despite `langgraph` being in requirements.txt, this pipeline does **not** use LangGraph's graph structure (StateGraph, nodes, edges). It's a straightforward sequential async workflow.

## Features

- **20 Pre-Built Readers** across 4 sets (CVC → Digraphs → Initial Blends → Final Blends)
- **Ben/Kim Approach** — Specific scene variations per page with consistent character refs (no rolling conditioning)
- **Natural Story Flow** — Each page gets different specific location within same environment
- **Decodability Validation** — Enforces phonics scope/sequence and heart word constraints
- **Character Consistency** — Reference image conditioning maintains identity across pages
- **QA Scoring** — Automated quality assessment for generated images

## Quick Start

### 1. Install Dependencies

```bash
cd langgraph_implementation/python_backend
pip install -r requirements.txt
```

### 2. Set Environment Variables

Create `.env.local` in the **project root** (or set environment variable):

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

The code will automatically load from `.env.local` in the project root.

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

## Directory Structure

```
langgraph_implementation/
├── reference_images/           # All reference images (self-contained)
│   ├── animals/               # Animal character references
│   │   ├── animal-group.jpg   # Style reference for all animals
│   │   ├── pat-the-fat-cat-reference.jpg
│   │   ├── sid-the-pig-reference.jpg
│   │   ├── gus-the-pup-reference.jpg
│   │   ├── meg-the-hen-reference.jpg
│   │   └── dot-the-fox-reference.jpg
│   └── humans/                # Human character references
│       ├── ben-ref-1.png
│       ├── ben-ref-2.png
│       └── kim-ref.png
├── data/
│   └── readers.json           # All 20 reader definitions
├── python_backend/
│   ├── agents/                # Orchestrator + Guardrail agents
│   ├── tools/                 # Prompts, image gen, QA, text analysis
│   ├── graph/                 # LangGraph workflow
│   └── requirements.txt
├── scripts/
│   ├── generate_reader.py     # Single reader generation
│   └── generate_all_readers.py # Batch generation
└── *.md                       # Documentation
```

## Architecture

### Agents
- **OrchestratorAgent** — Owns the end-to-end DAG (text → images → QA)
- **GuardrailAgent** — Validates decodability and repairs violations

### Tools
- **Text+Phonics** — `config_phonics`, `story_generate`, `story_validate`, `story_repair`
- **Prompting** — `page_prompt` with Ben/Kim approach (specific scene variations per page)
- **Identity/Continuity** — `summarize_appearance`, `rolling_conditioning`, `compare_identity`
- **Images** — `image_generate` (Gemini 2.5 Flash Image), `qa_score_and_pick`
- **Utilities** — `detect_human_characters`, `reader_loader`

### Key Innovation: Ben/Kim Approach

**For Animal Stories:**
- Each page gets a **different specific scene** within the same environment
- Same character refs passed to **every page** (no rolling conditioning with previous images)
- Creates natural story flow with variety while maintaining character consistency

**Example: "Pat the Cat"**
- Page 1: "living room corner near window"
- Page 2: "near low bookshelf"
- Page 3: "living room center with rug"
- Page 4: "by the couch"

Same cat, same living room, but different specific locations and poses.

**For Human Stories:**
- Ben/Kim reference images lock identity and wardrobe
- Rolling conditioning maintains consistency across pages

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

