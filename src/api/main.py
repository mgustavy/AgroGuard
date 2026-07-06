import json
import os
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


def band_probability(prob: float) -> str:
    """Map a HIGH-risk probability to the three API risk levels."""
    for threshold, level in RISK_BANDS:
        if prob >= threshold:
            return level
    return "LOW"


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
    """Return (HIGH-risk probability, model_version) for a request."""
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
    Return a 14-day disease risk score for a given district and crop.

    - **district**: Name of the East African district
    - **crop**: One of maize, beans, potato, banana
    - **consecutive_wet_days**: Days in a row with rainfall above 1mm
    - **temp_spread_7d**: 7-day average temperature spread in degrees C
    - **humidity_deviation**: Deviation from 7-day mean humidity in %
    - **rainfall_7d_total**: 7-day rolling rainfall total in mm
    """
    probability, model_version = predict_probability(request)
    risk_level = band_probability(probability)
    return RiskResponse(
        district=request.district,
        crop=request.crop,
        risk_level=risk_level,
        probability=round(probability, 2),
        recommendation=RECOMMENDATIONS[risk_level][request.crop],
        model_version=model_version,
    )


@app.get("/risk/{district}", response_model=DistrictRiskResponse, tags=["Predictions"])
def get_district_risk(
    district: str,
    crop: Literal["maize", "beans", "potato", "banana"] = "maize",
):
    """
    Return the latest precomputed disease risk for a district, scored by the
    trained model on real ERA5 weather. The crop selects the recommendation text
    but does not change the risk level, which is weather-driven.
    """
    record = RISK_SNAPSHOT.get(district)
    if record is None:
        raise HTTPException(status_code=404,
                            detail=f"No risk data for district '{district}'")
    risk_level = record["risk_level"]
    return DistrictRiskResponse(
        district=record["district"],
        country=record["country"],
        crop=crop,
        as_of=record["as_of"],
        risk_level=risk_level,
        probability=record["probability"],
        recommendation=RECOMMENDATIONS[risk_level][crop],
        features=DistrictFeatures(**record["features"]),
        model_version="xgboost-v0.2 (precomputed from real ERA5 data)",
    )


def probability_from_features(features: dict) -> float:
    """Score a feature dict with the trained model, honouring the feature order."""
    row = np.array([[features[name] for name in FEATURE_ORDER]], dtype=float)
    return float(MODEL.predict_proba(row)[0, 1])


@app.get("/risk/live/{district}", response_model=DistrictRiskResponse, tags=["Predictions"])
def get_live_risk(
    district: str,
    crop: Literal["maize", "beans", "potato", "banana"] = "maize",
):
    """
    Fetch recent Open-Meteo weather for a district, engineer the four features,
    and score them with the trained model. Requires the model file to be present.
    """
    coords = weather.DISTRICT_COORDS.get(district)
    if coords is None:
        raise HTTPException(status_code=404, detail=f"Unknown district '{district}'")
    if MODEL is None:
        raise HTTPException(status_code=503,
                            detail="Model not loaded; live scoring is unavailable.")
    try:
        daily = weather.fetch_recent_daily(coords["lat"], coords["lon"])
        latest = weather.latest_features(daily)
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error))

    features = latest["features"]
    probability = probability_from_features(features)
    risk_level = band_probability(probability)
    return DistrictRiskResponse(
        district=district,
        country=coords["country"],
        crop=crop,
        as_of=latest["as_of"],
        risk_level=risk_level,
        probability=round(probability, 2),
        recommendation=RECOMMENDATIONS[risk_level][crop],
        features=DistrictFeatures(**features),
        model_version="xgboost-v0.2 (live Open-Meteo weather)",
    )


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
