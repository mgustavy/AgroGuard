"""End-to-end tests for the FastAPI endpoints via Starlette's TestClient."""
from fastapi.testclient import TestClient

import main
from main import RECOMMENDATIONS

client = TestClient(main.app)

VALID_PAYLOAD = {
    "district": "Huye",
    "crop": "maize",
    "consecutive_wet_days": 4,
    "temp_spread_7d": 8.5,
    "humidity_deviation": 2.0,
    "rainfall_7d_total": 30.0,
}


def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "AgroGuard API"
    assert "model_loaded" in body


def test_risk_returns_a_valid_response():
    response = client.post("/risk", json=VALID_PAYLOAD)
    assert response.status_code == 200
    body = response.json()
    assert body["district"] == "Huye"
    assert body["crop"] == "maize"
    assert body["risk_level"] in {"HIGH", "MEDIUM", "LOW"}
    assert 0.0 <= body["probability"] <= 1.0
    assert body["crop_modifier"] is True


def test_risk_recommendation_matches_band_and_crop():
    body = client.post("/risk", json=VALID_PAYLOAD).json()
    # The returned advice must be the one mapped to its own risk level and crop.
    assert body["recommendation"] == RECOMMENDATIONS[body["risk_level"]]["maize"]


def test_risk_rejects_unknown_crop():
    payload = {**VALID_PAYLOAD, "crop": "cassava"}
    assert client.post("/risk", json=payload).status_code == 422


def test_risk_rejects_missing_feature():
    assert client.post("/risk", json={"district": "Huye", "crop": "maize"}).status_code == 422


def test_banana_scores_no_higher_than_maize_for_same_weather():
    weather = {k: v for k, v in VALID_PAYLOAD.items() if k != "crop"}
    maize = client.post("/risk", json={**weather, "crop": "maize"}).json()["probability"]
    banana = client.post("/risk", json={**weather, "crop": "banana"}).json()["probability"]
    # The banana multiplier (0.85) is below maize (1.00), so it can never score higher.
    assert banana <= maize


def test_maize_in_a_training_district_has_standard_confidence():
    payload = {**VALID_PAYLOAD, "district": "Arusha", "crop": "maize"}
    assert client.post("/risk", json=payload).json()["confidence"] == "standard"


def test_district_outside_training_data_has_low_confidence():
    # Huye (Rwanda) was never in the training labels, so its score is extrapolation.
    assert client.post("/risk", json=VALID_PAYLOAD).json()["confidence"] == "low"


def test_other_crops_have_low_confidence_even_in_training_districts():
    # Beans only get a hand-set multiplier on the maize model.
    payload = {**VALID_PAYLOAD, "district": "Arusha", "crop": "beans"}
    assert client.post("/risk", json=payload).json()["confidence"] == "low"
