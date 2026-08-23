from database import SessionLocal
from models.schemas import TransactionModel, ProductModel, FinanceModel

db = SessionLocal()

YEAR, MONTH = 2026, 8

rows = db.query(TransactionModel).filter(
    TransactionModel.order_year == YEAR,
    TransactionModel.order_month == "August"
).all()

order_ids = set(r.order_id for r in rows)
total_orders = len(order_ids)
total_qty_sold = sum(r.product_count or 0 for r in rows)
monthly_revenue = sum(r.total_price or 0.0 for r in rows)

gross_profit = 0.0
for r in rows:
    product = db.query(ProductModel).filter(ProductModel.product_id == r.product_id).first()
    if product and product.purchase_price is not None:
        cost = product.purchase_price * (r.product_count or 0)
        sell = product.selling_price * (r.product_count or 0)
        gross_profit += (sell - cost)
    else:
        print(f"WARNING: no purchase_price for {r.product_id}, skipped in cost calc")

record = db.query(FinanceModel).filter(
    FinanceModel.order_year == YEAR,
    FinanceModel.order_month == MONTH
).first()

if not record:
    print("No existing finance record found — nothing to reconcile against, aborting.")
    db.close()
    exit()

print("BEFORE:")
print(f"  monthly_revenue={record.monthly_revenue}, total_orders={record.total_orders}, "
      f"total_qty_sold={record.total_qty_sold}, gross_profit={record.gross_profit}, "
      f"net_profit={record.net_profit}, marketing_cost={record.marketing_cost}, "
      f"salary_cost={record.salary_cost}, rent_cost={record.rent_cost}")

record.monthly_revenue = monthly_revenue
record.total_orders = total_orders
record.total_qty_sold = total_qty_sold
record.gross_profit = gross_profit

# Reset test-junk cost fields to 0 (confirmed manually-added test values, not real)
record.marketing_cost = 0.0
record.salary_cost = 0
record.rent_cost = 0

record.net_profit = gross_profit - record.marketing_cost - record.salary_cost - record.rent_cost

db.commit()
db.refresh(record)

print("AFTER:")
print(f"  monthly_revenue={record.monthly_revenue}, total_orders={record.total_orders}, "
      f"total_qty_sold={record.total_qty_sold}, gross_profit={record.gross_profit}, "
      f"net_profit={record.net_profit}, marketing_cost={record.marketing_cost}, "
      f"salary_cost={record.salary_cost}, rent_cost={record.rent_cost}")

db.close()
