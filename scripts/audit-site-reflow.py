#!/usr/bin/env python3
"""S4 public portfolio WCAG automation and 320/640/1280 CSS-viewport reflow.

320 CSS pixels approximates 1280 physical pixels at 400% browser page zoom.
640 CSS pixels approximates the same desktop at 200% page zoom.
This is responsive-viewport equivalence, NOT a real browser Ctrl+plus test,
nor a native screen-reader or full WCAG 2.2 conformance certificate.
"""
import asyncio, json, pathlib, re
from collections import Counter
from playwright.async_api import async_playwright

BASE="http://127.0.0.1:8765"
OUTPUT=pathlib.Path("accessibility-reflow-output")
AXE=pathlib.Path("node_modules/axe-core/axe.min.js")
PAGES=(
"index.html","research.html","research-action.html","research-scoping.html",
"writing-biological-classification.html","projects.html","story-method.html",
"research-methods-studio.html","teaching.html","teaching-ap-biology.html",
"teaching-ap-chemistry.html","teaching-ap-evolution.html",
"teaching-osmosis-practice.html","interests.html","pungmul.html",
"contact.html","cv.html","404.html"
)
WIDTHS=(320,640,1280)
AXE_TAGS=["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22a","wcag22aa","best-practice"]
DARK=("index.html","research.html","cv.html","teaching-ap-biology.html","404.html")
# Fragments and slide out panels with accessible scrolling are exempted from
# checking an element's own right margin, but not page-level overflow.
METRICS=r"""() => {
 const root=document.documentElement;
 const main=document.querySelector('main');
 const nodes=[...(main?.querySelectorAll('h1,h2,h3,h4,p,li,a,button,label,figcaption,summary,blockquote,td,th,pre,code')||[])];
 const rect=e=>e.getBoundingClientRect();
 const isVisible=e=>{let r=rect(e),s=getComputedStyle(e);return r.height>0&&r.width>0&&s.display!=='none'&&s.visibility!=='hidden'};
 const exempt=e=>{for(let p=e.parentElement;p&&p!==main;p=p.parentElement){
   let s=getComputedStyle(p);
   if(/(auto|scroll)/.test(s.overflowX)&&p.scrollWidth>p.clientWidth+2)return true;
   if(p.hasAttribute('data-moon-free-placeholder'))return true;
 }return false;};
 let outOfBounds=nodes.filter(isVisible).filter(e=>!exempt(e)&&
   (rect(e).left< -3||rect(e).right>innerWidth+3)).slice(0,12).map(e=>({
   tag:e.tagName,cls:typeof e.className==='string'?e.className.slice(0,70):'',
   text:e.textContent.trim().slice(0,86),
   left:Math.round(rect(e).left),right:Math.round(rect(e).right)}));
 let clipped=nodes.filter(isVisible).filter(e=>{
   let s=getComputedStyle(e);
   return ((s.overflowX==='hidden'||s.overflowX==='clip')&&e.scrollWidth>e.clientWidth+3)||
    ((s.overflowY==='hidden'||s.overflowY==='clip')&&e.scrollHeight>e.clientHeight+3);
 }).slice(0,12).map(e=>({tag:e.tagName,text:e.textContent.trim().slice(0,86)}));
 let tabs=[...document.querySelectorAll('.site-nav a')];
 const focusable=[...document.querySelectorAll('a[href],button:not([disabled]),select,input,textarea,[tabindex]')]
   .filter(e=>isVisible(e)&&getComputedStyle(e).visibility!=='hidden');
 return {
  cssViewport:innerWidth,documentWidth:root.scrollWidth,bodyWidth:document.body.scrollWidth,
  title:document.title,h1:[...document.querySelectorAll('main h1')].map(e=>e.textContent.trim()),
  mainCount:document.querySelectorAll('main').length,
  skip:!!document.querySelector('a.skip-link[href="#main"]'),
  navCount:tabs.length,focusables:focusable.length,outOfBounds,clipped,
  images:[...document.querySelectorAll('main img')].length,
  bottom:Math.round(document.body.getBoundingClientRect().bottom)
 };
}"""
AXE_SCRIPT=r"""async (tags) => {
 const data=await axe.run(document,{
  runOnly:{type:'tag',values:tags},
  resultTypes:['violations','incomplete']
 });
 return {violations:data.violations.map(v=>({
   id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.map(n=>({
    target:n.target,html:n.html.slice(0,220),
    summary:n.failureSummary?.slice(0,400)
   })).slice(0,10)})),
   incomplete:data.incomplete.map(v=>({id:v.id,count:v.nodes.length}))
 };
}"""

async def run_case(browser, name, width):
    page=await browser.new_page(viewport={"width":width,"height":900},
                                reduced_motion="reduce",color_scheme="light")
    record={"page":name,"width":width,"errors":[]}
    try:
        res=await page.goto(f"{BASE}/{name}",wait_until="load",timeout=25000)
        await page.evaluate("document.fonts.ready")
        record["http"]=res.status if res else None
        m=await page.evaluate(METRICS);record["metrics"]=m
        if record["http"]!=200:record["errors"].append("unexpected HTTP status")
        if m["documentWidth"]>width+2:record["errors"].append("document-level horizontal scrolling")
        if m["mainCount"]!=1 or len(m["h1"])!=1:record["errors"].append("main/H1 structure")
        if not m["skip"] or m["navCount"]!=7:record["errors"].append("skip/primary navigation")
        if m["outOfBounds"]:record["errors"].append("reader text outside CSS viewport")
        if m["clipped"]:record["errors"].append("clipped reader text")
        if width==320:
            await page.keyboard.press("Tab")
            first=await page.evaluate("""() => ({
              href:document.activeElement?.getAttribute('href'),
              cls:document.activeElement?.className,
              outline:getComputedStyle(document.activeElement).outlineStyle
            })""")
            record["firstTab"]=first
            if first["href"]!="#main":record["errors"].append("first Tab did not reach Skip to content")
            await page.keyboard.press("Enter")
            focused=await page.evaluate("""() => ({
              hash:location.hash,focused:document.activeElement?.id==='main'
            })""")
            record["skipActivated"]=focused
            if not focused["focused"]:record["errors"].append("Skip to content did not focus main")
        if width in (320,1280):
            await page.add_script_tag(path=str(AXE))
            record["axe"]=await page.evaluate(AXE_SCRIPT,AXE_TAGS)
            if record["axe"]["violations"]:record["errors"].append("automated axe findings")
        if name in DARK and width==320:
            # Do not assume that the shared select is in the source HTML; it
            # may be constructed by appearance.js.
            select=page.locator(".moon-appearance-select")
            if await select.count():
                await select.select_option("dark")
                await page.wait_for_timeout(60)
                theme=await page.evaluate("document.documentElement.getAttribute('data-moon-theme')")
                record["darkTheme"]=theme
                if theme!="dark":record["errors"].append("dark-mode selector did not activate")
                record["axeDark"]=await page.evaluate(AXE_SCRIPT,AXE_TAGS)
                if record["axeDark"]["violations"]:record["errors"].append("dark automated axe findings")
            else:record["errors"].append("appearance select missing")
        if name in ("index.html","research.html","projects.html","teaching.html",
                    "interests.html","pungmul.html","contact.html","cv.html","404.html") and width in (320,640):
            screenshot=OUTPUT/f"{name[:-5]}-{width}.png"
            try:await page.screenshot(path=str(screenshot),full_page=True,animations="disabled",timeout=12000)
            except Exception as exc:record.setdefault("captureErrors",[]).append(str(exc)[:180])
        return record
    except Exception as exc:
        record["errors"].append("test exception: "+str(exc)[:280])
        return record
    finally:await page.close()

async def main():
    OUTPUT.mkdir(exist_ok=True)
    if not AXE.is_file():
        raise SystemExit("Missing axe-core bundle")
    cases=[]
    async with async_playwright() as pw:
        browser=await pw.chromium.launch()
        for width in WIDTHS:
            for name in PAGES:
                entry=await run_case(browser,name,width)
                cases.append(entry)
                print(f"{name:41s} {width:4d}px {len(entry['errors'])} errors "+
                      ",".join(entry['errors'][:3]),flush=True)
        await browser.close()
    failed=[{"page":r["page"],"width":r["width"],"errors":r["errors"],
              "metrics":{k:r.get("metrics",{}).get(k) for k in ("documentWidth","outOfBounds","clipped")},
              "axe":r.get("axe",{}).get("violations"),"axeDark":r.get("axeDark",{}).get("violations")}
            for r in cases if r["errors"]]
    rules=Counter()
    for r in cases:
        for key in ("axe","axeDark"):
            for v in r.get(key,{}).get("violations",[]):
                rules[v["id"]]+=len(v["nodes"])
    result={
      "scope":"18 public pages (About redirect separately completed under U1)",
      "cases":len(cases),"widths":WIDTHS,"axeScanCount":sum("axe" in x for x in cases),
      "darkAxeCount":sum("axeDark" in x for x in cases),
      "failedCases":len(failed),"failures":failed,
      "rules":dict(rules),
      "caveats":"CSS viewport equivalence to 200/400% reflow, not physical browser zoom. Automated axe findings do not certify WCAG. Exemptions apply only to intentional horizontal scroll containers.",
    }
    (OUTPUT/"report.json").write_text(json.dumps(cases,indent=2,ensure_ascii=False)+"\n")
    (OUTPUT/"summary.json").write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n")
    print(json.dumps(result,indent=2,ensure_ascii=False),flush=True)
    return 1 if failed else 0
if __name__=="__main__":raise SystemExit(asyncio.run(main()))
