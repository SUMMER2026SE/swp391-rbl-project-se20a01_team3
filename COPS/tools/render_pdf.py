from __future__ import annotations

import argparse
from pathlib import Path
from PIL import Image, ImageDraw
import pypdfium2 as pdfium


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("output")
    ap.add_argument("--scale", type=float, default=1.35)
    ap.add_argument("--contact-cols", type=int, default=2)
    ap.add_argument("--contact-rows", type=int, default=3)
    args = ap.parse_args()
    out = Path(args.output)
    pages_dir = out / "pages"
    contacts_dir = out / "contacts"
    pages_dir.mkdir(parents=True, exist_ok=True)
    contacts_dir.mkdir(parents=True, exist_ok=True)
    pdf = pdfium.PdfDocument(args.pdf)
    images = []
    for idx in range(len(pdf)):
        page = pdf[idx]
        img = page.render(scale=args.scale).to_pil().convert("RGB")
        path = pages_dir / f"page-{idx+1:03d}.png"
        img.save(path, optimize=True)
        thumb = img.copy()
        thumb.thumbnail((620, 870))
        images.append((idx + 1, thumb))
    per = args.contact_cols * args.contact_rows
    for start in range(0, len(images), per):
        chunk = images[start:start + per]
        cell_w, cell_h = 640, 910
        sheet = Image.new("RGB", (cell_w * args.contact_cols, cell_h * args.contact_rows), "#D9D9D9")
        draw = ImageDraw.Draw(sheet)
        for pos, (page_no, img) in enumerate(chunk):
            col = pos % args.contact_cols
            row = pos // args.contact_cols
            x = col * cell_w + (cell_w - img.width) // 2
            y = row * cell_h + 28 + (cell_h - 35 - img.height) // 2
            sheet.paste(img, (x, y))
            draw.text((col * cell_w + 12, row * cell_h + 8), f"Trang {page_no}", fill="black")
        end = chunk[-1][0]
        sheet.save(contacts_dir / f"contact-{chunk[0][0]:03d}-{end:03d}.png", optimize=True)
    print(f"pages={len(images)} contacts={(len(images)+per-1)//per}")


if __name__ == "__main__":
    main()
