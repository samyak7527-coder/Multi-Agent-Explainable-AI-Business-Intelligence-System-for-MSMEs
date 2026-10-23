import pandas as pd

# Load monthly dataset
df = pd.read_csv("AI Agents/sales/monthly_sales_cleaned.csv")

df["date"] = pd.to_datetime(df["date"])
df = df.sort_values("date")

# Calculate median revenue
median_revenue = df["monthly_revenue"].median()

# Calculate revenue per order
df["revenue_per_order"] = (
    df["monthly_revenue"] / df["monthly_orders"]
)

# Flag low revenue records
df["low_revenue_flag"] = (
    df["monthly_revenue"] < 0.10 * median_revenue
).astype(int)

# Flag very low order volume
df["low_order_flag"] = (
    df["monthly_orders"] < 10
).astype(int)

# Flag potential data quality issues
df["data_quality_flag"] = (
    (df["low_revenue_flag"] == 1) |
    (df["low_order_flag"] == 1)
).astype(int)

# Display flagged records
print("\nMONTHLY DATA QUALITY REPORT\n")

print(
    df[
        [
            "date",
            "monthly_revenue",
            "monthly_orders",
            "revenue_per_order",
            "low_revenue_flag",
            "low_order_flag",
            "data_quality_flag"
        ]
    ].to_string(index=False)
)

# Save quality-checked dataset
df.to_csv(
    "AI Agents/sales/monthly_sales_quality_checked.csv",
    index=False
)

print("\nQuality-checked dataset saved successfully!")