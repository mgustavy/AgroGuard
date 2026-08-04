# AgroGuard

- **Live app:** https://agroguard.duckdns.org
- **Demo video (5 min):** https://shorturl.at/8hzPz
- **Repository:** https://github.com/mgustavy/AgroGuard

## Project Overview

AgroGuard is a weather-driven crop disease early-warning system for East African smallholder farmers. It turns daily weather into district-level disease-risk signals up to 14 days ahead, so cooperative field officers can act before an outbreak spreads. The system pulls current and forecast weather from the Open-Meteo ERA5 archive, engineers four features (consecutive wet days, 7-day temperature spread, humidity deviation, and 7-day rainfall total), and scores them with a trained XGBoost model to return a HIGH / MEDIUM / LOW risk level, a probability, and a crop-specific recommendation. It has three parts: a Jupyter/Colab notebook that builds the data and trains the model, a FastAPI backend that serves live risk scores, and a React dashboard where field officers sign in and view risk, alerts, and a 14-day forecast for their district.

## Repository Structure

```
AgroGuard/
├── notebooks/
│   ├── data_pipeline.ipynb        # Fetch weather, engineer features, label, train, evaluate
│   ├── sprint1_features.csv       # Cached engineered features for all districts
│   ├── weather_cache.csv          # Cached raw weather
│   ├── feature_importance.png     # SHAP feature-importance figure
│   ├── risk_by_country.png        # Risk-distribution-by-country figure
│   └── xgb_risk_model.joblib      # Model copy exported by the notebook
├── src/
│   ├── api/                       # FastAPI backend
│   │   ├── main.py                # App, endpoints, and scoring logic
│   │   ├── weather.py             # Open-Meteo fetch and feature engineering
│   │   ├── build_risk_data.py     # Builds the district risk snapshot JSON
│   │   ├── data/district_risk.json# Snapshot fallback used when a live fetch fails
│   │   ├── requirements.txt       # API runtime dependencies
│   │   ├── requirements-dev.txt   # Test dependencies (pytest, httpx)
│   │   ├── pytest.ini             # Pytest configuration
│   │   └── tests/                 # API unit tests (32 tests)
│   └── dashboard/                 # React + Vite frontend
│       ├── src/                   # Components, pages, contexts, and lib
│       ├── index.html
│       ├── package.json
│       └── .env.example           # Frontend environment template
├── models/
│   └── xgb_risk_model.joblib      # Trained XGBoost model the API loads at startup
├── supabase/
│   └── migrations/
│       └── 0001_profiles.sql      # Profiles table and the sign-up trigger
├── deploy/                        # Production runbook, nginx, systemd, update script
│   ├── README.md
│   ├── nginx/
│   ├── systemd/
│   └── update.sh
├── docs/                          # Report materials and figures
└── README.md
```

## Prerequisites

Install the following before running anything:

- **Python 3.11** (3.9 or newer also works) with `pip` and `venv`.
- **Node.js 18 or newer**, which includes `npm`.
- **Git**.
- A free **Supabase** account (https://supabase.com). Supabase provides the managed **PostgreSQL** database and authentication used for field-officer accounts. Because Postgres is hosted by Supabase, you do not need to install PostgreSQL locally.
- A **Google account** with Google Drive, only if you want to run the data pipeline notebook in Google Colab.

No weather API key is required: Open-Meteo is a keyless public API.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/mgustavy/AgroGuard.git
cd AgroGuard
```

### 2. Create and activate a Python virtual environment

macOS / Linux:

```bash
python3.11 -m venv .venv
source .venv/bin/activate
```

Windows (PowerShell):

```powershell
py -3.11 -m venv .venv
.venv\Scripts\Activate.ps1
```

### 3. Install Python dependencies

```bash
pip install --upgrade pip
pip install -r src/api/requirements.txt
```

To also run the test suite later, install the dev dependencies:

```bash
pip install -r src/api/requirements-dev.txt
```

### 4. Install dashboard dependencies

```bash
cd src/dashboard
npm install
cd ../..
```

## Running the Data Pipeline

The notebook `notebooks/data_pipeline.ipynb` fetches weather, engineers the four model features, labels disease risk, trains the XGBoost model, and evaluates it with stratified 5-fold cross-validation. Running it in Google Colab is the simplest path.

### 1. Open the notebook in Google Colab

Open this URL in a browser (you must be signed in to Google):

```
https://colab.research.google.com/github/mgustavy/AgroGuard/blob/main/notebooks/data_pipeline.ipynb
```

Alternatively, in Colab choose **File > Open notebook > GitHub**, enter `mgustavy/AgroGuard`, and select `notebooks/data_pipeline.ipynb`.

### 2. Mount Google Drive

Run the "Google Drive Setup" cell near the top. It calls `drive.mount("/content/drive")`, which opens an authorization popup. Approve it, and the notebook writes its outputs (model, figures, cached CSVs) to `MyDrive/AgroGuard`. Outside Colab the notebook falls back to writing into the local folder, so this step is skipped automatically.

### 3. Switch between synthetic and real data

Find the configuration cell with the `USE_SYNTHETIC` flag:

```python
USE_SYNTHETIC = False   # False = pull real Open-Meteo ERA5 weather (needs internet)
                        # True  = generate offline synthetic weather for a quick demo
```

Set it to `True` for a fast offline run, or leave it `False` to download real historical weather for the 20 districts. The real pull is cached and resumable.

### 4. Run all cells

Choose **Runtime > Run all**. The notebook downloads or generates weather, trains the model, prints the cross-validation results, and saves `xgb_risk_model.joblib`, `feature_importance.png`, and `risk_by_country.png`.

To run locally instead of Colab, install Jupyter in the activated virtual environment (`pip install jupyter`) and open the same notebook.

## Running the API

### 1. Set up environment variables (optional)

The API runs with sensible defaults and needs no configuration for local use. All variables are optional overrides:

- `AGROGUARD_MODEL_PATH` defaults to `models/xgb_risk_model.joblib` at the repo root.
- `AGROGUARD_CORS_ORIGINS` defaults to `*` (all origins) in development.
- `AGROGUARD_RISK_DATA` defaults to `src/api/data/district_risk.json`.

The API does not use a database connection or any API keys (weather comes from the keyless Open-Meteo API). To override a default, export it before starting the server, for example:

```bash
export AGROGUARD_CORS_ORIGINS="http://localhost:5173"
```

### 2. Start the FastAPI server with uvicorn

```bash
cd src/api
uvicorn main:app --reload --port 8000
```

The health check at `http://localhost:8000/` should report `"model_loaded": true`.

### 3. Access the Swagger UI

Open the interactive API documentation at:

```
http://localhost:8000/docs
```

## Running the Dashboard

### 1. Configure the API base URL

From `src/dashboard`, copy the environment template and edit it:

```bash
cd src/dashboard
cp .env.example .env
```

Set the values in `.env`:

```
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

`VITE_API_URL` points the dashboard at the API you started above. The two Supabase values come from your Supabase project under **Project Settings > API**, and are required for sign-up and sign-in to work. Run the migration `supabase/migrations/0001_profiles.sql` once in the Supabase SQL editor, and under **Authentication > Providers > Email** turn **Confirm email OFF** so new accounts log in immediately.

### 2. Start the development server

```bash
npm run dev
```

### 3. Access the dashboard

Open the URL that Vite prints, which is usually:

```
http://localhost:5173
```

Register a field officer, sign in, and the dashboard opens on that officer's district with live risk, alerts, and the 14-day forecast.

## Running Tests

The API has a `pytest` suite covering the risk-banding, crop-modifier, feature-engineering, and endpoint logic. From the repository root with the virtual environment activated:

```bash
pip install -r src/api/requirements-dev.txt
cd src/api
python -m pytest -v
```

Expected output:

```
============================== 32 passed in 2s ==============================
```

## Deployment

The system is deployed on an Ubuntu VM on **Strettch Cloud** and is live at **https://agroguard.duckdns.org**. nginx serves the built dashboard and reverse-proxies the API on the same origin, with HTTPS from Let's Encrypt. The full production runbook (server setup, nginx, systemd, HTTPS, and one-command redeploys) is in [`deploy/README.md`](deploy/README.md).

## Environment Variables

The API variables are optional and only override defaults. The dashboard variables are read at build time by Vite and must be set for authentication to work. No real credentials are shown below.

| Variable | Used by | What it does | Example value |
|---|---|---|---|
| `VITE_API_URL` | Dashboard | Base URL of the AgroGuard API the dashboard calls. | `http://localhost:8000` (local) or `/api` (production, same origin) |
| `VITE_SUPABASE_URL` | Dashboard | Supabase project URL used for authentication. | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Dashboard | Supabase anonymous public key for the browser client. | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |
| `AGROGUARD_MODEL_PATH` | API | Path to the trained XGBoost model file loaded at startup. | `models/xgb_risk_model.joblib` |
| `AGROGUARD_CORS_ORIGINS` | API | Comma-separated list of allowed browser origins. | `http://localhost:5173` |
| `AGROGUARD_RISK_DATA` | API | Path to the district risk snapshot used as a fallback when a live weather fetch fails. | `src/api/data/district_risk.json` |
