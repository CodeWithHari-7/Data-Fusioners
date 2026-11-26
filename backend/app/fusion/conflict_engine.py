from typing import List, Dict, Any, Optional
from app.intelligence.entity_resolver import entity_resolver
from app.intelligence.unit_normalizer import unit_normalizer
from app.intelligence.temporal_aligner import temporal_aligner
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class ConflictEngine:
    """
    Layered Evidence Fusion & Conflict Engine:
    1. Entity Resolution: Are claims about the same canonical physical entity? (Distinct entities NEVER conflict).
    2. Attribute Match: Are they measuring the same attribute (e.g. Temperature vs Temperature)?
    3. Temporal Compatibility: Are the observations taken at overlapping/compatible times?
    4. Unit Normalization: Convert both values to canonical units (e.g. 95°C and 203°F convert to equal 95°C).
    5. Tolerance Comparison: Check if difference is within acceptable tolerance (default 2%).
    6. Classification: Corroborated, Potential conflict, Anomaly, Uncertain / insufficient evidence.
    """
    def __init__(self, tolerance_pct: float = settings.CONFLICT_TOLERANCE_PERCENT):
        self.tolerance_pct = tolerance_pct

    def compare_claims(self, claim_a: Dict[str, Any], claim_b: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        # Do not compare a claim with itself
        if claim_a.get("id") and claim_b.get("id") and claim_a["id"] == claim_b["id"]:
            return None

        # Layer 1: Entity Resolution Check
        is_same_entity, ent_conf, canonical_entity = entity_resolver.are_same_entity(
            claim_a["entity"], claim_b["entity"]
        )
        if not is_same_entity:
            # Different entities (e.g. Boiler 1 vs Boiler 2) -> Do not conflict
            return None

        # Layer 2: Attribute Match Check
        attr_a = claim_a["attribute"].strip().lower()
        attr_b = claim_b["attribute"].strip().lower()
        if attr_a != attr_b:
            # Different attributes (e.g. Temperature vs Pressure) -> Do not conflict
            return None

        # Layer 3: Temporal Compatibility Check
        is_temp_comp, time_delta, temp_reason = temporal_aligner.are_temporally_compatible(
            claim_a.get("timestamp"), claim_b.get("timestamp")
        )
        if not is_temp_comp:
            # Non-overlapping time windows -> Do not automatically conflict
            return None

        # Layer 4: Unit Normalization and Value Comparison
        val_a = claim_a.get("value")
        val_b = claim_b.get("value")
        unit_a = claim_a.get("unit")
        unit_b = claim_b.get("unit")

        # If both are numerical measurements
        if val_a is not None and val_b is not None:
            compatible, diff_pct, canon_unit, norm_a, norm_b = unit_normalizer.compare(
                val_a, unit_a, val_b, unit_b
            )

            if not compatible:
                # Incompatible dimensionalities for the same attribute
                return {
                    "case_id": claim_a.get("case_id"),
                    "entity": canonical_entity,
                    "attribute": claim_a["attribute"],
                    "claim_a_id": claim_a.get("id"),
                    "claim_b_id": claim_b.get("id"),
                    "conflict_type": "unit_incompatibility",
                    "severity": "high",
                    "status": "detected",
                    "tolerance_applied": self.tolerance_pct,
                    "value_a_normalized": norm_a,
                    "value_b_normalized": norm_b,
                    "unit_normalized": canon_unit or "incompatible",
                    "explanation": (
                        f"Unit incompatibility: Claim A measured in '{unit_a}' whereas Claim B measured in '{unit_b}' "
                        f"which cannot be converted directly."
                    )
                }

            # Layer 5 & 6: Tolerance & Conflict Classification
            if diff_pct <= self.tolerance_pct:
                # Values agree within tolerance!
                # CRITICAL TEST RULE: 95°C == 203°F results in diff_pct 0.0 -> CORROBORATED (NO false conflict)
                explanation = (
                    f"Corroborated: Evidence from both sources aligns within {diff_pct:.2f}% tolerance "
                    f"({norm_a:.2f} {canon_unit} vs {norm_b:.2f} {canon_unit}). {temp_reason}"
                )
                return {
                    "case_id": claim_a.get("case_id"),
                    "entity": canonical_entity,
                    "attribute": claim_a["attribute"],
                    "claim_a_id": claim_a.get("id"),
                    "claim_b_id": claim_b.get("id"),
                    "conflict_type": "corroboration",
                    "severity": "corroborated",
                    "status": "resolved",
                    "tolerance_applied": self.tolerance_pct,
                    "value_a_normalized": norm_a,
                    "value_b_normalized": norm_b,
                    "unit_normalized": canon_unit,
                    "explanation": explanation
                }
            else:
                # Contradiction detected outside tolerance!
                # CRITICAL TEST RULE: 95°C vs 78°C -> diff_pct > 2% -> POTENTIAL CONFLICT
                severity = "high" if diff_pct > 15.0 else "medium"
                explanation = (
                    f"Potential conflict: Value mismatch of {diff_pct:.2f}% detected for {canonical_entity} "
                    f"({claim_a.get('raw_value')} {unit_a or ''} [{norm_a:.2f} {canon_unit}] vs "
                    f"{claim_b.get('raw_value')} {unit_b or ''} [{norm_b:.2f} {canon_unit}]). "
                    f"Exceeds configured {self.tolerance_pct}% tolerance. {temp_reason}"
                )
                return {
                    "case_id": claim_a.get("case_id"),
                    "entity": canonical_entity,
                    "attribute": claim_a["attribute"],
                    "claim_a_id": claim_a.get("id"),
                    "claim_b_id": claim_b.get("id"),
                    "conflict_type": "value_mismatch",
                    "severity": severity,
                    "status": "detected",
                    "tolerance_applied": self.tolerance_pct,
                    "value_a_normalized": norm_a,
                    "value_b_normalized": norm_b,
                    "unit_normalized": canon_unit,
                    "explanation": explanation
                }

        # Non-numeric textual claims
        raw_a = str(claim_a.get("raw_value", "")).strip().lower()
        raw_b = str(claim_b.get("raw_value", "")).strip().lower()
        if raw_a and raw_b:
            if raw_a == raw_b:
                return {
                    "case_id": claim_a.get("case_id"),
                    "entity": canonical_entity,
                    "attribute": claim_a["attribute"],
                    "claim_a_id": claim_a.get("id"),
                    "claim_b_id": claim_b.get("id"),
                    "conflict_type": "corroboration",
                    "severity": "corroborated",
                    "status": "resolved",
                    "tolerance_applied": 0.0,
                    "explanation": f"Corroborated qualitative evidence: '{claim_a.get('raw_value')}' matches."
                }
            else:
                return {
                    "case_id": claim_a.get("case_id"),
                    "entity": canonical_entity,
                    "attribute": claim_a["attribute"],
                    "claim_a_id": claim_a.get("id"),
                    "claim_b_id": claim_b.get("id"),
                    "conflict_type": "categorical_mismatch",
                    "severity": "medium",
                    "status": "detected",
                    "tolerance_applied": 0.0,
                    "explanation": f"Categorical contradiction: '{claim_a.get('raw_value')}' vs '{claim_b.get('raw_value')}'."
                }

        return None

    def evaluate_all(self, claims: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Pairwise comparison of claims within a case."""
        findings = []
        n = len(claims)
        for i in range(n):
            for j in range(i + 1, n):
                finding = self.compare_claims(claims[i], claims[j])
                if finding:
                    findings.append(finding)
        return findings

conflict_engine = ConflictEngine()
