from database import SessionLocal
from models.schemas import FinanceModel

db = SessionLocal()
record = db.query(FinanceModel).filter(
    FinanceModel.order_year == 2099,
    FinanceModel.order_month == 5
).first()

if record:
    db.delete(record)
    db.commit()
    print("Deleted test row (2099, 5)")
else:
    print("No such row found")
db.close()
