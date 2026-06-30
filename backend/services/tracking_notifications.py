"""
Tracking notification service.
Sends WhatsApp message + email whenever order status changes.
"""

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from models.tracking import STATUS_META
import urllib.parse

WHATSAPP_NUMBER = os.getenv("WHATSAPP_NUMBER", "919344946069")
SMTP_HOST       = os.getenv("SMTP_HOST",     "smtp.gmail.com")
SMTP_PORT       = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER       = os.getenv("SMTP_USER",     "")
SMTP_PASSWORD   = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL      = os.getenv("FROM_EMAIL",    "Harsha Art Gallery <harshaartandcrafts@gmail.com>")
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "http://localhost:5173")


def _status_label(status: str) -> str:
    return STATUS_META.get(status, {}).get("label", status.replace("_", " ").title())

def _status_icon(status: str) -> str:
    return STATUS_META.get(status, {}).get("icon", "📌")


# ── WhatsApp ─────────────────────────────────────────────────────────────────

def build_status_whatsapp_url(
    order,
    new_status: str,
    notes: Optional[str],
    tracking_token: Optional[str] = None,
) -> str:
    """Build a pre-filled WhatsApp URL to notify the customer about their order status."""
    label = _status_label(new_status)
    icon  = _status_icon(new_status)

    tracking_url = ""
    if tracking_token:
        tracking_url = f"\n\n🔗 Track your order live:\n{PUBLIC_BASE_URL}/track/{tracking_token}"

    msg = (
        f"{icon} *Order Update — Harsha Art Gallery*\n\n"
        f"Dear {order.customer_name},\n\n"
        f"Your order *{order.order_number}* has been updated:\n\n"
        f"📌 *Status:* {label}\n"
    )
    if notes:
        msg += f"📝 *Note:* {notes}\n"

    msg += tracking_url
    msg += "\n\nThank you for choosing Harsha Art Gallery! ✨🪡"

    phone = str(order.customer_phone).replace("+", "").replace(" ", "").replace("-", "")
    if not phone.startswith("91"):
        phone = "91" + phone

    return f"https://wa.me/{phone}?text={urllib.parse.quote(msg)}"


# ── Email ─────────────────────────────────────────────────────────────────────

def _status_update_html(order, new_status: str, notes: Optional[str], tracking_token: Optional[str]) -> str:
    label = _status_label(new_status)
    icon  = _status_icon(new_status)
    from models.tracking import TRACKING_STATUSES

    # Progress bar: percentage complete
    idx = TRACKING_STATUSES.index(new_status) if new_status in TRACKING_STATUSES else 0
    pct = int((idx / (len(TRACKING_STATUSES) - 1)) * 100)

    tracking_section = ""
    if tracking_token:
        track_url = f"{PUBLIC_BASE_URL}/track/{tracking_token}"
        tracking_section = f"""
        <tr><td style="padding:16px 40px 0;">
          <a href="{track_url}"
             style="display:block;text-align:center;background:#c8860f;color:#fff;font-weight:700;
                    padding:14px;border-radius:10px;text-decoration:none;font-size:14px;">
            🔍 Track Your Order Live
          </a>
        </td></tr>
        """

    steps_html = ""
    for i, s in enumerate(TRACKING_STATUSES):
        s_label = _status_label(s)
        s_icon  = _status_icon(s)
        done    = i <= idx
        color   = "#c8860f" if done else "#d4c8b8"
        text_c  = "#1a1510" if done else "#9a9080"
        steps_html += f"""
        <div style="display:flex;align-items:center;gap:10px;padding:6px 0;">
          <div style="width:28px;height:28px;border-radius:50%;background:{color};
                      color:#fff;display:flex;align-items:center;justify-content:center;
                      font-size:13px;flex-shrink:0;">{s_icon if done else "○"}</div>
          <span style="font-size:13px;color:{text_c};{'font-weight:600;' if s == new_status else ''}">{s_label}</span>
        </div>
        """

    return f"""
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8f4ec;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:32px 16px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

  <!-- Header -->
  <tr><td style="background:#1a1510;padding:28px 40px;text-align:center;">
    <div style="font-size:20px;font-weight:700;color:#fff;">✨ Harsha Art Gallery</div>
    <div style="font-size:10px;color:#c8860f;letter-spacing:3px;margin-top:4px;text-transform:uppercase;">Order Status Update</div>
  </td></tr>

  <!-- Status badge -->
  <tr><td style="padding:32px 40px 0;text-align:center;">
    <div style="display:inline-block;background:linear-gradient(135deg,#c8860f,#e8be4a);
                color:#fff;font-size:32px;padding:18px 28px;border-radius:16px;margin-bottom:16px;">
      {icon}
    </div>
    <h2 style="font-size:22px;font-weight:700;color:#1a1510;margin:0 0 6px;">{label}</h2>
    <p style="font-size:13px;color:#9a9080;margin:0;">Order {order.order_number}</p>
  </td></tr>

  <!-- Progress bar -->
  <tr><td style="padding:24px 40px 0;">
    <div style="background:#f0e9d4;border-radius:99px;height:8px;overflow:hidden;">
      <div style="background:linear-gradient(90deg,#c8860f,#e8be4a);width:{pct}%;height:100%;border-radius:99px;transition:width .3s;"></div>
    </div>
    <div style="font-size:11px;color:#9a9080;text-align:right;margin-top:4px;">{pct}% complete</div>
  </td></tr>

  {f'<tr><td style="padding:16px 40px 0;"><div style="background:#f8f4ec;border-left:3px solid #c8860f;padding:12px 16px;border-radius:0 8px 8px 0;font-size:13px;color:#1a1510;">{notes}</div></td></tr>' if notes else ''}

  <!-- Timeline -->
  <tr><td style="padding:24px 40px 0;">
    <div style="font-size:10px;font-weight:700;color:#9a9080;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Journey So Far</div>
    {steps_html}
  </td></tr>

  {tracking_section}

  <!-- Footer -->
  <tr><td style="background:#1a1510;padding:20px 40px;text-align:center;margin-top:24px;">
    <div style="font-size:11px;color:rgba(255,255,255,.4);">
      Questions? <a href="mailto:harshaartandcrafts@gmail.com" style="color:#c8860f;">harshaartandcrafts@gmail.com</a>
    </div>
  </td></tr>

</table></td></tr></table>
</body></html>
"""


def send_status_update_email(
    order,
    new_status: str,
    notes: Optional[str] = None,
    tracking_token: Optional[str] = None,
) -> bool:
    if not order.customer_email:
        return False
    if not SMTP_USER or not SMTP_PASSWORD:
        print("[email] SMTP not configured — skipping status email")
        return False

    label = _status_label(new_status)
    icon  = _status_icon(new_status)

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"{icon} Order Update: {label} — #{order.order_number}"
        msg["From"]    = FROM_EMAIL
        msg["To"]      = order.customer_email

        html = _status_update_html(order, new_status, notes, tracking_token)
        msg.attach(MIMEText(html, "html", "utf-8"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, order.customer_email, msg.as_string())

        print(f"[email] Status update sent to {order.customer_email}: {label}")
        return True
    except Exception as e:
        print(f"[email] Failed: {e}")
        return False
