from typing import List, Dict, Any
from datetime import datetime, timezone

class TimelineBuilder:
    """
    Constructs a chronological timeline of claims, measurements, and events.
    Supports filtering by entity and attribute for multi-source temporal alignment.
    """
    def build_timeline(
        self,
        case_id: str,
        claims: List[Dict[str, Any]],
        sources: List[Dict[str, Any]],
        conflicts: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        # Map sources by id for fast filename lookup
        source_map = {s["id"]: s.get("filename", "Unknown") for s in sources}

        # Set of claim IDs involved in conflicts
        conflict_claim_ids = set()
        corroborated_claim_ids = set()
        for conf in conflicts:
            if conf.get("conflict_type") == "corroboration":
                corroborated_claim_ids.add(conf["claim_a_id"])
                corroborated_claim_ids.add(conf["claim_b_id"])
            else:
                conflict_claim_ids.add(conf["claim_a_id"])
                conflict_claim_ids.add(conf["claim_b_id"])

        events = []
        for c in claims:
            cid = c["id"]
            ts = c.get("timestamp")
            if ts is None:
                # Default to claim creation or omit if non-temporal
                ts = c.get("created_at") or datetime.now(timezone.utc)

            status = "normal"
            if cid in conflict_claim_ids:
                status = "conflict"
            elif cid in corroborated_claim_ids:
                status = "corroborated"

            events.append({
                "id": cid,
                "timestamp": ts,
                "entity": c.get("entity"),
                "attribute": c.get("attribute"),
                "value": c.get("value"),
                "raw_value": c.get("raw_value"),
                "unit": c.get("unit"),
                "normalized_value": c.get("normalized_value"),
                "normalized_unit": c.get("normalized_unit"),
                "source_filename": source_map.get(c.get("source_id"), "Unknown Source"),
                "page_number": c.get("page_number"),
                "row_number": c.get("row_number"),
                "original_text": c.get("original_text"),
                "confidence": c.get("extraction_confidence", 1.0),
                "status": status
            })

        # Sort chronologically by timestamp
        events.sort(key=lambda x: x["timestamp"])
        return events

timeline_builder = TimelineBuilder()
