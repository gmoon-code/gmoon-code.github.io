"""Render the public academic CV at A4 print size and inspect its PDF geometry.

This is an editorial QA task, not a replacement for human page-by-page review.
"""
import asyncio
import json
from pathlib import Path

import fitz
from playwright.async_api import async_playwright

OUT = Path("visual-audit-cv")
OUT.mkdir(exist_ok=True)
URL = "http://127.0.0.1:8765/cv.html"


async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        page = await browser.new_page(viewport={"width": 794, "height": 1123})
        response = await page.goto(URL, wait_until="networkidle")
        await page.emulate_media(media="print")
        await page.evaluate("document.fonts.ready")
        screen = await page.evaluate("""() => {
          const st = el => el ? getComputedStyle(el).display : null;
          return {
            printButton: st(document.querySelector(".resume-print")),
            topbar: st(document.querySelector(".topbar")),
            sectionCount: document.querySelectorAll(".resume-section").length,
            documentWidth: document.documentElement.scrollWidth,
            viewportWidth: innerWidth,
            title: document.title
          };
        }""")
        await page.pdf(path=str(OUT / "cv-a4.pdf"),
                       prefer_css_page_size=True,
                       print_background=True,
                       tagged=True)
        await browser.close()

    pdf = fitz.open(OUT / "cv-a4.pdf")
    checks = []
    for n, sheet in enumerate(pdf):
        rect = sheet.rect
        spans = []
        for block in sheet.get_text("dict")["blocks"]:
            if block.get("type") != 0:
                continue
            for line in block.get("lines", []):
                spans.extend(line.get("spans", []))
        out_of_bounds = []
        for span in spans:
            x0, y0, x1, y1 = span["bbox"]
            # Allow minor font-metric differences. Actual A4 page edge
            # crossings indicate clipped content or broken print layout.
            if x0 < 12 or y0 < 12 or x1 > rect.width - 12 or y1 > rect.height - 12:
                out_of_bounds.append({"text": span["text"][:80], "bbox": span["bbox"]})
        page_pix = sheet.get_pixmap(matrix=fitz.Matrix(1.25, 1.25), alpha=False)
        page_pix.save(str(OUT / f"cv-a4-page-{n+1}.png"))
        checks.append({
            "page": n + 1, "width": rect.width, "height": rect.height,
            "textSpanCount": len(spans), "outOfBounds": out_of_bounds
        })
    result = {"source": URL, "status": response.status if response else None,
              "pageCount": len(pdf), "computedPrintStyles": screen, "pages": checks}
    (OUT / "cv-print-report.json").write_text(json.dumps(result, indent=2),
                                               encoding="utf-8")
    failures = []
    if result["status"] != 200:
        failures.append("The CV page was not served successfully.")
    if screen["printButton"] != "none" or screen["topbar"] != "none":
        failures.append("Print stylesheet did not hide screen-only controls.")
    if screen["sectionCount"] != 8:
        failures.append("Unexpected number of CV sections.")
    if not 1 <= len(pdf) <= 8:
        failures.append("Unexpected A4 page count.")
    for item in checks:
        if item["outOfBounds"]:
            failures.append(f"Text outside printable page on sheet {item['page']}.")
    print(json.dumps({"summary": result, "failures": failures}, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
