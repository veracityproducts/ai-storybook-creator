#!/usr/bin/env python3
"""
Generate all 20 decodable readers with images.

Usage:
    python scripts/generate_all_readers.py
    python scripts/generate_all_readers.py --set 1  # Only Set 1
    python scripts/generate_all_readers.py --start reader-05 --end reader-10
"""

import argparse
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from python_backend.tools.reader_loader import load_readers, get_readers_by_set
from generate_reader import generate_reader

async def generate_all(readers: list, output_dir: str = "tmp/readers"):
    """Generate all readers sequentially"""
    total = len(readers)
    print(f"\n{'='*60}")
    print(f"BATCH GENERATION: {total} readers")
    print(f"{'='*60}\n")
    
    results = []
    for i, reader in enumerate(readers, 1):
        print(f"\n[{i}/{total}] Starting: {reader.get('title')}")
        try:
            result = await generate_reader(reader, output_dir)
            results.append({"reader": reader.get("id"), "ok": result.ok})
        except Exception as e:
            print(f"❌ Error generating {reader.get('title')}: {e}")
            results.append({"reader": reader.get("id"), "ok": False, "error": str(e)})
    
    # Summary
    print(f"\n{'='*60}")
    print("BATCH SUMMARY")
    print(f"{'='*60}")
    success = sum(1 for r in results if r.get("ok"))
    print(f"✓ Success: {success}/{total}")
    print(f"✗ Failed: {total - success}/{total}")
    
    if total - success > 0:
        print("\nFailed readers:")
        for r in results:
            if not r.get("ok"):
                print(f"  - {r.get('reader')}: {r.get('error', 'Unknown error')}")
    
    print(f"{'='*60}\n")

async def main():
    parser = argparse.ArgumentParser(description="Generate all decodable readers with images")
    parser.add_argument("--set", type=int, help="Only generate readers from this set (1-4)")
    parser.add_argument("--start", help="Start from this reader ID (inclusive)")
    parser.add_argument("--end", help="End at this reader ID (inclusive)")
    parser.add_argument("--output", default="tmp/readers", help="Output directory")
    
    args = parser.parse_args()
    
    # Load readers
    if args.set:
        readers = get_readers_by_set(args.set)
        print(f"Loaded {len(readers)} readers from Set {args.set}")
    else:
        readers = load_readers()
        print(f"Loaded {len(readers)} readers")
    
    # Filter by start/end
    if args.start or args.end:
        start_idx = 0
        end_idx = len(readers)
        
        if args.start:
            for i, r in enumerate(readers):
                if r.get("id") == args.start:
                    start_idx = i
                    break
        
        if args.end:
            for i, r in enumerate(readers):
                if r.get("id") == args.end:
                    end_idx = i + 1
                    break
        
        readers = readers[start_idx:end_idx]
        print(f"Filtered to {len(readers)} readers ({args.start or 'start'} → {args.end or 'end'})")
    
    if not readers:
        print("❌ No readers to generate")
        sys.exit(1)
    
    # Generate
    await generate_all(readers, args.output)

if __name__ == "__main__":
    asyncio.run(main())

