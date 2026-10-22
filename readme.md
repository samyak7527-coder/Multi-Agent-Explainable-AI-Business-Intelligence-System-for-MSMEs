# AI Business Intelligence System for Small & Medium Businesses

## Project Overview

AI Business Intelligence System is an intelligent decision-support platform that helps small and medium businesses manage their sales, customers, inventory, and finances using Artificial Intelligence.

Instead of manually analyzing business reports, the system automatically predicts future trends and provides business recommendations.

The system also includes a Point of Sale (POS) Billing System that stores every sale in a centralized database.

---

# Main Features

### Smart POS Billing

- Product Search
- Automatic Product Details
- Customer Billing
- PDF Invoice Generation
- Automatic Database Storage

---

### Sales Prediction

Predict future monthly sales based on historical business transactions.

---

### Customer Analysis

Identify customers who are likely to stop purchasing and understand customer purchasing behavior.

---

### Inventory Management

Monitor available stock and predict future product demand.

---

### Finance Analysis

Estimate monthly revenue, expenses, gross profit and net profit.

---

# System Architecture

Customer
↓

POS Billing System

↓

SQLite Database

↓

Transactions

↓

AI Agents

├── Sales Agent

├── Customer Agent

├── Inventory Agent

└── Finance Agent

↓

Business Dashboard

---

# Technologies Used

Programming Language

- Python

Database

- SQLite

Machine Learning

- Scikit-Learn
- XGBoost

Backend

- FastAPI

Frontend

- HTML
- CSS
- JavaScript

Libraries

- Pandas
- NumPy
- Matplotlib
- Plotly
- ReportLab

---

# Project Structure

```
Business-AI-System/

│

├── backend/

├── frontend/

├── database/

│ └── business_ai.db

│

├── data/

│ ├── master_df.csv

│ ├── sales_df.csv

│ ├── customer_df.csv

│ ├── inventory_df.csv

│ └── finance_df.csv

│

├── models/

│ ├── sales_model.pkl

│ ├── customer_model.pkl

│ ├── inventory_model.pkl

│ └── finance_model.pkl

│

├── notebooks/

│

├── requirements.txt

│

└── README.md
```

---

# Database Tables

### Transactions

Stores every customer purchase generated from the POS system.

### Product Inventory

Stores product details such as stock, price, category and seller information.

### Finance Summary

Stores monthly business financial information.

---

# AI Models

## Sales Agent

Predicts future monthly sales.

## Customer Agent

Predicts customer churn and purchasing behavior.

## Inventory Agent

Predicts future product demand.

## Finance Agent

Predicts future business revenue and profit.

---

# Project Workflow

Businessman adds products

↓

Products stored in Product Inventory

↓

Cashier searches products

↓

Billing Generated

↓

PDF Invoice Created

↓

Transaction stored in Database

↓

Inventory Updated

↓

Finance Updated

↓

AI Models Analyze Data

↓

Business Recommendations Generated

---


# Team Responsibilities

### Data Engineering

- ETL
- Data Cleaning
- Feature Engineering

### Backend

- FastAPI
- SQLite
- POS APIs

### Sales AI

Sales Forecasting Model

### Customer AI

Customer Churn Model

### Inventory AI

Inventory Demand Forecasting

### Finance AI

Revenue & Profit Prediction

---

# Future Enhancements

- Barcode Scanner
- QR Code Billing
- WhatsApp Invoice
- Cloud Database
- Multi-Store Inventory
- Voice Assistant
- AI Chatbot for Business Queries
- Mobile Application

---

# Target Users

- Retail Shops
- Grocery Stores
- Medical Stores
- Electronics Shops
- Small Manufacturing Businesses
- Supermarkets

---
