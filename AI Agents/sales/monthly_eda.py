
import pandas as pd
import matplotlib.pyplot as plt

# Load monthly sales dataset
df = pd.read_csv("dataset/processed/sales_df.csv")

print("FIRST FIVE RECORDS")
print(df.head())

print("\nDATASET INFORMATION")
df.info()

print("\nSTATISTICAL SUMMARY")
print(df.describe())

print("\nMISSING VALUES")
print(df.isnull().sum())

print("\nDATASET SHAPE")
print(df.shape)

# Monthly revenue graph
plt.figure(figsize=(10, 5))

plt.plot(df["monthly_revenue"], marker="o")

plt.title("Monthly Sales Revenue")
plt.xlabel("Record Number")
plt.ylabel("Revenue")

plt.grid(True)
plt.show()
