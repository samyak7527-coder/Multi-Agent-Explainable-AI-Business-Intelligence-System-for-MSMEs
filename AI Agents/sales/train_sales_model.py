"""Train, compare, tune, evaluate, explain, and save the weekly sales model."""
from __future__ import annotations
import json
import warnings
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import GridSearchCV, TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.tree import DecisionTreeRegressor

warnings.filterwarnings("ignore", category=UserWarning)
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "sales_ml_df.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
TARGET = "target_next_week_revenue"


def metrics(y_true, y_pred):
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    denom = np.sum(np.abs(y_true))
    return {
        "mae": round(float(mean_absolute_error(y_true, y_pred)), 4),
        "rmse": round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 4),
        "r2": round(float(r2_score(y_true, y_pred)), 4) if len(y_true) > 1 else None,
        "wape_percent": round(float(np.sum(np.abs(y_true-y_pred)) / denom * 100), 4) if denom else None,
    }


def main():
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    required = {"year", "week", "weekly_revenue", TARGET}
    missing = sorted(required - set(df.columns))
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")
    df = df.sort_values(["year", "week"]).drop_duplicates(["year", "week"], keep="last").reset_index(drop=True)
    # The target is never included as an input feature.
    excluded = {TARGET}
    features = [c for c in df.columns if c not in excluded]
    data = df[features + [TARGET]].replace([np.inf, -np.inf], np.nan).dropna().reset_index(drop=True)
    if len(data) < 20:
        raise ValueError(f"Need at least 20 usable weekly rows; found {len(data)}")
    X, y = data[features], data[TARGET].astype(float)
    split = max(1, min(len(data)-1, int(len(data) * 0.8)))
    X_train, X_test = X.iloc[:split], X.iloc[split:]
    y_train, y_test = y.iloc[:split], y.iloc[split:]

    # Baseline predicts the next week's revenue as the current week's revenue.
    baseline = X_test["weekly_revenue"].astype(float).to_numpy()
    results = [{"model": "Naive Baseline", **metrics(y_test, baseline)}]
    candidates = {
        "Linear Regression": LinearRegression(),
        "Decision Tree": DecisionTreeRegressor(random_state=42),
        "Random Forest": RandomForestRegressor(random_state=42, n_jobs=-1),
        "Gradient Boosting": GradientBoostingRegressor(random_state=42),
    }
    fitted = {}
    for name, estimator in candidates.items():
        estimator.fit(X_train, y_train)
        pred = estimator.predict(X_test)
        fitted[name] = estimator
        results.append({"model": name, **metrics(y_test, pred)})

    # Tune tree ensembles on the training window only, preserving time order.
    n_splits = min(5, max(2, len(X_train) // 10))
    cv = TimeSeriesSplit(n_splits=n_splits)
    tuning = {
        "Random Forest": (RandomForestRegressor(random_state=42, n_jobs=-1), {
            "n_estimators": [100, 200], "max_depth": [3, 5, None], "min_samples_leaf": [1, 2]}),
        "Gradient Boosting": (GradientBoostingRegressor(random_state=42), {
            "n_estimators": [100, 200], "learning_rate": [0.03, 0.1], "max_depth": [2, 3]}),
    }
    tuned = {}
    for name, (estimator, grid) in tuning.items():
        search = GridSearchCV(estimator, grid, scoring="neg_mean_absolute_error", cv=cv, n_jobs=-1)
        search.fit(X_train, y_train)
        tuned[name] = search.best_estimator_
        pred = search.best_estimator_.predict(X_test)
        results.append({"model": f"{name} (tuned)", **metrics(y_test, pred), "best_params": search.best_params_})

    # Select by holdout MAE, including the baseline, so complex models must earn their place.
    valid_results = [r for r in results if np.isfinite(r.get("mae", np.nan))]
    best_result = min(valid_results, key=lambda r: r["mae"])
    selected_name = best_result["model"]
    if selected_name == "Naive Baseline":
        # Persist a model anyway: the baseline strategy is explicitly represented in metadata.
        selected_model = None
    elif selected_name.endswith("(tuned)"):
        selected_model = tuned[selected_name.replace(" (tuned)", "")]
    else:
        selected_model = fitted[selected_name]

    # Retrain selected estimator on all available rows after final holdout evaluation.
    if selected_model is not None:
        selected_model.fit(X, y)
    else:
        # For a baseline selection, the service uses the latest weekly_revenue directly.
        selected_model = None

    # Save a model bundle; baseline selection is represented without a fake estimator.
    bundle_path = MODEL_DIR / "sales_forecast_model.joblib"
    joblib.dump(selected_model, bundle_path)
    # Recompute metrics from the selected holdout strategy.
    if selected_name == "Naive Baseline":
        best_pred = baseline
    elif selected_name.endswith("(tuned)"):
        best_pred = tuned[selected_name.replace(" (tuned)", "")].predict(X_test)
    else:
        best_pred = fitted[selected_name].predict(X_test)
    selected_metrics = metrics(y_test, best_pred)
    pd.DataFrame(results).to_csv(MODEL_DIR / "model_comparison.csv", index=False)

    metadata = {
        "features": features,
        "target": TARGET,
        "selected_model": selected_name,
        "selected_is_baseline": selected_name == "Naive Baseline",
        "test_metrics": selected_metrics,
        "training_rows": int(len(X)),
        "train_rows_before_holdout": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "data_first_year_week": [int(data.iloc[0]["year"]), int(data.iloc[0]["week"])],
        "data_last_year_week": [int(data.iloc[-1]["year"]), int(data.iloc[-1]["week"])],
        "note": "Confidence returned by API is a heuristic derived from holdout WAPE, not a calibrated probability. Forecast horizon is one week."
    }
    (MODEL_DIR / "sales_forecast_metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    
    # Explainability: generate SHAP output for the best tree-based candidate.
    explain_path = MODEL_DIR / "shap_explanation.txt"

    try:
        import shap
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        # Compare tree candidates using their existing holdout MAE.
        tree_candidates = {}

        for name in ["Decision Tree", "Random Forest", "Gradient Boosting"]:
            tree_candidates[name] = fitted[name]

        for name, estimator in tuned.items():
            tree_candidates[f"{name} (tuned)"] = estimator

        tree_results = [
            r for r in results
            if r["model"] in tree_candidates
            and np.isfinite(r.get("mae", np.nan))
        ]

        if not tree_results:
            raise ValueError("No valid tree-based candidate was available.")

        best_tree_result = min(tree_results, key=lambda r: r["mae"])
        explain_model_name = best_tree_result["model"]
        explain_model = tree_candidates[explain_model_name]

        # Explain a small, representative sample of available rows.
        sample = X.tail(min(100, len(X)))

        explainer = shap.TreeExplainer(explain_model)
        shap_values = explainer.shap_values(sample)

        importance = np.abs(np.asarray(shap_values)).mean(axis=0)

        importance_df = pd.DataFrame({
            "feature": sample.columns,
            "mean_abs_shap": importance
        }).sort_values("mean_abs_shap", ascending=False)

        importance_df.to_csv(
            MODEL_DIR / "shap_feature_importance.csv",
            index=False
        )

        # Summary plot showing feature impact.
        shap.summary_plot(
            shap_values,
            sample,
            show=False
        )
        plt.tight_layout()
        plt.savefig(
            MODEL_DIR / "shap_summary.png",
            dpi=200,
            bbox_inches="tight"
        )
        plt.close("all")

        # Bar plot showing average absolute SHAP importance.
        shap.summary_plot(
            shap_values,
            sample,
            plot_type="bar",
            show=False
        )
        plt.tight_layout()
        plt.savefig(
            MODEL_DIR / "shap_feature_importance.png",
            dpi=200,
            bbox_inches="tight"
        )
        plt.close("all")

        explain_path.write_text(
            f"SHAP generated for candidate model: {explain_model_name}\n"
            f"Candidate holdout MAE: {best_tree_result['mae']}\n"
            f"Overall selected forecasting strategy: {selected_name}\n"
            "If the overall strategy is the naive baseline, these plots "
            "explain the tree candidate, not the deployed forecast strategy.\n",
            encoding="utf-8"
        )

    except ImportError:
        explain_path.write_text(
            "SHAP or Matplotlib is not installed. Run: "
            "python -m pip install shap matplotlib\n",
            encoding="utf-8"
        )

    except Exception as exc:
        explain_path.write_text(
            f"SHAP could not be generated: "
            f"{type(exc).__name__}: {exc}\n",
            encoding="utf-8"
        )


    print("\nSALES MODEL TRAINING COMPLETE")
    print(pd.DataFrame(results).to_string(index=False))
    print(f"\nSelected model: {selected_name}")
    print(f"Model bundle: {bundle_path}")
    print(f"Metadata: {MODEL_DIR / 'sales_forecast_metadata.json'}")
    print(f"Comparison: {MODEL_DIR / 'model_comparison.csv'}")
    print(f"Explainability: {explain_path}")

if __name__ == "__main__":
    main()
