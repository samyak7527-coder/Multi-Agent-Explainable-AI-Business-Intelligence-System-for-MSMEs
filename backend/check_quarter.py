from database import SessionLocal
from models.schemas import FinanceModel

db = SessionLocal()
record = db.query(FinanceModel).filter(
    FinanceModel.order_year == 2026,
    FinanceModel.order_month == 8
).first()

print("order_year:", record.order_year)
print("order_month:", record.order_month)
print("order_quarter:", record.order_quarter)
print("monthly_revenue:", record.monthly_revenue)
print("total_orders:", record.total_orders)
db.close()
