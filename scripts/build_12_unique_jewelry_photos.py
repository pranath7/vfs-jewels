import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_unique_jewelry_photo(idx, title, category, bg_color, main_color, accent_color, shape_type):
    width, height = 400, 400
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)

    # Draw subtle background pattern / glow
    draw.ellipse([50, 50, 350, 350], fill=None, outline=(255, 255, 255, 40), width=3)

    # Draw main jewelry silhouette/graphic based on shape_type
    if shape_type == 'kada_emerald':
        # Gold Bangle with Green Emeralds
        draw.ellipse([80, 80, 320, 320], outline=main_color, width=28)
        draw.ellipse([92, 92, 308, 308], outline=(212, 175, 55), width=4)
        for angle_xy in [(200, 80), (320, 200), (200, 320), (80, 200)]:
            draw.rectangle([angle_xy[0]-16, angle_xy[1]-16, angle_xy[0]+16, angle_xy[1]+16], fill=accent_color)
    elif shape_type == 'pendant_infinity':
        # Silver & Blue Infinity Pendant
        draw.line([200, 40, 200, 160], fill=main_color, width=6)
        draw.ellipse([140, 160, 260, 280], outline=main_color, width=16)
        draw.ellipse([170, 190, 230, 250], fill=accent_color)
    elif shape_type == 'pearl_clover':
        # Pearl White Clover Earrings
        draw.ellipse([120, 120, 200, 200], fill=main_color, outline=accent_color, width=4)
        draw.ellipse([200, 120, 280, 200], fill=main_color, outline=accent_color, width=4)
        draw.ellipse([160, 180, 240, 260], fill=main_color, outline=accent_color, width=4)
        draw.ellipse([200, 200, 210, 280], fill=accent_color)
    elif shape_type == 'ring_diamond':
        # Gold Diamond Ring
        draw.ellipse([120, 150, 280, 310], outline=main_color, width=24)
        # Diamond Top
        draw.polygon([(200, 70), (240, 130), (160, 130)], fill=accent_color, outline=(255,255,255), width=3)
    elif shape_type == 'snake_chain':
        # S-Curve Gold Snake Chain
        draw.arc([100, 80, 300, 220], start=0, end=180, fill=main_color, width=18)
        draw.arc([100, 180, 300, 320], start=180, end=360, fill=main_color, width=18)
    elif shape_type == 'ruby_choker':
        # Ruby Red Gem Choker
        draw.arc([60, 100, 340, 280], start=20, end=160, fill=main_color, width=22)
        draw.polygon([(200, 220), (230, 270), (170, 270)], fill=accent_color)
    elif shape_type == 'curb_chain':
        # Heavy Gold Curb Links
        for i in range(5):
            y_off = 80 + i * 50
            draw.ellipse([140, y_off, 260, y_off + 45], outline=main_color, width=14)
    elif shape_type == 'drop_jhumka':
        # Indian Traditional Jhumkas
        draw.polygon([(200, 80), (220, 120), (180, 120)], fill=accent_color)
        draw.arc([140, 130, 260, 250], start=0, end=180, fill=main_color, width=24)
        for x in range(150, 260, 20):
            draw.line([x, 240, x, 270], fill=accent_color, width=4)
    elif shape_type == 'sapphire_ring':
        # Deep Blue Sapphire Ring
        draw.ellipse([110, 140, 290, 320], outline=main_color, width=20)
        draw.rectangle([165, 80, 235, 150], fill=accent_color, outline=(255,255,255), width=4)
    elif shape_type == 'tennis_bracelet':
        # Line of Sparkling Diamonds
        draw.line([60, 200, 340, 200], fill=main_color, width=12)
        for x in range(80, 340, 30):
            draw.ellipse([x-10, 190, x+10, 210], fill=accent_color, outline=(255,255,255), width=2)
    elif shape_type == 'black_enamel_kada':
        # Black Enamel & Gold Kada
        draw.ellipse([80, 80, 320, 320], outline=(20, 20, 20), width=32)
        draw.ellipse([76, 76, 324, 324], outline=main_color, width=4)
        draw.ellipse([112, 112, 288, 288], outline=main_color, width=4)
    else: # layered_necklace
        # 3 Gold Layered Chains
        draw.arc([120, 80, 280, 200], start=0, end=180, fill=main_color, width=8)
        draw.arc([90, 80, 310, 260], start=0, end=180, fill=main_color, width=8)
        draw.arc([60, 80, 340, 320], start=0, end=180, fill=main_color, width=8)

    # Add Category Banner Text at Bottom of Photo
    draw.rectangle([0, 330, 400, 400], fill=(18, 21, 30, 220))
    try:
        font = ImageFont.truetype("arial.ttf", 22)
        font_sub = ImageFont.truetype("arial.ttf", 16)
    except:
        font = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    draw.text((200, 345), f"ITEM #{idx}: {category.upper()}", fill=(212, 175, 55), font=font, anchor="mm")
    draw.text((200, 375), title[:30], fill=(255, 255, 255), font=font_sub, anchor="mm")

    out_path = os.path.join(os.getcwd(), 'assets', f'p_photo_{idx}.png')
    img.save(out_path)
    print(f"Generated 100% Unique Photo [{idx}]: {out_path}")
    return out_path

# Generate 12 distinct photo assets
configs = [
    (1, "Anti-Tarnish Emerald Kada", "Kada", (245, 243, 238), (212, 175, 55), (39, 174, 96), "kada_emerald"),
    (2, "CZ Infinity Pendant Necklace", "Necklace", (235, 240, 248), (192, 192, 192), (41, 128, 185), "pendant_infinity"),
    (3, "Pearl Clover Earrings", "Earrings", (255, 250, 245), (245, 245, 245), (212, 175, 55), "pearl_clover"),
    (4, "Solitaire Diamond Ring", "Ring", (248, 244, 236), (212, 175, 55), (255, 255, 255), "ring_diamond"),
    (5, "Kandy 316L Snake Gold Chain", "Chain", (250, 248, 240), (212, 175, 55), (180, 140, 30), "snake_chain"),
    (6, "Ruby Red CZ Choker", "Choker", (255, 240, 240), (212, 175, 55), (192, 57, 43), "ruby_choker"),
    (7, "Heavy Gold Curb Chain", "Chain", (242, 242, 242), (212, 175, 55), (120, 90, 20), "curb_chain"),
    (8, "Traditional Gold Jhumkas", "Jhumkas", (255, 248, 230), (212, 175, 55), (230, 126, 34), "drop_jhumka"),
    (9, "Royal Sapphire Blue Ring", "Ring", (235, 245, 255), (212, 175, 55), (26, 82, 118), "sapphire_ring"),
    (10, "Luxury Tennis Crystal Bracelet", "Bracelet", (250, 250, 250), (200, 200, 200), (255, 255, 255), "tennis_bracelet"),
    (11, "Black Enamel Gold Kada", "Kada", (240, 240, 240), (212, 175, 55), (20, 20, 20), "black_enamel_kada"),
    (12, "Multi-Strand Layered Necklace", "Necklace", (252, 248, 238), (212, 175, 55), (241, 196, 15), "layered_necklace")
]

os.makedirs('assets', exist_ok=True)
for c in configs:
    create_unique_jewelry_photo(*c)
