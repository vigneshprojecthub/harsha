"""
Analytics computation service.
Queries the DB directly — no third-party required.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, text, desc, and_
from datetime import datetime, timedelta, timezone
from typing import Optional
from models.order import Order, OrderItem, Payment
from models.phase5 import AnalyticsEvent, Review, Coupon, CouponUsage


def get_sales_overview(db: Session, days: int = 30) -> dict:
    since = datetime.now(timezone.utc) - timedelta(days=days)

    total_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.status.notin_(["cancelled", "pending"]),
        Order.created_at >= since
    ).scalar() or 0

    total_orders = db.query(func.count(Order.id)).filter(
        Order.created_at >= since,
        Order.status.notin_(["cancelled"])
    ).scalar() or 0

    confirmed_orders = db.query(func.count(Order.id)).filter(
        Order.created_at >= since,
        Order.status.notin_(["cancelled", "pending"])
    ).scalar() or 0

    avg_order_value = float(total_revenue) / confirmed_orders if confirmed_orders else 0

    # Previous period for delta
    prev_since = since - timedelta(days=days)
    prev_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.status.notin_(["cancelled", "pending"]),
        Order.created_at >= prev_since,
        Order.created_at < since
    ).scalar() or 0

    revenue_delta = (
        ((float(total_revenue) - float(prev_revenue)) / float(prev_revenue) * 100)
        if prev_revenue else 0
    )

    return {
        "total_revenue":    round(float(total_revenue), 2),
        "total_orders":     total_orders,
        "confirmed_orders": confirmed_orders,
        "avg_order_value":  round(avg_order_value, 2),
        "revenue_delta_pct": round(revenue_delta, 1),
        "period_days":      days,
    }


def get_daily_revenue(db: Session, days: int = 30) -> list:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = db.execute(text("""
        SELECT DATE(created_at AT TIME ZONE 'Asia/Kolkata') AS day,
               COUNT(*) AS orders,
               COALESCE(SUM(total_amount), 0) AS revenue
        FROM orders
        WHERE created_at >= :since
          AND status NOT IN ('cancelled', 'pending')
        GROUP BY day ORDER BY day
    """), {"since": since}).fetchall()

    return [
        {"date": str(r[0]), "orders": r[1], "revenue": float(r[2])}
        for r in rows
    ]


def get_top_products(db: Session, limit: int = 10) -> list:
    rows = db.query(
        OrderItem.product_name,
        OrderItem.product_category,
        func.sum(OrderItem.quantity).label("total_qty"),
        func.sum(OrderItem.line_total).label("total_revenue"),
        func.count(OrderItem.order_id.distinct()).label("order_count"),
    ).group_by(OrderItem.product_name, OrderItem.product_category)\
     .order_by(desc("total_revenue"))\
     .limit(limit).all()

    return [
        {
            "product_name":     r.product_name,
            "category":         r.product_category,
            "total_qty":        int(r.total_qty),
            "total_revenue":    round(float(r.total_revenue), 2),
            "order_count":      r.order_count,
        }
        for r in rows
    ]


def get_top_customers(db: Session, limit: int = 10) -> list:
    rows = db.query(
        Order.customer_name,
        Order.customer_phone,
        func.count(Order.id).label("order_count"),
        func.sum(Order.total_amount).label("total_spent"),
    ).filter(Order.status.notin_(["cancelled"]))\
     .group_by(Order.customer_name, Order.customer_phone)\
     .order_by(desc("total_spent"))\
     .limit(limit).all()

    return [
        {
            "name":         r.customer_name,
            "phone":        r.customer_phone[-4:].rjust(10, "*") if r.customer_phone else "—",
            "order_count":  r.order_count,
            "total_spent":  round(float(r.total_spent), 2),
        }
        for r in rows
    ]


def get_conversion_funnel(db: Session, days: int = 30) -> dict:
    since = datetime.now(timezone.utc) - timedelta(days=days)

    def count_event(event_type):
        return db.query(func.count(AnalyticsEvent.id)).filter(
            AnalyticsEvent.event_type == event_type,
            AnalyticsEvent.created_at >= since
        ).scalar() or 0

    views     = count_event("product_view")
    add_cart  = count_event("add_to_cart")
    checkout  = count_event("checkout_start")
    payment   = count_event("payment_start")
    complete  = count_event("order_complete")

    def pct(num, den): return round(num / den * 100, 1) if den else 0

    return {
        "product_views":    views,
        "add_to_cart":      add_cart,
        "checkout_start":   checkout,
        "payment_start":    payment,
        "order_complete":   complete,
        "view_to_cart":     pct(add_cart, views),
        "cart_to_checkout": pct(checkout, add_cart),
        "checkout_to_pay":  pct(payment, checkout),
        "pay_to_complete":  pct(complete, payment),
        "overall":          pct(complete, views),
    }


def get_category_breakdown(db: Session) -> list:
    rows = db.query(
        OrderItem.product_category,
        func.sum(OrderItem.line_total).label("revenue"),
        func.count(OrderItem.id).label("items_sold"),
    ).group_by(OrderItem.product_category)\
     .order_by(desc("revenue")).all()

    total = sum(float(r.revenue) for r in rows) or 1
    return [
        {
            "category": r.product_category or "Uncategorized",
            "revenue":  round(float(r.revenue), 2),
            "items_sold": r.items_sold,
            "pct":      round(float(r.revenue) / total * 100, 1),
        }
        for r in rows
    ]


def get_review_summary(db: Session) -> dict:
    total  = db.query(func.count(Review.id)).filter(Review.is_published == True).scalar() or 0
    avg    = db.query(func.avg(Review.rating)).filter(Review.is_published == True).scalar() or 0
    dist   = {}
    for star in range(1, 6):
        dist[star] = db.query(func.count(Review.id)).filter(
            Review.rating == star, Review.is_published == True
        ).scalar() or 0
    return {
        "total_reviews": total,
        "avg_rating":    round(float(avg), 2),
        "distribution":  dist,
    }


def get_coupon_performance(db: Session) -> list:
    rows = db.query(
        Coupon.code,
        Coupon.campaign,
        Coupon.total_used,
        func.sum(CouponUsage.discount_given).label("total_discount"),
    ).outerjoin(CouponUsage).group_by(Coupon.id)\
     .order_by(desc(Coupon.total_used)).all()

    return [
        {
            "code":           r.code,
            "campaign":       r.campaign,
            "total_used":     r.total_used,
            "total_discount": round(float(r.total_discount or 0), 2),
        }
        for r in rows
    ]
