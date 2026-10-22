
import pandas as pd
import numpy as np

from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor

from sklearn.metrics import mean_absolute_error, mean_squared_error


# Load monthly model dataset
df = pd.read_csv(
    "AI Agents/sales/monthly_model_dataset.csv"
)

df["date"] = pd.to_datetime(df["date"])
df = df.sort_values("date").reset_index(drop=True)

features = [
    "revenue_current",
    "revenue_lag_1",
    "revenue_lag_2",
    "rolling_mean_3m"
]

X = df[features]
y = df["target_next_month_revenue"]

# Chronological split
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

for name, model in models.items():

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    # Evaluation with all test records
    mae_all = mean_absolute_error(
        y_test, predictions
    )

    # Exclude final test observation only for sensitivity analysis
    mae_without_last = mean_absolute_error(
        y_test.iloc[:-1],
        predictions[:-1]
    )

    results.append({
        "Model": name,
        "MAE_With_All": mae_all,
        "MAE_Without_Last": mae_without_last
    })

# Baseline
baseline = X_test["revenue_current"]

results.append({
    "Model": "Naive Baseline",
    "MAE_With_All": mean_absolute_error(
        y_test, baseline
    ),
    "MAE_Without_Last": mean_absolute_error(
        y_test.iloc[:-1],
        baseline.iloc[:-1]
    )
})

results_df = pd.DataFrame(results)

print("\nMONTHLY FORECAST SENSITIVITY ANALYSIS\n")

print(results_df.to_string(index=False))

results_df.to_csv(
    "AI Agents/sales/monthly_sensitivity_results.csv",
    index=False
)

print("\nSensitivity analysis saved successfully!")
