import pandas as pd

# Load cleaned monthly dataset
df = pd.read_csv("AI Agents/sales/monthly_sales_cleaned.csv")

df["date"] = pd.to_datetime(df["date"])
df = df.sort_values("date")

# Calculate revenue per order
df["revenue_per_order"] = (
    df["monthly_revenue"] / df["monthly_orders"]
)

# Display suspicious records
median_revenue = df["monthly_revenue"].median()

suspicious = df[
    df["monthly_revenue"] < 0.10 * median_revenue
]

print("\nSUSPICIOUS MONTHLY RECORDS\n")

print(
    suspicious[
        [
            "date",
            "monthly_revenue",
            "monthly_orders",
            "revenue_per_order"
        ]
    ].to_string(index=False)
)

print("\nREVENUE AND ORDER TREND\n")

print(
    df[
        [
            "date",
            "monthly_revenue",
            "monthly_orders",
            "revenue_per_order"
        ]
    ].to_string(index=False)
)

print("\nINVESTIGATION COMPLETED!")