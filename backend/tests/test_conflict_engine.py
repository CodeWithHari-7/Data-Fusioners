import pytest
from datetime import datetime, timezone
from app.fusion.conflict_engine import conflict_engine

def test_no_false_conflict_when_95c_equals_203f():
    """
    CRITICAL RULE TEST:
    Verify no false conflict when 95°C equals 203°F.
    Both should be recognized as physically identical and classified as Corroborated.
    """
    claim_a = {
        "id": "claim-1",
        "case_id": "case-test",
        "entity": "Boiler 1",
        "attribute": "Temperature",
        "value": 95.0,
        "raw_value": "95",
        "unit": "°C",
        "timestamp": datetime(2026, 5, 14, 10, 0, 0, tzinfo=timezone.utc),
        "original_text": "Boiler 1 temperature measured at 95°C."
    }
    claim_b = {
        "id": "claim-2",
        "case_id": "case-test",
        "entity": "Boiler 1",
        "attribute": "Temperature",
        "value": 203.0,
        "raw_value": "203",
        "unit": "°F",
        "timestamp": datetime(2026, 5, 14, 10, 5, 0, tzinfo=timezone.utc),
        "original_text": "Temperature of Boiler 1 recorded as 203°F."
    }

    result = conflict_engine.compare_claims(claim_a, claim_b)
    assert result is not None
    assert result["conflict_type"] == "corroboration"
    assert result["severity"] == "corroborated"
    assert result["status"] == "resolved"
    assert "Corroborated" in result["explanation"]

def test_same_entity_attribute_time_95c_vs_78c_flags_potential_conflict():
    """
    CRITICAL RULE TEST:
    Verify same entity/attribute/time with 95°C vs 78°C flags a potential conflict.
    """
    claim_a = {
        "id": "claim-1",
        "case_id": "case-test",
        "entity": "Reactor Alpha",
        "attribute": "Temperature",
        "value": 95.0,
        "raw_value": "95",
        "unit": "°C",
        "timestamp": datetime(2026, 5, 14, 10, 0, 0, tzinfo=timezone.utc),
        "original_text": "Reactor Alpha temperature was 95°C."
    }
    claim_b = {
        "id": "claim-2",
        "case_id": "case-test",
        "entity": "Reactor Alpha",
        "attribute": "Temperature",
        "value": 78.0,
        "raw_value": "78",
        "unit": "°C",
        "timestamp": datetime(2026, 5, 14, 10, 10, 0, tzinfo=timezone.utc),
        "original_text": "Sensor log: Reactor Alpha 78°C."
    }

    result = conflict_engine.compare_claims(claim_a, claim_b)
    assert result is not None
    assert result["conflict_type"] == "value_mismatch"
    assert result["severity"] in ("high", "medium")
    assert result["status"] == "detected"
    assert "Potential conflict" in result["explanation"]

def test_different_entities_do_not_automatically_conflict():
    """
    CRITICAL RULE TEST:
    Verify different entities (Boiler 1 vs Boiler 2) do not automatically conflict,
    even with identical attributes and timestamps.
    """
    claim_a = {
        "id": "claim-1",
        "case_id": "case-test",
        "entity": "Boiler 1",
        "attribute": "Temperature",
        "value": 95.0,
        "raw_value": "95",
        "unit": "°C",
        "timestamp": datetime(2026, 5, 14, 10, 0, 0, tzinfo=timezone.utc),
        "original_text": "Boiler 1 temperature was 95°C."
    }
    claim_b = {
        "id": "claim-2",
        "case_id": "case-test",
        "entity": "Boiler 2",
        "attribute": "Temperature",
        "value": 78.0,
        "raw_value": "78",
        "unit": "°C",
        "timestamp": datetime(2026, 5, 14, 10, 0, 0, tzinfo=timezone.utc),
        "original_text": "Boiler 2 temperature was 78°C."
    }

    result = conflict_engine.compare_claims(claim_a, claim_b)
    assert result is None, "Different entities must not be flagged as contradictory."

def test_non_overlapping_times_do_not_automatically_conflict():
    """
    CRITICAL RULE TEST:
    Verify non-overlapping times (10:00 vs 22:00) do not automatically conflict.
    """
    claim_a = {
        "id": "claim-1",
        "case_id": "case-test",
        "entity": "Turbine 1",
        "attribute": "Temperature",
        "value": 95.0,
        "raw_value": "95",
        "unit": "°C",
        "timestamp": datetime(2026, 5, 14, 10, 0, 0, tzinfo=timezone.utc),
        "original_text": "Turbine 1 at 10:00 UTC was 95°C."
    }
    claim_b = {
        "id": "claim-2",
        "case_id": "case-test",
        "entity": "Turbine 1",
        "attribute": "Temperature",
        "value": 78.0,
        "raw_value": "78",
        "unit": "°C",
        "timestamp": datetime(2026, 5, 14, 22, 0, 0, tzinfo=timezone.utc),  # 12 hours later
        "original_text": "Turbine 1 at 22:00 UTC was 78°C."
    }

    result = conflict_engine.compare_claims(claim_a, claim_b)
    assert result is None, "Non-overlapping observation windows must not trigger false conflict."
