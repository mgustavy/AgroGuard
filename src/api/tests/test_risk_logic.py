"""Unit tests for the pure risk-scoring helpers in main.py."""
import pytest

from main import (
    band_probability,
    apply_crop_modifier,
    rule_based_fallback,
    CROP_MODIFIERS,
)


@pytest.mark.parametrize("prob, expected", [
    (0.99, "HIGH"),
    (0.66, "HIGH"),     # lower bound of HIGH is inclusive
    (0.65, "MEDIUM"),
    (0.50, "MEDIUM"),
    (0.33, "MEDIUM"),   # lower bound of MEDIUM is inclusive
    (0.32, "LOW"),
    (0.00, "LOW"),
    (-0.1, "LOW"),      # defensive: never crashes on a negative
])
def test_band_probability(prob, expected):
    assert band_probability(prob) == expected


def test_band_boundaries():
    # Values just below a threshold drop to the lower band.
    assert band_probability(0.659) == "MEDIUM"
    assert band_probability(0.329) == "LOW"


@pytest.mark.parametrize("crop, factor", [
    ("maize", 1.00),
    ("beans", 1.10),
    ("potato", 1.15),
    ("banana", 0.85),
])
def test_crop_modifier_scales_by_factor(crop, factor):
    base = 0.5
    assert apply_crop_modifier(base, crop) == pytest.approx(base * factor)


def test_crop_modifier_clamps_to_one():
    # 0.95 * 1.15 = 1.0925, must be clipped to 1.0.
    assert apply_crop_modifier(0.95, "potato") == 1.0


def test_crop_modifier_clamps_to_zero():
    assert apply_crop_modifier(0.0, "banana") == 0.0


def test_crop_modifier_unknown_crop_is_identity():
    # Unknown crops fall back to a multiplier of 1.0 (no change).
    assert apply_crop_modifier(0.4, "cassava") == pytest.approx(0.4)


def test_crop_modifiers_match_documented_values():
    assert CROP_MODIFIERS == {
        "maize": 1.00, "beans": 1.10, "potato": 1.15, "banana": 0.85,
    }


@pytest.mark.parametrize("wet_days, humidity_dev, temp_spread, expected", [
    (6, 3.0, 10.0, 0.85),   # both high-risk conditions met
    (4, 0.0, 10.0, 0.55),   # consecutive_wet_days > 3
    (0, 1.6, 10.0, 0.55),   # humidity_deviation > 1.5
    (2, 1.0, 10.0, 0.25),   # neither condition met
])
def test_rule_based_fallback(wet_days, humidity_dev, temp_spread, expected):
    assert rule_based_fallback(wet_days, humidity_dev, temp_spread) == expected
