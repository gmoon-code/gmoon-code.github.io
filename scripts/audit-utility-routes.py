"""Production Stage U2: 404 and legacy About visitor route checks."""
import asyncio, json, re
from pathlib import Path
from urllib.parse import urlparse
import fitz
from playwright.async_api import async_playwright
ROOT="https://gmoon-code.github.io"
MISSING=ROOT+"/unlisted/inside/nested/r5-20261029-missing"
OUT=Path("utility-route-audit")
WIDTHS=[320,375,480,560,700,701,768,900,1024,1140,1440]
REPORT={"route":MISSING,"screens":[],"keyboard":{},"about":{},"print":{},"errors":[]}

async def screen(page):
    return await page.evaluate("""() => {
      const main=document.querySelector('main'),footer=document.querySelector('.site-footer');
      const rect=e=>e.getBoundingClientRect();
      const els=[...document.querySelectorAll('h1,p,a,nav')].filter(e=>e.offsetWidth&&e.offsetHeight);
      return {width:innerWidth,docWidth:document.documentElement.scrollWidth,
        h1:[...document.querySelectorAll('h1')].map(e=>e.textContent.trim()),
        mainCount:document.querySelectorAll('main').length,
        nav:[...document.querySelectorAll('.site-nav a')].map(e=>e.getAttribute('href')),
        gap:Math.round(rect(footer).top-rect(main.lastElementChild).bottom),
        css:[...document.styleSheets].filter(e=>e.href).map(e=>({url:e.href,active:!!e.cssRules})),
        clipped:els.filter(e=>{const s=getComputedStyle(e);return (s.overflowX!=='visible'&&e.scrollWidth>e.clientWidth+3)||(s.overflowY!=='visible'&&e.scrollHeight>e.clientHeight+3)}).map(e=>e.textContent.slice(0,50)),
        escaped:els.filter(e=>!e.closest('.site-nav')&&rect(e).width>0&&(rect(e).left< -3||rect(e).right>innerWidth+3)).map(e=>e.textContent.slice(0,50))};
    }""")
async def main():
    OUT.mkdir(exist_ok=True)
    async with async_playwright() as pw:
        browser=await pw.chromium.launch()
        for w in WIDTHS:
            page=await browser.new_page(viewport={"width":w,"height":900},reduced_motion="reduce")
            errors=[]
            try:
                resp=await page.goto(MISSING,wait_until="load",timeout=30000)
                await page.evaluate("document.fonts.ready")
                d=await screen(page)
                if not resp or resp.status!=404:errors.append("nested production HTTP status not 404")
                if page.url!=MISSING:errors.append("unexpected redirect")
                if d["docWidth"]>w or d["clipped"] or d["escaped"]:errors.append("overflow/clipped text")
                if d["h1"]!=["Page not found"] or d["mainCount"]!=1:errors.append("404 landmark/headline")
                if len(d["nav"])!=7 or any(not x.startswith("/") for x in d["nav"]):errors.append("rooted navigation")
                if d["gap"]!=100:errors.append("footer gap")
                if len(d["css"])<3 or not all(x["active"] for x in d["css"]):errors.append("stylesheets")
                if w in (320,375,768,1024,1440):
                    await page.screenshot(path=str(OUT/f"404-{w}.png"),full_page=True,animations="disabled")
                if w==375:
                    await page.evaluate("document.documentElement.setAttribute('data-moon-theme','dark')")
                    sample=await page.evaluate("""() => {
                      const selectors=['main h1','main p','main .control','footer p','footer a','.site-nav a'];
                      const colors=str=>(str.match(/[\\d.]+/g)||[]).slice(0,3).map(Number);
                      const c=x=>{let a=x/255;return a<=.04045?a/12.92:((a+.055)/1.055)**2.4};
                      const lum=rgb=>.2126*c(rgb[0])+.7152*c(rgb[1])+.0722*c(rgb[2]);
                      return selectors.map(selector=>{let e=document.querySelector(selector);
                        if(!e)return {selector,ratio:null};
                        let fg=colors(getComputedStyle(e).color),bg=[255,255,255],node=e;
                        while(node){let a=(getComputedStyle(node).backgroundColor.match(/[\\d.]+/g)||[]).map(Number);
                          if(a.length>=3&&(a.length===3||a[3]>=.99)){bg=a.slice(0,3);break;}
                          node=node.parentElement;}
                        let l1=lum(fg),l2=lum(bg);
                        return {selector,ratio:Math.round(100*(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05))/100};
                      });
                    }""")
                    d["darkContrast"]=sample
                    if any(x["ratio"] is not None and x["ratio"]<4.5 for x in sample):errors.append("dark text contrast")
                    await page.screenshot(path=str(OUT/"404-dark-375.png"),full_page=True)
                if w==320:
                    await page.keyboard.press("Tab")
                    REPORT["keyboard"]["skipFirst"]=await page.evaluate("document.activeElement?.classList.contains('skip-link')")
                    await page.keyboard.press("Enter")
                    REPORT["keyboard"]["mainFocused"]=await page.evaluate("document.activeElement?.id==='main'")
                    await page.locator('a[href="#page-top"]').click()
                    REPORT["keyboard"]["backTop"]=await page.evaluate("location.hash==='#page-top'&&scrollY<4")
                    await page.locator('a.control.primary[href="/"]').click()
                    REPORT["keyboard"]["home"]=page.url
                    if not all(REPORT["keyboard"][x] for x in ["skipFirst","mainFocused","backTop"]) or urlparse(page.url).path!="/":
                        errors.append("keyboard/navigation")
                REPORT["screens"].append({"width":w,"status":resp.status if resp else None,**d,"errors":errors})
            except Exception as e:REPORT["screens"].append({"width":w,"errors":[str(e)]})
            finally:await page.close()
        for js in (True,False):
            page=await browser.new_page(java_script_enabled=js)
            try:
                await page.goto(ROOT+"/about.html",wait_until="domcontentloaded",timeout=25000)
                await page.wait_for_url(re.compile(r"/contact\.html(?:[?#].*)?$"),timeout=15000)
                REPORT["about"]["redirectJS" if js else "redirectNoJS"]=page.url
            except Exception as e:REPORT["errors"].append("redirect JS="+str(js)+": "+str(e))
            finally:await page.close()
        fallback=await browser.new_page(viewport={"width":320,"height":800},java_script_enabled=False)
        async def intercept(route):
            res=await route.fetch()
            html=await res.text()
            REPORT["about"]["metaRefresh"]=bool(re.search(r'http-equiv="refresh"\s+content="0;\s*url=contact.html"',html,re.I))
            REPORT["about"]["noindex"]=bool(re.search(r'name="robots"\s+content="noindex,follow"',html,re.I))
            REPORT["about"]["canonical"]=bool(re.search(r'rel="canonical"\s+href="https://gmoon-code.github.io/contact.html"',html,re.I))
            html=re.sub(r'<meta\s+http-equiv="refresh"[^>]*>',"<!-- suppressed for fallback inspection -->",html,flags=re.I)
            await route.fulfill(response=res,body=html)
        await fallback.route("**/about.html",intercept)
        try:
            await fallback.goto(ROOT+"/about.html",wait_until="load",timeout=25000)
            REPORT["about"]["fallbackH1"]=await fallback.locator("h1").all_text_contents()
            REPORT["about"]["fallbackHref"]=await fallback.locator("main a").get_attribute("href")
            REPORT["about"]["fallbackOverflow"]=await fallback.evaluate("document.documentElement.scrollWidth>innerWidth")
            await fallback.keyboard.press("Tab")
            REPORT["about"]["fallbackFocus"]=await fallback.evaluate("document.activeElement?.getAttribute('href')==='contact.html'")
            await fallback.screenshot(path=str(OUT/"about-fallback-320.png"),full_page=True)
            await fallback.keyboard.press("Enter")
            await fallback.wait_for_url(re.compile(r"/contact\.html(?:[?#].*)?$"),timeout=15000)
            REPORT["about"]["fallbackDestination"]=fallback.url
        except Exception as e:REPORT["errors"].append("about fallback: "+str(e))
        finally:await fallback.close()
        printer=await browser.new_page()
        try:
            await printer.goto(MISSING,wait_until="load",timeout=25000)
            pdf=await printer.pdf(format="A4",print_background=True)
            (OUT/"404-a4.pdf").write_bytes(pdf)
            doc=fitz.open(stream=pdf,filetype="pdf")
            REPORT["print"]={"pages":len(doc),"words":[len(p.get_text().split()) for p in doc],
              "hasTitle":"Page not found" in "".join(p.get_text() for p in doc),
              "offPageWords":sum(1 for p in doc for a in p.get_text("words") if a[0]<-1 or a[1]<-1 or a[2]>p.rect.width+1 or a[3]>p.rect.height+1)}
            for i,p in enumerate(doc):p.get_pixmap(matrix=fitz.Matrix(1.2,1.2),alpha=False).save(str(OUT/f"404-a4-{i+1}.png"))
        except Exception as e:REPORT["errors"].append("print: "+str(e))
        finally:await printer.close()
        await browser.close()
    a=REPORT["about"]
    if not all(a.get(x) for x in ("metaRefresh","noindex","canonical","fallbackFocus","fallbackDestination")) or a.get("fallbackH1")!=["The About page has moved."] or a.get("fallbackHref")!="contact.html" or a.get("fallbackOverflow"):REPORT["errors"].append("fallback structure/metadata")
    if REPORT["print"].get("pages")!=1 or REPORT["print"].get("offPageWords") or not REPORT["print"].get("hasTitle"):REPORT["errors"].append("printed 404 page")
    REPORT["errors"].extend(f"width {s['width']}: {s['errors']}" for s in REPORT["screens"] if s["errors"])
    (OUT/"report.json").write_text(json.dumps(REPORT,indent=2)+"\n")
    print(json.dumps({"errors":REPORT["errors"],"keyboard":REPORT["keyboard"],"about":REPORT["about"],"print":REPORT["print"],
        "screens":[{"width":s["width"],"status":s.get("status"),"gap":s.get("gap"),"errors":s["errors"]} for s in REPORT["screens"]]},indent=2))
    if REPORT["errors"]:raise SystemExit(1)
if __name__=="__main__":asyncio.run(main())
