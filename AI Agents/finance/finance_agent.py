import os
import pandas as pd
import joblib


# ==================================================
# LOAD TRAINED FINANCE MODELS
# ==================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_DIR = os.path.join(
    BASE_DIR, "models", "finance"
)

REVENUE_MODEL_PATH = os.path.join(
    MODEL_DIR, "target_next_week_revenue_model.pkl"
)

PROFIT_MODEL_PATH = os.path.join(
    MODEL_DIR, "target_next_week_net_profit_model.pkl"
)

FEATURES_PATH = os.path.join(
    MODEL_DIR, "finance_features.pkl"
)

revenue_model = joblib.load(REVENUE_MODEL_PATH)
profit_model = joblib.load(PROFIT_MODEL_PATH)
finance_features = joblib.load(FEATURES_PATH)


# ==================================================
# FINANCE AGENT
# ==================================================

def finance_agent(finance_data):

    # Convert input dictionary into a DataFrame
    input_df = pd.DataFrame([finance_data])

    # Check required features
    missing_features = [
        feature for feature in finance_features
        if feature not in input_df.columns
    ]

    if missing_features:
        raise ValueError(
            f"Missing finance features: {missing_features}"
        )

    # Keep features in the exact training order
    input_df = input_df[finance_features]

    # Predict next week's revenue and net profit
    predicted_revenue = float(
        revenue_model.predict(input_df)[0]
    )

    predicted_profit = float(
        profit_model.predict(input_df)[0]
    )

    # Calculate predicted profit margin
    if predicted_revenue > 0:
        profit_margin = (
            predicted_profit / predicted_revenue
        ) * 100
    else:
        profit_margin = None

    # Determine financial status
    if predicted_profit < 0:
        risk_level = "High"
        financial_status = "Predicted Loss"

        explanation = (
            "The model predicts negative net profit "
            "for the next week. Review operating costs "
            "and revenue trends."
        )

        recommendation = (
            "Review purchase, freight, marketing, "
            "salary and rent costs. Compare actual "
            "revenue with expected revenue."
        )

    elif predicted_revenue <= 0:
        risk_level = "High"
        financial_status = "Revenue Concern"

        explanation = (
            "The model predicts non-positive revenue. "
            "Review sales trends and the source data."
        )

        recommendation = (
            "Check sales activity, incoming orders "
            "and the accuracy of recorded transactions."
        )

    elif profit_margin < 10:
        risk_level = "Medium"
        financial_status = "Low Predicted Profit Margin"

        explanation = (
            "The predicted profit margin is below 10%. "
            "Expenses may be consuming a large share "
            "of revenue."
        )

        recommendation = (
            "Monitor expenses and evaluate cost-saving "
            "opportunities while maintaining sales."
        )

    else:
        risk_level = "Low"
        financial_status = "Positive Predicted Profit"

        explanation = (
            "The model predicts positive net profit "
            "and a profit margin of at least 10%. "
            "Continue monitoring actual results."
        )

        recommendation = (
            "Track weekly revenue, profit and costs "
            "to check whether actual results match "
            "the forecast."
        )

    # Standardized Finance Agent output
    result = {
        "agent": "finance",

        "prediction": {
            "next_week_revenue": round(
                predicted_revenue, 2
            ),

            "next_week_net_profit": round(
                predicted_profit, 2
            ),

            "predicted_profit_margin_percent": (
                round(profit_margin, 2)
                if profit_margin is not None
                else None
            ),

            "financial_status": financial_status,
            "risk_level": risk_level
        },

        "explanation": explanation,

        "recommended_action": recommendation
    }

    return result


# ==================================================
# TESTING
# ==================================================

if __name__ == "__main__":

    DATA_PATH = os.path.join(
        BASE_DIR, "finance_ml_df.csv"
    )

    df = pd.read_csv(DATA_PATH)

    # Use one dataset row as a sample input
    sample_finance = df.iloc[0][
        finance_features
    ].to_dict()

    result = finance_agent(sample_finance)

    print("\nFinance Agent Result:")
    print(result)