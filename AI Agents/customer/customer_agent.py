import pandas as pd
import joblib
import os


# ============================================================
# LOAD TRAINED CUSTOMER MODEL
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "customer",
    "customer_churn_model.pkl"
)

FEATURES_PATH = os.path.join(
    BASE_DIR,
    "models",
    "customer",
    "customer_features.pkl"
)


# Load trained model
customer_model = joblib.load(MODEL_PATH)

# Load feature names
customer_features = joblib.load(FEATURES_PATH)


# ============================================================
# CUSTOMER AGENT
# ============================================================

def customer_agent(customer_data):
    """
    Customer Agent

    Input:
        customer_data: Dictionary containing customer features

    Output:
        Dictionary containing:
        - churn prediction
        - churn probability
        - risk level
        - explanation
    """

    # --------------------------------------------------------
    # Convert input dictionary to DataFrame
    # --------------------------------------------------------

    input_df = pd.DataFrame(
        [customer_data]
    )


    # --------------------------------------------------------
    # Make sure required features are present
    # --------------------------------------------------------

    missing_features = [
        feature
        for feature in customer_features
        if feature not in input_df.columns
    ]

    if missing_features:

        raise ValueError(
            f"Missing customer features: {missing_features}"
        )


    # Keep only model features
    input_df = input_df[
        customer_features
    ]


    # --------------------------------------------------------
    # Predict churn
    # --------------------------------------------------------

    prediction = customer_model.predict(
        input_df
    )[0]


    # --------------------------------------------------------
    # Get churn probability
    # --------------------------------------------------------

    probability = customer_model.predict_proba(
        input_df
    )[0][1]


    # --------------------------------------------------------
    # Determine risk level
    # --------------------------------------------------------

    if probability >= 0.70:

        risk_level = "High"

    elif probability >= 0.40:

        risk_level = "Medium"

    else:

        risk_level = "Low"


    # --------------------------------------------------------
    # Determine churn status
    # --------------------------------------------------------

    if prediction == 1:

        churn_status = "Churned"

    else:

        churn_status = "Not Churned"


    # --------------------------------------------------------
    # Generate explanation
    # --------------------------------------------------------

    recency_days = customer_data.get(
        "recency_days",
        None
    )


    if recency_days is not None:

        if recency_days > 90:

            explanation = (
                f"Customer has been inactive for "
                f"{recency_days} days, which is greater "
                f"than the 90-day churn threshold."
            )

        else:

            explanation = (
                f"Customer made a purchase within the "
                f"last {recency_days} days and is below "
                f"the 90-day churn threshold."
            )

    else:

        explanation = (
            "Churn prediction generated from "
            "customer behavioral features."
        )


    # --------------------------------------------------------
    # Recommended action
    # --------------------------------------------------------

    if risk_level == "High":

        recommendation = (
            "Consider a targeted customer retention "
            "campaign or personalized offer."
        )

    elif risk_level == "Medium":

        recommendation = (
            "Monitor customer activity and consider "
            "a promotional engagement."
        )

    else:

        recommendation = (
            "Customer appears active. Continue normal "
            "customer engagement."
        )


    # ========================================================
    # STANDARDIZED CUSTOMER AGENT OUTPUT
    # ========================================================

    result = {

        "agent": "customer",

        "prediction": {

            "churn": int(prediction),

            "churn_status": churn_status,

            "churn_probability": round(
                float(probability),
                4
            ),

            "risk_level": risk_level
        },

        "explanation": explanation,

        "recommended_action": recommendation
    }


    return result


# ============================================================
# TESTING
# ============================================================

if __name__ == "__main__":

    sample_customer = {

        "customer_state": "SP",

        "customer_city": "sao paulo",

        "total_orders": 3,

        "total_spend": 750.50,

        "avg_order_value": 250.17,

        "avg_review_score": 4.0,

        "recency_days": 71,

        "purchase_frequency": 0.05,

        "avg_days_between_orders": 45
    }


    result = customer_agent(
        sample_customer
    )


    print("\nCustomer Agent Result:")
    print(result)