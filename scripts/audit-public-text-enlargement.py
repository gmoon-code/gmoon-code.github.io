#!/usr/bin/env python3
"""Read-only production academic reader stress test with simulated 200% text enlargement.

Loads real GitHub Pages in Chromium, measures before and after doubling CSS
font sizes on actual text-bearing elements. This is NOT native browser zoom,
a WCAG conformance test, or a substitute for physical-device testing.
"""
import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

BASE="https://gmoon-code.github.io"
OUT=Path("public-text-enlargement-output")
PAGES=(
    "research.html", "research-action.html", "research-scoping.html",
    "writing-biological-classification.html", "teaching-ap-biology.html",
    "teaching-ap-chemistry.html", "teaching-ap-evolution.html",
    "teaching-osmosis-practice.html", "projects.html", "story-method.html",
    "index.html", "teaching.html", "interests.html", "contact.html",
    "cv.html", "pungmul.html", "research-methods-studio.html",
)
WIDTHS=(390,1280)
SAMPLE_SCREENSHOTS={
    "research.html", "research-scoping.html", "research-action.html",
    "teaching-ap-chemistry.html", "teaching-ap-evolution.html",
    "interests.html", "pungmul.html", "cv.html",
}

METRICS=r"""() => {
  const viewport=window.innerWidth;
  const textSelectors='main h1,main h2,main h3,main h4,main p,main li,main blockquote,main figcaption,main label,main button,main summary,main td,main th,main a,main pre';
  const visible=e=>{
    const cs=getComputedStyle(e),rect=e.getBoundingClientRect();
    return cs.visibility!=='hidden' && cs.display!=='none' &&
      rect.width>0 && rect.height>0;
  };
  const insideIntendedScroller=e=>{
    const p=e.closest('.teaching-sequence-table-wrap, [role="region"][tabindex="0"]');
    return !!(p && getComputedStyle(p).overflowX.match(/auto|scroll/));
  };
  const textBounds=[...document.querySelectorAll(textSelectors)]
    .filter(visible).filter(e=>!insideIntendedScroller(e))
    .map(e=>{
      const r=e.getBoundingClientRect();
      return {tag:e.tagName,txt:(e.textContent||'').trim().slice(0,70),
        left:Math.round(r.left),right:Math.round(r.right),
        top:Math.round(r.top),bottom:Math.round(r.bottom)};
    });
  const outside=textBounds.filter(r=>r.left < -4 || r.right > viewport+4).slice(0,12);
  const clipped=[...document.querySelectorAll('main *')].filter(visible)
    .filter(e=>!insideIntendedScroller(e))
    .filter(e=>{
      const c=getComputedStyle(e);
      return ['hidden','clip'].includes(c.overflowX) &&
        e.scrollWidth > e.clientWidth+6 &&
        (e.textContent||'').trim().length>24;
    }).slice(0,10).map(e=>({
      tag:e.tagName,selector:e.className?.toString().slice(0,70),
      content:(e.textContent||'').trim().slice(0,70),
      scroll:e.scrollWidth,client:e.clientWidth
    }));
  return {
    documentWidth:document.documentElement.scrollWidth,viewportWidth:viewport,
    mainCount:document.querySelectorAll('main').length,
    textNodeElements:document.querySelectorAll('main *').length,
    outside,clipped,mainTextLength:document.querySelector('main')?.innerText.length||0,
    headingCount:document.querySelectorAll('main h1').length
  };
}"""

ENLARGE=r"""() => {
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const targets=new Set();
  let node;
  while((node=walker.nextNode())){
    if(!node.nodeValue.trim())continue;
    const element=node.parentElement;
    if(!element || element.closest('script,style,noscript,svg,[aria-hidden="true"]'))continue;
    if(element.closest('template'))continue;
    const style=getComputedStyle(element);
    if(style.display==='none'||style.visibility==='hidden')continue;
    targets.add(element);
  }
  const styles=[...targets].map(element=>({
    element,size:parseFloat(getComputedStyle(element).fontSize)
  }));
  for(const item of styles){
    if(item.size>0 && isFinite(item.size)){
      item.element.style.setProperty('font-size',(item.size*2)+'px','important');
    }
  }
  return {targets:styles.length,min:Math.min(...styles.map(x=>x.size)),
    max:Math.max(...styles.map(x=>x.size))};
}"""

async def inspect(browser,path,width):
    row={"path":path,"width":width,"errors":[]}
    context=await browser.new_context(viewport={"width":width,"height":850},reduced_motion="reduce")
    page=await context.new_page()
    try:
        response=await page.goto(f"{BASE}/{path}",wait_until="domcontentloaded",timeout=35000)
        await page.locator("main").wait_for(timeout=12000)
        await page.evaluate("document.fonts.ready")
        row["http"]=response.status if response else None
        row["base"]=await page.evaluate(METRICS)
        row["scaledElements"]=await page.evaluate(ENLARGE)
        await page.evaluate("document.fonts.ready")
        await page.wait_for_timeout(120)
        row["scaled"]=await page.evaluate(METRICS)
        if row["http"]!=200:
            row["errors"].append("live public source did not serve HTTP 200")
        if row["scaled"]["mainCount"]!=1 or row["scaled"]["headingCount"]!=1:
            row["errors"].append("academic page lacks main or unique h1")
        if row["scaledElements"]["targets"]<10:
            row["errors"].append("too few text-bearing elements to meaningfully enlarge")
        if row["base"]["documentWidth"]>width+2:
            row["errors"].append("baseline page has horizontal document overflow")
        if row["scaled"]["documentWidth"]>width+2:
            row["errors"].append("200% CSS text enlargement caused horizontal document overflow")
        if row["scaled"]["outside"]:
            row["errors"].append("reader text bounds protruded outside visual viewport")
        if row["scaled"]["clipped"]:
            row["errors"].append("potentially clipped text in overflow-hidden containers")
        if width==390 and (path in SAMPLE_SCREENSHOTS or row["errors"]):
            filename=path.replace("/","_").replace(".html","")
            fn=OUT/f"{filename}-390-enlarged.png"
            await page.screenshot(path=str(fn),full_page=True,animations="disabled",timeout=40000)
            row["screenshot"]=str(fn)
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
                    r=await inspect(browser,path,width)
                    cases.append(r)
                    print("TEXT_ENLARGEMENT",path,width,"PASS" if not r["errors"] else r["errors"],flush=True)
        finally:
            await browser.close()
    errors=[{"page":r["path"],"width":r["width"],"errors":r["errors"],
        "bounds":r.get("scaled",{}).get("outside",[]),
        "clipped":r.get("scaled",{}).get("clipped",[]),
        "scaledWidth":r.get("scaled",{}).get("documentWidth")}
        for r in cases if r["errors"]]
    report={
        "scope":"17 current public scholarly reading pages at 390 and 1280 CSS px",
        "method":"Live HTTPS headless Chromium; double each visible text-bearing element's precomputed CSS font size; inspect document and candidate text bounds",
        "notNativeZoom":True,
        "limitations":"Artificial 200% CSS font-size stress probe, NOT actual Chromium browser zoom or WCAG certification. Automated element dimensions do not prove no glyph overlap, screen-reader accessibility or readability under every device setting. Intentional horizontally scrollable scientific tables are excluded from raw out-of-viewport text bounds.",
        "count":len(cases),"passed":len(cases)-len(errors),
        "failedCount":len(errors),"failures":errors,"cases":cases}
    (OUT/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("TEXT_ENLARGEMENT_SUMMARY",json.dumps({
        "cases":len(cases),"passed":len(cases)-len(errors),
        "failedCount":len(errors),"failures":errors
    },ensure_ascii=False),flush=True)
    return int(bool(errors))

if __name__=="__main__":
    raise SystemExit(asyncio.run(main()))
