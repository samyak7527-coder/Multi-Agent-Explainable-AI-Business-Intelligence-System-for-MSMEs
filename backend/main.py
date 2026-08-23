# pyrefly: ignore [missing-import]
from routes import customers
from routes import auth
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes import users, products, billing, finance

# Initialize SQLite tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Business AI API",
    description="Backend API services for business management",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include route modules
app.include_router(users.router)
app.include_router(products.router)
app.include_router(billing.router)
app.include_router(finance.router)
app.include_router(auth.router)
app.include_router(customers.router)


@app.get("/")
def root():
    return {"message": "Welcome to Business AI Backend API"}
