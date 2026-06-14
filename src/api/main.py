from fastapi import FastAPI
from pydantic import BaseModel
from typing import Literal
import random

app = FastAPI(
    title="AgroGuard API",
    description="Weather-driven crop disease early warning system for East African smallholder farmers.",
    version="0.1.0",
)

CROPS = ["maize", "beans", "potato", "banana"]

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


class RiskRequest(BaseModel):
    district: str
    crop: Literal["maize", "beans", "potato", "banana"]
    consecutive_wet_days: int
    temp_spread_7d: float
    humidity_deviation: float


class RiskResponse(BaseModel):
    district: str
    crop: str
    risk_level: Literal["HIGH", "MEDIUM", "LOW"]
    probability: float
    recommendation: str
    model_version: str


def predict_risk(consecutive_wet_days: int,
                 humidity_deviation: float,
                 temp_spread_7d: float) -> tuple[str, float]:
    """
    Rule-based risk classification using the three engineered weather features.
    This will be replaced with the trained XGBoost model in Sprint 2.
    Thresholds drawn from Wadhwa & Malik (2024) and Bhardwaj et al. (2025).
    """
    if consecutive_wet_days > 5 and humidity_deviation > 2.0:
        return "HIGH", round(random.uniform(0.75, 0.95), 2)
    elif consecutive_wet_days > 3 or humidity_deviation > 1.5:
        return "MEDIUM", round(random.uniform(0.45, 0.74), 2)
    else:
        return "LOW", round(random.uniform(0.10, 0.44), 2)


@app.get("/", tags=["Health"])
def health_check():
    """Check that the API is running."""
    return {"status": "ok", "service": "AgroGuard API", "version": "0.1.0"}


@app.post("/risk", response_model=RiskResponse, tags=["Predictions"])
def get_risk(request: RiskRequest):
    """
    Return a 14-day disease risk score for a given district and crop.

    - **district**: Name of the East African district
    - **crop**: One of maize, beans, potato, banana
    - **consecutive_wet_days**: Days in a row with rainfall above 1mm
    - **temp_spread_7d**: 7-day average temperature spread in °C
    - **humidity_deviation**: Deviation from 7-day mean humidity in %
    """
    risk_level, probability = predict_risk(
        request.consecutive_wet_days,
        request.humidity_deviation,
        request.temp_spread_7d,
    )
    return RiskResponse(
        district=request.district,
        crop=request.crop,
        risk_level=risk_level,
        probability=probability,
        recommendation=RECOMMENDATIONS[risk_level][request.crop],
        model_version="rule-based-v0.1 (XGBoost pending Sprint 2)",
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
