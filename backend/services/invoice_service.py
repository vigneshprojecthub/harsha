"""
Invoice PDF generator using ReportLab.
Produces a premium, branded A4 invoice for Harsha Art Gallery.
"""
import os
import uuid
from decimal import Decimal
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.pdfgen import canvas as rl_canvas


# ── Brand colours ────────────────────────────────────────────────────────────
GOLD   = colors.HexColor("#C8860F")
DARK   = colors.HexColor("#1A1510")
IVORY  = colors.HexColor("#F8F4EC")
LIGHT  = colors.HexColor("#F0E9D4")
GREY   = colors.HexColor("#9A9080")
WHITE  = colors.white


def _build_styles():
    base = getSampleStyleSheet()

    styles = {
        "brand_title": ParagraphStyle(
            "brand_title", parent=base["Normal"],
            fontName="Helvetica-Bold", fontSize=22,
            textColor=DARK, leading=26,
        ),
        "brand_sub": ParagraphStyle(
            "brand_sub", parent=base["Normal"],
            fontName="Helvetica", fontSize=9,
            textColor=GREY, leading=13, spaceAfter=2,
        ),
        "section_head": ParagraphStyle(
            "section_head", parent=base["Normal"],
            fontName="Helvetica-Bold", fontSize=8,
            textColor=GREY, leading=11,
            spaceBefore=12, spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "body", parent=base["Normal"],
            fontName="Helvetica", fontSize=9,
            textColor=DARK, leading=13,
        ),
        "body_bold": ParagraphStyle(
            "body_bold", parent=base["Normal"],
            fontName="Helvetica-Bold", fontSize=9,
            textColor=DARK, leading=13,
        ),
        "small": ParagraphStyle(
            "small", parent=base["Normal"],
            fontName="Helvetica", fontSize=8,
            textColor=GREY, leading=11,
        ),
        "invoice_label": ParagraphStyle(
            "invoice_label", parent=base["Normal"],
            fontName="Helvetica-Bold", fontSize=26,
            textColor=GOLD, leading=30, alignment=TA_RIGHT,
        ),
        "total_label": ParagraphStyle(
            "total_label", parent=base["Normal"],
            fontName="Helvetica-Bold", fontSize=11,
            textColor=WHITE, leading=15,
        ),
        "total_value": ParagraphStyle(
            "total_value", parent=base["Normal"],
            fontName="Helvetica-Bold", fontSize=13,
            textColor=WHITE, leading=17, alignment=TA_RIGHT,
        ),
        "th": ParagraphStyle(
            "th", parent=base["Normal"],
            fontName="Helvetica-Bold", fontSize=8,
            textColor=WHITE, leading=11,
        ),
        "td": ParagraphStyle(
            "td", parent=base["Normal"],
            fontName="Helvetica", fontSize=8.5,
            textColor=DARK, leading=12,
        ),
        "td_right": ParagraphStyle(
            "td_right", parent=base["Normal"],
            fontName="Helvetica", fontSize=8.5,
            textColor=DARK, leading=12, alignment=TA_RIGHT,
        ),
        "td_bold_right": ParagraphStyle(
            "td_bold_right", parent=base["Normal"],
            fontName="Helvetica-Bold", fontSize=8.5,
            textColor=DARK, leading=12, alignment=TA_RIGHT,
        ),
    }
    return styles


def generate_invoice_pdf(
    order,
    invoice,
    upload_dir: str,
) -> str:
    """
    Build the invoice PDF and return its relative URL path.
    `order` and `invoice` are ORM objects (or dicts with same attributes).
    """
    filename = f"invoice_{invoice.invoice_number.replace('/', '-')}.pdf"
    filepath = os.path.join(upload_dir, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title=f"Invoice {invoice.invoice_number}",
        author="Harsha Art Gallery",
    )

    S = _build_styles()
    W = A4[0] - 36 * mm   # usable width
    story = []

    # ── Header row ────────────────────────────────────────────────────────────
    header_data = [[
        # Left: brand block
        [
            Paragraph("Harsha Art Gallery", S["brand_title"]),
            Paragraph("Premium Handcrafted Embroidery", S["brand_sub"]),
            Paragraph("Chennai, Tamil Nadu, India", S["brand_sub"]),
            Paragraph("harsha@artgallery.com  ·  +91 98765 43210", S["brand_sub"]),
            Paragraph("GSTIN: 33XXXXX0000X1ZX", S["brand_sub"]),
        ],
        # Right: INVOICE label + meta
        [
            Paragraph("INVOICE", S["invoice_label"]),
            Spacer(1, 4),
            Paragraph(f"<b>Invoice No:</b>  {invoice.invoice_number}", S["body_bold"]),
            Paragraph(
                f"<b>Date:</b>  {invoice.invoice_date.strftime('%d %B %Y') if hasattr(invoice.invoice_date, 'strftime') else invoice.invoice_date}",
                S["body"]
            ),
            Paragraph(f"<b>Order No:</b>  {order.order_number}", S["body"]),
            Paragraph(f"<b>Status:</b>  {order.status.upper()}", S["body"]),
        ],
    ]]

    header_tbl = Table(header_data, colWidths=[W * 0.55, W * 0.45])
    header_tbl.setStyle(TableStyle([
        ("VALIGN",      (0, 0), (-1, -1), "TOP"),
        ("ALIGN",       (1, 0), (1, 0),   "RIGHT"),
        ("BOTTOMPADDING", (0,0),(-1,-1),  4),
    ]))
    story.append(header_tbl)
    story.append(Spacer(1, 6 * mm))
    story.append(HRFlowable(width="100%", thickness=1.5, color=GOLD, spaceAfter=6 * mm))

    # ── Bill To / Ship To ────────────────────────────────────────────────────
    addr_line2 = f"{order.address_line2}, " if order.address_line2 else ""
    address_block = (
        f"{order.address_line1}<br/>"
        f"{addr_line2}{order.city}, {order.state} - {order.pincode}<br/>"
        f"{order.country}"
    )
    bto_data = [[
        [
            Paragraph("BILL TO", S["section_head"]),
            Paragraph(f"<b>{order.customer_name}</b>", S["body_bold"]),
            Paragraph(address_block, S["body"]),
            Paragraph(order.customer_phone, S["body"]),
            Paragraph(order.customer_email or "", S["body"]),
        ],
        [
            Paragraph("PAYMENT METHOD", S["section_head"]),
            Paragraph("Razorpay — Online Payment", S["body"]),
            Paragraph("<br/>NOTES", S["section_head"]),
            Paragraph(order.delivery_notes or "—", S["body"]),
        ],
    ]]
    bto_tbl = Table(bto_data, colWidths=[W * 0.55, W * 0.45])
    bto_tbl.setStyle(TableStyle([
        ("VALIGN",      (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND",  (0, 0), (-1, -1), IVORY),
        ("BOX",         (0, 0), (-1, -1), 0.5, LIGHT),
        ("ROUNDEDCORNERS", [4]),
        ("LEFTPADDING",  (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING",   (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 8),
    ]))
    story.append(bto_tbl)
    story.append(Spacer(1, 8 * mm))

    # ── Line Items Table ──────────────────────────────────────────────────────
    item_header = [
        Paragraph("#",         S["th"]),
        Paragraph("ITEM",      S["th"]),
        Paragraph("CATEGORY",  S["th"]),
        Paragraph("UNIT PRICE",S["th"]),
        Paragraph("QTY",       S["th"]),
        Paragraph("TOTAL",     S["th"]),
    ]

    item_rows = [item_header]
    for idx, item in enumerate(order.items, 1):
        custom_note = ""
        if item.is_custom:
            custom_note = '<br/><font size="7" color="#9A9080"><i>Custom / Personalized</i></font>'
        item_rows.append([
            Paragraph(str(idx), S["td"]),
            Paragraph(f"{item.product_name}{custom_note}", S["td"]),
            Paragraph(item.product_category or "—", S["td"]),
            Paragraph(f"Rs. {float(item.unit_price):,.2f}", S["td_right"]),
            Paragraph(str(item.quantity), S["td"]),
            Paragraph(f"Rs. {float(item.line_total):,.2f}", S["td_bold_right"]),
        ])

    col_w = [8*mm, W*0.38, W*0.18, W*0.15, 10*mm, W*0.15]
    items_tbl = Table(item_rows, colWidths=col_w, repeatRows=1)
    items_tbl.setStyle(TableStyle([
        # Header row
        ("BACKGROUND",  (0, 0), (-1, 0),   DARK),
        ("TEXTCOLOR",   (0, 0), (-1, 0),   WHITE),
        ("TOPPADDING",  (0, 0), (-1, 0),   6),
        ("BOTTOMPADDING",(0, 0),(-1, 0),   6),
        ("LEFTPADDING", (0, 0), (-1, 0),   6),
        # Body rows
        ("BACKGROUND",  (0, 1), (-1, -1),  WHITE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, IVORY]),
        ("TOPPADDING",  (0, 1), (-1, -1),  5),
        ("BOTTOMPADDING",(0, 1),(-1, -1),  5),
        ("LEFTPADDING", (0, 1), (-1, -1),  6),
        ("RIGHTPADDING",(0, 1), (-1, -1),  6),
        ("ALIGN",       (3, 0), (-1, -1),  "RIGHT"),
        ("GRID",        (0, 0), (-1, -1),  0.25, LIGHT),
        ("LINEBELOW",   (0, 0), (-1, 0),   1,    GOLD),
    ]))
    story.append(items_tbl)
    story.append(Spacer(1, 8 * mm))

    # ── Totals Block ──────────────────────────────────────────────────────────
    subtotal  = float(invoice.subtotal)
    tax_rate  = invoice.tax_rate
    tax_amt   = float(invoice.tax_amount)
    shipping  = float(invoice.shipping_amount)
    discount  = float(getattr(order, "discount_amount", 0))
    total     = float(invoice.total_amount)

    totals_data = []
    def _row(label, val, bold=False):
        style = S["body_bold"] if bold else S["body"]
        return [Paragraph(label, style), Paragraph(f"Rs. {val:,.2f}", style if not bold else S["td_bold_right"])]

    totals_data.append(_row("Subtotal", subtotal))
    if discount:
        totals_data.append(_row(f"Discount", -discount))
    if shipping:
        totals_data.append(_row("Shipping & Handling", shipping))
    totals_data.append(_row(f"GST ({tax_rate:.0f}%)", tax_amt))

    totals_tbl = Table(totals_data, colWidths=[W * 0.7, W * 0.3])
    totals_tbl.setStyle(TableStyle([
        ("ALIGN",       (1, 0), (1, -1), "RIGHT"),
        ("TOPPADDING",  (0, 0), (-1,-1),  3),
        ("BOTTOMPADDING",(0,0), (-1,-1),  3),
        ("LINEBELOW",   (0, -1),(-1,-1),  0.5, GREY),
    ]))

    # Grand total bar
    grand_data = [[
        Paragraph("GRAND TOTAL", S["total_label"]),
        Paragraph(f"Rs. {total:,.2f}", S["total_value"]),
    ]]
    grand_tbl = Table(grand_data, colWidths=[W * 0.7, W * 0.3])
    grand_tbl.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (-1, -1), DARK),
        ("ALIGN",       (1, 0), (1, 0),   "RIGHT"),
        ("TOPPADDING",  (0, 0), (-1,-1),  10),
        ("BOTTOMPADDING",(0,0), (-1,-1),  10),
        ("LEFTPADDING", (0, 0), (-1,-1),  12),
        ("RIGHTPADDING",(0, 0), (-1,-1),  12),
    ]))

    # Right-align totals block
    wrapper_data = [[Spacer(1, 1), totals_tbl]]
    wrapper_tbl = Table([[Paragraph("", S["body"]), totals_tbl]], colWidths=[W * 0.3, W * 0.7])
    story.append(wrapper_tbl)
    story.append(Spacer(1, 3 * mm))
    story.append(grand_tbl)
    story.append(Spacer(1, 10 * mm))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.5, color=LIGHT, spaceAfter=4 * mm))
    footer_data = [[
        Paragraph(
            "Thank you for choosing Harsha Art Gallery. "
            "Every piece is crafted with love and delivered with care.",
            S["small"]
        ),
        Paragraph(
            "For queries: harsha@artgallery.com  ·  +91 98765 43210",
            ParagraphStyle("footer_r", parent=S["small"], alignment=TA_RIGHT)
        ),
    ]]
    footer_tbl = Table(footer_data, colWidths=[W * 0.6, W * 0.4])
    footer_tbl.setStyle(TableStyle([("VALIGN", (0,0),(-1,-1),"TOP")]))
    story.append(footer_tbl)

    doc.build(story)
    return f"/uploads/{filename}"
