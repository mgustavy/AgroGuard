import json
import os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Literal, Optional

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from . import weather
except ImportError:  # allows running as `uvicorn main:app` from src/api
    import weather

app = FastAPI(
    title="AgroGuard API",
    description="Weather-driven crop disease early warning system for East African smallholder farmers.",
    version="0.2.0",
)

# Allow the dashboard and other browser clients to call the API in development.
CORS_ORIGINS = os.environ.get("AGROGUARD_CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

CROPS = ["maize", "beans", "potato", "banana"]

# Probability bands, kept identical to the data pipeline notebook.
RISK_BANDS = [(0.66, "HIGH"), (0.33, "MEDIUM"), (0.0, "LOW")]

# Feature order the model expects. Overridden by the order stored alongside the
# model when a trained bundle is loaded.
DEFAULT_FEATURES = ["consecutive_wet_days", "temp_spread_7d",
                    "humidity_deviation", "rainfall_7d_total"]

# Crop-specific sensitivity multipliers applied to the model probability.
# PLACEHOLDER: the risk model is trained on maize disease data, so this is a
# coarse, hand-set stand-in for crop-specific models to be trained in a future
# sprint. Each crop weights the shared weather-driven risk differently, so the
# score changes with the selected crop instead of being cosmetic.
CROP_MODIFIERS = {
    "maize":  1.00,  # baseline; most disease data is from maize
    "beans":  1.10,  # slightly more sensitive to humidity
    "potato": 1.15,  # more sensitive to sustained consecutive wet days
    "banana": 0.85,  # less sensitive overall
}

RECOMMENDATIONS = {
    "HIGH": {
        "maize":   "Apply fungicide within 48 hours. Avoid overhead irrigation. Monitor neighbouring plots.",
        "beans":   "Apply copper-based fungicide. Remove and destroy any infected leaves immediately.",
        "potato":  "Apply preventive fungicide. Ensure good drainage. Inspect tubers in storage.",
        "banana":  "Remove affected leaves. Apply systemic fungicide. Increase inspection frequency.",
    },
    "MEDIUM": {
        "maize":   "Monitor daily. Apply fungicide if wet conditions persist beyond 3 days.",
        "beans":   "Increase inspection frequency. Prepare fungicide as a precaution.",
        "potato":  "Check drainage. Apply foliar fungicide if humidity remains elevated.",
        "banana":  "Monitor for early lesions. Ensure good air circulation around plants.",
    },
    "LOW": {
        "maize":   "No immediate action required. Continue routine monitoring.",
        "beans":   "Conditions are favourable. Maintain normal inspection schedule.",
        "potato":  "Low risk. Ensure standard crop hygiene practices.",
        "banana":  "Low risk. No intervention needed at this stage.",
    },
}


def load_model() -> tuple[Optional[object], list]:
    """
    Load the trained risk model exported by the Sprint 1 notebook.

    The path is taken from the AGROGUARD_MODEL_PATH environment variable,
    defaulting to models/xgb_risk_model.joblib at the repository root. The
    notebook saves a dict of {"model": ..., "features": [...]}. Returns
    (model, feature_order); model is None when no file is found, in which case
    the API falls back to the literature thresholds.
    """
    default_path = Path(__file__).resolve().parents[2] / "models" / "xgb_risk_model.joblib"
    model_path = os.environ.get("AGROGUARD_MODEL_PATH", str(default_path))
    if not os.path.exists(model_path):
        return None, DEFAULT_FEATURES
    bundle = joblib.load(model_path)
    if isinstance(bundle, dict):
        return bundle["model"], bundle.get("features", DEFAULT_FEATURES)
    return bundle, DEFAULT_FEATURES


def load_risk_snapshot() -> dict:
    """
    Load the precomputed per-district risk snapshot exported from the notebook
    (latest scored day per district, on real ERA5 data). Path comes from
    AGROGUARD_RISK_DATA, defaulting to data/district_risk.json next to this file.

    The snapshot is only a fallback now: live endpoints score current weather and
    drop back to this frozen data when a live fetch fails.
    """
    default_path = Path(__file__).resolve().parent / "data" / "district_risk.json"
    path = os.environ.get("AGROGUARD_RISK_DATA", str(default_path))
    if not os.path.exists(path):
        return {}
    with open(path) as handle:
        return json.load(handle).get("districts", {})


MODEL, FEATURE_ORDER = load_model()
RISK_SNAPSHOT = load_risk_snapshot()


class RiskRequest(BaseModel):
    district: str
    crop: Literal["maize", "beans", "potato", "banana"]
    consecutive_wet_days: int
    temp_spread_7d: float
    humidity_deviation: float
    rainfall_7d_total: float


class RiskResponse(BaseModel):
    district: str
    crop: str
    risk_level: Literal["HIGH", "MEDIUM", "LOW"]
    probability: float
    recommendation: str
    model_version: str
    crop_modifier: bool


class DistrictFeatures(BaseModel):
    consecutive_wet_days: int
    temp_spread_7d: float
    humidity_deviation: float
    rainfall_7d_total: float


class DistrictRiskResponse(BaseModel):
    district: str
    country: str
    crop: str
    as_of: str
    risk_level: Literal["HIGH", "MEDIUM", "LOW"]
    probability: float
    recommendation: str
    features: DistrictFeatures
    model_version: str
    data_source: Literal["live", "snapshot"]
    crop_modifier: bool


class ForecastPoint(BaseModel):
    date: str
    probability: float
    risk_level: Literal["HIGH", "MEDIUM", "LOW"]


class ForecastResponse(BaseModel):
    district: str
    country: str
    series: list[ForecastPoint]
    model_version: str


class AlertItem(BaseModel):
    district: str
    country: str
    risk_level: Literal["HIGH", "MEDIUM", "LOW"]
    probability: float
    as_of: str
    data_source: Literal["live", "snapshot"]


def band_probability(prob: float) -> str:
    """Map a HIGH-risk probability to the three API risk levels."""
    for threshold, level in RISK_BANDS:
        if prob >= threshold:
            return level
    return "LOW"


def apply_crop_modifier(probability: float, crop: str) -> float:
    """
    Scale the base weather-driven probability by the crop multiplier and clip to
    [0, 1]. See CROP_MODIFIERS: this is a placeholder for crop-specific models.
    """
    return max(0.0, min(1.0, probability * CROP_MODIFIERS.get(crop, 1.0)))


def rule_based_fallback(consecutive_wet_days: int,
                        humidity_deviation: float,
                        temp_spread_7d: float) -> float:
    """
    Literature-threshold fallback, used only when no trained model is available.
    Returns a probability so the banding logic is shared with the model path.
    Thresholds drawn from Wadhwa & Malik (2024) and Bhardwaj et al. (2025).
    """
    if consecutive_wet_days > 5 and humidity_deviation > 2.0:
        return 0.85
    if consecutive_wet_days > 3 or humidity_deviation > 1.5:
        return 0.55
    return 0.25


def predict_probability(request: RiskRequest) -> tuple[float, str]:
    """Return (base HIGH-risk probability, model_version) for a request."""
    if MODEL is None:
        prob = rule_based_fallback(request.consecutive_wet_days,
                                   request.humidity_deviation,
                                   request.temp_spread_7d)
        return prob, "rule-based-fallback-v0.2 (no model file found)"

    feature_values = {
        "consecutive_wet_days": request.consecutive_wet_days,
        "temp_spread_7d":       request.temp_spread_7d,
        "humidity_deviation":   request.humidity_deviation,
        "rainfall_7d_total":    request.rainfall_7d_total,
    }
    row = np.array([[feature_values[name] for name in FEATURE_ORDER]], dtype=float)
    prob = float(MODEL.predict_proba(row)[0, 1])
    return prob, "xgboost-v0.2 (Arusha, Mbeya, Morogoro labelled; 4 features)"


def probability_from_features(features: dict) -> float:
    """Score a feature dict with the trained model, honouring the feature order."""
    row = np.array([[features[name] for name in FEATURE_ORDER]], dtype=float)
    return float(MODEL.predict_proba(row)[0, 1])


def live_score(coords: dict) -> dict:
    """
    Live-score one district on current Open-Meteo weather. Returns the engineered
    features, base probability, and as-of date. Raises on any fetch or model
    failure so callers can fall back to the snapshot.
    """
    if MODEL is None:
        raise RuntimeError("model not loaded")
    daily = weather.fetch_daily(coords["lat"], coords["lon"])
    latest = weather.latest_features(daily)
    return {
        "features": latest["features"],
        "base_probability": probability_from_features(latest["features"]),
        "as_of": latest["as_of"],
    }


def score_district(district: str, crop: str) -> DistrictRiskResponse:
    """
    Score a district on live weather, falling back to the precomputed snapshot
    when the live fetch or model is unavailable. The crop multiplier is applied
    to the probability and the risk level is re-classified from the result.
    data_source flags which path was used.
    """
    coords = weather.DISTRICT_COORDS.get(district)
    if coords is None:
        raise HTTPException(status_code=404, detail=f"Unknown district '{district}'")

    try:
        result = live_score(coords)
        base, features, as_of = result["base_probability"], result["features"], result["as_of"]
        country, source = coords["country"], "live"
        version = "xgboost-v0.2 (live Open-Meteo weather)"
    except Exception:  # any live-path failure degrades to the snapshot
        record = RISK_SNAPSHOT.get(district)
        if record is None:
            raise HTTPException(status_code=503,
                                detail="No live data and no snapshot available.")
        base, features, as_of = record["probability"], record["features"], record["as_of"]
        country, source = record["country"], "snapshot"
        version = "xgboost-v0.2 (snapshot fallback)"

    probability = apply_crop_modifier(base, crop)
    risk_level = band_probability(probability)
    return DistrictRiskResponse(
        district=district,
        country=country,
        crop=crop,
        as_of=as_of,
        risk_level=risk_level,
        probability=round(probability, 2),
        recommendation=RECOMMENDATIONS[risk_level][crop],
        features=DistrictFeatures(**features),
        model_version=version,
        data_source=source,
        crop_modifier=True,
    )


def alert_for_district(district: str, coords: dict) -> Optional[AlertItem]:
    """
    Score one district for the alerts list on live weather, falling back to the
    snapshot on failure. Alerts are district-level (no crop), so the baseline
    probability is used. Returns None if neither live nor snapshot data exists.
    """
    try:
        result = live_score(coords)
        prob, as_of, source, country = (result["base_probability"], result["as_of"],
                                        "live", coords["country"])
    except Exception:  # degrade to the snapshot for this district
        record = RISK_SNAPSHOT.get(district)
        if record is None:
            return None
        prob, as_of, source, country = (record["probability"], record["as_of"],
                                        "snapshot", record["country"])

    return AlertItem(
        district=district,
        country=country,
        risk_level=band_probability(prob),
        probability=round(prob, 2),
        as_of=as_of,
        data_source=source,
    )


@app.get("/", tags=["Health"])
def health_check():
    """Check that the API is running and report whether a trained model is loaded."""
    return {
        "status": "ok",
        "service": "AgroGuard API",
        "version": "0.2.0",
        "model_loaded": MODEL is not None,
        "districts_loaded": len(RISK_SNAPSHOT),
        "features": FEATURE_ORDER,
    }


@app.post("/risk", response_model=RiskResponse, tags=["Predictions"])
def get_risk(request: RiskRequest):
    """
    Score an explicit set of the four features for a district and crop. The crop
    multiplier is applied to the probability (see CROP_MODIFIERS).

    - **district**: Name of the East African district
    - **crop**: One of maize, beans, potato, banana
    - **consecutive_wet_days**: Days in a row with rainfall above 1mm
    - **temp_spread_7d**: 7-day average temperature spread in degrees C
    - **humidity_deviation**: Deviation from 7-day mean humidity in %
    - **rainfall_7d_total**: 7-day rolling rainfall total in mm
    """
    base_probability, model_version = predict_probability(request)
    probability = apply_crop_modifier(base_probability, request.crop)
    risk_level = band_probability(probability)
    return RiskResponse(
        district=request.district,
        crop=request.crop,
        risk_level=risk_level,
        probability=round(probability, 2),
        recommendation=RECOMMENDATIONS[risk_level][request.crop],
        model_version=model_version,
        crop_modifier=True,
    )


@app.get("/risk/{district}", response_model=DistrictRiskResponse, tags=["Predictions"])
def get_district_risk(
    district: str,
    crop: Literal["maize", "beans", "potato", "banana"] = "maize",
):
    """
    Current disease risk for a district, scored on live Open-Meteo weather when
    available and falling back to the precomputed snapshot otherwise (see
    data_source). The crop multiplier adjusts the probability and risk level.
    """
    return score_district(district, crop)


@app.get("/risk/live/{district}", response_model=DistrictRiskResponse, tags=["Predictions"])
def get_live_risk(
    district: str,
    crop: Literal["maize", "beans", "potato", "banana"] = "maize",
):
    """
    Force live scoring: fetch recent Open-Meteo weather, engineer the four
    features, apply the crop multiplier, and score with the model. Requires the
    model file; returns an error instead of falling back to the snapshot.
    """
    coords = weather.DISTRICT_COORDS.get(district)
    if coords is None:
        raise HTTPException(status_code=404, detail=f"Unknown district '{district}'")
    if MODEL is None:
        raise HTTPException(status_code=503,
                            detail="Model not loaded; live scoring is unavailable.")
    try:
        result = live_score(coords)
    except Exception as error:
        raise HTTPException(status_code=502, detail=str(error))

    probability = apply_crop_modifier(result["base_probability"], crop)
    risk_level = band_probability(probability)
    return DistrictRiskResponse(
        district=district,
        country=coords["country"],
        crop=crop,
        as_of=result["as_of"],
        risk_level=risk_level,
        probability=round(probability, 2),
        recommendation=RECOMMENDATIONS[risk_level][crop],
        features=DistrictFeatures(**result["features"]),
        model_version="xgboost-v0.2 (live Open-Meteo weather)",
        data_source="live",
        crop_modifier=True,
    )


@app.get("/forecast/{district}", response_model=ForecastResponse, tags=["Predictions"])
def get_forecast(district: str, days: int = 14):
    """
    Return a rolling risk forecast for the next `days` days, scoring each day's
    engineered features (built from recent plus forecast weather) with the model.
    """
    coords = weather.DISTRICT_COORDS.get(district)
    if coords is None:
        raise HTTPException(status_code=404, detail=f"Unknown district '{district}'")
    if MODEL is None:
        raise HTTPException(status_code=503,
                            detail="Model not loaded; forecast is unavailable.")
    try:
        daily = weather.fetch_daily(coords["lat"], coords["lon"],
                                    past_days=14, forecast_days=days)
        engineered = weather.engineer_features(daily).tail(days)
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error))

    rows = np.array(engineered[FEATURE_ORDER].values, dtype=float)
    probabilities = MODEL.predict_proba(rows)[:, 1]
    series = [
        ForecastPoint(
            date=day.date().isoformat(),
            probability=round(float(prob), 2),
            risk_level=band_probability(prob),
        )
        for day, prob in zip(engineered["date"], probabilities)
    ]
    return ForecastResponse(
        district=district,
        country=coords["country"],
        series=series,
        model_version="xgboost-v0.2 (live Open-Meteo forecast)",
    )


@app.get("/alerts", response_model=list[AlertItem], tags=["Predictions"])
def get_alerts():
    """
    Current risk for every district, scored on live weather (one request per
    district, run in parallel) and falling back to the snapshot where a live
    fetch fails. Each item flags its data_source. Sorted highest risk first.
    """
    districts = list(weather.DISTRICT_COORDS.items())
    with ThreadPoolExecutor(max_workers=8) as pool:
        results = pool.map(lambda item: alert_for_district(item[0], item[1]), districts)
    items = [item for item in results if item is not None]
    order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    return sorted(items, key=lambda a: (order[a.risk_level], -a.probability))


@app.get("/districts", tags=["Reference"])
def list_districts():
    """Return the list of supported East African districts."""
    return {
        "districts": [
            {"name": "Huye",      "country": "Rwanda"},
            {"name": "Musanze",   "country": "Rwanda"},
            {"name": "Nyamagabe", "country": "Rwanda"},
            {"name": "Rwamagana", "country": "Rwanda"},
            {"name": "Nakuru",    "country": "Kenya"},
            {"name": "Kisumu",    "country": "Kenya"},
            {"name": "Eldoret",   "country": "Kenya"},
            {"name": "Kitale",    "country": "Kenya"},
            {"name": "Mbarara",   "country": "Uganda"},
            {"name": "Gulu",      "country": "Uganda"},
            {"name": "Jinja",     "country": "Uganda"},
            {"name": "Mbale",     "country": "Uganda"},
            {"name": "Arusha",    "country": "Tanzania"},
            {"name": "Mbeya",     "country": "Tanzania"},
            {"name": "Dodoma",    "country": "Tanzania"},
            {"name": "Morogoro",  "country": "Tanzania"},
            {"name": "Hawassa",   "country": "Ethiopia"},
            {"name": "Jimma",     "country": "Ethiopia"},
            {"name": "Bahir Dar", "country": "Ethiopia"},
            {"name": "Dire Dawa", "country": "Ethiopia"},
        ]
    }


@app.get("/crops", tags=["Reference"])
def list_crops():
    """Return the list of supported crops."""
    return {"crops": CROPS}
