import fitz
import sys

sys.stdout.reconfigure(encoding='utf-8')

doc = fitz.open("live_photoslip_j9779.pdf")
print("Total pages in live PDF:", len(doc))

page = doc[0]
pix = page.get_pixmap(dpi=150)
pix.save("live_photoslip_j9779_page1.png")
print("Rendered live_photoslip_j9779_page1.png")
