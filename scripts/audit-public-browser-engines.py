#!/usr/bin/env python3
"""S5 cross-engine public browser and forced-colours check; browser zoom is a probe."""
import asyncio,json,pathlib
from playwright.async_api import async_playwright

BASE="http://127.0.0.1:8765"
OUT=pathlib.Path("s5-browser-output")
PAGES=("index.html","research.html","research-action.html","research-scoping.html",
"writing-biological-classification.html","projects.html","story-method.html",
"research-methods-studio.html","teaching.html","teaching-ap-biology.html",
"teaching-ap-chemistry.html","teaching-ap-evolution.html","teaching-osmosis-practice.html",
"interests.html","pungmul.html","contact.html","cv.html","404.html")
FORCED=("index.html","research.html","research-action.html","teaching-ap-biology.html","interests.html","cv.html")
FOCUS=("#main","index.html","index.html","research.html","projects.html","teaching.html",
"interests.html","contact.html","cv.html")
METRICS=r"""() => {
const main=document.querySelector('main'),root=document.documentElement;
const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'};
const nested=e=>{for(let a=e.parentElement;a&&a!==main;a=a.parentElement){const s=getComputedStyle(a);if(/(auto|scroll)/.test(s.overflowX)&&a.scrollWidth>a.clientWidth+2)return true;}return false};
const els=[...(main?.querySelectorAll('h1,h2,h3,p,li,figcaption,a,label,button,td,th,blockquote')||[])].filter(visible);
const outside=els.filter(e=>!nested(e)&&(e.getBoundingClientRect().left < -3||e.getBoundingClientRect().right>innerWidth+3));
const clipped=els.filter(e=>{const s=getComputedStyle(e);return ((s.overflowX==='hidden'||s.overflowX==='clip')&&e.scrollWidth>e.clientWidth+3)||((s.overflowY==='hidden'||s.overflowY==='clip')&&e.scrollHeight>e.clientHeight+3)});
const desc=e=>({tag:e.tagName,text:e.textContent.trim().slice(0,72),x:Math.round(e.getBoundingClientRect().left),right:Math.round(e.getBoundingClientRect().right)});
return {innerWidth,outerWidth,devicePixelRatio,visualScale:visualViewport?.scale,
  scrollWidth:root.scrollWidth,mainCount:document.querySelectorAll('main').length,
  h1Count:document.querySelectorAll('main h1').length,navCount:document.querySelectorAll('.site-nav a').length,
  forced:matchMedia('(forced-colors: active)').matches,
  outOfBounds:outside.slice(0,7).map(desc),clipped:clipped.slice(0,7).map(desc)};
}"""
FOCUS_METRICS=r"""() => {
const e=document.activeElement,r=e.getBoundingClientRect(),s=getComputedStyle(e);
return {href:e.getAttribute('href'),visible:r.width>0&&r.height>0&&r.left<innerWidth&&r.right>0&&r.top<innerHeight&&r.bottom>0,outlineStyle:s.outlineStyle,outlineWidth:s.outlineWidth};
}"""
async def visit(browser,engine,page,width,forced=False):
    result={"engine":engine,"page":page,"width":width,"forcedRequested":forced,"errors":[]}
    try:
        tab=await browser.new_page(viewport={"width":width,"height":900},reduced_motion="reduce",forced_colors="active" if forced else "none")
    except Exception as e:
        result["unsupported"]=str(e)[:200]
        return result
    try:
        resp=await tab.goto(f"{BASE}/{page}",wait_until="domcontentloaded",timeout=17000)
        await tab.evaluate("document.fonts.ready")
        result["http"]=resp.status if resp else None
        m=await tab.evaluate(METRICS);result["metrics"]=m
        if result["http"]!=200:result["errors"].append("HTTP not 200")
        if m["scrollWidth"]>width+2:result["errors"].append("document horizontal scrolling")
        if m["outOfBounds"]:result["errors"].append("reading content out of bounds")
        if m["clipped"]:result["errors"].append("reader text clipped")
        if m["mainCount"]!=1 or m["h1Count"]!=1 or m["navCount"]!=7:result["errors"].append("structural landmarks")
        if forced and not m["forced"]:result["unsupported"]="forced-colour simulation not activated by engine"
        actual=[]
        for href in FOCUS if not forced else FOCUS[:1]:
            await tab.keyboard.press("Tab")
            focus=await tab.evaluate(FOCUS_METRICS)
            actual.append(focus)
            if focus["href"]!=href:
                result["errors"].append("keyboard Tab order differs")
                break
            if not focus["visible"]:result["errors"].append("focused item offscreen")
            if focus["outlineStyle"] in ("none","hidden") or focus["outlineWidth"] in ("0px","0"):
                result["errors"].append("focused item has no outline")
        result["tabs"]=actual
        await tab.locator("a.skip-link").focus()
        await tab.keyboard.press("Enter")
        result["skip"]=await tab.evaluate("() => ({hash:location.hash,onMain:document.activeElement?.id==='main'})")
        if result["skip"]["hash"]!="#main" or not result["skip"]["onMain"]:
            result["errors"].append("skip link failed to focus main")
        if forced and page in ("index.html","research.html","teaching-ap-biology.html","cv.html"):
            path=OUT/f"forced-{engine}-{page[:-5]}.png"
            try:
                await tab.screenshot(path=str(path),animations="disabled",timeout=10000)
                result["screenshot"]=str(path)
            except Exception as e:result["screenshotError"]=str(e)[:180]
        return result
    except Exception as e:
        result["errors"].append("runner exception: "+str(e)[:270])
        return result
    finally:await tab.close()

async def zoom(browser,engine,name):
    tab=await browser.new_page(viewport={"width":1280,"height":900})
    result={"engine":engine,"page":name}
    try:
        await tab.goto(f"{BASE}/{name}",wait_until="domcontentloaded",timeout=17000)
        before=await tab.evaluate(METRICS)
        for _ in range(3):await tab.keyboard.press("Control+Equal")
        after=await tab.evaluate(METRICS)
        keys=("innerWidth","devicePixelRatio","visualScale")
        result["before"]={k:before[k] for k in keys}
        result["after"]={k:after[k] for k in keys}
        result["observableChange"]=any(abs(float(after[k] or 0)-float(before[k] or 0))>.01 for k in keys)
        result["conclusion"]=("Viewport or zoom scale changed; cause requires review" if result["observableChange"] else
                              "No observable zoom change from headless keyboard shortcut; actual page zoom not verified")
    except Exception as e:result["error"]=str(e)[:250]
    finally:await tab.close()
    return result

async def main():
    OUT.mkdir(exist_ok=True)
    cases=[];forced_cases=[];zooms=[];engines={}
    async with async_playwright() as pw:
        for engine in ("chromium","firefox","webkit"):
            try:b=await getattr(pw,engine).launch(headless=True)
            except Exception as e:
                engines[engine]={"available":False,"error":str(e)[:280]}
                continue
            engines[engine]={"available":True}
            for width in (320,1280):
                for name in PAGES:
                    x=await visit(b,engine,name,width);cases.append(x)
                    print("PAGE",engine,width,name,len(x["errors"]),x["errors"][:2],flush=True)
            for name in FORCED:
                x=await visit(b,engine,name,320,True);forced_cases.append(x)
                print("FORCED",engine,name,len(x["errors"]),x.get("unsupported"),flush=True)
            for name in ("index.html","research.html","cv.html"):
                x=await zoom(b,engine,name);zooms.append(x)
                print("ZOOM",engine,name,x.get("observableChange"),x.get("error"),flush=True)
            await b.close()
    failed=[x for x in cases+forced_cases if x["errors"]]
    summary={"engines":engines,"publicPages":len(PAGES),"regularCount":len(cases),
             "forcedCount":len(forced_cases),"unsupportedForced":sum(bool(x.get("unsupported")) for x in forced_cases),
             "zoomProbeCount":len(zooms),"zoomObservedCount":sum(bool(x.get("observableChange")) for x in zooms),
             "zoomResults":zooms,"failedCount":len(failed),"failures":failed,
             "limitations":"Playwright Linux Chromium Firefox WebKit are not physical Safari/Firefox devices. Keyboard zoom shortcuts without a measured viewport/scale change do not verify real browser Ctrl-plus. Forced-colour emulation and automatic focus checks do not constitute WCAG certification or screen-reader testing."}
    (OUT/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
    (OUT/"report.json").write_text(json.dumps({"cases":cases,"forced":forced_cases,"zoom":zooms},ensure_ascii=False,indent=2)+"\n")
    print(json.dumps(summary,ensure_ascii=False,indent=2),flush=True)
    return 1 if failed or any(not e["available"] for e in engines.values()) else 0
if __name__=="__main__":raise SystemExit(asyncio.run(main()))
