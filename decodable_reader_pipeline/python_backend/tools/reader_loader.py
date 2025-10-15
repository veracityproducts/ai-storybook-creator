import json
import os
from typing import Dict, List, Optional

def load_readers() -> List[Dict]:
    """Load all 20 readers from readers.json"""
    path = os.path.join(os.path.dirname(__file__), "../../data/readers.json")
    with open(path, "r") as f:
        data = json.load(f)
    return data.get("readers", [])

def get_reader_by_id(reader_id: str) -> Optional[Dict]:
    """Get a specific reader by ID"""
    readers = load_readers()
    for r in readers:
        if r.get("id") == reader_id:
            return r
    return None

def get_readers_by_set(set_number: int) -> List[Dict]:
    """Get all readers in a specific set (1-4)"""
    readers = load_readers()
    return [r for r in readers if r.get("set") == set_number]

def get_reader_by_title(title: str) -> Optional[Dict]:
    """Get a reader by title (case-insensitive)"""
    readers = load_readers()
    title_lower = title.lower()
    for r in readers:
        if r.get("title", "").lower() == title_lower:
            return r
    return None

