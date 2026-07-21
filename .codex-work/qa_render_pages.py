from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(r"E:\swp391-rbl-project-se20a01_team3\.codex-work\sds_final_render")
PAGES = sorted(ROOT.glob("v2-all-page-*.png"))
OUT = ROOT / "contact_sheets"
OUT.mkdir(exist_ok=True)


def main():
    if not PAGES:
        raise SystemExit("No rendered pages found")
    print(f"pages={len(PAGES)}")
    bad_dimensions = []
    edge_heavy = []
    for path in PAGES:
        with Image.open(path) as image:
            if image.size != (765, 990):
                bad_dimensions.append((path.name, image.size))
            gray = image.convert("L")
            # Flag pages where a non-white mark is unusually close to the edge;
            # this catches likely clipping while allowing the footer rule.
            pix = gray.load(); w, h = gray.size
            edge = []
            for x in range(w):
                edge += [pix[x, y] for y in range(0, 8)]
                edge += [pix[x, y] for y in range(h-8, h)]
            for y in range(h):
                edge += [pix[x, y] for x in range(0, 8)]
                edge += [pix[x, y] for x in range(w-8, w)]
            dark_ratio = sum(value < 220 for value in edge) / len(edge)
            if dark_ratio > 0.12:
                edge_heavy.append((path.name, round(dark_ratio, 3)))

    print("bad_dimensions=", bad_dimensions[:10])
    print("edge_heavy=", edge_heavy[:20])

    thumb_w, thumb_h = 190, 246
    label_h = 24
    for start in range(0, len(PAGES), 12):
        batch = PAGES[start:start+12]
        sheet = Image.new("RGB", (thumb_w*3, (thumb_h+label_h)*4), "white")
        draw = ImageDraw.Draw(sheet)
        for slot, path in enumerate(batch):
            with Image.open(path) as image:
                thumb = image.convert("RGB")
                thumb.thumbnail((thumb_w, thumb_h))
                x = (slot % 3) * thumb_w + (thumb_w-thumb.width)//2
                y = (slot // 3) * (thumb_h+label_h)
                sheet.paste(thumb, (x, y))
            draw.text(((slot % 3)*thumb_w + 6, (slot // 3)*(thumb_h+label_h)+thumb_h+2),
                      path.stem.replace("v2-all-page-", "Page "), fill="#222222")
        sheet.save(OUT / f"sheet-{start//12+1:02d}.png")
        print(OUT / f"sheet-{start//12+1:02d}.png")


if __name__ == "__main__":
    main()
