"""
Notification service: email via SMTP + WhatsApp via wa.me deep-link.
Email uses Python's built-in smtplib (no third-party required).
For production, swap SMTP credentials for SendGrid / AWS SES / Mailgun.
"""

import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from typing import Optional
from decimal import Decimal


# ── Config (set in .env) ──────────────────────────────────────────────────────
SMTP_HOST     = os.getenv("SMTP_HOST",     "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER     = os.getenv("SMTP_USER",     "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL    = os.getenv("FROM_EMAIL",    "Harsha Art Gallery <harsha@artgallery.com>")
WHATSAPP_NUM  = os.getenv("WHATSAPP_NUMBER", "919876543210")


# ── HTML email template ───────────────────────────────────────────────────────
def _order_confirmation_html(order, invoice) -> str:
    items_html = "".join(
        f"""
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f0e9d4;">{item.product_name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0e9d4;text-align:center;">{item.quantity}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0e9d4;text-align:right;">
            ₹{float(item.unit_price):,.2f}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0e9d4;text-align:right;font-weight:600;">
            ₹{float(item.line_total):,.2f}
          </td>
        </tr>
        """
        for item in order.items
    )

    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ec;font-family:'Lato',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#1a1510;padding:32px 40px;text-align:center;">
            <div style="font-size:24px;font-weight:700;color:#fff;letter-spacing:1px;">✨ Harsha Art Gallery</div>
            <div style="font-size:11px;color:#c8860f;letter-spacing:3px;margin-top:4px;text-transform:uppercase;">Premium Handcrafted Embroidery</div>
          </td>
        </tr>

        <!-- Hero message -->
        <tr>
          <td style="background:linear-gradient(135deg,#c8860f,#e8be4a);padding:28px 40px;text-align:center;">
            <div style="font-size:28px;margin-bottom:8px;">🎉</div>
            <div style="font-size:22px;font-weight:700;color:#fff;">Order Confirmed!</div>
            <div style="font-size:14px;color:rgba(255,255,255,0.85);margin-top:6px;">
              Thank you, {order.customer_name}. Your handcrafted journey begins now.
            </div>
          </td>
        </tr>

        <!-- Order meta -->
        <tr>
          <td style="padding:32px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:50%;vertical-align:top;">
                  <div style="font-size:10px;color:#9a9080;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Order Number</div>
                  <div style="font-size:16px;font-weight:700;color:#1a1510;">{order.order_number}</div>
                </td>
                <td style="width:50%;vertical-align:top;text-align:right;">
                  <div style="font-size:10px;color:#9a9080;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Invoice</div>
                  <div style="font-size:16px;font-weight:700;color:#1a1510;">{invoice.invoice_number}</div>
                </td>
              </tr>
            </table>
            <hr style="border:none;border-top:1px solid #f0e9d4;margin:20px 0;">
          </td>
        </tr>

        <!-- Items table -->
        <tr>
          <td style="padding:0 40px;">
            <div style="font-size:10px;color:#9a9080;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;">Your Order</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <thead>
                <tr style="background:#1a1510;">
                  <th style="padding:10px 12px;text-align:left;font-size:11px;color:#fff;font-weight:600;">Item</th>
                  <th style="padding:10px 12px;text-align:center;font-size:11px;color:#fff;font-weight:600;">Qty</th>
                  <th style="padding:10px 12px;text-align:right;font-size:11px;color:#fff;font-weight:600;">Price</th>
                  <th style="padding:10px 12px;text-align:right;font-size:11px;color:#fff;font-weight:600;">Total</th>
                </tr>
              </thead>
              <tbody>{items_html}</tbody>
            </table>

            <!-- Totals -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
              <tr>
                <td style="font-size:13px;color:#6b6060;padding:4px 0;">Subtotal</td>
                <td style="font-size:13px;color:#1a1510;text-align:right;padding:4px 0;">₹{float(invoice.subtotal):,.2f}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#6b6060;padding:4px 0;">GST ({invoice.tax_rate:.0f}%)</td>
                <td style="font-size:13px;color:#1a1510;text-align:right;padding:4px 0;">₹{float(invoice.tax_amount):,.2f}</td>
              </tr>
              {"<tr><td style='font-size:13px;color:#6b6060;padding:4px 0;'>Shipping</td><td style='font-size:13px;color:#1a1510;text-align:right;padding:4px 0;'>₹" + f"{float(invoice.shipping_amount):,.2f}" + "</td></tr>" if float(invoice.shipping_amount) else ""}
              <tr>
                <td colspan="2"><hr style="border:none;border-top:1px solid #f0e9d4;margin:8px 0;"></td>
              </tr>
              <tr>
                <td style="font-size:16px;font-weight:700;color:#1a1510;padding:4px 0;">Grand Total</td>
                <td style="font-size:18px;font-weight:700;color:#c8860f;text-align:right;padding:4px 0;">₹{float(invoice.total_amount):,.2f}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Shipping address -->
        <tr>
          <td style="padding:28px 40px 0;">
            <hr style="border:none;border-top:1px solid #f0e9d4;margin:0 0 20px;">
            <div style="font-size:10px;color:#9a9080;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Shipping To</div>
            <div style="font-size:13px;color:#1a1510;line-height:1.7;">
              <strong>{order.customer_name}</strong><br>
              {order.address_line1}{"<br>" + order.address_line2 if order.address_line2 else ""}<br>
              {order.city}, {order.state} - {order.pincode}<br>
              {order.country}
            </div>
          </td>
        </tr>

        <!-- What's next -->
        <tr>
          <td style="padding:24px 40px;">
            <div style="background:#f8f4ec;border-radius:12px;padding:20px;">
              <div style="font-size:12px;font-weight:700;color:#1a1510;margin-bottom:10px;">What happens next?</div>
              <div style="font-size:12px;color:#6b6060;line-height:1.8;">
                🧵 &nbsp;Our artisans will begin crafting your order shortly.<br>
                📱 &nbsp;We'll connect on WhatsApp to confirm design details.<br>
                🚚 &nbsp;You'll receive shipping updates via email &amp; WhatsApp.<br>
                📦 &nbsp;Estimated delivery: 15–21 business days.
              </div>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1a1510;padding:24px 40px;text-align:center;">
            <div style="font-size:12px;color:rgba(255,255,255,0.4);">
              © {__import__('datetime').datetime.now().year} Harsha Art Gallery · Chennai, Tamil Nadu, India<br>
              Questions? <a href="mailto:harsha@artgallery.com" style="color:#c8860f;">harsha@artgallery.com</a>
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
"""


def send_order_confirmation_email(
    order,
    invoice,
    pdf_path: Optional[str] = None,
) -> bool:
    """
    Send order confirmation email with invoice PDF attached.
    Returns True if sent successfully, False otherwise.
    """
    if not order.customer_email:
        return False
    if not SMTP_USER or not SMTP_PASSWORD:
        print("[email] SMTP credentials not configured — skipping email")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Order Confirmed #{order.order_number} — Harsha Art Gallery"
        msg["From"]    = FROM_EMAIL
        msg["To"]      = order.customer_email

        html_body = _order_confirmation_html(order, invoice)
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        # Attach invoice PDF if available
        if pdf_path and os.path.exists(pdf_path.lstrip("/")):
            real_path = pdf_path.lstrip("/")
            with open(real_path, "rb") as f:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(f.read())
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f'attachment; filename="invoice_{invoice.invoice_number}.pdf"',
            )
            msg.attach(part)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, order.customer_email, msg.as_string())

        print(f"[email] Sent confirmation to {order.customer_email}")
        return True

    except Exception as e:
        print(f"[email] Failed to send: {e}")
        return False


def build_whatsapp_order_url(order, invoice) -> str:
    """Build a WhatsApp URL with pre-filled order confirmation message."""
    items_text = "\n".join(
        f"  • {item.product_name} × {item.quantity} = ₹{float(item.line_total):,.0f}"
        for item in order.items
    )

    msg = (
        f"🎉 *Order Confirmed — Harsha Art Gallery*\n\n"
        f"Dear {order.customer_name},\n\n"
        f"Your order has been confirmed!\n\n"
        f"📋 *Order:* {order.order_number}\n"
        f"🧾 *Invoice:* {invoice.invoice_number}\n\n"
        f"*Items:*\n{items_text}\n\n"
        f"💰 *Total Paid:* ₹{float(invoice.total_amount):,.2f} (incl. GST)\n\n"
        f"📦 *Ship To:*\n"
        f"{order.address_line1}, {order.city} - {order.pincode}\n\n"
        f"Our artisans will start working on your order shortly. "
        f"We'll keep you updated here on WhatsApp. 🙏✨"
    )

    phone = order.customer_phone.replace("+", "").replace(" ", "").replace("-", "")
    if not phone.startswith("91"):
        phone = "91" + phone

    from urllib.parse import quote

    return f"https://wa.me/{phone}?text={quote(msg)}"