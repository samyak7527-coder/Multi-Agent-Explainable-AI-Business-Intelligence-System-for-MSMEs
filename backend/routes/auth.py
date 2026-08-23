# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.schemas import UserModel, LoginRequest, LoginResponse

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(
        UserModel.username == payload.username
    ).first()

    if not user or user.password != payload.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return LoginResponse(
        user_id=user.user_id,
        username=user.username,
        full_name=user.full_name,
        business_name=user.business_name,
        role=user.role
    )