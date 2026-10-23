
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor


# Load dataset
df = pd.read_csv(
    "AI Agents/sales/monthly_model_dataset.csv"
)

df["date"] = pd.to_datetime(df["date"])
df = df.sort_values("date").reset_index(drop=True)

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

# Corrected training target
y_train = y.iloc[:split]
y_test = y.iloc[split:]

# Target month = forecast origin month + 1 month
test_dates = (
    df["date"].iloc[split:] + pd.DateOffset(months=1)
)

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

# Plot actual revenue
plt.figure(figsize=(12, 6))

plt.plot(
    test_dates,
    y_test.values,
    marker="o",
    linewidth=2,
    label="Actual Revenue"
)

# Train and plot predictions
for name, model in models.items():

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    plt.plot(
        test_dates,
        predictions,
        marker="o",
        linestyle="--",
        label=name
    )

# Naive baseline
plt.plot(
    test_dates,
    X_test["revenue_current"].values,
    marker="o",
    linestyle=":",
    label="Naive Baseline"
)

# Graph formatting
plt.title("Monthly Sales Revenue: Actual vs Predicted")

plt.xlabel("Forecast Month")
plt.ylabel("Revenue (₹)")

plt.xticks(rotation=45)

plt.legend()
plt.grid(True)

plt.tight_layout()

plt.savefig(
    "AI Agents/sales/monthly_prediction_comparison.png"
)

plt.show()

print("Date-wise prediction graph saved successfully!")
