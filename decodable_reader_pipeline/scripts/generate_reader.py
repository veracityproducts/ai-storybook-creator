#!/usr/bin/env python3
"""
Generate a single decodable reader with images.

Usage:
    python scripts/generate_reader.py --reader-id reader-01
    python scripts/generate_reader.py --title "Pat the Cat"
    python scripts/generate_reader.py --set 1 --index 0
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from python_backend.tools.reader_loader import get_reader_by_id, get_reader_by_title, get_readers_by_set
from python_backend.graph.workflow import build_orchestrator

async def generate_reader(reader_data: dict, output_dir: str = "tmp/readers"):
    """Generate images for a reader"""
    reader_id = reader_data.get("id")
    title = reader_data.get("title")
    pages = reader_data.get("pages", [])
    heart_words = reader_data.get("heartWords", ["the", "a", "I"])
    pattern_id = reader_data.get("patternId", "cvc-short-a")
    
    print(f"\n{'='*60}")
    print(f"Generating: {title} ({reader_id})")
    print(f"Pattern: {pattern_id}")
    print(f"Pages: {len(pages)}")
    print(f"Heart words: {', '.join(heart_words)}")
    print(f"{'='*60}\n")
    
    # Build orchestrator
    orch = await build_orchestrator()
    
    # Run preview with pre-defined text
    result = await orch.run_preview(
        pattern_id=pattern_id,
        title=title,
        theme=f"Story about: {' '.join([p['text'] for p in pages[:2]])}",
        page_count=len(pages),
        max_word_len=10,  # Allow longer words for later sets
        heart_words=heart_words,
        whitelist=[],
        three_shot=False,
        sample_count=1,
        predefined_pages=pages,
    )
    
    # Create output directory
    reader_dir = Path(output_dir) / reader_id
    reader_dir.mkdir(parents=True, exist_ok=True)
    
    # Save images
    for page in result.pages:
        img_path = reader_dir / f"page-{page.index + 1}.png"
        # Decode base64 and save
        import base64
        img_data = base64.b64decode(page.imageBase64)
        with open(img_path, "wb") as f:
            f.write(img_data)
        print(f"✓ Saved: {img_path}")
    
    # Save metadata
    meta = {
        "id": reader_id,
        "title": title,
        "patternId": pattern_id,
        "phonicsFocus": reader_data.get("phonicsFocus"),
        "decodability": reader_data.get("decodability"),
        "heartWords": heart_words,
        "validation": result.validation,
        "pages": [
            {
                "index": p.index,
                "text": p.text,
                "qa": p.qa,
            }
            for p in result.pages
        ],
    }
    
    meta_path = reader_dir / "metadata.json"
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"✓ Saved: {meta_path}")
    
    print(f"\n{'='*60}")
    print(f"✓ Complete: {title}")
    print(f"  Output: {reader_dir}")
    print(f"  Validation: {'PASS' if result.ok else 'FAIL'}")
    print(f"{'='*60}\n")
    
    return result

async def main():
    parser = argparse.ArgumentParser(description="Generate a decodable reader with images")
    parser.add_argument("--reader-id", help="Reader ID (e.g., reader-01)")
    parser.add_argument("--title", help="Reader title (e.g., 'Pat the Cat')")
    parser.add_argument("--set", type=int, help="Set number (1-4)")
    parser.add_argument("--index", type=int, help="Index within set (0-based)")
    parser.add_argument("--output", default="tmp/readers", help="Output directory")
    
    args = parser.parse_args()
    
    # Find reader
    reader = None
    if args.reader_id:
        reader = get_reader_by_id(args.reader_id)
    elif args.title:
        reader = get_reader_by_title(args.title)
    elif args.set is not None and args.index is not None:
        readers = get_readers_by_set(args.set)
        if 0 <= args.index < len(readers):
            reader = readers[args.index]
    else:
        parser.error("Must specify --reader-id, --title, or --set and --index")
    
    if not reader:
        print("❌ Reader not found")
        sys.exit(1)
    
    # Generate
    await generate_reader(reader, args.output)

if __name__ == "__main__":
    asyncio.run(main())

