# Sales Agent setup and integration

## What was added
- `train_sales_model.py`: chronological holdout evaluation, naive baseline, Linear Regression, Decision Tree, Random Forest, Gradient Boosting, time-series hyperparameter tuning, model comparison, optional SHAP feature importance, and saved artifacts.
- `sales_agent.py`: callable Sales Agent that returns a structured JSON-compatible dictionary for one-week-ahead revenue questions.
- `backend/routes/sales.py`: FastAPI `/sales/query` and `/sales/health` endpoints.
- Updated `backend/main.py`: registers the Sales router.
- Updated `FrontEnd/Cashier/src/admin/ForecastingView.jsx`: sends questions to the backend and displays real response fields.

## 1. Install backend dependencies
Activate the same Python environment used for FastAPI and install any missing packages:

```bash
pip install fastapi uvicorn pandas numpy scikit-learn joblib
```

Optional explainability dependency:

```bash
pip install shap
```

## 2. Train the model
Run from the project root (the path with `backend/` and `AI Agents/`):

```bash
python "AI Agents/sales/train_sales_model.py"
```

Artifacts are written to `AI Agents/sales/models/`. The training process chooses the lowest-MAE strategy on the chronological holdout, including the naive baseline. On the supplied dataset the baseline currently wins; this is intentional rather than forcing a more complex model to be selected.

## 3. Start FastAPI
From the `backend` directory, use the project's normal environment:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Swagger docs: `http://127.0.0.1:8000/docs`

Test health:

```bash
curl http://127.0.0.1:8000/sales/health
```

Test forecast (PowerShell, curl, Postman, or Swagger):

```bash
curl -X POST http://127.0.0.1:8000/sales/query -H "Content-Type: application/json" -d "{\"query\":\"What will my revenue be next week?\"}"
```

## 4. Start the frontend
In a separate terminal:

```bash
cd "FrontEnd/Cashier"
npm install
npm run dev
```

The existing frontend API helper points to `http://127.0.0.1:8000`. Keep the backend running while using Forecasting.

## Notes and limitations
- The supplied dataset is weekly, so the current agent only claims a one-week-ahead forecast. Monthly queries are rejected instead of mislabeled.
- The response's `confidence` is a heuristic `1 - holdout WAPE`, not a calibrated probability. The UI explains this.
- The baseline wins on the supplied dataset's holdout results. Improve data quality and gather more representative history before claiming the complex models are more accurate.
- SHAP is optional; model training and prediction still work if it is not installed. SHAP output is only generated for a selected tree model that supports feature importance.
