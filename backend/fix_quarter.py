from database import SessionLocal
from models.schemas import FinanceModel

db = SessionLocal()
record = db.query(FinanceModel).filter(
    FinanceModel.order_year == 2026,
    FinanceModel.order_month == 8
).first()

record.order_quarter = (8 - 1) // 3 + 1  # = 3
db.commit()
print("Fixed. order_quarter is now:", record.order_quarter)
db.close()
