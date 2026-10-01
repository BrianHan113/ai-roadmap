"""Generate the PWA / home-screen icons in icons/. Run once: python scripts/make_icons.py"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "icons"
OUT.mkdir(exist_ok=True)

BG = (27, 31, 59)        # deep indigo
PATH = (124, 140, 255)   # route line
NODES = [(255, 196, 92), (124, 214, 180), (255, 132, 132)]


def draw(size, rounded):
    s = size * 4  # supersample for smooth edges
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.22), fill=BG)
    else:
        d.rectangle([0, 0, s, s], fill=BG)
    # Content stays inside the central ~60% so it survives maskable cropping.
    pts = [(0.27, 0.68), (0.43, 0.47), (0.57, 0.58), (0.73, 0.34)]
    pts = [(x * s, y * s) for x, y in pts]
    w = s * 0.06
    for a, b in zip(pts, pts[1:]):
        d.line([a, b], fill=PATH, width=int(w))
    for x, y in pts:  # round the joints
        d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=PATH)
    for (x, y), c in zip([pts[0], pts[1], pts[3]], NODES):
        r = s * 0.075
        d.ellipse([x - r, y - r, x + r, y + r], fill=c)
    # ring around the destination
    x, y = pts[3]
    r = s * 0.12
    d.ellipse([x - r, y - r, x + r, y + r], outline=NODES[2], width=int(s * 0.02))
    return img.resize((size, size), Image.LANCZOS)


draw(192, rounded=False).save(OUT / "icon-192.png")
draw(512, rounded=False).save(OUT / "icon-512.png")
draw(512, rounded=False).save(OUT / "icon-maskable-512.png")
draw(180, rounded=False).convert("RGB").save(OUT / "apple-touch-icon.png")
draw(64, rounded=True).save(OUT / "favicon-64.png")
print("icons written to", OUT)
