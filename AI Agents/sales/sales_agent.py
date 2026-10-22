"""Sales forecasting agent for the MSME Business Intelligence project."""
from __future__ import annotations
import json
from pathlib import Path
import joblib
import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "sales_forecast_model.joblib"
METADATA_PATH = BASE_DIR / "models" / "sales_forecast_metadata.json"
DATA_PATH = BASE_DIR / "sales_ml_df.csv"


def _load_artifacts():
    if not MODEL_PATH.exists() or not METADATA_PATH.exists():
        raise RuntimeError("Sales model is not trained yet. Run train_sales_model.py first.")
    model = joblib.load(MODEL_PATH)
    metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
    return model, metadata


def _period_from_query(query: str) -> str:
    q = query.lower()
    if any(word in q for word in ("month", "monthly", "next month")):
        return "next_month"
    return "next_week"


def sales_agent(query: str) -> dict:
    """Forecast next week's revenue from the latest available weekly row.

    The training table contains a precomputed target_next_week_revenue. For a
    live forecast, only the latest row's feature columns are passed to the model.
    """
    if not isinstance(query, str) or not query.strip():
        raise ValueError("query must be a non-empty string")
    model, metadata = _load_artifacts()
    df = pd.read_csv(DATA_PATH)
    df = df.sort_values(["year", "week"]).reset_index(drop=True)
    features = metadata["features"]
    missing = [c for c in features if c not in df.columns]
    if missing:
        raise RuntimeError(f"Sales data is missing model features: {missing}")
    latest = df.iloc[[-1]][features].copy()
    for col in features:
        latest[col] = pd.to_numeric(latest[col], errors="coerce")
    if latest.isna().any().any():
        raise RuntimeError("Latest sales row contains missing feature values; fix the dataset before forecasting.")

    if _period_from_query(query) == "next_month":
        raise ValueError("This Sales Agent currently supports one-week-ahead forecasts only. Ask: 'What will my revenue be next week?'")
    period = "next_week"
    current_revenue = float(df.iloc[-1]["weekly_revenue"])
    if metadata.get("selected_is_baseline", False):
        prediction = max(0.0, current_revenue)
    else:
        prediction = max(0.0, float(model.predict(latest)[0]))
    recent = pd.to_numeric(df["weekly_revenue"].tail(4), errors="coerce").dropna()
    explanations = []
    if len(recent) >= 2:
        if recent.iloc[-1] > recent.iloc[0]:
            explanations.append("Revenue increased across the most recent four available weeks")
        elif recent.iloc[-1] < recent.iloc[0]:
            explanations.append("Revenue decreased across the most recent four available weeks")
        else:
            explanations.append("Revenue was broadly stable across the most recent four available weeks")
    if "weekly_orders" in df.columns and len(df) >= 2:
        if float(df.iloc[-1]["weekly_orders"]) > float(df.iloc[-2]["weekly_orders"]):
            explanations.append("Order volume increased versus the previous recorded week")
        elif float(df.iloc[-1]["weekly_orders"]) < float(df.iloc[-2]["weekly_orders"]):
            explanations.append("Order volume decreased versus the previous recorded week")
        else:
            explanations.append("Order volume was unchanged versus the previous recorded week")
    if not explanations:
        explanations.append("Forecast generated from historical sales and lag features")

    # This is a heuristic reliability indicator derived from held-out WAPE, not a calibrated probability.
    wape = metadata.get("test_metrics", {}).get("wape_percent")
    reliability = None if wape is None else round(float(max(0.0, min(1.0, 1.0 - wape / 100.0))), 2)
    return {
        "agent": "sales",
        "status": "success",
        "query": query.strip(),
        "prediction": {"metric": "revenue", "value": round(prediction, 2)},
        "confidence": reliability,
        "confidence_type": "heuristic_from_holdout_wape_not_a_probability",
        "unit": "INR",
        "period": period,
        "forecast_horizon": "one_week",
        "current_week_revenue": round(current_revenue, 2),
        "model": metadata.get("selected_model"),
        "test_metrics": metadata.get("test_metrics", {}),
        "explanation": explanations,
        "recommended_action": "Compare this forecast with recent order volume and known promotions before making purchasing or staffing decisions."
    }


if __name__ == "__main__":
    print(json.dumps(sales_agent("What will my revenue be next week?"), indent=2))
