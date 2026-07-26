import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

base_img_path = r'C:\Users\91636\.gemini\antigravity-ide\brain\9438da06-7f01-4306-893b-97bede64edec\kandy_base_photo_1785080151966.png'
orig_user_path = r'C:\Users\91636\.gemini\antigravity-ide\brain\9438da06-7f01-4306-893b-97bede64edec\media__1785079310861.png'

# Fonts
font_dir = r'C:\Windows\Fonts'
georgia_reg = os.path.join(font_dir, 'georgia.ttf')
georgia_bold = os.path.join(font_dir, 'georgiab.ttf')
arial_reg = os.path.join(font_dir, 'arial.ttf')
arial_bold = os.path.join(font_dir, 'arialbd.ttf')

# 1. CREATE DESKTOP BANNER (2048 x 1092)
def create_desktop_banner():
    # Load base image and scale up cleanly
    base = Image.open(base_img_path).convert('RGBA')
    base = base.resize((2048, 1092), Image.Resampling.LANCZOS)
    
    # Overlay draw
    overlay = Image.new('RGBA', base.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)
    
    # Font sizes for 2048x1092
    f_star = ImageFont.truetype(georgia_reg, 32)
    f_sub_top = ImageFont.truetype(arial_reg, 24)
    f_title = ImageFont.truetype(georgia_reg, 120)
    f_sub_bot = ImageFont.truetype(arial_reg, 26)
    f_badge_title = ImageFont.truetype(arial_bold, 18)
    f_badge_sub = ImageFont.truetype(arial_reg, 15)
    f_btn = ImageFont.truetype(arial_bold, 22)
    f_corner_title = ImageFont.truetype(georgia_bold, 28)
    f_corner_sub = ImageFont.truetype(arial_reg, 15)
    f_footer = ImageFont.truetype(arial_reg, 22)

    # Colors
    c_gold = (160, 135, 100, 255)
    c_dark = (35, 30, 25, 255)
    c_gray = (100, 95, 90, 255)
    c_bg_dark = (40, 35, 30, 255)
    
    # --- Top Right Corner Badge ---
    # Box bounds: x1=1680, y1=60, x2=1980, y2=170
    bx1, by1, bx2, by2 = 1660, 60, 1980, 170
    draw.rectangle([bx1, by1, bx2, by2], outline=(140, 120, 95, 220), width=2)
    draw.text((bx1 + 25, by1 + 22), "KANDY 316L", font=f_corner_title, fill=c_dark)
    draw.text((bx1 + 25, by1 + 65), "PREMIUM STAINLESS STEEL", font=f_corner_sub, fill=c_gray)
    
    # --- Left Main Branding ---
    # Top star & anti-tarnish jewelry text
    cx = 480
    draw.text((cx, 130), "✦", font=f_star, fill=c_gold, anchor="mm")
    
    # Lines on sides of top sub
    draw.line([(cx - 300, 190), (cx - 140, 190)], fill=(180, 165, 145, 180), width=2)
    draw.text((cx, 190), "A N T I   T A R N I S H   J E W E L R Y", font=f_sub_top, fill=c_gold, anchor="mm")
    draw.line([(cx + 140, 190), (cx + 300, 190)], fill=(180, 165, 145, 180), width=2)
    
    # Main Title: VFS JEWELS
    draw.text((cx, 310), "VFS JEWELS", font=f_title, fill=c_dark, anchor="mm")
    
    # Bottom sub line
    draw.line([(cx - 280, 420), (cx - 160, 420)], fill=(180, 165, 145, 180), width=2)
    draw.text((cx, 420), "T I M E L E S S   B E A U T Y.   E V E R Y D A Y   S H I N E.", font=f_sub_bot, fill=c_dark, anchor="mm")
    draw.line([(cx + 160, 420), (cx + 280, 420)], fill=(180, 165, 145, 180), width=2)
    
    # 4 Badges grid (x positions: 160, 370, 580, 790)
    badges = [
      ("💧", "ANTI TARNISH", "LONG LASTING SHINE"),
      ("🛡️", "WATER RESISTANT", "MADE FOR EVERYDAY"),
      ("✨", "HYPOALLERGENIC", "SKIN FRIENDLY"),
      ("💎", "PREMIUM QUALITY", "CRAFTED TO PERFECTION")
    ]
    
    start_x = 160
    gap = 210
    by = 560
    for idx, (icon, t1, t2) in enumerate(badges):
        bx = start_x + idx * gap
        # Vertical divider line
        if idx > 0:
            draw.line([(bx - 20, by - 20), (bx - 20, by + 70)], fill=(200, 190, 175, 180), width=1)
        draw.text((bx + 15, by), icon, font=ImageFont.truetype(arial_reg, 32), fill=c_gold)
        draw.text((bx + 60, by), t1, font=f_badge_title, fill=c_dark)
        draw.text((bx + 60, by + 28), t2, font=f_badge_sub, fill=c_gray)
        
    # Dark Button
    btn_x1, btn_y1, btn_x2, btn_y2 = 220, 710, 680, 790
    draw.rectangle([btn_x1, btn_y1, btn_x2, btn_y2], fill=c_bg_dark)
    draw.text(((btn_x1 + btn_x2)//2, (btn_y1 + btn_y2)//2), "SHINE WITHOUT COMPROMISE   →", font=f_btn, fill=(255, 255, 255, 255), anchor="mm")

    # Bottom Dark Footer Strip
    footer_y1 = 1010
    draw.rectangle([0, footer_y1, 2048, 1092], fill=c_bg_dark)
    draw.text((1024, footer_y1 + 41), "E L E G A N T.   D U R A B L E.   D E S I G N E D   F O R   Y O U.   ✦", font=f_footer, fill=(240, 235, 225, 255), anchor="mm")

    out = Image.alpha_composite(base, overlay)
    out.save(r'C:\Users\91636\.gemini\antigravity-ide\scratch\vfs-jewels-git\assets\hero-kandy-desktop.png')
    print('Created desktop banner: assets/hero-kandy-desktop.png')

# 2. CREATE MOBILE BANNER (1080 x 1350)
def create_mobile_banner():
    base = Image.open(base_img_path).convert('RGBA')
    # Crop right portion with jewelry for top half, clean silk for bottom half
    base = base.resize((1440, 768), Image.Resampling.LANCZOS)
    
    canvas = Image.new('RGBA', (1080, 1350), (250, 247, 242, 255))
    # Paste base photo in top/right portion
    canvas.paste(base, (-200, 0))
    
    draw = ImageDraw.Draw(canvas)
    
    # Mobile fonts
    f_star = ImageFont.truetype(georgia_reg, 28)
    f_sub_top = ImageFont.truetype(arial_reg, 20)
    f_title = ImageFont.truetype(georgia_reg, 82)
    f_sub_bot = ImageFont.truetype(arial_reg, 20)
    f_badge_title = ImageFont.truetype(arial_bold, 18)
    f_badge_sub = ImageFont.truetype(arial_reg, 14)
    f_btn = ImageFont.truetype(arial_bold, 22)
    f_corner_title = ImageFont.truetype(georgia_bold, 24)
    f_corner_sub = ImageFont.truetype(arial_reg, 14)
    f_footer = ImageFont.truetype(arial_reg, 18)

    c_gold = (160, 135, 100, 255)
    c_dark = (35, 30, 25, 255)
    c_gray = (100, 95, 90, 255)
    c_bg_dark = (40, 35, 30, 255)

    # Top Corner Badge on Mobile (x1=40, y1=40)
    bx1, by1, bx2, by2 = 40, 40, 340, 130
    draw.rectangle([bx1, by1, bx2, by2], outline=(140, 120, 95, 220), width=2, fill=(255, 255, 255, 180))
    draw.text((bx1 + 18, by1 + 18), "KANDY 316L", font=f_corner_title, fill=c_dark)
    draw.text((bx1 + 18, by1 + 54), "PREMIUM STAINLESS STEEL", font=f_corner_sub, fill=c_gray)

    # Main Center Branding (y=580 down)
    cx = 540
    draw.text((cx, 580), "✦", font=f_star, fill=c_gold, anchor="mm")
    draw.text((cx, 630), "A N T I   T A R N I S H   J E W E L R Y", font=f_sub_top, fill=c_gold, anchor="mm")
    draw.text((cx, 730), "VFS JEWELS", font=f_title, fill=c_dark, anchor="mm")
    draw.text((cx, 820), "TIMELESS BEAUTY. EVERYDAY SHINE.", font=f_sub_bot, fill=c_dark, anchor="mm")

    # 2x2 Grid for Mobile Badges
    badges = [
      ("💧 ANTI TARNISH", "Long Lasting Shine", 180, 900),
      ("🛡️ WATER RESISTANT", "Made For Everyday", 580, 900),
      ("✨ HYPOALLERGENIC", "Skin Friendly", 180, 990),
      ("💎 PREMIUM QUALITY", "Crafted To Perfection", 580, 990)
    ]
    for title, sub, x, y in badges:
        draw.text((x, y), title, font=f_badge_title, fill=c_dark)
        draw.text((x, y + 26), sub, font=f_badge_sub, fill=c_gray)

    # Mobile Button
    btn_x1, btn_y1, btn_x2, btn_y2 = 140, 1100, 940, 1200
    draw.rectangle([btn_x1, btn_y1, btn_x2, btn_y2], fill=c_bg_dark)
    draw.text((cx, 1150), "SHINE WITHOUT COMPROMISE   →", font=f_btn, fill=(255, 255, 255, 255), anchor="mm")

    # Mobile Dark Footer Strip
    footer_y1 = 1270
    draw.rectangle([0, footer_y1, 1080, 1350], fill=c_bg_dark)
    draw.text((cx, footer_y1 + 40), "ELEGANT. DURABLE. DESIGNED FOR YOU. ✦", font=f_footer, fill=(240, 235, 225, 255), anchor="mm")

    canvas.save(r'C:\Users\91636\.gemini\antigravity-ide\scratch\vfs-jewels-git\assets\hero-kandy-mobile.png')
    print('Created mobile banner: assets/hero-kandy-mobile.png')

create_desktop_banner()
create_mobile_banner()
