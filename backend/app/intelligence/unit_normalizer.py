import re
import pint
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)

# Initialize standard Pint unit registry with default offset units for temperature
ureg = pint.UnitRegistry()

# Unit alias normalization map: maps colloquial symbols/names to Pint standard names
UNIT_MAP = {
    "°c": "degC",
    "c": "degC",
    "celsius": "degC",
    "degc": "degC",
    "degree_c": "degC",
    "degree_celsius": "degC",
    "°f": "degF",
    "f": "degF",
    "fahrenheit": "degF",
    "degf": "degF",
    "degree_f": "degF",
    "degree_fahrenheit": "degF",
    "k": "kelvin",
    "kelvin": "kelvin",
    "degk": "kelvin",
    "psi": "psi",
    "bar": "bar",
    "kpa": "kPa",
    "pa": "Pa",
    "mpa": "MPa",
    "kg": "kilogram",
    "g": "gram",
    "lb": "pound",
    "lbs": "pound",
    "v": "volt",
    "volt": "volt",
    "volts": "volt",
    "kv": "kilovolt",
    "mv": "millivolt",
    "a": "ampere",
    "amp": "ampere",
    "amps": "ampere",
    "ma": "milliampere",
    "rpm": "revolutions_per_minute",
    "%": "percent",
    "percent": "percent",
    "m": "meter",
    "ft": "foot",
    "in": "inch",
    "cm": "centimeter",
    "mm": "millimeter"
}

class UnitNormalizer:
    def __init__(self):
        self.ureg = ureg

    def clean_unit_string(self, raw_unit: str) -> Optional[str]:
        if not raw_unit:
            return None
        cleaned = raw_unit.strip().lower()
        cleaned = re.sub(r"[\s\._\-]", "", cleaned)
        return UNIT_MAP.get(cleaned, raw_unit.strip())

    def normalize(self, value: Optional[float], raw_unit: Optional[str]) -> Tuple[Optional[float], Optional[str]]:
        """
        Normalize a numerical value to its canonical SI representation.
        For temperature: degC.
        For pressure: bar.
        For mass: kilogram.
        """
        if raw_unit is None or value is None:
            return value, None

        unit_str = self.clean_unit_string(raw_unit)
        try:
            qty = self.ureg.Quantity(value, unit_str)
            dim = str(qty.dimensionality)
            if dim == "[temperature]":
                target = "degC"
            elif dim == "[mass] / [length] / [time] ** 2":  # Pressure
                target = "bar"
            elif dim == "[mass]":
                target = "kilogram"
            elif dim == "[length]":
                target = "meter"
            elif dim == "[length] ** 2 * [mass] / [current] / [time] ** 3":  # Voltage
                target = "volt"
            else:
                target = str(qty.units)

            converted = qty.to(target)
            return round(converted.magnitude, 4), target
        except Exception as e:
            logger.debug(f"Pint conversion error for '{value} {raw_unit}': {e}")
            return value, raw_unit

    def compare(self, val_a: float, unit_a: Optional[str], val_b: float, unit_b: Optional[str]) -> Tuple[bool, float, Optional[str], float, float]:
        """
        Compare two values with potentially different units.
        Returns:
          compatible (bool), percent_difference (float), canonical_unit (str), norm_a (float), norm_b (float)
        """
        norm_a, canon_a = self.normalize(val_a, unit_a)
        norm_b, canon_b = self.normalize(val_b, unit_b)

        if canon_a != canon_b:
            # Different dimensionalities (e.g. kg vs degC)
            return False, 100.0, None, norm_a, norm_b

        # Check if values agree
        diff_abs = abs(norm_a - norm_b)
        if diff_abs < 1e-4:
            return True, 0.0, canon_a, norm_a, norm_b

        base = max(abs(norm_a), abs(norm_b), 1e-6)
        diff_pct = diff_abs / base * 100.0
        return True, diff_pct, canon_a, norm_a, norm_b

unit_normalizer = UnitNormalizer()
