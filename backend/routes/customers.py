# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.schemas import TransactionModel, TransactionResponse

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("/phone/{phone}", response_model=List[TransactionResponse])
def get_transactions_by_phone(phone: str, db: Session = Depends(get_db)):
    transactions = db.query(TransactionModel).filter(
        TransactionModel.customer_phone == phone
    ).all()
    if not transactions:
        raise HTTPException(status_code=404, detail="No transactions found for this phone number")
    return transactions