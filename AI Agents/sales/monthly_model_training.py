
import pandas as pd
import numpy as np

from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error

# Load prepared dataset
df = pd.read_csv(
    "AI Agents/sales/monthly_model_dataset.csv"
)

print("\nDATASET")
print(df.head())

# Select input features
features = [
    "revenue_current",
    "revenue_lag_1",
    "revenue_lag_2",
    "rolling_mean_3m"
]

X = df[features]

# Target variable
y = df["target_next_month_revenue"]

# Chronological 80:20 split
split_index = int(len(df) * 0.8)

X_train = X.iloc[:split_index]
X_test = X.iloc[split_index:]

y_train = y.iloc[:split_index]
y_test = y.iloc[split_index:]

print("\nTRAINING RECORDS:", len(X_train))
print("TESTING RECORDS:", len(X_test))

# Train Linear Regression
model = LinearRegression()

model.fit(X_train, y_train)

# Predict test values
predictions = model.predict(X_test)

# Baseline: next month = current month
baseline_predictions = X_test["revenue_current"].values

# Evaluation function
def evaluate(actual, predicted):

    mae = mean_absolute_error(actual, predicted)

    rmse = np.sqrt(mean_squared_error(actual, predicted))

    wape = (
        np.sum(np.abs(actual - predicted))
        / np.sum(np.abs(actual))
    ) * 100

    return mae, rmse, wape

# Evaluate Linear Regression
model_mae, model_rmse, model_wape = evaluate(
    y_test, predictions
)

# Evaluate baseline
base_mae, base_rmse, base_wape = evaluate(
    y_test, baseline_predictions
)

print("\nLINEAR REGRESSION RESULTS")
print("MAE:", model_mae)
print("RMSE:", model_rmse)
print("WAPE:", model_wape, "%")

print("\nBASELINE RESULTS")
print("MAE:", base_mae)
print("RMSE:", base_rmse)
print("WAPE:", base_wape, "%")

# Compare actual and predicted values
results = pd.DataFrame({
    "Actual Revenue": y_test.values,
    "Predicted Revenue": predictions,
    "Baseline Prediction": baseline_predictions
}, index=df.iloc[split_index:]["date"])

print("\nPREDICTION COMPARISON")
print(results)

print("\nMODEL TRAINING COMPLETED!")
