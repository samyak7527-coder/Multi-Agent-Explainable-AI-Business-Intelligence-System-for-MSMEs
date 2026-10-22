# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.schemas import UserModel, UserCreate, UserResponse

from sqlalchemy.exc import IntegrityError

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(UserModel).all()

@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check for existing username
    existing_username = db.query(UserModel).filter(UserModel.username == user.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already exists. Please choose a different username.")

    # Check for existing user_id
    existing_id = db.query(UserModel).filter(UserModel.user_id == user.user_id).first()
    if existing_id:
        raise HTTPException(status_code=400, detail="User ID already exists. Please try registering again.")

    # Check for existing phone number if provided
    if user.phone_number:
        existing_phone = db.query(UserModel).filter(UserModel.phone_number == user.phone_number).first()
        if existing_phone:
            raise HTTPException(status_code=400, detail="Phone number is already associated with another account.")

    try:
        db_user = UserModel(**user.dict())
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="An account with these details already exists.")


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user