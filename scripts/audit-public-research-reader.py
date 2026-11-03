#!/usr/bin/env python3
"""C-RV29bq read-only Chromium check of two actually deployed academic pages.

Unlike earlier localhost browser tests, page navigation, CSS, images and fonts
are fetched directly from the public GitHub Pages host over HTTPS. This is a
bounded, automated browser and static source/served-text check, not a human
visual review, WCAG certification, or a complete site-wide audit.
"""
import asyncio
import hashlib
import json
import pathlib
import sys
import urllib.request
from urllib.parse import urlparse

from playwright.async_api import async_playwright

# The established parity helper uses a hyphenated filename, not an importable
# Python module name. Reuse its exact parser without changing its algorithm.
import runpy
main_text = runpy.run_path("scripts/audit-public-content-parity.py")["main_text"]

BASE = "https://gmoon-code.github.io"
PAGES = ("research.html", "research-action.html")
WIDTHS = (390, 1280)
OUT = pathlib.Path("public-research-reader-output")
METRICS = r"""() => {
  const main = document.querySelector('main');
  const html = document.documentElement;
  const visible = node => {
    const css = getComputedStyle(node),r=node.getBoundingClientRect();
    return css.display !== 'none' && css.visibility !== 'hidden' && r.width > 0 && r.height > 0;
  };
  const candidate = [...(main?.querySelectorAll('h1,h2,h3,p,li,figcaption,blockquote,label,button') || [])].filter(visible);
  const outside = candidate.filter(node => {
    const r=node.getBoundingClientRect();
    return r.left < -3 || r.right > innerWidth + 3;
  }).slice(0,8).map(node => ({
    tag:node.tagName,text:node.textContent.trim().slice(0,85),
    x:Math.round(node.getBoundingClientRect().x),
    right:Math.round(node.getBoundingClientRect().right)
  }));
  const styles = [...document.querySelectorAll('link[rel~="stylesheet"]')].map(node => ({
    href:node.getAttribute('href'),loaded:!!node.sheet
  }));
  const localAnchors = [...(main?.querySelectorAll('a[href^="#"]') || [])]
    .filter(node => node.getAttribute('href').length > 1);
  const missingAnchors = localAnchors.map(node => node.getAttribute('href'))
    .filter(href => !document.getElementById(decodeURIComponent(href.slice(1))));
  const nav = [...document.querySelectorAll('.site-nav a')].map(node => node.getAttribute('href'));
  return {
    title:document.title,mainCount:document.querySelectorAll('main').length,
    h1:[...(main?.querySelectorAll('h1') || [])].map(node=>node.textContent.trim()),
    nav,bodyScrollWidth:html.scrollWidth,viewportWidth:innerWidth,
    outOfBounds:outside,styles,missingAnchors:[...new Set(missingAnchors)],
    figureCount:main?.querySelectorAll('figure').length || 0,
    mainTextCharacters:main?.innerText.length || 0,
    mainImageCount:main?.querySelectorAll('img').length || 0,
    scripts:[...document.scripts].map(node=>node.getAttribute('src')).filter(Boolean)
  };
}"""

def public_html(path):
    req = urllib.request.Request(
        f"{BASE}/{path}",
        headers={"User-Agent": "academic-public-research-reader-proof/1.0", "Accept": "text/html"}
    )
    with urllib.request.urlopen(req, timeout=25) as response:
        return response.status, response.headers.get("Content-Type", ""), response.read().decode("utf-8")

def digest(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

async def inspect(browser, path, width):
    case = {"path": path, "width": width, "publicUrl": f"{BASE}/{path}", "errors": []}
    context = await browser.new_context(viewport={"width": width, "height": 850}, reduced_motion="reduce")
    page = await context.new_page()
    page_errors = []
    page.on("pageerror", lambda error: page_errors.append(str(error)[:250]))
    try:
        response = await page.goto(case["publicUrl"], wait_until="domcontentloaded", timeout=35000)
        await page.locator("main").wait_for(timeout=12000)
        await page.evaluate("document.fonts.ready")
        case["http"] = response.status if response else None
        case["metrics"] = await page.evaluate(METRICS)
        m=case["metrics"]
        if case["http"] != 200:
            case["errors"].append("public main document returned non-200")
        if m["mainCount"] != 1 or len(m["h1"]) != 1:
            case["errors"].append("main/h1 structure differs from expected one each")
        if len(m["nav"]) != 7:
            case["errors"].append("site navigation missing or changed count")
        if m["bodyScrollWidth"] > width + 2:
            case["errors"].append("document has horizontal overflow")
        if m["outOfBounds"]:
            case["errors"].append("reader text protrudes outside viewport")
        if any(not x["loaded"] for x in m["styles"]):
            case["errors"].append("stylesheet not attached to rendered document")
        if m["missingAnchors"]:
            case["errors"].append("in-page links target missing IDs")
        images=[]
        for img in await page.locator("main img").all():
            await img.scroll_into_view_if_needed(timeout=10000)
            try:
                await img.evaluate("""async node => {
                    node.loading='eager';
                    if(!node.complete) await new Promise(resolve => {
                        node.addEventListener('load',resolve,{once:true});
                        node.addEventListener('error',resolve,{once:true});
                        setTimeout(resolve,5000);
                    });
                }""")
                state=await img.evaluate("""node => ({
                    src:node.getAttribute('src'),alt:node.getAttribute('alt'),
                    complete:node.complete,naturalWidth:node.naturalWidth,
                    naturalHeight:node.naturalHeight,
                    rectWidth:node.getBoundingClientRect().width
                })""")
            except Exception as exc:
                state={"error":str(exc)[:250]}
            images.append(state)
        case["images"]=images
        if any(not image.get("complete") or image.get("naturalWidth",0)<=0 for image in images):
            case["errors"].append("one or more on-page images did not load")
        await page.evaluate("window.scrollTo(0,0)")
        await page.screenshot(path=str(OUT/f"{path[:-5]}-{width}.png"), full_page=True, animations="disabled", timeout=25000)
        case["screenshot"]=str(OUT/f"{path[:-5]}-{width}.png")
        # Verify the real production skip link without changing the original HTML.
        await page.locator("a.skip-link").focus()
        await page.keyboard.press("Enter")
        case["skipLink"]=await page.evaluate("""() => ({
            hash:location.hash,focusedMain:document.activeElement === document.querySelector('main')
        })""")
        if case["skipLink"] != {"hash":"#main","focusedMain":True}:
            case["errors"].append("skip link failed to focus main content")
        case["pageErrors"]=page_errors
        return case
    except Exception as exc:
        case["errors"].append("browser exception: "+str(exc)[:350])
        return case
    finally:
        await context.close()

async def main():
    OUT.mkdir(parents=True,exist_ok=True)
    static_checks=[]
    for path in PAGES:
        record={"path":path,"url":f"{BASE}/{path}","errors":[]}
        try:
            status,ctype,served=public_html(path)
            source=pathlib.Path(path).read_text(encoding="utf-8")
            orig=main_text(source)
            live=main_text(served)
            record.update(http=status,contentType=ctype,
                          sourceTextDigest=digest(orig),publicTextDigest=digest(live),
                          textEqual=orig==live,sourceTextCharacters=len(orig),
                          publicTextCharacters=len(live))
            if status!=200 or "html" not in ctype.lower() or orig!=live:
                record["errors"].append("public main text or response differs from checked repository source")
        except Exception as exc:
            record["errors"].append("HTTPS source comparison exception: "+str(exc)[:350])
        static_checks.append(record)
        print("PUBLIC_SOURCE",path,"PASS" if not record["errors"] else record["errors"],flush=True)

    browser_cases=[]
    navigation={}
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(headless=True)
        try:
            for width in WIDTHS:
                for path in PAGES:
                    row=await inspect(browser,path,width)
                    browser_cases.append(row)
                    print("PUBLIC_BROWSER",path,width,"PASS" if not row["errors"] else row["errors"],flush=True)
            # Follow the real public Research hub link using an actual browser.
            page=await browser.new_page(viewport={"width":1280,"height":850})
            try:
                await page.goto(BASE+"/research.html",wait_until="domcontentloaded",timeout=35000)
                await page.locator('main a[href="research-action.html"]').first.click(timeout=10000)
                navigation={"url":page.url,"h1":await page.locator("main h1").inner_text(),
                            "success":urlparse(page.url).path=="/research-action.html"}
                if not navigation["success"]:
                    navigation["error"]="Research hub did not navigate to Action Research"
            except Exception as exc:
                navigation={"success":False,"error":str(exc)[:350]}
            finally:
                await page.close()
        finally:
            await browser.close()
    errors=[{"kind":"source", "page":x["path"],"errors":x["errors"]} for x in static_checks if x["errors"]]
    errors.extend({"kind":"browser","page":x["path"],"width":x["width"],"errors":x["errors"]}
                  for x in browser_cases if x["errors"])
    if not navigation.get("success"):
        errors.append({"kind":"navigation","errors":[navigation.get("error","navigation failed")]})
    report={"scope":"Live production Research and Classroom Action Research pages only",
            "browser":"Playwright Chromium on Linux, headless, real public HTTPS origin",
            "widths":WIDTHS,"staticChecks":static_checks,"browserCases":browser_cases,
            "researchToActionNavigation":navigation,"failedCount":len(errors),"failures":errors,
            "limitations":"Automated DOM, CSS-resource, image, navigation, keyboard-skip, and overflow checks with screenshot artifacts. Screenshots are evidence for later inspection, not human-reviewed in this run. No claim for physical devices, screen readers, other pages or all interaction states."}
    (OUT/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("SUMMARY",json.dumps({"static":[x.get("textEqual") for x in static_checks],
          "browser":[{"page":x["path"],"width":x["width"],"errors":x["errors"]} for x in browser_cases],
          "navigation":navigation,"failedCount":len(errors)},ensure_ascii=False),flush=True)
    return 1 if errors else 0

if __name__=="__main__":
    sys.exit(asyncio.run(main()))
