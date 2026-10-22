
import pandas as pd

# Load cleaned dataset
df = pd.read_csv(
    "AI Agents/sales/monthly_sales_cleaned.csv"
)

df["date"] = pd.to_datetime(df["date"])

df = df.sort_values("date").reset_index(drop=True)

# Calculate month-to-month revenue change
df["revenue_change"] = df["monthly_revenue"].diff()

df["revenue_change_percentage"] = (
    df["monthly_revenue"].pct_change() * 100
)

print("\nMONTHLY REVENUE VALIDATION")

print(df[[
    "date",
    "monthly_revenue",
    "monthly_orders",
    "revenue_change_percentage"
]].to_string(index=False))

# Identify unusually low revenue
median_revenue = df["monthly_revenue"].median()

print("\nMEDIAN MONTHLY REVENUE:", median_revenue)

print("\nRECORDS BELOW 10% OF MEDIAN REVENUE")

low_revenue = df[
    df["monthly_revenue"] < median_revenue * 0.10
]

print(low_revenue[[
    "date",
    "monthly_revenue",
    "monthly_orders"
]])

# Check September 2018
print("\nFINAL MONTH INSPECTION")

print(df.tail(3).to_string(index=False))

print("\nDATA VALIDATION COMPLETED!")
