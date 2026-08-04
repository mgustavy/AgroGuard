"""Unit tests for the weather feature engineering in weather.py."""
import pandas as pd

from weather import engineer_features, latest_features


def make_daily():
    """Five consecutive days with known weather, for deterministic assertions."""
    return pd.DataFrame({
        "date": pd.to_datetime(
            ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05"]),
        "temp_max": [30, 30, 30, 30, 30],
        "temp_min": [20, 20, 20, 20, 20],
        "rainfall": [0.5, 1.0, 2.0, 0.0, 1.0],
        "humidity": [60, 62, 64, 66, 68],
    })


def test_consecutive_wet_days_resets_on_dry_day():
    out = engineer_features(make_daily())
    # Wet is rainfall >= 1.0, so [0.5, 1.0, 2.0, 0.0, 1.0] -> [0, 1, 2, 0, 1].
    assert list(out["consecutive_wet_days"]) == [0, 1, 2, 0, 1]


def test_temp_spread_is_rolling_mean_of_daily_spread():
    out = engineer_features(make_daily())
    # Daily spread is 10 every day, so the 7-day rolling mean is 10.0 throughout.
    assert list(out["temp_spread_7d"]) == [10.0, 10.0, 10.0, 10.0, 10.0]


def test_rainfall_7d_total_is_rolling_sum():
    out = engineer_features(make_daily())
    assert list(out["rainfall_7d_total"]) == [0.5, 1.5, 3.5, 3.5, 4.5]


def test_humidity_deviation_first_day_is_zero():
    out = engineer_features(make_daily())
    # On day one the value equals its own running mean, so deviation is 0.
    assert out["humidity_deviation"].iloc[0] == 0.0


def test_latest_features_returns_last_day():
    latest = latest_features(make_daily())
    assert latest["as_of"] == "2024-01-05"
    assert set(latest["features"]) == {
        "consecutive_wet_days", "temp_spread_7d",
        "humidity_deviation", "rainfall_7d_total",
    }
    assert latest["features"]["consecutive_wet_days"] == 1
    assert isinstance(latest["features"]["consecutive_wet_days"], int)
