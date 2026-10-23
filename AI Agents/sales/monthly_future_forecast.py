
import pandas as pd

from sklearn.ensemble import RandomForestRegressor


# Load dataset
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

# Exclude September 2018 target from training
# August 2018 is the forecast origin for September 2018
train_mask = df["date"] < "2018-08-01"

X_train = X[train_mask]
y_train = y[train_mask]

# September forecast input: August 2018 features
forecast_input = X.iloc[[-1]]

# Train model
model = RandomForestRegressor(
    n_estimators=100,
    max_depth=3,
    random_state=42
)

model.fit(X_train, y_train)

# Predict September 2018
forecast = model.predict(forecast_input)[0]

# Baseline
baseline = forecast_input["revenue_current"].iloc[0]

print("\nCORRECTED MONTHLY FORECAST")
print("--------------------------")

print("Forecast Month: September 2018")

print("Random Forest Forecast: ₹", round(forecast, 2))

print("Naive Baseline: ₹", round(baseline, 2))

# Actual value for comparison only
actual = 166.46

print("Actual Revenue: ₹", actual)

print("Random Forest Absolute Error: ₹", round(abs(actual - forecast), 2))

print("\nForecast evaluation completed!")
