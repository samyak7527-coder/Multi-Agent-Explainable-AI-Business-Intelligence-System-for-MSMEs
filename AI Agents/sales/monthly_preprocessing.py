
import pandas as pd

# Load dataset
df = pd.read_csv("dataset/processed/sales_df.csv")

# Convert month names into month numbers
df["month_number"] = pd.to_datetime(
    df["order_month"],
    format="%B"
).dt.month

# Create proper date column
df["date"] = pd.to_datetime(
    df["order_year"].astype(str) + "-" +
    df["month_number"].astype(str) + "-01"
)

# Sort data chronologically
df = df.sort_values("date").reset_index(drop=True)


# Generate all expected monthly dates

expected_dates = pd.date_range(
    start=df["date"].min(),
    end=df["date"].max(),
    freq="MS"
)

# Find missing months

missing_dates = expected_dates.difference(df["date"])

print("\nMISSING MONTHS")

print(missing_dates)

print("\nTOTAL MISSING MONTHS")

print(len(missing_dates))

# Display chronological data
print("\nCHRONOLOGICAL SALES DATA")

print(df[[
    "date",
    "monthly_revenue",
    "monthly_orders"
]])

# Check duplicate months
print("\nDUPLICATE MONTHS")

print(df[df.duplicated("date", keep=False)])

# Check zero revenue
print("\nZERO REVENUE RECORDS")

print(df[df["monthly_revenue"] == 0])

# Plot chronological revenue
import matplotlib.pyplot as plt

plt.figure(figsize=(12, 5))

plt.plot(
    df["date"],
    df["monthly_revenue"],
    marker="o"
)

plt.title("Monthly Revenue - Chronological Order")
plt.xlabel("Month")
plt.ylabel("Revenue")

plt.xticks(rotation=45)
plt.grid(True)
plt.tight_layout()

plt.show()


# Check missing months

expected_dates = pd.date_range(
    start=df["date"].min(),
    end=df["date"].max(),
    freq="MS"
)

missing_dates = expected_dates.difference(df["date"])

print("\nMISSING MONTHS")

print(missing_dates)

print("\nTOTAL MISSING MONTHS")

print(len(missing_dates))


# Save cleaned dataset
df.to_csv(
    "AI Agents/sales/monthly_sales_cleaned.csv",
    index=False
)

print("\nCleaned dataset saved successfully!")
