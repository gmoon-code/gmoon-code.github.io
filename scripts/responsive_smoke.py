#!/usr/bin/env python3
"""Responsive smoke test for the public GitHub Pages site.

Runs a local HTTP server started by the CI workflow and verifies that the
document viewport does not acquire horizontal scrolling. Deliberately
scrollable data tables are allowed. The script never writes to page sources.
"""
import asyncio
import json
import pathlib
import sys

from playwright.async_api import async_playwright

BASE = "http://127.0.0.1:8765"
PAGES = (
    "index.html", "research.html", "research-action.html",
    "research-scoping.html", "teaching.html", "teaching-ap-biology.html",
    "teaching-ap-chemistry.html", "teaching-ap-evolution.html",
    "teaching-osmosis-practice.html", "projects.html", "story-method.html",
    "research-methods-studio.html", "interests.html", "about.html",
    "cv.html", "404.html",
)
WIDTHS = (375, 768, 1024, 1440)
ARTIFACTS = pathlib.Path("visual-audit-output")
ARTIFACTS.mkdir(exist_ok=True)

MEASURE = """() => {
  const root = document.documentElement;
  const viewport = window.innerWidth;
  const width = root.scrollWidth;
  const main = document.querySelector("main");
  const extra = [...document.querySelectorAll("main *")]
    .filter(el => {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return false;
      if (rect.right <= viewport + 3 && rect.left >= -3) return false;
      for (let ancestor = el.parentElement; ancestor && ancestor !== main; ancestor = ancestor.parentElement) {
        const s = getComputedStyle(ancestor);
        if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) return false;
      }
      return true;
    }).slice(0, 8).map(el => {
      const r = el.getBoundingClientRect();
      return {tag:el.tagName.toLowerCase(), cls:String(el.className).slice(0,90),
        x:Math.round(r.x), right:Math.round(r.right)};
    });
  return {viewport,scrollWidth:width,overflow:Math.max(0,width-viewport),
    pageTitle:document.title, mainPresent:!!main, culprits:extra};
}"""

async def main():
    failures = []
    results = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        for width in WIDTHS:
            context = await browser.new_context(
                viewport={"width": width, "height": 900},
                device_scale_factor=1,
                reduced_motion="reduce",
            )
            page = await context.new_page()
            for filename in PAGES:
                try:
                    response = await page.goto(
                        f"{BASE}/{filename}", wait_until="domcontentloaded",
                        timeout=20000,
                    )
                    await page.locator("main").wait_for(timeout=5000)
                    await page.wait_for_timeout(160)
                    result = await page.evaluate(MEASURE)
                    # Sample computed styles from actual page links. An inline
                    # source must look clickable before hover, including on phones.
                    if filename in ("interests.html", "research-scoping.html",
                                    "story-method.html", "research-methods-studio.html"):
                        affordance = await page.evaluate("""() => {
                          const a = document.querySelector(
                            '#main p a[href^="https://"]:not(.inline-link):not(.control)'
                          );
                          if (!a) return {error:"inline external link missing"};
                          const style = getComputedStyle(a);
                          const after = getComputedStyle(a, "::after").content;
                          a.focus();
                          const focused = getComputedStyle(a);
                          return {label:a.textContent.trim().slice(0,60),
                            underline:style.textDecorationLine,
                            color:style.color,
                            after, focusOutline:focused.outlineStyle};
                        }""")
                        result["linkAffordance"] = affordance
                        if (affordance.get("error") or
                                "underline" not in affordance.get("underline", "") or
                                "↗" not in affordance.get("after", "") or
                                affordance.get("focusOutline") in ("none", "")):
                            failures.append({"page": filename, "viewport": width,
                                             "linkAffordance": affordance})
                    if filename == "teaching-ap-chemistry.html":
                        # This case now has research references but no in-prose
                        # outbound link. Test that the cited sources remain visible.
                        reference = await page.evaluate("""() => {
                          const a = document.querySelector(
                            '#main .teaching-source-list li a[href^="https://"]'
                          );
                          if (!a) return {error:"source link missing"};
                          a.focus();
                          const style = getComputedStyle(a);
                          return {underline:style.textDecorationLine,
                            focusOutline:style.outlineStyle};
                        }""")
                        result["referenceAffordance"] = reference
                        if (reference.get("error") or
                                "underline" not in reference.get("underline", "") or
                                reference.get("focusOutline") in ("none", "")):
                            failures.append({"page": filename, "viewport": width,
                                             "referenceAffordance": reference})
                    if filename == "interests.html":
                        gallery = await page.evaluate("""() => {
                          const a = document.querySelector("#main .pungmul-gallery a");
                          return a ? getComputedStyle(a, "::after").content : "";
                        }""")
                        result["galleryCue"] = gallery
                        if "View photo" not in gallery:
                            failures.append({"page": filename, "viewport": width,
                                             "galleryCue": gallery})
                        media = await page.evaluate("""() => {
                          const cards = [...document.querySelectorAll("#main .media-entry")];
                          return cards.map(card => {
                            const row = card.querySelector("p.media-explore");
                            const link = row?.querySelector("a");
                            const links = [...card.querySelectorAll("a")];
                            const review = card.querySelector("p:not(.meta):not(.media-explore)");
                            return {heading:card.querySelector("h3")?.textContent,
                              hasRow:!!row, links:links.length,
                              reviewHasLinks:!!review?.querySelector("a"),
                              visible:!!link && getComputedStyle(link).display !== "none",
                              underline:link ? getComputedStyle(link).textDecorationLine : "",
                              external:!!link && /^https?:/.test(link.href)};
                          });
                        }""")
                        result["mediaResources"] = media
                        if (len(media) != 6 or any(
                                not card["hasRow"] or card["links"] != 1 or
                                card["reviewHasLinks"] or not card["visible"] or
                                "underline" not in card["underline"] or
                                not card["external"] for card in media)):
                            failures.append({"page": filename, "viewport": width,
                                             "mediaResources": media})
                    if width == 1440:
                        # Local images should decode from the actual staged site,
                        # including images that normally load only when scrolled into view.
                        local_images = await page.evaluate("""async () => {
                          const images = [...document.querySelectorAll(
                            'main img[src^="assets/"]'
                          )];
                          return Promise.all(images.map(async img => {
                            try {
                              await img.decode();
                              return {src:img.getAttribute("src"),
                                loaded:img.naturalWidth > 0};
                            } catch (e) {
                              return {src:img.getAttribute("src"), loaded:false};
                            }
                          }));
                        }""")
                        result["localImages"] = local_images
                        if any(not img["loaded"] for img in local_images):
                            failures.append({"page": filename, "viewport": width,
                                             "localImages": local_images})
                    if filename in ("story-method.html",
                                    "research-methods-studio.html") and width in (375, 1440):
                        # Preview controls must open the expected first-party app
                        # and return to a keyboard-accessible closed state.
                        preview = page.locator("[data-live-preview]")
                        open_button = preview.locator("[data-preview-open]")
                        await open_button.wait_for(state="visible", timeout=5000)
                        await open_button.click()
                        frame = preview.locator("[data-preview-stage] iframe")
                        await frame.wait_for(state="attached", timeout=5000)
                        src = await frame.get_attribute("src")
                        expected = ("/memory-palace-u1-8/" if
                                    filename == "story-method.html" else
                                    "/research-methods/")
                        escaped = False
                        await page.keyboard.press("Escape")
                        if await frame.count() == 0:
                            await open_button.wait_for(state="visible", timeout=5000)
                            escaped = True
                        result["previewTest"] = {
                            "path": src, "expectedPath": expected,
                            "closedWithEscape": escaped}
                        if not src or expected not in src or not escaped:
                            failures.append({"page": filename, "viewport": width,
                                             "previewTest": result["previewTest"]})
                    if filename == "teaching.html":
                        has_novice = await page.locator("#teaching-resources").count()
                        if has_novice:
                            failures.append({"page": filename, "viewport": width,
                                             "unexpectedSection": "#teaching-resources"})
                    result["page"] = filename
                    result["httpStatus"] = response.status if response else None
                    results.append(result)
                    label = "OK" if result["overflow"] <= 3 else "OVERFLOW"
                    print(f"{label} {filename} @{width}px: "
                          f"document {result['scrollWidth']}px / viewport {width}px")
                    if response is None or response.status != 200 or not result["mainPresent"]:
                        failures.append(result)
                    elif result["overflow"] > 3:
                        failures.append(result)
                    if filename in ("index.html", "research.html",
                                    "teaching-ap-chemistry.html", "interests.html") and width in (375, 1440):
                        await page.screenshot(
                            path=str(ARTIFACTS / f"{filename.removesuffix('.html')}-{width}.png"),
                            full_page=True,
                        )
                except Exception as exc:
                    failure = {"page": filename, "viewport": width, "error": str(exc)}
                    results.append(failure)
                    failures.append(failure)
                    print("ERROR", failure, flush=True)
            await context.close()
        await browser.close()
    (ARTIFACTS / "results.json").write_text(
        json.dumps({"results": results, "failures": failures}, indent=2), encoding="utf-8"
    )
    if failures:
        print(f"\n{len(failures)} responsive rendering failure(s):")
        for item in failures:
            print(json.dumps(item, ensure_ascii=False))
        return 1
    print(f"\nAll {len(results)} browser / viewport checks passed.")
    return 0

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
