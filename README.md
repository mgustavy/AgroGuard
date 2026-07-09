# AgroGuard

A weather-driven crop disease early-warning system for East African smallholder farmers. AgroGuard turns daily weather into district-level disease-risk signals up to 14 days ahead, so cooperative field officers can act before an outbreak spreads.

- **Live app:** https://agroguard.duckdns.org
- **Demo video (5 min):** https://shorturl.at/8hzPz
- **Repository:** https://github.com/mgustavy/AgroGuard

---

## The problem

Crop disease destroys up to 40% of smallholder yields every season, and most of that damage happens before anyone sees a symptom. By the time a farmer notices diseased leaves, the outbreak has been spreading for days. AgroGuard flags disease-favourable conditions early, from weather alone, so field officers get a head start.

## Core functionality

- **Risk Overview.** For a chosen district and crop, a HIGH / MEDIUM / LOW disease-risk level with a probability score, driven by current weather, plus a crop-specific recommendation.
- **Live weather scoring.** Pulls current Open-Meteo weather for the district, engineers four features, and scores them with a trained XGBoost model.
- **14-day forecast.** A rolling risk outlook for the next two weeks, one bar per day, coloured by risk level.
- **Alerts.** Every district ranked by current risk, highest first, so an officer sees where to act.
- **Field-officer accounts.** Registration and login (Supabase), with each officer tied to their cooperative and district; the dashboard opens on their own district.

## Tech stack

| Layer | Tools |
|---|---|
| Data and ML | Python, pandas, scikit-learn, XGBoost, Open-Meteo ERA5 |
| API | FastAPI, uvicorn |
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui |
| Auth and database | Supabase (Postgres) |
| Hosting | Ubuntu VM (Strettch Cloud), nginx, Let's Encrypt HTTPS |

## Repository structure

```
notebooks/data_pipeline.ipynb   Data pipeline: fetch weather, engineer features, label, train, evaluate
src/api/                        FastAPI service (risk, live, forecast, alerts) plus the trained model
src/dashboard/                  React dashboard (sign in, risk overview, alerts, settings)
supabase/migrations/            Postgres profiles table and the sign-up trigger
deploy/                         nginx config, systemd unit, and the deployment runbook
models/xgb_risk_model.joblib    Trained XGBoost model
```

## Run it locally

Prerequisites: Python 3.9+, Node 18+, and a free [Supabase](https://supabase.com) project (for accounts).

### 1. API

```bash
cd src/api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Open http://localhost:8000/docs for the interactive API docs. `model_loaded: true` on the health check (`GET /`) confirms the model loaded.

### 2. Dashboard

```bash
cd src/dashboard
npm install
cp .env.example .env     # fill in your Supabase URL and anon key; keep VITE_API_URL=http://localhost:8000
npm run dev
```

Open the URL Vite prints (for example http://localhost:5173).

### 3. Supabase (one-time)

1. Create a project and copy the **Project URL** and **anon key** into `src/dashboard/.env`.
2. In the SQL editor, run `supabase/migrations/0001_profiles.sql`.
3. Authentication -> Providers -> Email: turn **Confirm email OFF** so accounts log in immediately.

### Deploy to a server

The full production runbook (nginx, systemd, HTTPS with certbot) is in [`deploy/README.md`](deploy/README.md).

## Data pipeline and model

`notebooks/data_pipeline.ipynb` pulls real ERA5 weather for 20 East African districts (2021-2023) from Open-Meteo, engineers four features (consecutive wet days, 7-day temperature spread, humidity deviation, 7-day rainfall total), derives disease-risk labels from the Mduma and Mayo (2024) Tanzania maize dataset, and trains an XGBoost classifier evaluated with stratified 5-fold cross-validation. Run it in Google Colab (Run all) or locally with Jupyter. Set `USE_SYNTHETIC = True` for an offline demo run.

## Testing

- **Functional / manual:** the deployed app exercised end to end (register, log in, risk overview, alerts, forecast).
- **API:** interactive testing through FastAPI's `/docs` (Swagger UI).
- **Different data values:** switching district and crop changes the model inputs and outputs (a dry district reads LOW; a wet, humid one reads HIGH).
- **Model evaluation:** stratified 5-fold cross-validation and leave-one-district-out transfer testing in the notebook.
- **Different environments:** responsive dark UI verified across desktop and mobile widths, running on a 2 GB Ubuntu VM.

## Limitations and future work

- Disease labels are weakly derived (no ground-truth field data), so risk levels are relative screening signals of disease-favourable weather, not calibrated outbreak probabilities.
- The model is trained on three Tanzanian districts and generalised to the rest, a documented scope constraint.