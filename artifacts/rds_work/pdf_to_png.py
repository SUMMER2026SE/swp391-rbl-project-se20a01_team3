from __future__ import annotations

import sys
from pathlib import Path

import fitz


def main() -> None:
    pdf_path = Path(sys.argv[1])
    output_dir = Path(sys.argv[2])
    output_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf_path)
    scale = 150 / 72
    matrix = fitz.Matrix(scale, scale)
    for index, page in enumerate(doc, 1):
        pix = page.get_pixmap(matrix=matrix, alpha=False)
        pix.save(output_dir / f"page-{index}.png")
    print(f"pages={len(doc)}")


if __name__ == "__main__":
    main()
