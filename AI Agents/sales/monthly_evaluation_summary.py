import pandas as pd

# Load model comparison results
comparison = pd.read_csv(
    "AI Agents/sales/monthly_model_comparison_results.csv"
)

# Load sensitivity analysis
sensitivity = pd.read_csv(
    "AI Agents/sales/monthly_sensitivity_results.csv"
)

# Load October forecast
forecast = pd.read_csv(
    "AI Agents/sales/monthly_october_forecast.csv"
)

print("\nSALES AI MODEL EVALUATION SUMMARY")
print("=" * 45)

print("\n1. MODEL PERFORMANCE COMPARISON")
print(comparison.to_string(index=False))

print("\n2. SENSITIVITY ANALYSIS")
print(sensitivity.to_string(index=False))

print("\n3. OCTOBER 2018 FORECAST")
print(forecast.to_string(index=False))

# Save combined evaluation summary
comparison.to_csv(
    "AI Agents/sales/final_model_performance.csv",
    index=False
)

print("\nEvaluation summary saved successfully!")