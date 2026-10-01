
import os
import pandas as pd
import joblib

from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# --------------------------------------------------
# PATHS
# --------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_PATH = os.path.join(BASE_DIR, "finance_ml_df.csv")

MODEL_DIR = os.path.join(
    BASE_DIR, "models", "finance"
)

os.makedirs(MODEL_DIR, exist_ok=True)


# --------------------------------------------------
# LOAD DATASET
# --------------------------------------------------

df = pd.read_csv(DATA_PATH)

print("Dataset loaded successfully")
print("Dataset shape:", df.shape)


# --------------------------------------------------
# DEFINE TARGETS
# --------------------------------------------------

targets = [
    "target_next_week_revenue",
    "target_next_week_net_profit"
]

# Remove rows without target values
df = df.dropna(subset=targets).reset_index(drop=True)

# Input features: all columns except prediction targets
features = [
    col for col in df.columns
    if col not in targets
]

X = df[features]


# --------------------------------------------------
# TRAIN AND EVALUATE EACH MODEL
# --------------------------------------------------

evaluation_results = []

for target in targets:

    print("\nTraining model for:", target)

    y = df[target]

    # Chronological split: first 80% for training,
    # last 20% for testing
    split_index = int(len(df) * 0.80)

    X_train = X.iloc[:split_index]
    X_test = X.iloc[split_index:]

    y_train = y.iloc[:split_index]
    y_test = y.iloc[split_index:]

    # Build ML pipeline
    model = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("regressor", RandomForestRegressor(
            n_estimators=200,
            random_state=42,
            min_samples_leaf=2
        ))
    ])

    # Train
    model.fit(X_train, y_train)

    # Predict test data
    predictions = model.predict(X_test)

    # Evaluation metrics
    mae = mean_absolute_error(y_test, predictions)
    mse = mean_squared_error(y_test, predictions)
    rmse = mse ** 0.5
    r2 = r2_score(y_test, predictions)

    print("MAE:", round(mae, 2))
    print("MSE:", round(mse, 2))
    print("RMSE:", round(rmse, 2))
    print("R2 Score:", round(r2, 4))

    # Save trained model
    model_name = target + "_model.pkl"

    joblib.dump(
        model,
        os.path.join(MODEL_DIR, model_name)
    )

    evaluation_results.append({
        "target": target,
        "MAE": mae,
        "MSE": mse,
        "RMSE": rmse,
        "R2": r2
    })


# --------------------------------------------------
# SAVE FEATURE LIST
# --------------------------------------------------

joblib.dump(
    features,
    os.path.join(MODEL_DIR, "finance_features.pkl")
)


# --------------------------------------------------
# SAVE EVALUATION RESULTS
# --------------------------------------------------

evaluation_df = pd.DataFrame(evaluation_results)

evaluation_df.to_csv(
    os.path.join(MODEL_DIR, "model_evaluation.csv"),
    index=False
)

print("\nFinance model training completed!")
print("Models saved in:", MODEL_DIR)
print(evaluation_df.to_string(index=False))