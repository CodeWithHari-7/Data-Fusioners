import re
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from dateutil import parser as date_parser
import logging

logger = logging.getLogger(__name__)

class TemporalAligner:
    """
    Tracen Trail Topic 20: Cron Jobs & UTC Timestamps.
    Parses dates and timestamps, forces UTC, and aligns time intervals for conflict verification.
    """
    def parse_datetime(self, text: str) -> Optional[datetime]:
        """Attempt to extract and parse ISO or common date/time format into a UTC datetime."""
        if not text:
            return None
        
        # Regex patterns for ISO-like dates: YYYY-MM-DD or YYYY-MM-DD HH:MM:SS
        date_pattern = r"\b(\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:[ T]\d{1,2}:\d{2}(?::\d{2})?)?)\b"
        match = re.search(date_pattern, text)
        if match:
            candidate = match.group(1).replace("/", "-")
            try:
                dt = date_parser.parse(candidate)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                else:
                    dt = dt.astimezone(timezone.utc)
                return dt
            except Exception:
                pass
        
        # Try generic dateutil parse
        try:
            dt = date_parser.parse(text, fuzzy=True)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            else:
                dt = dt.astimezone(timezone.utc)
            return dt
        except Exception:
            return None

    def are_temporally_compatible(
        self,
        time_a: Optional[datetime],
        time_b: Optional[datetime],
        max_delta_hours: float = 2.0
    ) -> Tuple[bool, Optional[float], str]:
        """
        Check whether two observation timestamps are compatible for conflict analysis.
        If both have timestamps, they must fall within max_delta_hours to be directly comparable.
        If timestamps are significantly different, they do NOT automatically conflict!
        """
        if time_a is None or time_b is None:
            # One or both lack a specific timestamp; treat as general/unbounded observation
            return True, None, "Unbounded temporal scope: one or both claims lack explicit timestamp."

        delta_seconds = abs((time_a - time_b).total_seconds())
        delta_hours = delta_seconds / 3600.0

        if delta_hours <= max_delta_hours:
            return True, delta_seconds, f"Temporally compatible: observations within {delta_hours:.1f} hours of each other."
        else:
            return False, delta_seconds, f"Temporally non-overlapping: observations are {delta_hours:.1f} hours apart (different measurement windows)."

temporal_aligner = TemporalAligner()
