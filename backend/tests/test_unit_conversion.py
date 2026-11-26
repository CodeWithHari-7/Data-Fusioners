import pytest
from app.intelligence.unit_normalizer import unit_normalizer

def test_temperature_conversion():
    # 95 degC -> degC
    norm_val, norm_unit = unit_normalizer.normalize(95.0, "°C")
    assert norm_val == 95.0
    assert norm_unit == "degC"

    # 203 degF -> degC (should be 95.0)
    norm_val_f, norm_unit_f = unit_normalizer.normalize(203.0, "°F")
    assert abs(norm_val_f - 95.0) < 0.01
    assert norm_unit_f == "degC"

def test_unit_comparison_and_tolerance():
    # 95°C vs 203°F -> 0% diff
    comp, diff, canon, na, nb = unit_normalizer.compare(95.0, "°C", 203.0, "°F")
    assert comp is True
    assert diff < 0.01
    assert canon == "degC"

    # 95°C vs 78°C -> significant diff (~17.89%)
    comp2, diff2, canon2, na2, nb2 = unit_normalizer.compare(95.0, "°C", 78.0, "°C")
    assert comp2 is True
    assert diff2 > 10.0

    # Incompatible: 95°C vs 100 kg
    comp3, diff3, canon3, _, _ = unit_normalizer.compare(95.0, "°C", 100.0, "kg")
    assert comp3 is False
