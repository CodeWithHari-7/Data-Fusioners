import re
from typing import Tuple, List, Optional
from rapidfuzz import fuzz
import logging

logger = logging.getLogger(__name__)

class EntityResolver:
    """
    Resolves entities across multimodal sources using exact, fuzzy (RapidFuzz),
    and contextual structural checks.
    CRITICAL: Avoids falsely merging distinct entities (e.g. Boiler 1 vs Boiler 2).
    """
    def __init__(self, fuzzy_threshold: float = 85.0):
        self.fuzzy_threshold = fuzzy_threshold

    def normalize_name(self, name: str) -> str:
        """Strip extra punctuation, normalize whitespace and lowercase."""
        if not name:
            return ""
        s = name.strip()
        s = re.sub(r"[\t\r\n]+", " ", s)
        s = re.sub(r"\s+", " ", s)
        return s

    def extract_entity_index(self, name: str) -> Optional[str]:
        """Extract trailing or standalone digits/letters indicating distinct instances (e.g. 1, 2, A, B)."""
        match = re.search(r"\b([0-9]+|[A-Za-z])\b$", name.strip())
        if match:
            return match.group(1).upper()
        return None

    def are_same_entity(self, name_a: str, name_b: str) -> Tuple[bool, float, str]:
        """
        Check if name_a and name_b refer to the exact same physical/logical entity.
        Returns:
          is_same (bool), confidence (0-1), canonical_name (str)
        """
        norm_a = self.normalize_name(name_a)
        norm_b = self.normalize_name(name_b)

        # 1. Exact match (case-insensitive)
        if norm_a.lower() == norm_b.lower():
            return True, 1.0, norm_a

        # 2. Safety Check: Verify instance indices (e.g. "Boiler 1" vs "Boiler 2", "Turbine A" vs "Turbine B")
        idx_a = self.extract_entity_index(norm_a)
        idx_b = self.extract_entity_index(norm_b)
        if idx_a and idx_b and idx_a != idx_b:
            # Distinct numbered/lettered units -> MUST NOT MERGE
            return False, 0.0, norm_a

        # 3. Fuzzy similarity with RapidFuzz token sort ratio
        score = fuzz.token_sort_ratio(norm_a.lower(), norm_b.lower())
        if score >= self.fuzzy_threshold:
            # Prefer the cleaner or longer canonical representation
            canonical = norm_a if len(norm_a) >= len(norm_b) else norm_b
            return True, round(score / 100.0, 3), canonical

        return False, round(score / 100.0, 3), norm_a

entity_resolver = EntityResolver()
