"""
WhatsApp Business API webhook handler.
Integrates with Meta's Cloud API (free tier).

Flow:
  1. Meta sends webhook POST to /api/whatsapp/webhook
  2. We parse the message
  3. Match against reply rules
  4. Send response via Cloud API

Setup: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
"""

import os
import httpx
import re
from typing import Optional

WA_TOKEN       = os.getenv("WHATSAPP_API_TOKEN", "")
WA_PHONE_ID    = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
WA_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "harsha_gallery_verify_2025")
WA_API_VERSION = "v19.0"
WA_BASE        = f"https://graph.facebook.com/{WA_API_VERSION}/{WA_PHONE_ID}/messages"


# ── Auto-reply rule engine ────────────────────────────────────────────────────

GREETINGS = ["hi", "hello", "hey", "hii", "namaste", "hai"]
ORDER_KW   = ["order", "status", "track", "where", "delivered", "shipped"]
PRICE_KW   = ["price", "cost", "rate", "how much", "charges", "pricing"]
CUSTOM_KW  = ["custom", "customize", "design", "stitch", "embroider"]
CATALOG_KW = ["catalogue", "catalog", "products", "collection", "work", "show"]
TIMING_KW  = ["days", "time", "when", "deliver", "how long", "timeline"]

BUSINESS_PHONE  = os.getenv("WHATSAPP_NUMBER", "919876543210")
WEBSITE_URL     = os.getenv("PUBLIC_FRONTEND_URL", "http://localhost:5173")

def _matches(text: str, keywords: list) -> bool:
    t = text.lower()
    return any(kw in t for kw in keywords)

def get_auto_reply(incoming_text: str, sender_phone: str, order_number: Optional[str] = None) -> str:
    """
    Rule-based auto-reply. Returns None if no rule matches
    (allowing human takeover).
    """
    text = incoming_text.strip().lower()

    if _matches(text, GREETINGS) and len(text) < 30:
        return (
            "🙏 *Namaste! Welcome to Harsha Art Gallery*\n\n"
            "We create premium handcrafted embroidery — Aari Work, Thread Embroidery, "
            "Bead Work, Sequence Work & Wedding Frames.\n\n"
            "How can we help you today? Reply with:\n"
            "1️⃣ *ORDER* — Track your order\n"
            "2️⃣ *PRICE* — Pricing & quotes\n"
            "3️⃣ *CUSTOM* — Custom order request\n"
            "4️⃣ *CATALOG* — View our collection\n"
            "5️⃣ *TIMING* — Delivery timelines\n\n"
            "_Our team will respond within 30 minutes_ ⏰"
        )

    if _matches(text, ORDER_KW):
        tracking_url = f"{WEBSITE_URL}/my-orders?phone={sender_phone}"
        return (
            "📦 *Order Tracking*\n\n"
            f"Track your order status here:\n{tracking_url}\n\n"
            "Or reply with your *Order Number* (e.g. HAG-250601-ABC123) "
            "and we'll give you an instant update! 🚀"
        )

    if _matches(text, PRICE_KW):
        return (
            "💰 *Our Pricing*\n\n"
            "Prices vary by complexity and size:\n\n"
            "🪡 Aari Work Blouse — ₹1,500 to ₹5,000\n"
            "🧵 Thread Embroidery — ₹800 to ₹3,000\n"
            "💎 Bead Work Border — ₹2,000 to ₹6,000\n"
            "✨ Sequence Work — ₹1,200 to ₹8,000\n"
            "🖼 Wedding Frame — ₹1,500 to ₹3,500\n\n"
            "For an exact quote, share your design reference and size. "
            f"Browse our catalog: {WEBSITE_URL}/products"
        )

    if _matches(text, CUSTOM_KW):
        return (
            "✏️ *Custom Order Request*\n\n"
            "We love creating one-of-a-kind pieces! Here's how it works:\n\n"
            "1. Share your *reference image* or describe your design\n"
            "2. We'll send you a quote within 2 hours\n"
            "3. Confirm & make a 50% advance payment\n"
            "4. We'll keep you updated with *progress photos*\n\n"
            f"Or use our AI preview tool: {WEBSITE_URL}/ai-preview\n\n"
            "Please share your design reference now! 🎨"
        )

    if _matches(text, CATALOG_KW):
        return (
            "🎨 *Harsha Art Gallery Collections*\n\n"
            f"View our full catalog here: {WEBSITE_URL}/products\n\n"
            "Categories:\n"
            "🪡 Aari Work\n"
            "🧵 Thread Embroidery\n"
            "💎 Bead Work\n"
            "✨ Sequence Work\n"
            "🖼 Wedding Frames\n\n"
            "All pieces can be customized! 💛"
        )

    if _matches(text, TIMING_KW):
        return (
            "⏰ *Delivery Timelines*\n\n"
            "🏃 Express (7–10 days) — Simple embroidery\n"
            "📅 Standard (15–21 days) — Bridal & complex work\n"
            "🎁 Custom (21–30 days) — Heavy embroidery & wedding items\n\n"
            "We ship pan-India via courier with tracking. "
            "International orders available on request.\n\n"
            "We always deliver *on or before* the promised date! 🤝"
        )

    # Check for order number pattern
    order_pattern = re.search(r'HAG-\d{6}-[A-Z0-9]+', incoming_text.upper())
    if order_pattern:
        order_num = order_pattern.group()
        tracking_url = f"{WEBSITE_URL}/track"
        return (
            f"🔍 *Order: {order_num}*\n\n"
            f"Track your order live: {tracking_url}\n\n"
            "Our team has been notified and will update you shortly! 🙏"
        )

    # No rule matched → human takeover prompt
    return None


# ── Meta Cloud API sender ─────────────────────────────────────────────────────

async def send_whatsapp_message(to_phone: str, message: str) -> bool:
    """Send a text message via Meta WhatsApp Cloud API."""
    if not WA_TOKEN or not WA_PHONE_ID:
        print(f"[whatsapp_bot] Not configured — would send to {to_phone}: {message[:60]}…")
        return False

    # Normalise phone
    phone = to_phone.replace("+", "").replace(" ", "").replace("-", "")
    if not phone.startswith("91"):
        phone = "91" + phone

    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {"body": message, "preview_url": True},
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                WA_BASE,
                json=payload,
                headers={
                    "Authorization": f"Bearer {WA_TOKEN}",
                    "Content-Type": "application/json",
                }
            )
            resp.raise_for_status()
            print(f"[whatsapp_bot] Sent to {phone}: {resp.status_code}")
            return True
    except Exception as e:
        print(f"[whatsapp_bot] Send failed: {e}")
        return False


async def send_order_status_whatsapp(phone: str, order_number: str, status_label: str,
                                      notes: Optional[str], tracking_token: Optional[str]) -> bool:
    icon_map = {
        "Order Placed": "📋", "Design Approval": "✏️",
        "Embroidery Started": "🪡", "In Progress": "⚙️",
        "Quality Check": "🔍", "Packed": "📦",
        "Shipped": "🚚", "Delivered": "🎉",
    }
    icon = icon_map.get(status_label, "📌")
    msg = (
        f"{icon} *Harsha Art Gallery — Order Update*\n\n"
        f"Your order *{order_number}* is now:\n"
        f"➡️ *{status_label}*\n"
    )
    if notes:
        msg += f"\n📝 {notes}\n"
    if tracking_token:
        msg += f"\n🔗 Track live: {WEBSITE_URL}/track/{tracking_token}"
    return await send_whatsapp_message(phone, msg)


async def send_abandoned_cart_reminder(phone: str, name: str, cart_items: list,
                                        total: float, coupon_code: Optional[str] = None) -> bool:
    items_text = "\n".join(f"  • {i.get('product_name','Item')} × {i.get('quantity',1)}" for i in cart_items[:3])
    if len(cart_items) > 3:
        items_text += f"\n  • …and {len(cart_items)-3} more"

    msg = (
        f"👋 Hi {name or 'there'}!\n\n"
        "You left something beautiful behind at Harsha Art Gallery 🪡\n\n"
        f"*Your cart:*\n{items_text}\n"
        f"💰 Total: ₹{total:,.0f}\n\n"
    )
    if coupon_code:
        msg += f"🎁 Use code *{coupon_code}* for an extra 10% off!\n\n"
    msg += f"Complete your order: {WEBSITE_URL}/checkout\n\n_Limited availability — artisan slots fill up fast!_ 🙏"
    return await send_whatsapp_message(phone, msg)
