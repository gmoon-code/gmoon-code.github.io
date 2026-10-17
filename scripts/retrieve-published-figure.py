"""Fetch a publicly available full-text source and locate the authors' original Figure 1.
Render the source page for editorial verification before any cropped figure is published.
"""
import json
import pathlib
import urllib.request
import fitz
from PIL import Image

OUT = pathlib.Path("docs/visual-audit")
OUT.mkdir(parents=True, exist_ok=True)
status = {"status": "started", "sources_tried": []}

sources = [
    ("nsf-public-manuscript", "https://par.nsf.gov/servlets/purl/10480924"),
]
try:
    for label, url in sources:
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (academic research image review)"})
            with urllib.request.urlopen(request, timeout=45) as response:
                payload = response.read(18000000)
            if not payload.startswith(b"%PDF") or len(payload) < 50000:
                raise ValueError("Retrieved content was not a substantive PDF")
            pdf = fitz.open(stream=payload, filetype="pdf")
            matches = []
            for i in range(len(pdf)):
                contents = pdf[i].get_text().casefold()
                if "focal science practice" in contents and ("conceptualization" in contents or "conceptualisation" in contents):
                    matches.append(i)
            if not matches:
                raise ValueError("Figure title not located in the PDF text")
            # Prefer the last match when a table or textual mention precedes the figure.
            idx = matches[-1]
            page = pdf[idx]
            pix = page.get_pixmap(matrix=fitz.Matrix(1.65, 1.65), alpha=False)
            path = OUT / "gonzalez-figure-source-page.png"
            pix.save(str(path))
            if label != "nsf-public-manuscript" or idx != 30:
                raise ValueError("Unexpected source/layout. Do not crop without verifying the original figure.")
            # Visible Figure 1 and legend are in this precise panel on page 31.
            # Remove only manuscript header, empty page area, and page number.
            clip = fitz.Rect(60, 68, 554, 421)
            figure_pix = page.get_pixmap(matrix=fitz.Matrix(2.2, 2.2), clip=clip, alpha=False)
            from io import BytesIO
            figure = Image.open(BytesIO(figure_pix.tobytes("png"))).convert("RGB")
            output = pathlib.Path("assets/gonzalez-howard-2023-figure-1.webp")
            output.parent.mkdir(parents=True, exist_ok=True)
            figure.save(output, format="WEBP", quality=89, method=6)
            if figure.width < 950 or figure.height < 650:
                raise ValueError("Figure extraction has unexpected image dimensions")
            status.update(status="source_page_captured", source=label, source_url=url, pages=len(pdf),
                          candidate_pages=matches, selected_page=idx, page_width=page.rect.width,
                          page_height=page.rect.height, saved_image=str(path), figure_image=str(output),
                          clip_pdf_points=list(clip), crop_description="Original figure with manuscript header, empty lower page, and page number removed",
                          figure_width=figure.width, figure_height=figure.height)
            break
        except Exception as e:
            status["sources_tried"].append({"source": label, "issue": str(e)[:420]})
    else:
        status["status"] = "failed"
finally:
    (OUT / "figure-retrieval-status.json").write_text(json.dumps(status, indent=2) + "\n")
print(json.dumps(status, indent=2))
