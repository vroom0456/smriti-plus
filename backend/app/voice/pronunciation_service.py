"""
SMRITI+ — Pronunciation & Fuzzy Contact Matcher

Provides:
- Pronunciation dictionary for key medical & platform terminology
- Fuzzy name matching for family contacts (e.g., 'Venkates' -> 'Venkatesh')
- Ambiguity detection (avoids calling the wrong person)
"""

import difflib
from typing import List, Optional, Tuple, Dict


PRONUNCIATION_HINTS: Dict[str, str] = {
    "smriti+": "Smrithi Plus",
    "smriti": "Smrithi",
    "caregiver": "Care giver",
    "hydration": "Water intake",
    "cognitive": "Memory and thinking",
    "bp": "Blood Pressure",
}


class PronunciationService:
    @classmethod
    def get_pronunciation_hint(cls, term: str) -> Optional[str]:
        return PRONUNCIATION_HINTS.get(term.lower().strip())

    @classmethod
    def fuzzy_match_contact(
        cls,
        spoken_name: str,
        available_contacts: List[str],
        cutoff: float = 0.75,
    ) -> Tuple[Optional[str], bool]:
        """
        Matches spoken name against linked contact names.
        Returns: (best_match_name: Optional[str], is_ambiguous: bool)
        """
        if not spoken_name or not available_contacts:
            return None, False

        # Exact match check first
        for contact in available_contacts:
            if spoken_name.lower() in contact.lower() or contact.lower() in spoken_name.lower():
                return contact, False

        # Fuzzy match
        matches = difflib.get_close_matches(spoken_name, available_contacts, n=2, cutoff=cutoff)
        if not matches:
            return None, False

        if len(matches) > 1:
            # Check if close runner up
            ratio1 = difflib.SequenceMatcher(None, spoken_name, matches[0]).ratio()
            ratio2 = difflib.SequenceMatcher(None, spoken_name, matches[1]).ratio()
            if abs(ratio1 - ratio2) < 0.10:
                # Ambiguous!
                return matches[0], True

        return matches[0], False
