import pandas as pd
from sklearn.ensemble import RandomForestRegressor

# Load training dataset
df = pd.read_csv("AI Agents/sales/monthly_model_dataset.csv")

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

# Train only using data available before September 2018
train_mask = df["date"] < "2018-08-01"

X_train = X[train_mask]
y_train = y[train_mask]

# Load actual monthly sales data
sales = pd.read_csv("AI Agents/sales/monthly_sales_cleaned.csv")

sales["date"] = pd.to_datetime(sales["date"])
sales = sales.sort_values("date").reset_index(drop=True)

# Get July, August and September 2018 revenue
recent = sales[sales["date"].isin(pd.to_datetime([
    "2018-07-01",
    "2018-08-01",
    "2018-09-01"
]))].sort_values("date")

if len(recent) != 3:
    raise ValueError("July, August, or September 2018 data is missing.")

revenues = recent["monthly_revenue"].tolist()

# Prepare October input
future_input = pd.DataFrame([{
    "revenue_current": revenues[2],
    "revenue_lag_1": revenues[1],
    "revenue_lag_2": revenues[0],
    "rolling_mean_3m": sum(revenues) / 3
}])

# Train model
model = RandomForestRegressor(
    n_estimators=100,
    max_depth=3,
    random_state=42
)

model.fit(X_train, y_train)

# Predict October 2018
forecast = model.predict(future_input)[0]

# Naive baseline: September revenue
baseline = revenues[2]

forecast_month = pd.Timestamp("2018-10-01")

print("\nOCTOBER MONTHLY SALES FORECAST")
print("--------------------------------")
print("Forecast Month:", forecast_month.strftime("%B %Y"))
print("Random Forest Forecast: ₹", round(forecast, 2))
print("Naive Baseline Forecast: ₹", round(baseline, 2))

# Save forecast
forecast_result = pd.DataFrame([{
    "forecast_month": forecast_month,
    "random_forest_forecast": forecast,
    "naive_baseline_forecast": baseline
}])

forecast_result.to_csv(
    "AI Agents/sales/monthly_october_forecast.csv",
    index=False
)

print("\nOctober forecast saved successfully!")