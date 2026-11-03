#!/usr/bin/env python3
"""C-RV29cm: enlarged-text keyboard and disclosure checks on live academic pages.

Uses the same CSS text-only 200% stress method as C-RV29cl.
It is not a native browser-zoom or screen-reader conformance test.
"""
import asyncio
import json
from pathlib import Path
from urllib.parse import urlparse
import runpy
from playwright.async_api import async_playwright

helper=runpy.run_path("scripts/audit-public-text-enlargement.py")
ENLARGE=helper["ENLARGE"]
METRICS=helper["METRICS"]
BASE=helper["BASE"]
OUT=Path("public-enlarged-text-interactions-output")
PAGES=(
    "research-scoping.html",
    "research-methods-studio.html",
    "teaching-osmosis-practice.html",
    "story-method.html",
    "teaching-ap-chemistry.html",
    "teaching-ap-evolution.html",
)
DISCLOSURES=set(PAGES[:4])
SCROLLTABLES=set(PAGES[-2:])
WIDTHS=(390,1280)

async def inspect(browser,path,width):
    row={"path":path,"width":width,"errors":[],"details":[],"tables":[]}
    context=await browser.new_context(
        viewport={"width":width,"height":850},reduced_motion="reduce"
    )
    page=await context.new_page()
    try:
        response=await page.goto(f"{BASE}/{path}",wait_until="domcontentloaded",timeout=35000)
        await page.locator("main").wait_for(timeout=12000)
        await page.evaluate("document.fonts.ready")
        row["http"]=response.status if response else None
        # Expand content *before* scaling so the disclosure body itself receives
        # double computed font sizes, not only the visible summary label.
        disclosures=await page.locator("main details").all()
        if path in DISCLOSURES and not disclosures:
            row["errors"].append("expected scholarly disclosure not present")
        for details in disclosures:
            summary=details.locator("summary")
            label=(await summary.inner_text()).strip()[:95]
            if await details.get_attribute("open") is None:
                await summary.click(timeout=10000)
            opened=await details.get_attribute("open") is not None
            row["details"].append({"name":label,"preScaleOpened":opened})
            if not opened:
                row["errors"].append("source disclosure would not open")
        row["scale"]=await page.evaluate(ENLARGE)
        await page.evaluate("document.fonts.ready")
        await page.wait_for_timeout(120)
        row["scaled"]=await page.evaluate(METRICS)
        m=row["scaled"]
        if row["http"]!=200:
            row["errors"].append("public origin returned non-200")
        if m["documentWidth"]>width+2:
            row["errors"].append("document horizontal overflow after expanded content and doubled text")
        if m["outside"]:
            row["errors"].append("expanded reader text outside visual viewport")
        if m["clipped"]:
            row["errors"].append("potentially clipped expanded text")
        # Confirm each disclosure can still close and reopen at doubled size.
        for i,details in enumerate(disclosures):
            summary=details.locator("summary")
            await summary.scroll_into_view_if_needed(timeout=15000)
            if width==390:
                fn=OUT/f"{path.replace('.html','').replace('/','_')}-open-detail-{i}.png"
                await page.screenshot(path=str(fn),full_page=False,animations="disabled",timeout=18000)
                row["details"][i]["image"]=str(fn)
            await summary.click(timeout=10000)
            closed=await details.get_attribute("open") is None
            await summary.click(timeout=10000)
            reopened=await details.get_attribute("open") is not None
            row["details"][i].update(closedByClick=closed,reopenedByClick=reopened)
            if not closed or not reopened:
                row["errors"].append("enlarged source disclosure not keyboard/click togglable")
        if path in SCROLLTABLES:
            wrappers=await page.locator("main .teaching-sequence-table-wrap").all()
            hints=await page.locator("main .teaching-table-hint").all()
            if len(wrappers)!=2:
                row["errors"].append("expected two scientific table scroll containers")
            for i,wrapper in enumerate(wrappers):
                await wrapper.scroll_into_view_if_needed(timeout=12000)
                before=await wrapper.evaluate("""e=>({
                    tabIndex:e.tabIndex,ariaLabel:e.getAttribute('aria-label'),
                    scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,
                    scrollLeft:e.scrollLeft,overflowX:getComputedStyle(e).overflowX
                })""")
                hintVisible=(await hints[i].is_visible()) if i<len(hints) else False
                await wrapper.focus()
                await page.keyboard.press("ArrowRight")
                await page.wait_for_timeout(170)
                after=await wrapper.evaluate("e=>e.scrollLeft")
                row["tables"].append({"before":before,"afterArrowRight":after,
                                      "hintVisible":hintVisible})
                if before["tabIndex"]<0 or not before["ariaLabel"]:
                    row["errors"].append("scientific table lacks keyboard focus or accessible name")
                if width==390 and (not hintVisible or after<=before["scrollLeft"]
                                    or before["scrollWidth"]<=before["clientWidth"]+5):
                    row["errors"].append("mobile science table columns inaccessible via keyboard")
                if width==390:
                    fn=OUT/f"{path.replace('.html','')}-table-{i}.png"
                    await page.screenshot(path=str(fn),full_page=False,animations="disabled",timeout=18000)
            post=await page.evaluate(METRICS)
            row["afterScrollDocumentWidth"]=post["documentWidth"]
            if post["documentWidth"]>width+2:
                row["errors"].append("scroll interaction caused document-level overflow")
        # Verify that skip navigation still invokes main focus after scaling.
        await page.locator("a.skip-link").focus(timeout=10000)
        await page.keyboard.press("Enter")
        row["skip"]=await page.evaluate("""()=>({
            hash:location.hash,
            focusedMain:document.activeElement===document.querySelector('main')
        })""")
        if row["skip"]!={"hash":"#main","focusedMain":True}:
            row["errors"].append("keyboard skip-link failed to focus main")
        # Use the site's real navigational anchor. Keyboard Enter must work.
        home=page.locator(".site-nav a[href='index.html']")
        if await home.count()!=1:
            row["errors"].append("single Home navigation anchor missing")
        else:
            await home.focus(timeout=10000)
            await page.keyboard.press("Enter")
            await page.wait_for_url(lambda url:urlparse(str(url)).path in ("/","/index.html"),timeout=10000)
            row["homeNav"]={"url":page.url,"success":urlparse(page.url).path in ("/","/index.html")}
            if not row["homeNav"]["success"]:
                row["errors"].append("keyboard Home activation reached unexpected path")
    except Exception as exc:
        row["errors"].append("browser exception: "+str(exc)[:380])
    finally:
        await context.close()
    return row

async def main():
    OUT.mkdir(parents=True,exist_ok=True)
    cases=[]
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(headless=True)
        try:
            for width in WIDTHS:
                for path in PAGES:
                    case=await inspect(browser,path,width)
                    cases.append(case)
                    print("ENLARGED_INTERACTION",path,width,
                          "PASS" if not case["errors"] else case["errors"],flush=True)
        finally:
            await browser.close()
    failures=[{"path":c["path"],"width":c["width"],"errors":c["errors"],
               "scaled":c.get("scaled"),"skip":c.get("skip")}
              for c in cases if c["errors"]]
    report={
        "scope":"Six selected actual public academic pages at 390 and 1280 CSS px",
        "method":"Double computed font sizes after opening scholarly details; real Chromium keyboard and click interactions on actual HTTPS Pages",
        "nativeZoom":False,
        "limitations":"Not native browser zoom, physical device, screen reader, WCAG certification or exhaustive tab-order audit. Programmatic focus before pressing Enter proves keyboard activation at the selected controls, not complete reachability from a fresh Tab sequence.",
        "totalCases":len(cases),"passedCases":len(cases)-len(failures),
        "failedCount":len(failures),"failures":failures,"cases":cases}
    (OUT/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("ENLARGED_INTERACTION_SUMMARY",json.dumps({
        "total":len(cases),"passed":len(cases)-len(failures),
        "failedCount":len(failures),"failures":failures
    },ensure_ascii=False),flush=True)
    return int(bool(failures))

if __name__=="__main__":
    raise SystemExit(asyncio.run(main()))
