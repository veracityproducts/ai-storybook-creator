import re
from typing import List

def detect_human_characters(text: str, character_names: List[str] = None) -> bool:
    """
    Detect if the page text explicitly mentions human characters.
    
    Args:
        text: The page text to analyze
        character_names: Optional list of known character names (e.g., ["ben", "kim", "trent", "brent"])
    
    Returns:
        True if human characters are mentioned, False otherwise
    """
    if character_names is None:
        character_names = ["ben", "kim", "trent", "brent", "grant", "kent", "swift", "stan", "chip", "chop", "rick", "nick"]
    
    text_lower = text.lower()
    
    # Check for explicit character names
    for name in character_names:
        if name in text_lower:
            return True
    
    # Check for human pronouns/descriptors
    human_indicators = [
        r'\bhe\b', r'\bshe\b', r'\bhis\b', r'\bher\b', r'\bhim\b',
        r'\bboy\b', r'\bgirl\b', r'\bkid\b', r'\bchild\b', r'\bpal\b', r'\bchum\b',
        r'\bfriend\b', r'\bman\b', r'\bwoman\b', r'\belf\b', r'\bking\b'
    ]
    
    for pattern in human_indicators:
        if re.search(pattern, text_lower):
            return True
    
    return False

