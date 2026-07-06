"""
Build the precomputed per-district risk snapshot served by the API.

Reads the feature table exported by the Sprint 1 notebook (sprint1_features.csv,
which already contains risk_probability and risk_level scored on real ERA5
weather) and writes the latest scored day per district to data/district_risk.json.

Usage:
    python build_risk_data.py [path/to/sprint1_features.csv]
"""
import json
import sys
from pathlib import Path

import pandas as pd

HERE = Path(__file__).resolve().parent
DEFAULT_INPUT = HERE.parents[1] / "notebooks" / "sprint1_features.csv"
OUTPUT_PATH = HERE / "data" / "district_risk.json"

FEATURE_COLS = ["consecutive_wet_days", "temp_spread_7d",
                "humidity_deviation", "rainfall_7d_total"]


def build(input_path: Path) -> dict:
    df = pd.read_csv(input_path, parse_dates=["date"])
    latest = df.sort_values("date").groupby("district", as_index=False).tail(1)

    districts = {}
    for _, row in latest.iterrows():
        districts[row["district"]] = {
            "district": row["district"],
            "country": row["country"],
            "as_of": row["date"].date().isoformat(),
            "risk_level": row["risk_level"],
            "probability": round(float(row["risk_probability"]), 2),
            "features": {
                "consecutive_wet_days": int(row["consecutive_wet_days"]),
                "temp_spread_7d": round(float(row["temp_spread_7d"]), 1),
                "humidity_deviation": round(float(row["humidity_deviation"]), 1),
                "rainfall_7d_total": round(float(row["rainfall_7d_total"]), 1),
            },
        }
    return {"source": "Open-Meteo ERA5 archive",
            "generated_from": input_path.name,
            "districts": districts}


def main() -> None:
    input_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_INPUT
    if not input_path.exists():
        raise SystemExit(f"Feature file not found: {input_path}. Run the notebook first.")
    snapshot = build(input_path)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(snapshot, indent=2))
    print(f"Wrote {len(snapshot['districts'])} districts to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
