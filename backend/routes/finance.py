# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.schemas import FinanceModel, FinanceCreate, FinanceResponse, FinanceCostsUpdate

router = APIRouter(prefix="/finance", tags=["Finance"])

@router.get("/", response_model=List[FinanceResponse])
def get_finance_records(db: Session = Depends(get_db)):
    return db.query(FinanceModel).all()

@router.post("/", response_model=FinanceResponse)
def create_finance_record(finance: FinanceCreate, db: Session = Depends(get_db)):
    data = finance.dict()
    data["order_quarter"] = (data["order_month"] - 1) // 3 + 1  # always derive server-side, never trust caller
    db_finance = FinanceModel(**data)
    db.add(db_finance)
    db.commit()
    db.refresh(db_finance)
    return db_finance

@router.get("/{order_year}/{order_month}", response_model=FinanceResponse)
def get_finance_record(order_year: int, order_month: int, db: Session = Depends(get_db)):
    record = db.query(FinanceModel).filter(
        FinanceModel.order_year == order_year,
        FinanceModel.order_month == order_month
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Finance record not found")
    return record

@router.patch("/{order_year}/{order_month}", response_model=FinanceResponse)
def update_finance_costs(order_year: int, order_month: int, payload: FinanceCostsUpdate, db: Session = Depends(get_db)):
    """
    Updates marketing/salary/rent cost for a given year+month.
    If no finance record exists yet for that month (e.g. no sales
    logged yet), creates one with just these cost fields set —
    revenue/profit fields stay null/0 until a sale populates them.
    """
    record = db.query(FinanceModel).filter(
        FinanceModel.order_year == order_year,
        FinanceModel.order_month == order_month
    ).first()

    if not record:
        record = FinanceModel(
            order_year=order_year,
            order_month=order_month,
            order_quarter=(order_month - 1) // 3 + 1,
        )
        db.add(record)

    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return record