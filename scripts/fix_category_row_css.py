import os

style_css_path = 'style.css'
with open(style_css_path, 'r', encoding='utf-8') as f:
    css = f.read()

category_row_css = '''
/* Homepage Category Row Track & Banner Styling */
.category-track-row {
  margin-bottom: 40px;
  position: relative;
}

.category-banner {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  min-height: 180px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  padding: 24px 32px;
  background-color: #12151e;
  border: 1px solid rgba(212, 175, 55, 0.25);
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
}

.category-banner-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(14,16,23,0.92) 0%, rgba(14,16,23,0.75) 50%, rgba(14,16,23,0.2) 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 24px 32px;
  color: #ffffff;
  z-index: 2;
}

.category-banner-overlay h2 {
  font-family: var(--font-heading);
  font-size: 2.2rem;
  color: #ffffff;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 700;
}

.category-banner-overlay p {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 12px;
  max-width: 480px;
}

.cat-view-all-btn {
  display: inline-flex;
  align-items: center;
  background: #D4AF37;
  color: #121212 !important;
  font-weight: 800;
  font-size: 1.1rem;
  padding: 6px 16px;
  border-radius: 4px;
  text-decoration: none;
  width: fit-content;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  transition: transform 0.2s ease, background 0.2s ease;
}

.cat-view-all-btn:hover {
  transform: translateY(-2px);
  background: #f1c40f;
}

.product-row-scroll {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 12px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.product-row-scroll::-webkit-scrollbar {
  height: 6px;
}

.product-row-scroll::-webkit-scrollbar-thumb {
  background: var(--color-secondary, #D4AF37);
  border-radius: 4px;
}

.product-row-scroll .p-card {
  flex: 0 0 240px;
  max-width: 240px;
}

@media (max-width: 768px) {
  .product-row-scroll .p-card {
    flex: 0 0 170px;
    max-width: 170px;
  }
  .category-banner {
    min-height: 150px;
    padding: 16px 20px;
  }
  .category-banner-overlay h2 {
    font-size: 1.6rem;
  }
  .category-banner-overlay p {
    font-size: 1.05rem;
    margin-bottom: 8px;
  }
}
'''

if '/* Homepage Category Row Track & Banner Styling */' not in css:
    css += '\n' + category_row_css
    with open(style_css_path, 'w', encoding='utf-8') as f:
        f.write(css)
    print("Added category track row & banner styling to style.css")
