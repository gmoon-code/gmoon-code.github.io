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
    "cv.html", "writing-biological-classification.html", "404.html",
)
WIDTHS = (320, 375, 768, 1024, 1440)
CORE_SCREENSHOT_PAGES = (
    "index.html", "research.html", "writing-biological-classification.html",
    "teaching-ap-chemistry.html", "interests.html",
)
EXTENDED_SCREENSHOT_PAGES = (
    "about.html", "cv.html", "projects.html", "teaching.html",
    "research-action.html", "research-scoping.html",
    "teaching-ap-biology.html", "teaching-ap-evolution.html",
    "story-method.html", "research-methods-studio.html",
)
EXPECTED_SECTION = {
    "index.html": "Home",
    "research.html": "Research",
    "research-action.html": "Research",
    "research-scoping.html": "Research",
    "writing-biological-classification.html": "Research",
    "projects.html": "Projects",
    "story-method.html": "Projects",
    "research-methods-studio.html": "Projects",
    "teaching.html": "Teaching",
    "teaching-ap-biology.html": "Teaching",
    "teaching-ap-chemistry.html": "Teaching",
    "teaching-ap-evolution.html": "Teaching",
    "teaching-osmosis-practice.html": "Teaching",
    "interests.html": "Interests",
    "about.html": "About",
    "cv.html": "CV",
    "404.html": None,
}
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
                    # Exercise the actual sequential keyboard route through
                    # the skip link, identity link and all seven navigation links.
                    # This catches broken keyboard order that structural rules
                    # and programmatic focus alone would miss.
                    if width in (320, 1440):
                        expected_tabs = [
                            "#main", "index.html", "index.html",
                            "research.html", "projects.html", "teaching.html",
                            "interests.html", "about.html", "cv.html",
                        ]
                        tab_states = []
                        for expected_href in expected_tabs:
                            await page.keyboard.press("Tab")
                            state = await page.evaluate("""() => {
                              const element = document.activeElement;
                              const r = element.getBoundingClientRect();
                              const style = getComputedStyle(element);
                              return {
                                href:element.getAttribute('href'),
                                tag:element.tagName,
                                outline:style.outlineStyle,
                                visible:r.width > 0 && r.height > 0 &&
                                  r.right > 0 && r.left < innerWidth &&
                                  r.bottom > 0 && r.top < innerHeight
                              };
                            }""")
                            tab_states.append(state)
                            if (state["href"] != expected_href or
                                    state["outline"] in ("none", "") or
                                    not state["visible"]):
                                failures.append({
                                    "page": filename, "viewport": width,
                                    "expectedTab": expected_href, "focused": state,
                                })
                        result["keyboardNavigation"] = tab_states
                    # A keyboard skip link should move focus to the main
                    # landmark, allowing navigation to continue after the header.
                    if width in (320, 375, 1440):
                        skip = page.locator("a.skip-link")
                        await skip.focus()
                        await page.keyboard.press("Enter")
                        skip_target = await page.evaluate("""() => ({
                          hash:location.hash,
                          onMain:document.activeElement === document.querySelector("#main")
                        })""")
                        result["skipNavigation"] = skip_target
                        if skip_target["hash"] != "#main" or not skip_target["onMain"]:
                            failures.append({"page": filename, "viewport": width,
                                             "skipNavigation": skip_target})
                    if width == 1440:
                        canonical = await page.locator('link[rel="canonical"]').all()
                        if filename not in ("404.html", "teaching-osmosis-practice.html"):
                            expected_url = ("https://gmoon-code.github.io/" if
                                            filename == "index.html" else
                                            f"https://gmoon-code.github.io/{filename}")
                            actual_url = (await canonical[0].get_attribute("href")
                                          if len(canonical) == 1 else None)
                            result["canonical"] = actual_url
                            if actual_url != expected_url:
                                failures.append({"page": filename, "viewport": width,
                                                 "canonical": actual_url,
                                                 "expected": expected_url})
                        else:
                            robots = await page.locator('meta[name="robots"]').get_attribute("content")
                            if "noindex" not in robots:
                                failures.append({"page": filename, "viewport": width,
                                                 "missingNoindex": robots})
                    if width == 1440:
                        # Structural and accessibility checks run against the
                        # browser-rendered DOM on every page.
                        structure = await page.evaluate("""() => {
                          const current = [...document.querySelectorAll(
                            '.site-nav a[aria-current="page"]'
                          )].map(a => a.textContent.trim());
                          const unnamedTables = [...document.querySelectorAll(
                            'main table'
                          )].filter(t => !t.getAttribute('aria-label') &&
                            !t.getAttribute('aria-labelledby') &&
                            !t.querySelector('caption')).length;
                          const unlabelledRegions = [...document.querySelectorAll(
                            'main [role="region"]'
                          )].filter(el => !el.getAttribute('aria-label') &&
                            !el.getAttribute('aria-labelledby')).length;
                          const unresolvedFragments = [...document.querySelectorAll(
                            'a[href^="#"]'
                          )].filter(a => {
                            const hash = a.getAttribute('href');
                            return hash && hash.length > 1 &&
                              !document.getElementById(decodeURIComponent(hash.slice(1)));
                          }).map(a => a.getAttribute('href'));
                          return {current, mainHeadingCount:document.querySelectorAll(
                              'main h1').length,
                            imagesWithoutAlt:document.querySelectorAll(
                              'img:not([alt])').length,
                            unnamedTables, unlabelledRegions, unresolvedFragments};
                        }""")
                        result["structure"] = structure
                        expected_section = EXPECTED_SECTION[filename]
                        expected_current = ([expected_section]
                                            if expected_section else [])
                        if (structure["current"] != expected_current or
                                structure["mainHeadingCount"] != 1 or
                                structure["imagesWithoutAlt"] != 0 or
                                structure["unnamedTables"] != 0 or
                                structure["unlabelledRegions"] != 0 or
                                structure["unresolvedFragments"]):
                            failures.append({"page": filename, "viewport": width,
                                             "structure": structure,
                                             "expectedCurrent": expected_current})
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
                    if ((filename in CORE_SCREENSHOT_PAGES and width in (320, 375, 1440)) or
                            (filename in EXTENDED_SCREENSHOT_PAGES and width in (320, 1440))):
                        # Screenshots capture the full page, including sections
                        # normally reached by scrolling. Load and decode local
                        # photographs before capture so lazy-loading does not
                        # create misleading blank rectangles.
                        screenshot_images = await page.evaluate("""async () => {
                          const images = [...document.querySelectorAll('main img')];
                          return Promise.all(images.map(async img => {
                            img.loading = 'eager';
                            const loaded = await Promise.race([
                              img.decode().then(() => img.naturalWidth > 0)
                                .catch(() => false),
                              new Promise(resolve => setTimeout(() => resolve(false), 4500))
                            ]);
                            return {src:img.getAttribute('src'), loaded,
                              local:img.getAttribute('src')?.startsWith('assets/')};
                          }));
                        }""")
                        result["screenshotImages"] = screenshot_images
                        if any(img["local"] and not img["loaded"] for img in screenshot_images):
                            failures.append({"page": filename, "viewport": width,
                                             "screenshotImages": screenshot_images})
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
