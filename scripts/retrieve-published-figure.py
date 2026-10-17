"""Fetch a publicly available full-text source and locate the authors' original Figure 1.
Render the source page for editorial verification before any cropped figure is published.
"""
import json
import pathlib
import urllib.request
import fitz

OUT = pathlib.Path("docs/visual-audit")
OUT.mkdir(parents=True, exist_ok=True)
status = {"status": "started", "sources_tried": []}

sources = [
    ("publisher-pdf", "https://journals.sagepub.com/doi/pdf/10.3102/0013189X231206172?download=true"),
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
            status.update(status="source_page_captured", source=label, source_url=url, pages=len(pdf),
                          candidate_pages=matches, selected_page=idx, page_width=page.rect.width,
                          page_height=page.rect.height, saved_image=str(path))
            break
        except Exception as e:
            status["sources_tried"].append({"source": label, "issue": str(e)[:420]})
    else:
        status["status"] = "failed"
finally:
    (OUT / "figure-retrieval-status.json").write_text(json.dumps(status, indent=2) + "\n")
print(json.dumps(status, indent=2))
