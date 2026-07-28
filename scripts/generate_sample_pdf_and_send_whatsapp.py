import os
import fitz  # PyMuPDF
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

# ── 12 COMPLETELY UNIQUE PRODUCTS WITH 12 DISTINCT PHOTO ASSETS ──
SAMPLE_PRODUCTS = [
    {"sku": "VFS-KAD-01", "name": "Anti-Tarnish Emerald Kada #01", "qty": 2, "price": 499, "img_file": "assets/p_photo_1.png"},
    {"sku": "VFS-NEC-02", "name": "CZ Infinity Pendant Necklace #02", "qty": 1, "price": 799, "img_file": "assets/p_photo_2.png"},
    {"sku": "VFS-EAR-03", "name": "Handcrafted Pearl Clover Earrings #03", "qty": 3, "price": 499, "img_file": "assets/p_photo_3.png"},
    {"sku": "VFS-RNG-04", "name": "Solitaire Diamond Ring #04", "qty": 4, "price": 399, "img_file": "assets/p_photo_4.png"},
    {"sku": "VFS-CHN-05", "name": "Kandy 316L Snake Gold Chain #05", "qty": 2, "price": 599, "img_file": "assets/p_photo_5.png"},
    {"sku": "VFS-CHK-06", "name": "Ruby Red CZ Choker #06", "qty": 1, "price": 1299, "img_file": "assets/p_photo_6.png"},
    {"sku": "VFS-CHN-07", "name": "Heavy Gold Curb Chain #07", "qty": 2, "price": 699, "img_file": "assets/p_photo_7.png"},
    {"sku": "VFS-JHM-08", "name": "Traditional Gold Jhumkas #08", "qty": 1, "price": 549, "img_file": "assets/p_photo_8.png"},
    {"sku": "VFS-RNG-09", "name": "Royal Sapphire Blue Ring #09", "qty": 2, "price": 499, "img_file": "assets/p_photo_9.png"},
    {"sku": "VFS-BRC-10", "name": "Luxury Tennis Crystal Bracelet #10", "qty": 1, "price": 899, "img_file": "assets/p_photo_10.png"},
    {"sku": "VFS-KAD-11", "name": "Black Enamel Gold Kada #11", "qty": 2, "price": 749, "img_file": "assets/p_photo_11.png"},
    {"sku": "VFS-NEC-12", "name": "Multi-Strand Layered Necklace #12", "qty": 3, "price": 1199, "img_file": "assets/p_photo_12.png"}
]

ORDER_META = {
    "inv_no": "INV-2034",
    "order_no": "#VFS-98407",
    "date": "2026/07/26",
    "cust_id": "CUST-98407",
    "terms": "Prepaid (UPI / Cards)",
    "customer": {
        "name": "Vikram Sales Client",
        "company": "VFS Boutique Partner",
        "address": "42 Narayana Mudali Street, Sowcarpet",
        "city_zip": "Chennai, TN 600001",
        "phone": "+91 98407 57363",
        "email": "client@vfsjewels.store",
        "gstin": "33AAACV1234F1Z9"
    }
}

# ── BUILD OFFICIAL INVOICE PDF (Screenshot 1 Format) ──
def build_invoice_pdf(filename="vfs_invoice_sample_12_items.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'CompanyTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#121212')
    )
    brand_sub = ParagraphStyle(
        'BrandSub',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#D4AF37')
    )
    store_info = ParagraphStyle(
        'StoreInfo',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#444444')
    )
    inv_title_style = ParagraphStyle(
        'InvTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=28,
        alignment=2,
        textColor=colors.HexColor('#222222')
    )

    story = []

    left_header = [
        Paragraph("VIKRAM FANCY STORE (VFS)", title_style),
        Paragraph("VFS JEWELS", brand_sub),
        Paragraph("42, 2nd Floor, Natwar Kurpa Complex, Sowcarpet, Chennai - 600001", store_info),
        Paragraph("Phone: +91 98407 57363 | Email: vfsjewels@gmail.com | <b>GSTIN: 33AAFVC8491A1ZX</b>", store_info)
    ]

    meta_table_data = [
        [Paragraph("<b>INVOICE #</b>", store_info), Paragraph("<b>DATE</b>", store_info)],
        [Paragraph(ORDER_META["inv_no"], store_info), Paragraph(ORDER_META["date"], store_info)],
        [Paragraph("<b>CUSTOMER ID</b>", store_info), Paragraph("<b>TERMS</b>", store_info)],
        [Paragraph(ORDER_META["cust_id"], store_info), Paragraph(ORDER_META["terms"], store_info)]
    ]
    meta_table = Table(meta_table_data, colWidths=[1.1*inch, 1.3*inch])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (1,0), colors.HexColor('#e5e7eb')),
        ('BACKGROUND', (0,2), (1,2), colors.HexColor('#e5e7eb')),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#9ca3af')),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 3),
    ]))

    header_table_data = [
        [left_header, [Paragraph("INVOICE", inv_title_style), Spacer(1, 4), meta_table]]
    ]
    header_table = Table(header_table_data, colWidths=[4.2*inch, 3.1*inch])
    header_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story.append(header_table)
    story.append(Spacer(1, 15))

    c = ORDER_META["customer"]
    bill_to_content = [
        Paragraph("<b>Name:</b> " + c["name"], store_info),
        Paragraph("<b>Company:</b> " + c["company"], store_info),
        Paragraph("<b>Address:</b> " + c["address"], store_info),
        Paragraph("<b>City:</b> " + c["city_zip"], store_info),
        Paragraph("<b>Phone:</b> " + c["phone"], store_info),
        Paragraph("<b>Email:</b> " + c["email"], store_info),
        Paragraph("<b>GSTIN:</b> " + c.get("gstin", "33AAACV1234F1Z9"), store_info),
    ]
    ship_to_content = [
        Paragraph("<b>Name:</b> " + c["name"], store_info),
        Paragraph("<b>Company:</b> " + c["company"], store_info),
        Paragraph("<b>Address:</b> " + c["address"], store_info),
        Paragraph("<b>City:</b> " + c["city_zip"], store_info),
        Paragraph("<b>Phone:</b> " + c["phone"], store_info),
    ]

    bill_to_box = Table([
        [Paragraph("<b>BILL TO</b>", store_info)],
        [bill_to_content]
    ], colWidths=[3.5*inch])
    bill_to_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor('#d1d5db')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#9ca3af')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
    ]))

    ship_to_box = Table([
        [Paragraph("<b>SHIP TO</b>", store_info)],
        [ship_to_content]
    ], colWidths=[3.5*inch])
    ship_to_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor('#d1d5db')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#9ca3af')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
    ]))

    address_table = Table([[bill_to_box, ship_to_box]], colWidths=[3.65*inch, 3.65*inch])
    address_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story.append(address_table)
    story.append(Spacer(1, 15))

    item_header_style = ParagraphStyle('ItemHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, textColor=colors.HexColor('#111111'))
    item_cell_style = ParagraphStyle('ItemCell', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, textColor=colors.HexColor('#222222'))
    item_cell_bold = ParagraphStyle('ItemCellBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, textColor=colors.HexColor('#222222'))

    table_data = [
        [
            Paragraph("<b>DESCRIPTION</b>", item_header_style),
            Paragraph("<b>QTY</b>", item_header_style),
            Paragraph("<b>UNIT PRICE</b>", item_header_style),
            Paragraph("<b>AMOUNT</b>", item_header_style)
        ]
    ]

    subtotal = 0
    for p in SAMPLE_PRODUCTS:
        amt = p["price"] * p["qty"]
        subtotal += amt
        table_data.append([
            Paragraph(f"<b>{p['name']}</b> (SKU: {p['sku']})", item_cell_style),
            Paragraph(str(p["qty"]), item_cell_style),
            Paragraph(f"Rs. {p['price']:,}", item_cell_style),
            Paragraph(f"Rs. {amt:,}", item_cell_bold)
        ])

    shipping_fee = 90
    gst_fee = int(subtotal * 0.03)
    grand_total = subtotal + shipping_fee + gst_fee

    item_table = Table(table_data, colWidths=[4.2*inch, 0.8*inch, 1.1*inch, 1.2*inch])
    item_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#d1d5db')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#9ca3af')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
    ]))
    story.append(item_table)
    story.append(Spacer(1, 10))

    totals_data = [
        [Paragraph("Subtotal:", store_info), Paragraph(f"Rs. {subtotal:,}", store_info)],
        [Paragraph("GST (3%):", store_info), Paragraph(f"Rs. {gst_fee:,}", store_info)],
        [Paragraph("Shipping Fee:", store_info), Paragraph(f"Rs. {shipping_fee:,}", store_info)],
        [Paragraph("<b>Grand Total:</b>", ParagraphStyle('GT', parent=store_info, fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor('#D4AF37'))),
         Paragraph(f"<b>Rs. {grand_total:,}</b>", ParagraphStyle('GTVal', parent=store_info, fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor('#D4AF37')))]
    ]
    totals_table = Table(totals_data, colWidths=[1.5*inch, 1.2*inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LINEABOVE', (0,-1), (-1,-1), 1, colors.HexColor('#D4AF37')),
    ]))

    totals_wrapper = Table([[Spacer(1, 1), totals_table]], colWidths=[4.6*inch, 2.7*inch])
    totals_wrapper.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story.append(totals_wrapper)

    doc.build(story)
    print(f"Successfully generated Invoice PDF: {filename}")


# ── BUILD PRODUCT PHOTO SLIP PDF (12 COMPLETELY UNIQUE PRODUCT PHOTOS) ──
def build_photo_slip_pdf(filename="vfs_photo_slip_sample_12_items.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=24,
        rightMargin=24,
        topMargin=24,
        bottomMargin=24
    )

    styles = getSampleStyleSheet()

    header_title_style = ParagraphStyle(
        'SlipHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.HexColor('#111111')
    )
    meta_info_style = ParagraphStyle(
        'SlipMeta',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#333333')
    )
    card_text_style = ParagraphStyle(
        'CardText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#222222')
    )

    story = []

    story.append(Paragraph("VIKRAM FANCY STORE (VFS) PRODUCT PHOTO SLIP", header_title_style))
    story.append(Spacer(1, 8))

    c = ORDER_META["customer"]
    billed_info = [
        [
            Paragraph(f"<b>BILLED FROM :</b> Vikram Fancy Store (VFS) / VFS Jewels | <b>GSTIN: 33AAFVC8491A1ZX</b>", meta_info_style),
            Paragraph(f"<b>BILLED TO :</b> {c['name']} ({c['phone']}) | <b>GSTIN: {c.get('gstin', '33AAACV1234F1Z9')}</b>", meta_info_style)
        ],
        [
            Paragraph(f"<b>INV . NO :</b> {ORDER_META['inv_no']}", meta_info_style),
            Paragraph(f"<b>ORDER NO :</b> {ORDER_META['order_no']}", meta_info_style)
        ]
    ]
    billed_table = Table(billed_info, colWidths=[3.7*inch, 3.7*inch])
    billed_table.setStyle(TableStyle([
        ('LINEBELOW', (0,-1), (-1,-1), 1, colors.HexColor('#D4AF37')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(billed_table)
    story.append(Spacer(1, 12))

    card_elements = []
    for idx, p in enumerate(SAMPLE_PRODUCTS):
        img_file = p["img_file"]
        
        info_lines = [
            Paragraph(f"<b>qty orderd :</b> {p['qty']}", card_text_style),
            Paragraph(f"<b>price :</b> Rs. {p['price']:,}", card_text_style),
            Paragraph(f"<b>product :</b> {p['name']}", card_text_style),
            Paragraph(f"<b>product code :</b> {p['sku']}", card_text_style),
        ]

        if os.path.exists(img_file):
            img_obj = Image(img_file, width=1.55*inch, height=1.55*inch)
            card_content = Table([[img_obj], [info_lines]], colWidths=[3.3*inch])
        else:
            card_content = Table([["[PRODUCT PHOTO]"], [info_lines]], colWidths=[3.3*inch])

        card_content.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,0), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cccccc')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fafafa')),
        ]))
        card_elements.append(card_content)

    grid_rows = []
    for i in range(0, len(card_elements), 2):
        row = [card_elements[i]]
        if i + 1 < len(card_elements):
            row.append(card_elements[i+1])
        else:
            row.append(Spacer(1, 1))
        grid_rows.append(row)

    for r_idx, r in enumerate(grid_rows):
        grid_table = Table([r], colWidths=[3.65*inch, 3.65*inch])
        grid_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(grid_table)

        if (r_idx + 1) % 3 == 0 and r_idx + 1 < len(grid_rows):
            story.append(PageBreak())

    doc.build(story)
    print(f"Successfully generated Photo Slip PDF with 12 UNIQUE PHOTOS: {filename}")


# ── CONVERT PDF PAGES TO HIGH-RES PNG PREVIEW IMAGES ──
def render_pdf_to_images(pdf_filename, output_prefix):
    doc = fitz.open(pdf_filename)
    saved_images = []
    for page_idx in range(len(doc)):
        page = doc[page_idx]
        pix = page.get_pixmap(dpi=200) # High Resolution
        out_name = f"{output_prefix}_page_{page_idx+1}.png"
        out_path = os.path.join(os.getcwd(), out_name)
        pix.save(out_path)
        
        assets_path = os.path.join(os.getcwd(), 'assets', out_name)
        pix.save(assets_path)
        
        saved_images.append(out_path)
        print(f"Rendered {pdf_filename} Page {page_idx+1} -> {out_name}")
    return saved_images


if __name__ == '__main__':
    build_invoice_pdf("vfs_invoice_sample_12_items.pdf")
    build_photo_slip_pdf("vfs_photo_slip_sample_12_items.pdf")
    
    render_pdf_to_images("vfs_invoice_sample_12_items.pdf", "vfs_invoice_sample")
    render_pdf_to_images("vfs_photo_slip_sample_12_items.pdf", "vfs_photo_slip_sample")
