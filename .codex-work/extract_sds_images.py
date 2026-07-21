from pathlib import Path
import zipfile


DOCX = Path(r"E:\swp391-rbl-project-se20a01_team3\docs\Group3_BeeAcademy_SDS_UML_UPDATED.docx")
OUT = Path(r"E:\swp391-rbl-project-se20a01_team3\.codex-work\sds_images")
NAMES = [
    "image23.png", "image24.png",  # UC10 payment/voucher context
    "image37.png", "image38.png",  # UC17 assessment context
    "image43.png", "image44.png",  # UC20 certificate context
    "image91.png", "image92.png",  # final section styling reference
]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(DOCX) as zf:
        for name in NAMES:
            source = f"word/media/{name}"
            target = OUT / name
            target.write_bytes(zf.read(source))
            print(target)


if __name__ == "__main__":
    main()
