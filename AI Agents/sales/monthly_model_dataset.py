
import pandas as pd

# Load feature-engineered dataset
df = pd.read_csv("AI Agents/sales/monthly_features.csv")

# Convert date
df["date"] = pd.to_datetime(df["date"])

# Set date as index
df = df.set_index("date")

# Create next month revenue as target
df["target_next_month_revenue"] = df["monthly_revenue"].shift(-1)

# Select input features
features = [
    "revenue_lag_1",
    "revenue_lag_2",
    "revenue_lag_3",
    "rolling_mean_3m"
]

# Create model dataset
model_df = df[features + ["target_next_month_revenue"]].copy()

# Remove rows containing missing values
model_df = model_df.dropna()

# Display final dataset
print("\nFINAL MONTHLY MODEL DATASET")

print(model_df)

print("\nDATASET SHAPE")
print(model_df.shape)

# Save dataset
model_df.to_csv("AI Agents/sales/monthly_model_dataset.csv")

print("\nMonthly model dataset created successfully!")
