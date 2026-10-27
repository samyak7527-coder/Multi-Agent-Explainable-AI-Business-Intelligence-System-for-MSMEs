
"""
InsightIQ - Decision Coordinator Agent
Coordinates Customer, Sales, Inventory, and Finance agents.

Responsibilities:
1. Execute each agent independently.
2. Handle agent failures.
3. Identify cross-agent business risks.
4. Prioritize recommendations.
5. Return a JSON-serializable result.

This is a rule-based coordinator, not a separate ML model.
"""

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


# ============================================================
# DECISION COORDINATOR
# ============================================================

class DecisionCoordinator:

    PRIORITY_ORDER = {
        "critical": 0,
        "high": 1,
        "medium": 2,
        "low": 3
    }

    def __init__(self):
        self.agent_results = {}
        self.agent_errors = {}

    # --------------------------------------------------------
    # 1. Execute an agent safely
    # --------------------------------------------------------

    def _execute_agent(
        self,
        agent_name: str,
        agent_function,
        *args
    ) -> Dict[str, Any]:

        try:
            result = agent_function(*args)

            if not isinstance(result, dict):
                raise TypeError(
                    f"{agent_name} agent must return a dictionary."
                )

            if not isinstance(result.get("prediction"), dict):
                raise ValueError(
                    f"{agent_name} agent did not return a valid prediction dictionary."
                )

            return {
                "agent": agent_name,
                "execution_status": "success",
                "result": result
            }

        except Exception as exc:
            error_result = {
                "agent": agent_name,
                "execution_status": "error",
                "error": {
                    "type": type(exc).__name__,
                    "message": str(exc)
                }
            }

            self.agent_errors[agent_name] = error_result["error"]

            return error_result

    # --------------------------------------------------------
    # 2. Add a recommendation
    # --------------------------------------------------------

    @staticmethod
    def _add_recommendation(
        recommendations: List[Dict[str, Any]],
        priority: str,
        category: str,
        issue: str,
        action: str,
        source_agents: List[str]
    ):

        recommendations.append({
            "priority": priority,
            "category": category,
            "issue": issue,
            "recommended_action": action,
            "source_agents": source_agents
        })

    # --------------------------------------------------------
    # 3. Coordinate the agent outputs
    # --------------------------------------------------------

    def coordinate_results(
        self,
        customer_result: Optional[Dict[str, Any]],
        sales_result: Optional[Dict[str, Any]],
        inventory_result: Optional[Dict[str, Any]],
        finance_result: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:

        self.agent_errors = {}

        supplied_results = {
            "customer": customer_result,
            "sales": sales_result,
            "inventory": inventory_result,
            "finance": finance_result
        }

        valid_results = {}
        execution_status = {}

        for name, result in supplied_results.items():

            if (
                isinstance(result, dict)
                and isinstance(result.get("prediction"), dict)
            ):
                valid_results[name] = result

                # Customer "status" means churn status.
                # Sales "status" indicates execution success.
                # Inventory and Finance have no execution status.
                execution_status[name] = "success"

            else:
                execution_status[name] = (
                    "error"
                    if result is not None
                    else "not_run"
                )

                if result is not None:
                    self.agent_errors[name] = {
                        "message": (
                            "Missing or invalid prediction dictionary."
                        )
                    }

        customer = valid_results.get("customer", {})
        sales = valid_results.get("sales", {})
        inventory = valid_results.get("inventory", {})
        finance = valid_results.get("finance", {})

        customer_prediction = customer.get("prediction", {})
        sales_prediction = sales.get("prediction", {})
        inventory_prediction = inventory.get("prediction", {})
        finance_prediction = finance.get("prediction", {})

        findings = []
        recommendations = []

        # ====================================================
        # CUSTOMER ANALYSIS
        # ====================================================

        customer_risk = str(
            customer_prediction.get("risk_level", "")
        ).lower()

        churn_probability = customer_prediction.get(
            "churn_probability"
        )

        customer_high_risk = (
            customer_risk in {"high", "critical"}
            or (
                isinstance(churn_probability, (int, float))
                and churn_probability >= 0.70
            )
        )

        customer_medium_risk = (
            customer_risk == "medium"
            or (
                isinstance(churn_probability, (int, float))
                and 0.40 <= churn_probability < 0.70
            )
        )

        if customer:

            findings.append({
                "category": "customer",
                "finding": (
                    "High customer churn risk."
                    if customer_high_risk
                    else "Moderate customer churn risk."
                    if customer_medium_risk
                    else "Customer churn risk is currently low."
                ),
                "risk_level": customer_prediction.get("risk_level"),
                "churn_probability": churn_probability
            })

            if customer_high_risk or customer_medium_risk:

                self._add_recommendation(
                    recommendations,
                    "high" if customer_high_risk else "medium",
                    "customer_retention",
                    "Customer churn risk needs attention.",
                    customer.get(
                        "recommended_action",
                        "Review customer activity and plan appropriate engagement."
                    ),
                    ["customer"]
                )

        # ====================================================
        # SALES ANALYSIS
        # ====================================================

        sales_explanation = sales.get("explanation", [])

        if isinstance(sales_explanation, str):
            sales_explanation = [sales_explanation]

        sales_text = " ".join(
            str(item) for item in sales_explanation
        ).lower()

        declining_sales = any(
            phrase in sales_text
            for phrase in [
                "revenue decreased",
                "revenue declined",
                "revenue decreasing",
                "order volume decreased",
                "sales decreased",
                "sales declined"
            ]
        )

        current_revenue = sales.get("current_week_revenue")
        forecast_revenue = sales_prediction.get("value")

        if sales:

            findings.append({
                "category": "sales",
                "finding": (
                    "Recent sales indicators show a decline."
                    if declining_sales
                    else "Sales forecast received."
                ),
                "forecast_metric": sales_prediction.get("metric"),
                "forecast_value": forecast_revenue,
                "unit": sales.get("unit"),
                "forecast_period": sales.get("period"),
                "model": sales.get("model")
            })

            # Compare values only when they are for compatible
            # weekly periods and both are valid numeric values.
            revenue_decline_vs_current = (
                isinstance(current_revenue, (int, float))
                and isinstance(forecast_revenue, (int, float))
                and current_revenue > 0
                and forecast_revenue < current_revenue
            )

            if declining_sales or revenue_decline_vs_current:

                self._add_recommendation(
                    recommendations,
                    "high" if finance else "medium",
                    "sales_performance",
                    "Sales indicators suggest a possible decline.",
                    sales.get(
                        "recommended_action",
                        "Review order volume, product performance, and promotions."
                    ),
                    ["sales"]
                )

        # ====================================================
        # INVENTORY ANALYSIS
        # ====================================================

        reorder_required = inventory_prediction.get(
            "reorder_required"
        )

        current_stock = inventory_prediction.get("current_stock")
        reorder_point = inventory_prediction.get("reorder_point")

        stock_risk = str(
            inventory_prediction.get("stock_risk", "")
        ).lower()

        inventory_high_risk = stock_risk in {"high", "critical"}

        if inventory:

            findings.append({
                "category": "inventory",
                "finding": (
                    "Inventory replenishment is indicated."
                    if reorder_required is True
                    else "Inventory replenishment is not indicated."
                    if reorder_required is False
                    else "Inventory forecast received."
                ),
                "predicted_next_month_demand":
                    inventory_prediction.get(
                        "predicted_next_month_demand"
                    ),
                "current_stock": current_stock,
                "reorder_point": reorder_point,
                "stock_risk": inventory_prediction.get("stock_risk"),
                "reorder_required": reorder_required
            })

            # The agent's explicit decision is preferred.
            # Stock and reorder point provide a fallback.
            needs_reorder = (
                reorder_required is True
                or (
                    reorder_required is None
                    and isinstance(current_stock, (int, float))
                    and isinstance(reorder_point, (int, float))
                    and current_stock <= reorder_point
                )
            )

            if needs_reorder:

                self._add_recommendation(
                    recommendations,
                    "high" if inventory_high_risk else "medium",
                    "inventory_replenishment",
                    "Stock replenishment may be required.",
                    inventory.get(
                        "recommended_action",
                        "Review demand, supplier lead time, and safety stock."
                    ),
                    ["inventory"]
                )

        # ====================================================
        # FINANCE ANALYSIS
        # ====================================================

        predicted_profit = finance_prediction.get(
            "next_week_net_profit"
        )

        predicted_revenue = finance_prediction.get(
            "next_week_revenue"
        )

        profit_margin = finance_prediction.get(
            "predicted_profit_margin_percent"
        )

        financial_status = str(
            finance_prediction.get("financial_status", "")
        ).lower()

        finance_risk = str(
            finance_prediction.get("risk_level", "")
        ).lower()

        negative_profit = (
            isinstance(predicted_profit, (int, float))
            and predicted_profit < 0
        )

        negative_margin = (
            isinstance(profit_margin, (int, float))
            and profit_margin < 0
        )

        financial_loss = (
            negative_profit
            or negative_margin
            or "loss" in financial_status
        )

        if finance:

            findings.append({
                "category": "finance",
                "finding": (
                    "Forecast indicates a potential financial loss."
                    if financial_loss
                    else "Financial forecast received."
                ),
                "next_week_revenue": predicted_revenue,
                "next_week_net_profit": predicted_profit,
                "predicted_profit_margin_percent": profit_margin,
                "financial_status":
                    finance_prediction.get("financial_status"),
                "risk_level": finance_prediction.get("risk_level")
            })

            if financial_loss or finance_risk in {"high", "critical"}:

                self._add_recommendation(
                    recommendations,
                    "critical" if financial_loss else "high",
                    "financial_risk",
                    "The financial forecast indicates a potential loss or high risk.",
                    finance.get(
                        "recommended_action",
                        "Review revenue, operating costs, and the financial forecast."
                    ),
                    ["finance"]
                )

        # ====================================================
        # CROSS-AGENT REASONING
        # ====================================================

        # Sales decline + financial loss
        if sales and finance and declining_sales and financial_loss:

            findings.append({
                "category": "cross_agent",
                "finding": (
                    "Declining sales indicators and a predicted financial "
                    "loss require joint investigation."
                )
            })

            self._add_recommendation(
                recommendations,
                "critical",
                "sales_finance",
                "Sales decline and financial loss signals are present together.",
                (
                    "Review order trends, product-level margins, purchase costs, "
                    "freight, marketing, salaries, and rent. Validate actual results "
                    "before making major spending decisions."
                ),
                ["sales", "finance"]
            )

        # High customer risk + sales decline
        if customer and sales and customer_high_risk and declining_sales:

            findings.append({
                "category": "cross_agent",
                "finding": (
                    "High customer churn risk coincides with declining sales indicators."
                )
            })

            self._add_recommendation(
                recommendations,
                "high",
                "customer_sales",
                "Customer retention and sales performance need joint review.",
                (
                    "Identify valuable inactive customers and evaluate targeted "
                    "retention campaigns against repeat purchases and revenue."
                ),
                ["customer", "sales"]
            )

        # Inventory replenishment + financial loss
        if inventory and finance and reorder_required is True and financial_loss:

            findings.append({
                "category": "cross_agent",
                "finding": (
                    "Inventory replenishment is indicated while a financial loss "
                    "is forecast."
                )
            })

            self._add_recommendation(
                recommendations,
                "high",
                "inventory_finance",
                "Replenishment decisions should account for financial pressure.",
                (
                    "Prioritize essential and fast-moving stock. Check supplier "
                    "terms, cash availability, lead time, and forecast demand before "
                    "placing orders; do not postpone necessary stock automatically."
                ),
                ["inventory", "finance"]
            )

        # ====================================================
        # PRIORITIZE AND DEDUPLICATE
        # ====================================================

        recommendations.sort(
            key=lambda item: self.PRIORITY_ORDER.get(
                item["priority"], 4
            )
        )

        unique_recommendations = []
        seen = set()

        for recommendation in recommendations:

            key = (
                recommendation["category"],
                recommendation["issue"]
            )

            if key not in seen:
                seen.add(key)
                unique_recommendations.append(recommendation)

        # ====================================================
        # OVERALL STATUS
        # ====================================================

        successful_agents = [
            name for name in supplied_results
            if name in valid_results
        ]

        if not successful_agents:
            overall_status = "error"
            summary = "No valid agent predictions were available."

        elif any(
            item["priority"] == "critical"
            for item in unique_recommendations
        ):
            overall_status = "critical"
            summary = (
                "Critical business risks were identified. "
                "Review the highest-priority recommendations."
            )

        elif any(
            item["priority"] == "high"
            for item in unique_recommendations
        ):
            overall_status = "attention_required"
            summary = (
                "One or more high-priority business issues require review."
            )

        elif len(successful_agents) < 4:
            overall_status = "partial_success"
            summary = (
                "Some agent results are unavailable. Findings are based "
                "only on the agents that returned valid outputs."
            )

        else:
            overall_status = "normal"
            summary = (
                "No critical issue was identified from the available agent "
                "outputs. Continue monitoring business performance."
            )

        return {
            "agent": "decision_coordinator",
            "status": overall_status,
            "generated_at": datetime.now(timezone.utc).isoformat(),

            "business_summary": summary,

            "agent_execution": {
                "status": execution_status,
                "successful_agents": successful_agents,
                "failed_agents": list(self.agent_errors.keys()),
                "errors": self.agent_errors
            },

            "key_findings": findings,

            "priority_recommendations": unique_recommendations,

            "agent_outputs": valid_results,

            "limitations": [
                "Recommendations use rule-based coordination.",
                "Forecasts are predictions, not guaranteed outcomes.",
                "SHAP values are not calculated by this coordinator.",
                "Cross-agent patterns indicate signals to investigate, not proven causation."
            ]
        }

    # --------------------------------------------------------
    # 4. Run all four agents
    # --------------------------------------------------------

    def run(
        self,
        customer_data: Dict[str, Any],
        sales_query: str,
        inventory_data: Dict[str, Any],
        finance_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute the four existing agents with their actual inputs.

        customer_data: features required by customer_features.pkl
        sales_query: natural-language query for Sales Agent
        inventory_data: features required by inventory_features.pkl
        finance_data: features required by finance_features.pkl
        """

        # Lazy imports: one agent's model-loading failure will not
        # prevent the other agents from being attempted.
        agent_specs = [
            (
                "customer",
                "customer.customer_agent",
                "customer_agent",
                (customer_data,)
            ),
            (
                "sales",
                "sales.sales_agent",
                "sales_agent",
                (sales_query,)
            ),
            (
                "inventory",
                "inventory.inventory_agent",
                "inventory_agent",
                (inventory_data,)
            ),
            (
                "finance",
                "finance.finance_agent",
                "finance_agent",
                (finance_data,)
            )
        ]

        results = {}

        for name, module_name, function_name, args in agent_specs:

            try:
                import importlib

                module = importlib.import_module(module_name)
                function = getattr(module, function_name)

                results[name] = self._execute_agent(
                    name,
                    function,
                    *args
                )

            except Exception as exc:
                results[name] = {
                    "agent": name,
                    "execution_status": "error",
                    "error": {
                        "type": type(exc).__name__,
                        "message": str(exc)
                    }
                }

                self.agent_errors[name] = results[name]["error"]

        # Unwrap successful agent calls for cross-agent analysis.
        unwrapped = {}

        for name, execution in results.items():

            if execution.get("execution_status") == "success":
                unwrapped[name] = execution["result"]
            else:
                unwrapped[name] = None

        final_result = self.coordinate_results(
            customer_result=unwrapped.get("customer"),
            sales_result=unwrapped.get("sales"),
            inventory_result=unwrapped.get("inventory"),
            finance_result=unwrapped.get("finance")
        )

        # Preserve execution errors, including module import errors.
        for name, execution in results.items():

            if execution.get("execution_status") == "error":
                final_result["agent_execution"]["status"][name] = "error"
                final_result["agent_execution"]["errors"][name] = (
                    execution.get("error", {})
                )

        final_result["agent_execution"]["successful_agents"] = [
            name for name, execution in results.items()
            if execution.get("execution_status") == "success"
        ]

        final_result["agent_execution"]["failed_agents"] = [
            name for name, execution in results.items()
            if execution.get("execution_status") == "error"
        ]

        if final_result["agent_execution"]["failed_agents"]:
            if final_result["status"] == "normal":
                final_result["status"] = "partial_success"
                final_result["business_summary"] = (
                    "Some agents failed. Findings are based only on "
                    "the agents that returned valid outputs."
                )

        return final_result


# ============================================================
# EXAMPLE EXECUTION
# ============================================================

if __name__ == "__main__":

    # IMPORTANT:
    # Replace these sample dictionaries with valid input data.
    # Each dictionary must contain every feature required by
    # that agent's saved feature list.

    sample_customer_data = {
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

    sample_sales_query = "What will my revenue be next week?"

    sample_inventory_data = {
        "order_year": 2018,
        "order_month": 5,
        "monthly_sales": 1,
        "current_stock": 10,
        "reorder_level": 4,
        "lead_time_days": 4,
        "category": "perfumaria",
        "warehouse_location": "Hyderabad"
    }

    # This example must be updated if finance_features.pkl
    # contains different features.
    
    sample_finance_data = {
        "year": 2018,
        "month": 5,
        "quarter": 2,
        "week": 20,

        "weekly_revenue": 25000.00,
        "weekly_orders": 85,
        "total_qty_sold": 140,
        "weekly_freight_cost": 1800.00,
        "avg_order_value": 294.12,

        "purchase_cost": 12000.00,
        "marketing_cost": 1500.00,
        "salary_cost": 3000.00,
        "rent_cost": 2000.00,

        "gross_profit": 11200.00,
        "net_profit": 4700.00,

        "revenue_lag_1": 23500.00,
        "revenue_lag_2": 22000.00,
        "revenue_lag_3": 21000.00,

        "profit_lag_1": 4300.00,
        "profit_lag_2": 3900.00,
        "profit_lag_3": 3500.00,

        "orders_lag_1": 80,
        "orders_lag_2": 76,
        "orders_lag_3": 72,

        "rolling_revenue_4w": 22500.00,
        "rolling_profit_4w": 4100.00,
        "rolling_orders_4w": 78
    }


    coordinator = DecisionCoordinator()

    result = coordinator.run(
        customer_data=sample_customer_data,
        sales_query=sample_sales_query,
        inventory_data=sample_inventory_data,
        finance_data=sample_finance_data
    )

    print("\nINSIGHTIQ DECISION COORDINATOR RESULT\n")
    print(json.dumps(result, indent=4, ensure_ascii=False))
