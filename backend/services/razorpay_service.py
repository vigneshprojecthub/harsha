"""
Razorpay integration service.
Handles: create order, verify payment signature, fetch payment details.
"""

import hmac
import hashlib
import os
from decimal import Decimal

import razorpay

RAZORPAY_KEY_ID     = os.getenv("RAZORPAY_KEY_ID",     "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET",  "")


def _client():
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise ValueError(
            "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env"
        )
    return razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


def create_razorpay_order(amount_inr: Decimal, order_number: str, customer_name: str, customer_email: str = "") -> dict:
    """
    Create a Razorpay order.
    amount_inr — total in rupees (will be converted to paise).
    Returns the Razorpay order dict (contains 'id', 'amount', 'currency', etc.)
    """
    client = _client()
    amount_paise = int(amount_inr * 100)

    rz_order = client.order.create({
        "amount":   amount_paise,
        "currency": "INR",
        "receipt":  order_number[:40],   # max 40 chars
        "notes": {
            "customer_name":  customer_name,
            "customer_email": customer_email or "",
        },
        "payment_capture": 1,   # auto-capture
    })
    return rz_order


def verify_payment_signature(
    razorpay_order_id:   str,
    razorpay_payment_id: str,
    razorpay_signature:  str,
) -> bool:
    """
    HMAC-SHA256 verification as required by Razorpay docs.
    Returns True if signature is valid.
    """
    secret = RAZORPAY_KEY_SECRET.encode("utf-8")
    message = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
    expected = hmac.new(secret, message, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, razorpay_signature)


def fetch_payment_details(razorpay_payment_id: str) -> dict:
    """Fetch full payment object from Razorpay (method, captured, etc.)"""
    client = _client()
    return client.payment.fetch(razorpay_payment_id)


def get_key_id() -> str:
    return RAZORPAY_KEY_ID
