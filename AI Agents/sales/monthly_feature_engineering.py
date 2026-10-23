
import pandas as pd

# Load cleaned monthly dataset
df = pd.read_csv("AI Agents/sales/monthly_sales_cleaned.csv")

# Convert date
df["date"] = pd.to_datetime(df["date"])

# Sort chronologically
df = df.sort_values("date")

# Set date as index
df = df.set_index("date")

# Create complete monthly timeline
df = df.asfreq("MS")

# Current month's revenue
df["revenue_current"] = df["monthly_revenue"]

# Previous month revenue
df["revenue_lag_1"] = df["monthly_revenue"].shift(1)

# Revenue two months ago
df["revenue_lag_2"] = df["monthly_revenue"].shift(2)

# Average revenue of current and previous two months
df["rolling_mean_3m"] = (
    df["monthly_revenue"]
    .rolling(window=3)
    .mean()
)

# Target: next month's revenue
df["target_next_month_revenue"] = (
    df["monthly_revenue"].shift(-1)
)

# Select features
features = [
    "revenue_current",
    "revenue_lag_1",
    "revenue_lag_2",
    "rolling_mean_3m"
]

# Prepare model dataset
model_df = df[
    features + ["target_next_month_revenue"]
].copy()

# Remove rows with unavailable information
model_df = model_df.dropna()

# Display result
print("\nCORRECTED MONTHLY MODEL DATASET")

print(model_df)

print("\nDATASET SHAPE")
print(model_df.shape)

# Save
model_df.to_csv(
    "AI Agents/sales/monthly_model_dataset.csv"
)

print("\nCorrected dataset saved successfully!")
