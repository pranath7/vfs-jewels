import fitz # PyMuPDF
import sys

sys.stdout.reconfigure(encoding='utf-8')

def pdf_to_png(pdf_path, png_path):
    doc = fitz.open(pdf_path)
    page = doc.load_page(0)
    pix = page.get_pixmap(dpi=150)
    pix.save(png_path)
    print(f"Rendered {pdf_path} page 1 -> {png_path}")

try:
    pdf_to_png("live_invoice_j9099.pdf", "live_invoice_j9099_page1.png")
    pdf_to_png("live_photoslip_j9099.pdf", "live_photoslip_j9099_page1.png")
except Exception as e:
    print("PyMuPDF note:", e)
