"""Génère les SVG du logo CampusFlow : pictogramme, logo complet clair et sombre."""
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

font_path, out_dir = sys.argv[1], sys.argv[2]
font = TTFont(font_path)
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
upm = font["head"].unitsPerEm
ascender = font["hhea"].ascent

INK, YELLOW, BLUE = "#111111", "#FFD23F", "#5B8CFF"

def wordmark(text, size, tracking_em):
    """Tracé du texte, origine en haut à gauche ; renvoie (d, largeur, hauteur de capitale)."""
    scale = size / upm
    pen = SVGPathPen(glyphs)
    x = 0.0
    for i, ch in enumerate(text):
        name = cmap[ord(ch)]
        # y vers le bas en SVG : on retourne l'axe et on place la ligne de base à `ascender`.
        tpen = TransformPen(pen, (scale, 0, 0, -scale, x, ascender * scale))
        glyphs[name].draw(tpen)
        x += glyphs[name].width * scale
        if i < len(text) - 1:
            x += tracking_em * size
    cap = font["OS/2"].sCapHeight * scale
    return pen.getCommands(), x, cap, ascender * scale

def mark(x=0, y=0, s=64, ink=INK, tile=YELLOW, dot=BLUE, shadow=True):
    """Pictogramme 64×64 (mis à l'échelle s) : tuile jaune, « C » en anneau, point bleu."""
    k = s / 64
    g = f'<g transform="translate({x} {y}) scale({k})">'
    if shadow:
        g += f'<rect x="6" y="6" width="56" height="56" rx="16" fill="{ink}"/>'
    g += f'<rect x="2" y="2" width="56" height="56" rx="16" fill="{tile}" stroke="{ink}" stroke-width="3"/>'
    # « C » : arc de cercle (centre 28,30 ; rayon 14) ouvert à droite, extrémités arrondies.
    g += f'<path d="M37.9 20.1 A14 14 0 1 0 37.9 39.9" fill="none" stroke="{ink}" stroke-width="7" stroke-linecap="round"/>'
    # Le « flow » : point bleu dans l'ouverture du C.
    g += f'<circle cx="42.5" cy="30" r="4.6" fill="{dot}" stroke="{ink}" stroke-width="2.5"/>'
    return g + "</g>"

def svg(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" '
            f'width="{w:.0f}" height="{h:.0f}" role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n')

# 1. Pictogramme seul (icône, favicon).
open(f"{out_dir}/logo-mark.svg", "w").write(svg(64, 64, mark(), "CampusFlow"))

# 2. Logo complet : pictogramme + « CampusFlow ».
d, width, cap, base = wordmark("CampusFlow", 46, -0.03)
mark_size, gap, pad = 64, 16, 0
h = mark_size
text_y = (mark_size - 6) / 2 - base + cap / 2 + 2  # centre la capitale sur la tuile
for name, ink in (("logo", INK), ("logo-dark", "#F6F4EC")):
    body = mark(shadow=True) if name == "logo" else mark(shadow=False)
    body += f'<path transform="translate({mark_size + gap} {text_y:.2f})" d="{d}" fill="{ink}"/>'
    open(f"{out_dir}/{name}.svg", "w").write(svg(mark_size + gap + width + 2, h, body, "CampusFlow"))

print(f"mot-symbole : largeur {width:.1f}, capitale {cap:.1f}")

# 3. Icône d'app (écran d'accueil, PWA) : fond plein, le système arrondit les coins.
#    Le C et le point sont centrés dans une zone sûre de 60 %.
app = (f'<rect width="512" height="512" fill="{YELLOW}"/>'
       f'<g transform="translate(256 256) scale(8.6) translate(-28.8 -30)">'
       f'<path d="M37.9 20.1 A14 14 0 1 0 37.9 39.9" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>'
       f'<circle cx="42.5" cy="30" r="4.6" fill="{BLUE}" stroke="{INK}" stroke-width="2.5"/></g>')
open(f"{out_dir}/app-icon.svg", "w").write(svg(512, 512, app, "CampusFlow"))

# 4. Favicon : tuile pleine page, sans ombre, C plus épais pour les petites tailles.
fav = (f'<rect x="1.5" y="1.5" width="61" height="61" rx="16" fill="{YELLOW}" stroke="{INK}" stroke-width="3"/>'
       f'<g transform="translate(32 32) scale(1.18) translate(-28.8 -30)">'
       f'<path d="M37.9 20.1 A14 14 0 1 0 37.9 39.9" fill="none" stroke="{INK}" stroke-width="8.5" stroke-linecap="round"/>'
       f'<circle cx="42.5" cy="30" r="5" fill="{BLUE}" stroke="{INK}" stroke-width="2.5"/></g>')
open(f"{out_dir}/favicon.svg", "w").write(svg(64, 64, fav, "CampusFlow"))
