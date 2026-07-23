from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]

ITEMS = [
    ("guest/REQ-CRS-001/step-01-open-course-list-original.png", "guest/REQ-CRS-001/step-01-open-course-list-highlighted.png", (729.48, 588.5, 200.22, 64)),
    ("guest/REQ-CRS-001/step-02-search-course-original.png", "guest/REQ-CRS-001/step-02-search-course-highlighted.png", (436.94, 18.5, 576, 42)),
    ("guest/REQ-CRS-002/step-01-select-course-original.png", "guest/REQ-CRS-002/step-01-select-course-highlighted.png", (353, 711, 286.33, 31)),
    ("guest/REQ-CRS-002/step-02-view-course-details-original.png", "guest/REQ-CRS-002/step-02-view-course-details-highlighted.png", (152.5, 220, 896, 75)),
    ("guest/REQ-CRS-003/step-01-open-course-content-original.png", "guest/REQ-CRS-003/step-01-open-course-content-highlighted.png", (340.33, 417, 178.84, 48)),
    ("user/REQ-AUTH-002/step-01-enter-credentials-original.png", "user/REQ-AUTH-002/step-01-enter-credentials-highlighted.png", (545, 337, 350, 264)),
    ("user/REQ-AUTH-002/step-02-submit-login-original.png", "user/REQ-AUTH-002/step-02-submit-login-highlighted.png", (545, 545, 350, 56)),
    ("guest/REQ-AUTH-001/step-01-open-register-form-original.png", "guest/REQ-AUTH-001/step-01-open-register-form-highlighted.png", (537.5, 257, 350, 370)),
    ("user/REQ-AUTH-004/step-01-open-forgot-password-original.png", "user/REQ-AUTH-004/step-01-open-forgot-password-highlighted.png", (545, 471, 350, 170)),
]


def draw_highlight(src: Path, dst: Path, box) -> None:
    img = Image.open(src).convert("RGB")
    x, y, w, h = box
    pad = 6
    x1 = max(3, round(x - pad))
    y1 = max(3, round(y - pad))
    x2 = min(img.width - 4, round(x + w + pad))
    y2 = min(img.height - 4, round(y + h + pad))
    draw = ImageDraw.Draw(img)
    for offset in range(3):
        draw.rounded_rectangle((x1-offset, y1-offset, x2+offset, y2+offset), radius=2, outline="#FF0000", width=1)
    dst.parent.mkdir(parents=True, exist_ok=True)
    img.save(dst, optimize=True)


def main() -> None:
    src_root = ROOT / "output" / "screenshots-original"
    dst_root = ROOT / "output" / "screenshots"
    for src_rel, dst_rel, box in ITEMS:
        draw_highlight(src_root / src_rel, dst_root / dst_rel, box)
    print(f"created={len(ITEMS)}")


if __name__ == "__main__":
    main()
