"""
Live weather features for the AgroGuard API.

Fetches recent daily weather (plus hourly relative humidity) from the Open-Meteo
forecast archive and engineers the same four features the model was trained on.
The feature definitions mirror the Sprint 1 notebook exactly.
"""
import time

import pandas as pd
import requests

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

# District coordinates, matching the notebook's district configuration.
DISTRICT_COORDS = {
    "Huye":      {"country": "Rwanda",   "lat": -2.5967, "lon": 29.7397},
    "Musanze":   {"country": "Rwanda",   "lat": -1.4985, "lon": 29.6328},
    "Nyamagabe": {"country": "Rwanda",   "lat": -2.4733, "lon": 29.4978},
    "Rwamagana": {"country": "Rwanda",   "lat": -1.9487, "lon": 30.4347},
    "Nakuru":    {"country": "Kenya",    "lat": -0.3031, "lon": 36.0800},
    "Kisumu":    {"country": "Kenya",    "lat": -0.1022, "lon": 34.7617},
    "Eldoret":   {"country": "Kenya",    "lat":  0.5143, "lon": 35.2698},
    "Kitale":    {"country": "Kenya",    "lat":  1.0154, "lon": 35.0062},
    "Mbarara":   {"country": "Uganda",   "lat": -0.6072, "lon": 30.6545},
    "Gulu":      {"country": "Uganda",   "lat":  2.7749, "lon": 32.2990},
    "Jinja":     {"country": "Uganda",   "lat":  0.4244, "lon": 33.2042},
    "Mbale":     {"country": "Uganda",   "lat":  1.0796, "lon": 34.1753},
    "Arusha":    {"country": "Tanzania", "lat": -3.3869, "lon": 36.6830},
    "Mbeya":     {"country": "Tanzania", "lat": -8.9094, "lon": 33.4607},
    "Dodoma":    {"country": "Tanzania", "lat": -6.1730, "lon": 35.7395},
    "Morogoro":  {"country": "Tanzania", "lat": -6.8242, "lon": 37.6556},
    "Hawassa":   {"country": "Ethiopia", "lat":  7.0621, "lon": 38.4767},
    "Jimma":     {"country": "Ethiopia", "lat":  7.6790, "lon": 36.8344},
    "Bahir Dar": {"country": "Ethiopia", "lat": 11.5742, "lon": 37.3614},
    "Dire Dawa": {"country": "Ethiopia", "lat":  9.5931, "lon": 41.8661},
}


def fetch_recent_daily(lat: float, lon: float, past_days: int = 14,
                       retries: int = 3, backoff: float = 2.0) -> pd.DataFrame:
    """Return recent daily weather with a daily-mean humidity column."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": ["temperature_2m_max", "temperature_2m_min", "precipitation_sum"],
        "hourly": ["relative_humidity_2m"],
        "past_days": past_days,
        "forecast_days": 1,
        "timezone": "Africa/Nairobi",
    }
    payload = None
    for attempt in range(1, retries + 1):
        try:
            response = requests.get(FORECAST_URL, params=params, timeout=30)
            response.raise_for_status()
            payload = response.json()
            break
        except (requests.RequestException, ValueError) as error:
            if attempt == retries:
                raise RuntimeError(f"Open-Meteo forecast fetch failed: {error}")
            time.sleep(backoff * attempt)

    daily = pd.DataFrame(payload["daily"]).rename(columns={
        "temperature_2m_max": "temp_max",
        "temperature_2m_min": "temp_min",
        "precipitation_sum": "rainfall",
    })
    daily["date"] = pd.to_datetime(daily["time"])

    hourly = pd.DataFrame(payload["hourly"])
    hourly["date"] = pd.to_datetime(hourly["time"]).dt.normalize()
    daily_humidity = hourly.groupby("date")["relative_humidity_2m"].mean()
    daily["humidity"] = daily["date"].map(daily_humidity)
    return daily.dropna(subset=["temp_max", "temp_min", "rainfall", "humidity"])


def latest_features(daily: pd.DataFrame) -> dict:
    """
    Engineer the four model features for the most recent day. Definitions match
    the notebook: consecutive wet days, 7-day temperature spread, humidity
    deviation from the 7-day mean, and the 7-day rainfall total.
    """
    daily = daily.sort_values("date").reset_index(drop=True)

    consecutive = 0
    for rain in daily["rainfall"]:
        consecutive = consecutive + 1 if rain >= 1.0 else 0

    spread = (daily["temp_max"] - daily["temp_min"]).rolling(7, min_periods=1).mean()
    humidity = daily["humidity"]
    humidity_deviation = humidity - humidity.rolling(7, min_periods=1).mean()

    return {
        "as_of": daily["date"].iloc[-1].date().isoformat(),
        "features": {
            "consecutive_wet_days": int(consecutive),
            "temp_spread_7d": round(float(spread.iloc[-1]), 1),
            "humidity_deviation": round(float(humidity_deviation.iloc[-1]), 1),
            "rainfall_7d_total": round(float(daily["rainfall"].tail(7).sum()), 1),
        },
    }
