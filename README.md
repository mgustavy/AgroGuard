# AgroGuard

A weather-driven crop disease early warning system for East African smallholder farmers.

Most crop disease tools need a sick plant before they can help. AgroGuard does not. It uses historical weather patterns to predict district-level disease risk 14 days before symptoms appear, giving cooperative field officers time to act before an outbreak takes hold.

---

## The Problem

Crop disease destroys up to 40% of yields for East African smallholders every season. Most of that damage happens before anyone knows something is wrong. By the time a farmer notices diseased leaves, the outbreak has been spreading for days and the window for cheap, effective treatment is already closing.

## What It Does

Takes weather forecast data for any East African district, runs it through a trained ML model, and returns a risk score: HIGH, MEDIUM, or LOW. A rule-based layer translates that score into a disease-specific recommendation. Cooperative field officers see this on a dashboard before their farm visits. Farmers get a plain-language summary.

## Stack

| Layer | Tools |
|---|---|
| Language | Python 3.11 |
| Data | Open-Meteo API, CHIRPS, ERA5, Mendeley Data |
| ML | scikit-learn, XGBoost, TensorFlow/Keras, SHAP |
| API | FastAPI, PostgreSQL, SQLAlchemy |
| Frontend | React 18, Tailwind CSS |
| Hosting | Strettch Cloud |

## Project Structure

```
agroguard/
├── notebooks/
│   └── sprint1_data_pipeline.ipynb   # Sprint 1: data collection + feature engineering
├── src/
│   ├── ingestion/                     # Weather data pipeline
│   ├── features/                      # Feature engineering
│   ├── models/                        # XGBoost, LSTM, logistic regression
│   ├── api/                           # FastAPI backend
│   └── dashboard/                     # React frontend
├── .gitignore
└── README.md
```

## Getting Started

The notebook is designed to run in Google Colab.

1. Open `notebooks/sprint1_data_pipeline.ipynb` in Colab
2. Run all cells — it will mount your Google Drive and load from cache if available
3. On first run it fetches weather data for 20 districts and saves it to `MyDrive/AgroGuard/`


## Data

- **Districts:** 20 across Rwanda, Kenya, Uganda, Tanzania, and Ethiopia
- **Date range:** 2021–2023 (~21,900 rows)
- **Engineered features:** consecutive wet days, 7-day temperature spread, humidity deviation
- **Disease labels:** Mduma & Mayo (2024) via Mendeley Data (Sprint 1 alignment in progress)


## Three Core Features

**Consecutive wet days** — counts how many days in a row had more than 1mm of rainfall. Sustained moisture is the primary driver of fungal spore germination.

**7-day temperature spread** — rolling average of the gap between daily max and min temperature. Wide diurnal swings stress plant defences.

**Humidity deviation** — how far overnight humidity sits above or below the 7-day mean. Elevated overnight humidity is what activates most fungal pathogens in the region.
