import re
from typing import List, Dict, Any, Optional
from app.intelligence.unit_normalizer import unit_normalizer
from app.intelligence.temporal_aligner import temporal_aligner
import logging

logger = logging.getLogger(__name__)

class ClaimsExtractor:
    """
    Extracts structured claims from raw text and tabular chunks.
    Preserves exact provenance: source excerpt, page/row, confidence, method.
    """
    def __init__(self):
        # Common attributes and units
        self.attr_keywords = [
            "temperature", "temp", "pressure", "voltage", "current",
            "speed", "rpm", "flow rate", "vibration", "weight", "mass",
            "length", "frequency", "humidity", "resistance", "power"
        ]
        self.unit_pattern = r"(?:°[CF]|deg[CF]|celsius|fahrenheit|bar|psi|kpa|mpa|pa|kg|g|lb|lbs|v|volt|kv|mv|a|amp|ma|rpm|%|m|ft|in|cm|mm)"

    def extract_from_chunk(self, chunk: Dict[str, Any], case_id: str, source_id: str) -> List[Dict[str, Any]]:
        text = chunk.get("text", "")
        page_num = chunk.get("page_number")
        row_num = chunk.get("row_number")
        method = chunk.get("method", "nlp_rule")
        base_confidence = chunk.get("confidence", 0.90)

        claims: List[Dict[str, Any]] = []

        # 1. Tabular format parsing: e.g. "Equipment: Boiler 1; Parameter: Temperature; Value: 95 °C; Time: 2026-05-14 10:00"
        if ";" in text or ":" in text:
            parsed_tabular = self._parse_structured_pairs(text)
            if parsed_tabular:
                for item in parsed_tabular:
                    item.update({
                        "case_id": case_id,
                        "source_id": source_id,
                        "page_number": page_num,
                        "row_number": row_num,
                        "original_text": text[:300],
                        "extraction_method": method,
                        "extraction_confidence": base_confidence
                    })
                    claims.append(item)
                if claims:
                    return claims

        # 2. Regex Rule-Based Parsing for Sentences / Logs
        # Pattern 1: "<Entity> <Attribute> [is/was/recorded/measured at] <Value> <Unit>"
        # Example: "Boiler 1 temperature was measured at 95°C"
        p1 = rf"([A-Za-z0-9_\-\s]{{2,30}}?)\s+({'|'.join(self.attr_keywords)})\s+(?:is|was|recorded|measured at|at|of|=)?\s*([0-9]+(?:\.[0-9]+)?)\s*({self.unit_pattern})?"
        matches = re.finditer(p1, text, re.IGNORECASE)
        for m in matches:
            entity_candidate = m.group(1).strip()
            # Clean common filler words
            entity_candidate = re.sub(r"^(the|a|an|in|at|for|from)\s+", "", entity_candidate, flags=re.IGNORECASE).strip()
            attr = m.group(2).strip().title()
            val_str = m.group(3).strip()
            unit_str = m.group(4).strip() if m.group(4) else None
            
            try:
                num_val = float(val_str)
            except ValueError:
                num_val = None

            norm_val, norm_unit = unit_normalizer.normalize(num_val, unit_str)
            timestamp = temporal_aligner.parse_datetime(text)

            claims.append({
                "case_id": case_id,
                "source_id": source_id,
                "entity": entity_candidate.title(),
                "attribute": attr,
                "value": num_val,
                "raw_value": val_str,
                "unit": unit_str,
                "normalized_value": norm_val,
                "normalized_unit": norm_unit,
                "timestamp": timestamp,
                "page_number": page_num,
                "row_number": row_num,
                "original_text": m.group(0),
                "extraction_method": method,
                "extraction_confidence": base_confidence
            })

        # Pattern 2: "<Attribute> of <Entity> : <Value> <Unit>"
        # Example: "Temperature of Boiler 1: 203°F"
        p2 = rf"({'|'.join(self.attr_keywords)})\s+(?:of|for)\s+([A-Za-z0-9_\-\s]{{2,30}}?)\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)\s*({self.unit_pattern})?"
        matches2 = re.finditer(p2, text, re.IGNORECASE)
        for m in matches2:
            attr = m.group(1).strip().title()
            entity_candidate = m.group(2).strip().title()
            val_str = m.group(3).strip()
            unit_str = m.group(4).strip() if m.group(4) else None

            try:
                num_val = float(val_str)
            except ValueError:
                num_val = None

            norm_val, norm_unit = unit_normalizer.normalize(num_val, unit_str)
            timestamp = temporal_aligner.parse_datetime(text)

            claims.append({
                "case_id": case_id,
                "source_id": source_id,
                "entity": entity_candidate,
                "attribute": attr,
                "value": num_val,
                "raw_value": val_str,
                "unit": unit_str,
                "normalized_value": norm_val,
                "normalized_unit": norm_unit,
                "timestamp": timestamp,
                "page_number": page_num,
                "row_number": row_num,
                "original_text": m.group(0),
                "extraction_method": method,
                "extraction_confidence": base_confidence
            })

        return claims

    def _parse_structured_pairs(self, text: str) -> List[Dict[str, Any]]:
        """Parse key-value delimited rows: e.g. Key: Value pairs."""
        pairs = {}
        for part in text.split(";"):
            if ":" in part:
                k, v = part.split(":", 1)
                pairs[k.strip().lower()] = v.strip()

        entity = pairs.get("entity") or pairs.get("equipment") or pairs.get("system") or pairs.get("target") or pairs.get("device")
        attr = pairs.get("attribute") or pairs.get("parameter") or pairs.get("metric") or pairs.get("sensor") or pairs.get("property")
        raw_val = pairs.get("value") or pairs.get("reading") or pairs.get("measurement")
        unit = pairs.get("unit")
        timestamp_str = pairs.get("timestamp") or pairs.get("time") or pairs.get("date")

        if entity and attr and raw_val:
            # Parse number and unit from raw_val if unit not separate
            val_num = None
            extracted_unit = unit
            num_match = re.search(rf"([0-9]+(?:\.[0-9]+)?)\s*({self.unit_pattern})?", raw_val, re.IGNORECASE)
            if num_match:
                try:
                    val_num = float(num_match.group(1))
                    if not extracted_unit and num_match.group(2):
                        extracted_unit = num_match.group(2)
                except ValueError:
                    pass

            norm_val, norm_unit = unit_normalizer.normalize(val_num, extracted_unit)
            parsed_dt = temporal_aligner.parse_datetime(timestamp_str) if timestamp_str else None

            return [{
                "entity": entity.title(),
                "attribute": attr.title(),
                "value": val_num,
                "raw_value": str(raw_val),
                "unit": extracted_unit,
                "normalized_value": norm_val,
                "normalized_unit": norm_unit,
                "timestamp": parsed_dt
            }]

        return []

claims_extractor = ClaimsExtractor()
