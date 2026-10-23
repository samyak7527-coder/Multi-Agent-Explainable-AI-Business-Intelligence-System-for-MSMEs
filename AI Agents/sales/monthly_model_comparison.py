import pandas as pd

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.tree import DecisionTreeRegressor

from sklearn.metrics import mean_absolute_error, mean_squared_error
import numpy as np


# Load model dataset
df = pd.read_csv(
    "AI Agents/sales/monthly_model_dataset.csv"
)

df["date"] = pd.to_datetime(df["date"])
df = df.sort_values("date")

# Features and target
features = [
    "revenue_current",
    "revenue_lag_1",
    "revenue_lag_2",
    "rolling_mean_3m"
]

X = df[features]
y = df["target_next_month_revenue"]

# Chronological train-test split
split = int(len(df) * 0.8)

X_train = X.iloc[:split]
X_test = X.iloc[split:]

y_train = y.iloc[:split]
y_test = y.iloc[split:]

# Models
models = {
    "Linear Regression": LinearRegression(),

    "Decision Tree": DecisionTreeRegressor(
        max_depth=3,
        random_state=42
    ),

    "Random Forest": RandomForestRegressor(
        n_estimators=100,
        max_depth=3,
        random_state=42
    )
}

results = []

# Train and evaluate models
for name, model in models.items():

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    mae = mean_absolute_error(y_test, predictions)

    rmse = np.sqrt(
        mean_squared_error(y_test, predictions)
    )

    wape = (
        np.sum(np.abs(y_test - predictions))
        / np.sum(np.abs(y_test))
    ) * 100

    results.append({
        "Model": name,
        "MAE": mae,
        "RMSE": rmse,
        "WAPE (%)": wape
    })

# Naive baseline
baseline_predictions = X_test["revenue_current"]

baseline_mae = mean_absolute_error(
    y_test,
    baseline_predictions
)

baseline_rmse = np.sqrt(
    mean_squared_error(y_test, baseline_predictions)
)

baseline_wape = (
    np.sum(np.abs(y_test - baseline_predictions))
    / np.sum(np.abs(y_test))
) * 100

results.append({
    "Model": "Naive Baseline",
    "MAE": baseline_mae,
    "RMSE": baseline_rmse,
    "WAPE (%)": baseline_wape
})

# Display results
results_df = pd.DataFrame(results)

print("\nMONTHLY MODEL COMPARISON\n")

print(results_df.to_string(index=False))

results_df.to_csv(
    "AI Agents/sales/monthly_model_comparison_results.csv",
    index=False
)

print("\nModel comparison results saved successfully!")