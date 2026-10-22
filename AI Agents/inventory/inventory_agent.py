import os
import calendar
import joblib
import pandas as pd
import numpy as np


# ============================================================
# LOAD TRAINED INVENTORY MODEL
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "inventory_product_demand_model.pkl"
)

FEATURES_PATH = os.path.join(
    BASE_DIR,
    "models",
    "inventory_features.pkl"
)

inventory_model = joblib.load(MODEL_PATH)
inventory_features = joblib.load(FEATURES_PATH)


# ============================================================
# INVENTORY AGENT
# ============================================================

def inventory_agent(inventory_data):
    """
    Inventory Agent

    Predicts next-month demand and provides stock-risk
    assessment and reorder recommendations.
    """

    # Convert input dictionary to DataFrame
    input_df = pd.DataFrame([inventory_data])

    # Validate required features
    missing_features = [
        feature
        for feature in inventory_features
        if feature not in input_df.columns
    ]

    if missing_features:
        raise ValueError(
            f"Missing inventory features: {missing_features}"
        )

    # Preserve the feature order used during training
    input_df = input_df[inventory_features]

    # --------------------------------------------------------
    # PREDICT NEXT-MONTH DEMAND
    # --------------------------------------------------------

    prediction = inventory_model.predict(input_df)[0]
    predicted_demand = max(0.0, float(prediction))

    # --------------------------------------------------------
    # INVENTORY INFORMATION
    # --------------------------------------------------------

    current_stock = float(inventory_data["current_stock"])
    reorder_level = float(inventory_data["reorder_level"])
    lead_time_days = float(inventory_data["lead_time_days"])

    order_year = int(inventory_data["order_year"])
    order_month = int(inventory_data["order_month"])

    if current_stock < 0 or reorder_level < 0 or lead_time_days < 0:
        raise ValueError(
            "Stock, reorder level, and lead time cannot be negative."
        )

    if not 1 <= order_month <= 12:
        raise ValueError("order_month must be between 1 and 12.")

    # --------------------------------------------------------
    # ESTIMATE DEMAND DURING SUPPLIER LEAD TIME
    # --------------------------------------------------------

    # Calculate the month being predicted
    forecast_year = order_year
    forecast_month = order_month + 1

    if forecast_month == 13:
        forecast_month = 1
        forecast_year += 1

    days_in_forecast_month = calendar.monthrange(
        forecast_year,
        forecast_month
    )[1]

    predicted_daily_demand = (
        predicted_demand / days_in_forecast_month
    )

    lead_time_demand = (
        predicted_daily_demand * lead_time_days
    )

    # Reorder point = expected lead-time demand + buffer
    reorder_point = lead_time_demand + reorder_level

    # Target stock for the next month, including the buffer
    target_stock = predicted_demand + reorder_level

    # --------------------------------------------------------
    # STOCK-RISK ASSESSMENT
    # --------------------------------------------------------

    if current_stock <= reorder_point:
        risk_level = "High"

    elif current_stock < target_stock:
        risk_level = "Medium"

    else:
        risk_level = "Low"

    reorder_required = current_stock < target_stock

    recommended_quantity = max(
        0,
        int(np.ceil(target_stock - current_stock))
    )

    # --------------------------------------------------------
    # EXPLANATION
    # --------------------------------------------------------

    explanation = (
        f"Predicted demand for the next month is "
        f"{predicted_demand:.2f} units. Current stock is "
        f"{current_stock:.0f} units. Estimated demand during "
        f"the {lead_time_days:.0f}-day supplier lead time is "
        f"{lead_time_demand:.2f} units. The reorder point, "
        f"including the buffer, is {reorder_point:.2f} units."
    )

    # --------------------------------------------------------
    # RECOMMENDATION
    # --------------------------------------------------------

    if reorder_required:
        recommendation = (
            f"{risk_level} stock risk. Consider replenishing "
            f"{recommended_quantity} units to reach the "
            f"estimated target stock level."
        )
    else:
        recommendation = (
            "Current stock meets the estimated target stock "
            "level. Continue monitoring sales and inventory."
        )

    # --------------------------------------------------------
    # STANDARDIZED AGENT OUTPUT
    # --------------------------------------------------------

    result = {
        "agent": "inventory",

        "prediction": {
            "predicted_next_month_demand": round(
                predicted_demand, 2
            ),
            "current_stock": current_stock,
            "estimated_lead_time_demand": round(
                lead_time_demand, 2
            ),
            "reorder_point": round(reorder_point, 2),
            "stock_risk": risk_level,
            "reorder_required": reorder_required,
            "recommended_reorder_quantity": recommended_quantity
        },

        "explanation": explanation,

        "recommended_action": recommendation
    }

    return result


# ============================================================
# TESTING
# ============================================================

if __name__ == "__main__":

    sample_inventory = {
        "order_year": 2018,
        "order_month": 5,
        "monthly_sales": 1,
        "current_stock": 10,
        "reorder_level": 4,
        "lead_time_days": 4,
        "category": "perfumaria",
        "warehouse_location": "Hyderabad"
    }

    result = inventory_agent(sample_inventory)

    print("\nInventory Agent Result:")
    print(result)