# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Query
# pyrefly: ignore [missing-import]
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from datetime import datetime
import os
import uuid
from database import get_db
from models.schemas import TransactionModel, TransactionCreate, TransactionResponse, ProductModel, FinanceModel, OrderStatusUpdate

router = APIRouter(prefix="/billing", tags=["Billing"])


def generate_order_id(db: Session) -> str:
    """
    Looks at all existing order_ids (format ORD001, ORD002, ...) and
    returns the next one, computed numerically. Called ONCE per checkout,
    not once per item, so multiple items in one cart share one order_id.
    """
    orders = db.query(TransactionModel.order_id).all()

    if not orders:
        return "ORD001"

    max_num = 0
    for (oid,) in orders:
        try:
            num = int(oid.replace("ORD", ""))
            max_num = max(max_num, num)
        except (ValueError, AttributeError):
            continue

    return f"ORD{max_num + 1:03d}"


@router.get("/", response_model=List[TransactionResponse])
def get_all_transactions(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """
    Returns flat rows (one per product line, same as before). Multiple
    rows can share the same order_id now — frontend groups them by
    order_id for display (see OrderHistoryView.jsx changes).
    """
    return (
        db.query(TransactionModel)
        .order_by(TransactionModel.order_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("/", response_model=List[TransactionResponse])
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    """
    Accepts the WHOLE cart (list of items) in one request.
    Creates ONE order_id, shared across N rows (one row per item),
    all inside one atomic DB transaction. If any item fails stock
    check, nothing is committed (full rollback).
    """
    if not transaction.items:
        raise HTTPException(status_code=400, detail="Cart must contain at least one item")

    # 1. Validate ALL items + stock BEFORE touching the DB (atomicity)
    products = {}
    for item in transaction.items:
        product = db.query(ProductModel).filter(ProductModel.product_id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product not found: {item.product_id}")
        if product.current_stock < item.product_count:
            raise HTTPException(
                status_code=400,
                detail=f"Not enough stock for {item.product_id} (have {product.current_stock}, need {item.product_count})"
            )
        products[item.product_id] = product

    # 2. Resolve customer_id from phone number (reuse if found, else new)
    existing_customer = db.query(TransactionModel).filter(
        TransactionModel.customer_phone == transaction.customer_phone
    ).first()

    if existing_customer:
        customer_id = existing_customer.customer_id
        customer_unique_id = existing_customer.customer_unique_id
    else:
        customer_id = uuid.uuid4().hex
        customer_unique_id = uuid.uuid4().hex

    # 3. Generate ONE order_id for the whole cart
    now = datetime.utcnow()
    new_order_id = generate_order_id(db)

    freight = transaction.total_freight or 0.0
    discount = transaction.discount or 0.0

    created_rows = []
    order_gross_total = 0.0
    order_qty_total = 0

    # 4. Deduct stock + build one row per item
    for idx, item in enumerate(transaction.items):
        product = products[item.product_id]
        product.current_stock -= item.product_count

        gross_amount = product.selling_price * item.product_count
        order_gross_total += gross_amount
        order_qty_total += item.product_count

        # Freight/discount are ORDER-level, not per-item — apply them
        # ONLY to the first row so SUM(total_price) across the order_id
        # doesn't double-count them. Same for payment_value.
        is_first_row = (idx == 0)
        row_freight = freight if is_first_row else 0.0
        row_discount = discount if is_first_row else 0.0
        row_payment_value = transaction.payment_value if is_first_row else 0.0

        # Formula: (gross - discount) + freight
        row_total_price = (gross_amount - row_discount) + row_freight

        db_row = TransactionModel(
            order_id=new_order_id,
            customer_id=customer_id,
            customer_unique_id=customer_unique_id,
            customer_name=transaction.customer_name,
            customer_phone=transaction.customer_phone,
            customer_city=transaction.customer_city,
            customer_state=transaction.customer_state,
            product_id=item.product_id,
            product_count=item.product_count,
            product_categories=item.product_categories,
            order_status="processing",
            order_date=now,
            order_time=now.strftime("%H:%M:%S"),
            order_year=now.year,
            order_month=now.strftime("%B"),
            order_quarter=(now.month - 1) // 3 + 1,
            order_day_of_week=now.strftime("%A"),
            total_items=float(item.product_count),
            total_price=row_total_price,
            total_freight=row_freight,
            payment_value=row_payment_value,
            payment_type=transaction.payment_type,
            review_score=transaction.review_score,
            discount=row_discount,
        )
        db.add(db_row)
        created_rows.append(db_row)

    # 5. Update or create finance record for this month/year — ONCE per order
    year, month = now.year, now.month

    finance_record = db.query(FinanceModel).filter(
        FinanceModel.order_year == year,
        FinanceModel.order_month == month
    ).first()

    # Formula: (gross - discount) + freight
    order_total_price = (order_gross_total - discount) + freight
    total_purchase_cost = sum(
        (products[item.product_id].purchase_price or 0) * item.product_count
        for item in transaction.items
    )
    order_profit = order_total_price - total_purchase_cost

    if finance_record:
        finance_record.monthly_revenue = (finance_record.monthly_revenue or 0) + order_total_price
        finance_record.total_orders = (finance_record.total_orders or 0) + 1
        finance_record.total_qty_sold = (finance_record.total_qty_sold or 0) + order_qty_total
        finance_record.gross_profit = (finance_record.gross_profit or 0) + order_profit
        finance_record.net_profit = (finance_record.net_profit or 0) + order_profit
        finance_record.total_freight_cost = (finance_record.total_freight_cost or 0) + freight
        finance_record.purchase_cost = (finance_record.purchase_cost or 0) + total_purchase_cost
    else:
        finance_record = FinanceModel(
            order_year=year,
            order_month=month,
            order_quarter=(month - 1) // 3 + 1,
            monthly_revenue=order_total_price,
            total_orders=1,
            total_qty_sold=order_qty_total,
            gross_profit=order_profit,
            net_profit=order_profit,
            total_freight_cost=freight,
            purchase_cost=total_purchase_cost
        )
        db.add(finance_record)

    # 6. Commit everything together — atomic
    db.commit()
    for row in created_rows:
        db.refresh(row)

    return created_rows


@router.get("/{order_id}", response_model=List[TransactionResponse])
def get_transaction(order_id: str, db: Session = Depends(get_db)):
    """Returns ALL rows (all product lines) belonging to this order_id."""
    rows = db.query(TransactionModel).filter(TransactionModel.order_id == order_id).all()
    if not rows:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return rows


@router.get("/{order_id}/invoice")
def get_invoice(
    order_id: str,
    business_name: Optional[str] = Query(None),
    business_phone: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    rows = db.query(TransactionModel).filter(TransactionModel.order_id == order_id).all()
    if not rows:
        raise HTTPException(status_code=404, detail="Transaction not found")

    header = rows[0]  # customer/order info is identical across all rows in the order

    os.makedirs("invoices", exist_ok=True)
    file_path = f"invoices/invoice_{order_id}.pdf"

    doc = SimpleDocTemplate(file_path, pagesize=A4, topMargin=20*mm, bottomMargin=20*mm)
    styles = getSampleStyleSheet()
    elements = []

    # --- Header: business name + phone, centered ---
    header_style = ParagraphStyle("HeaderStyle", parent=styles["Title"], alignment=TA_CENTER, fontSize=20)
    subheader_style = ParagraphStyle("SubHeaderStyle", parent=styles["Normal"], alignment=TA_CENTER, fontSize=11, textColor=colors.grey)

    elements.append(Paragraph(business_name or "Business AI", header_style))
    elements.append(Paragraph(business_phone or "-", subheader_style))
    elements.append(Spacer(1, 12))

    # --- Customer details (left) + Order details (right), side by side ---
    customer_lines = [
        f"Customer ID: {header.customer_id or '-'}",
        f"Name: {header.customer_name or '-'}",
        f"Phone: {header.customer_phone or '-'}",
        f"City/State: {(header.customer_city or '-')}, {(header.customer_state or '-')}",
    ]
    order_lines = [
        f"Order ID: {header.order_id}",
        f"Order Date: {header.order_date.strftime('%d-%m-%Y') if header.order_date else '-'}",
        f"Order Time: {header.order_time or '-'}",
    ]

    max_lines = max(len(customer_lines), len(order_lines))
    customer_lines += [""] * (max_lines - len(customer_lines))
    order_lines += [""] * (max_lines - len(order_lines))

    detail_data = [[Paragraph(c, styles["Normal"]), Paragraph(o, styles["Normal"])] for c, o in zip(customer_lines, order_lines)]
    detail_table = Table(detail_data, colWidths=[95*mm, 75*mm])
    detail_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
    ]))
    elements.append(detail_table)
    elements.append(Spacer(1, 16))

    # --- Product table: ONE ROW PER ITEM IN THE ORDER ---
    product_header = ["Product ID", "Product Name", "Category", "Qty", "Selling Price", "Amount"]
    table_rows = [product_header]

    gross_total = 0.0
    for row in rows:
        product = db.query(ProductModel).filter(ProductModel.product_id == row.product_id).first()
        selling_price = product.selling_price if product else 0
        amount = selling_price * (row.product_count or 0)
        gross_total += amount

        table_rows.append([
            row.product_id,
            product.product_name if product else row.product_id,
            product.category if product else "-",
            str(row.product_count or 0),
            f"Rs. {selling_price:.2f}",
            f"Rs. {amount:.2f}",
        ])

    product_table = Table(table_rows, colWidths=[25*mm, 40*mm, 30*mm, 15*mm, 30*mm, 30*mm])
    product_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f2f2f2")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (3, 0), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dddddd")),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(product_table)
    elements.append(Spacer(1, 16))

    # --- Totals block: sum across ALL rows in the order ---
    freight = sum((r.total_freight or 0.0) for r in rows)
    discount = sum((r.discount or 0.0) for r in rows)
    order_total = sum((r.total_price or 0.0) for r in rows)

    totals_data = [
        ["Gross", f"Rs. {gross_total:.2f}"],
        ["Freight Cost", f"Rs. {freight:.2f}"],
        ["Discount", f"Rs. {discount:.2f}"],
        ["Total Amount", f"Rs. {order_total:.2f}"],
    ]
    totals_table = Table(totals_data, colWidths=[130*mm, 40*mm])
    totals_table.setStyle(TableStyle([
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, -1), (-1, -1), 11),
        ("LINEABOVE", (0, -1), (-1, -1), 0.75, colors.black),
        ("TOPPADDING", (0, -1), (-1, -1), 8),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 30))

    doc.build(elements)

    return FileResponse(file_path, media_type="application/pdf", filename=f"invoice_{order_id}.pdf")


@router.patch("/{order_id}/status", response_model=List[TransactionResponse])
def update_order_status(order_id: str, status_update: OrderStatusUpdate, db: Session = Depends(get_db)):
    """Updates status on ALL rows sharing this order_id (all products in the order)."""
    rows = db.query(TransactionModel).filter(TransactionModel.order_id == order_id).all()
    if not rows:
        raise HTTPException(status_code=404, detail="Transaction not found")

    valid_statuses = {"processing", "shipped", "delivered"}
    if status_update.order_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"order_status must be one of {valid_statuses}")

    for row in rows:
        row.order_status = status_update.order_status

    db.commit()
    for row in rows:
        db.refresh(row)
    return rows