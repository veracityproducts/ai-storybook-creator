# Portability & Self-Containment

**Date:** 2025-10-15  
**Status:** ✅ Fully self-contained and portable

## Overview

The `langgraph_implementation/` directory is now **completely self-contained** with zero dependencies on the parent Next.js application or any external code.

## What's Included

### ✅ All Code
```
python_backend/
├── agents/           # Orchestrator + Guardrail
├── tools/            # Prompts, image gen, QA, text analysis
├── graph/            # LangGraph workflow
└── requirements.txt  # Python dependencies
```

### ✅ All Reference Images
```
reference_images/
├── animals/
│   ├── animal-group.jpg              # Style reference
│   ├── pat-the-fat-cat-reference.jpg
│   ├── sid-the-pig-reference.jpg
│   ├── gus-the-pup-reference.jpg
│   ├── meg-the-hen-reference.jpg
│   └── dot-the-fox-reference.jpg
└── humans/
    ├── ben-ref-1.png
    ├── ben-ref-2.png
    └── kim-ref.png
```

### ✅ All Data
```
data/
└── readers.json      # All 20 reader definitions
```

### ✅ All Scripts
```
scripts/
├── generate_reader.py        # Single reader generation
└── generate_all_readers.py   # Batch generation
```

### ✅ All Documentation
```
README.md                     # Main documentation
PLAN.md                       # Original planning
BEN_KIM_APPROACH_FIX.md      # Key breakthrough
PROMPT_V2_IMPROVEMENTS.md    # Prompt evolution
REFERENCE_STRATEGY_FIX.md    # Reference image strategy
SET_1_TEST_RESULTS.md        # Test results
PORTABILITY.md               # This file
```

## What's NOT Included (Not Needed)

### ❌ Next.js App
- `app/api/*` - Legacy API routes
- `lib/*` - Legacy TypeScript utilities
- `components/*` - UI components

### ❌ Legacy Scripts
- `scripts/preview-story-direct.js` - Reference example only
- `scripts/preview-story.js` - Legacy
- `scripts/run-blends-illustrated.mjs` - Legacy

### ❌ Original ai_docs/
- Now copied into `reference_images/`
- Original can be deleted or kept for reference

## How to Use in a New Project

### Option 1: Copy Entire Directory

```bash
# Copy the entire directory
cp -r langgraph_implementation/ /path/to/new/project/

# Install dependencies
cd /path/to/new/project/langgraph_implementation/python_backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set API key
export GOOGLE_GENERATIVE_AI_API_KEY=your_key_here

# Generate readers
cd /path/to/new/project
python3 langgraph_implementation/scripts/generate_reader.py --reader-id reader-01
```

### Option 2: Git Subtree

```bash
# In new project
git subtree add --prefix=decodable-readers \
  https://github.com/veracityproducts/ai-storybook-creator.git \
  main:langgraph_implementation
```

### Option 3: Separate Repository

```bash
# Create new repo with just langgraph_implementation/
git clone https://github.com/veracityproducts/ai-storybook-creator.git temp
cd temp
git filter-branch --subdirectory-filter langgraph_implementation -- --all
git remote set-url origin https://github.com/your-org/decodable-readers.git
git push -u origin main
```

## External Dependencies

### Required
1. **Python 3.13+**
2. **Python packages** (in `requirements.txt`):
   - `google-generativeai` - Gemini API
   - `langgraph` - Workflow orchestration
   - `pydantic` - Data validation
   - `python-dotenv` - Environment variables

3. **Google Generative AI API Key**
   - Set in `.env.local` or environment variable
   - `GOOGLE_GENERATIVE_AI_API_KEY=your_key_here`

### Optional
- `.env.local` file in project root (or set env var directly)

## Path Resolution

All paths are resolved relative to the code location:

```python
# In orchestrator_agent.py
base_path = os.path.join(os.path.dirname(__file__), "../../reference_images/animals")
```

This means the code will work regardless of where `langgraph_implementation/` is placed in the filesystem.

## Testing Portability

To verify portability:

```bash
# 1. Copy to temp location
cp -r langgraph_implementation /tmp/test-portable

# 2. Set up environment
cd /tmp/test-portable/python_backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Set API key
export GOOGLE_GENERATIVE_AI_API_KEY=your_key_here

# 4. Generate a reader
cd /tmp/test-portable
python3 scripts/generate_reader.py --reader-id reader-01

# 5. Verify output
ls -la /tmp/readers/reader-01/
```

If this works, the directory is fully portable! ✅

## Version Control

When committing to a new repository:

```bash
# Include
✅ python_backend/
✅ reference_images/
✅ data/
✅ scripts/
✅ *.md

# Exclude (add to .gitignore)
❌ python_backend/venv/
❌ python_backend/**/__pycache__/
❌ python_backend/**/*.pyc
❌ .env
❌ .env.local
❌ tmp/
```

## Maintenance

### Adding New Readers
Edit `data/readers.json` - no code changes needed.

### Adding New Animals
1. Add reference image to `reference_images/animals/`
2. Update `STORY_SCENE_VARIATIONS` in `python_backend/tools/prompts.py`
3. Update `filename_map` in `python_backend/agents/orchestrator_agent.py`

### Adding New Humans
1. Add reference images to `reference_images/humans/`
2. Update `_load_seed_refs()` in `python_backend/agents/orchestrator_agent.py`

## Support

For issues or questions:
- Check `README.md` for usage instructions
- Review `BEN_KIM_APPROACH_FIX.md` for prompt strategy
- See `PLAN.md` for architecture overview

## License

[Add your license here]

---

**Last Updated:** 2025-10-15  
**Tested On:** macOS with Python 3.13  
**Status:** Production-ready ✅

