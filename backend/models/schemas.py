from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, TIMESTAMP
from database import Base

# --- SQLAlchemy Models (match real DB tables) ---

class UserModel(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, index=True)
    username = Column(String)
    password = Column(String)
    full_name = Column(String)
    business_name = Column(String)
    phone_number = Column(String)
    email = Column(String)
    role = Column(String)

class ProductModel(Base):
    __tablename__ = "product_inventory"

    product_id = Column(String, primary_key=True, index=True)
    product_name = Column(String)
    category = Column(String)
    current_stock = Column(Integer)
    selling_price = Column(Float)
    purchase_price = Column(Float)
    seller_id = Column(String)
    warehouse_location = Column(String)

class TransactionModel(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(String, index=True)  # no longer unique — multiple rows can share one order_id
    customer_id = Column(String)
    customer_unique_id = Column(String)
    customer_name = Column(String)
    customer_phone = Column(String)
    customer_city = Column(String)
    customer_state = Column(String)
    product_id = Column(String)
    product_count = Column(Integer)
    product_categories = Column(String)
    order_status = Column(String)
    order_date = Column(TIMESTAMP)
    order_time = Column(String)
    order_year = Column(Integer)
    order_month = Column(String)
    order_quarter = Column(Integer)
    order_day_of_week = Column(String)
    total_items = Column(Float)
    total_price = Column(Float)
    total_freight = Column(Float)
    payment_value = Column(Float)
    payment_type = Column(String)
    review_score = Column(Float)
    discount = Column(Float)
    # NOTE: discount is intentionally NOT a column here. It's a
    # calculation-only field used to compute total_price server-side
    # at creation time, but never persisted. See routes/billing.py.

class FinanceModel(Base):
    __tablename__ = "finance"

    order_year = Column(Integer, primary_key=True)
    order_month = Column(Integer, primary_key=True)
    order_quarter = Column(Integer)
    monthly_revenue = Column(Float)
    total_orders = Column(Integer)
    total_qty_sold = Column(Float)
    total_freight_cost = Column(Float)
    purchase_cost = Column(Float)
    marketing_cost = Column(Float)
    salary_cost = Column(Integer)
    rent_cost = Column(Integer)
    gross_profit = Column(Float)
    net_profit = Column(Float)
    profit_margin = Column(Float)


# --- Pydantic Schemas ---

class UserBase(BaseModel):
    user_id: str
    username: str
    password: str
    full_name: str
    business_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = "user"

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    class Config:
        orm_mode = True

class ProductBase(BaseModel):
    product_id: str
    product_name: str
    category: Optional[str] = None
    current_stock: Optional[int] = 0
    selling_price: float
    purchase_price: Optional[float] = None
    seller_id: Optional[str] = None
    warehouse_location: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    category: Optional[str] = None
    current_stock: Optional[int] = None
    selling_price: Optional[float] = None
    purchase_price: Optional[float] = None
    seller_id: Optional[str] = None
    warehouse_location: Optional[str] = None

class ProductResponse(ProductBase):
    class Config:
        orm_mode = True
class TransactionBase(BaseModel):
    id: Optional[int] = None
    order_id: str
    customer_id: Optional[str] = None
    customer_unique_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_city: Optional[str] = None
    customer_state: Optional[str] = None
    product_id: str
    product_count: Optional[int] = None
    product_categories: Optional[str] = None
    order_status: Optional[str] = None
    order_date: Optional[datetime] = None
    order_time: Optional[str] = None
    order_year: Optional[int] = None
    order_month: Optional[str] = None
    order_quarter: Optional[int] = None
    order_day_of_week: Optional[str] = None
    total_items: Optional[float] = None
    total_price: float
    total_freight: Optional[float] = None
    payment_value: Optional[float] = None
    payment_type: Optional[str] = None
    review_score: Optional[float] = None
    discount: Optional[float] = None

class OrderItemIn(BaseModel):
    """One cart line item sent from the frontend."""
    product_id: str
    product_count: int
    product_categories: Optional[str] = None

class TransactionCreate(BaseModel):
    """
    Frontend sends the WHOLE cart in one request. Backend generates
    ONE order_id and creates one `transactions` row PER ITEM, all
    sharing that same order_id. Order-level fields (customer info,
    freight, discount, payment) apply once — see billing.py for how
    they're distributed across the item rows so SUM(total_price)
    over an order_id gives the correct order total (no double count).
    """
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_city: Optional[str] = None
    customer_state: Optional[str] = None
    items: List[OrderItemIn]
    total_freight: Optional[float] = 0.0
    discount: Optional[float] = 0.0
    payment_value: Optional[float] = None
    payment_type: Optional[str] = None
    review_score: Optional[float] = 5.0

class OrderStatusUpdate(BaseModel):
    order_status: str  # "processing" | "shipped" | "delivered"

class TransactionResponse(TransactionBase):
    class Config:
        orm_mode = True

class FinanceBase(BaseModel):
    order_year: int
    order_month: int
    order_quarter: Optional[int] = None
    monthly_revenue: Optional[float] = None
    total_orders: Optional[int] = None
    total_qty_sold: Optional[float] = None
    total_freight_cost: Optional[float] = None
    purchase_cost: Optional[float] = None
    marketing_cost: Optional[float] = None
    salary_cost: Optional[int] = None
    rent_cost: Optional[int] = None
    gross_profit: Optional[float] = None
    net_profit: Optional[float] = None
    profit_margin: Optional[float] = None

class FinanceCreate(FinanceBase):
    pass

class FinanceResponse(FinanceBase):
    class Config:
        orm_mode = True


# --- Auth Schemas ---

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    user_id: str
    username: str
    full_name: str
    business_name: Optional[str] = None
    role: Optional[str] = "user"

class FinanceCostsUpdate(BaseModel):
    marketing_cost: Optional[float] = None
    salary_cost: Optional[float] = None
    rent_cost: Optional[float] = None