# AgroGuard API

FastAPI service that serves disease-risk predictions from the model trained in
the Sprint 1 notebook, on real Open-Meteo ERA5 weather.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Health check; reports whether the model and district snapshot are loaded |
| GET | `/risk/live/{district}?crop=maize` | Live scoring: fetch recent weather, engineer features, run the model (needs the model file) |
| GET | `/risk/{district}?crop=maize` | Latest precomputed risk for a district (no model file needed) |
| POST | `/risk` | Score an arbitrary set of the four features |
| GET | `/districts`, `/crops` | Reference lists |

## Run it

```bash
cd src/api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000   # run from repo root as: uvicorn src.api.main:app
```

Open http://localhost:8000/docs for the interactive API docs.

## Data and model

- `data/district_risk.json` holds the latest scored day per district. Regenerate
  it from the notebook's export with:

  ```bash
  python build_risk_data.py            # reads notebooks/sprint1_features.csv
  ```

- The POST `/risk` endpoint uses the trained model. Place the notebook's
  `xgb_risk_model.joblib` at `models/xgb_risk_model.joblib` (repo root) or set
  `AGROGUARD_MODEL_PATH`. Without it, `/risk` falls back to literature thresholds;
  the precomputed `/risk/{district}` endpoint does not need the model file.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `AGROGUARD_MODEL_PATH` | `models/xgb_risk_model.joblib` | Trained model bundle |
| `AGROGUARD_RISK_DATA` | `src/api/data/district_risk.json` | Precomputed snapshot |
| `AGROGUARD_CORS_ORIGINS` | `*` | Comma-separated allowed origins |
