
import pandas as pd
import matplotlib.pyplot as plt

# Load weekly sales dataset
df = pd.read_csv("AI Agents/sales/sales_ml_df.csv")

# Display first five records
print("FIRST FIVE RECORDS")
print(df.head())

# Display dataset information
print("\nDATASET INFORMATION")
print(df.info())

# Display statistical summary
print("\nSTATISTICAL SUMMARY")
print(df.describe())

# Check missing values
print("\nMISSING VALUES")
print(df.isnull().sum())

# Display dataset dimensions
print("\nDATASET SHAPE")
print(df.shape)

# Plot weekly revenue
plt.figure(figsize=(10, 5))
plt.plot(df["weekly_revenue"])

plt.title("Weekly Sales Revenue")
plt.xlabel("Record Number")
plt.ylabel("Revenue")

plt.grid(True)
plt.show()

print("\nLAST 10 RECORDS")

print(df.tail(10))

print("\nWEEKLY REVENUE DETAILS")

print(df["weekly_revenue"].describe())

print("\nTARGET REVENUE DETAILS")

print(df["target_next_week_revenue"].describe())