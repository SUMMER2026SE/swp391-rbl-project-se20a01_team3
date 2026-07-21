from pathlib import Path

from pypdf import PdfReader


PDF = Path(r"E:\swp391-rbl-project-se20a01_team3\.codex-work\sds_final_render\Group3_BeeAcademy_SDS_UML_UPDATED.pdf")


def main():
    reader = PdfReader(PDF)
    print(f"pages={len(reader.pages)}")
    needles = ("UC45", "UC46", "UC47", "III. Deployment")
    for index, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        hits = [needle for needle in needles if needle in text]
        if hits:
            sample = text[:220].encode("ascii", "backslashreplace").decode("ascii")
            print(index, ", ".join(hits), sample)


if __name__ == "__main__":
    main()
