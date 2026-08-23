from database import SessionLocal
from models.schemas import TransactionModel, ProductModel, FinanceModel

db = SessionLocal()

YEAR, MONTH = 2026, 8

rows = db.query(TransactionModel).filter(
    TransactionModel.order_year == YEAR,
    TransactionModel.order_month == "August"
).all()

total_freight_cost = sum(r.total_freight or 0.0 for r in rows)

purchase_cost = 0.0
for r in rows:
    product = db.query(ProductModel).filter(ProductModel.product_id == r.product_id).first()
    if product and product.purchase_price is not None:
        purchase_cost += product.purchase_price * (r.product_count or 0)

record = db.query(FinanceModel).filter(
    FinanceModel.order_year == YEAR,
    FinanceModel.order_month == MONTH
).first()

if not record:
    print("No finance record found — aborting.")
    db.close()
    exit()

print("BEFORE:")
print(f"  total_freight_cost={record.total_freight_cost}, purchase_cost={record.purchase_cost}")

record.total_freight_cost = total_freight_cost
record.purchase_cost = purchase_cost

db.commit()
db.refresh(record)

print("AFTER:")
print(f"  total_freight_cost={record.total_freight_cost}, purchase_cost={record.purchase_cost}")

db.close()
