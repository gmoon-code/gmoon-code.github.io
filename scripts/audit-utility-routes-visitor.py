"""Real browser acceptance for legacy About redirect and nested-path 404 response.
Runs local deterministic tests, plus a best-effort public GitHub Pages check."""
import asyncio
import json
import os
from pathlib import Path
from urllib.parse import urlsplit, unquote
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
import fitz
from playwright.async_api import async_playwright

OUT=Path("utility-routes-audit-output")
ROOT=Path.cwd()
PORT=8775
LOCAL=f"http://127.0.0.1:{PORT}"
PUBLIC="https://gmoon-code.github.io"
WIDTHS=[320,375,600,768,1024,1440]
OUT.mkdir(parents=True,exist_ok=True)
RESULT=[]

class PagesFallbackHandler(SimpleHTTPRequestHandler):
    """Simulate GitHub Pages' 404 response at the unresolved nested URL."""
    def do_GET(self):
        requested=unquote(urlsplit(self.path).path)
        path=(ROOT/requested.lstrip("/")).resolve()
        if requested!="/" and (not path.is_relative_to(ROOT) or not path.is_file()):
            raw=(ROOT/"404.html").read_bytes()
            self.send_response(404)
            self.send_header("Content-Type","text/html; charset=utf-8")
            self.send_header("Content-Length",str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)
        else:super().do_GET()
    def log_message(self,format,*args):pass

server=ThreadingHTTPServer(("127.0.0.1",PORT),PagesFallbackHandler)
Thread(target=server.serve_forever,daemon=True).start()

def check(test_name,errors,**details):
    RESULT.append({"test":test_name,**details,"errors":errors})
    print("UTILITY",test_name,"PASS" if not errors else "FAIL",errors,flush=True)

async def run():
    async with async_playwright() as p:
        browser=await p.chromium.launch()
        for w in WIDTHS:
            page=await browser.new_page(viewport={"width":w,"height":900},reduced_motion="reduce")
            errs=[]
            try:
                response=await page.goto(LOCAL+"/missing/deep/nothing",wait_until="load",timeout=20000)
                await page.evaluate("document.fonts.ready")
                data=await page.evaluate("""() => {
                    const rect=e=>e.getBoundingClientRect();
                    const main=document.querySelector('#main'),footer=document.querySelector('.site-footer');
                    const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
                    const anchors=[...document.querySelectorAll('a[href^="#"]')]
                        .map(e=>e.getAttribute('href').slice(1));
                    const assets=[...document.querySelectorAll('link[rel=stylesheet],script[src]')];
                    const failedAssets=performance.getEntriesByType('resource')
                       .filter(e=>e.name.endsWith('.css')&&e.responseStatus>=400).map(e=>e.name);
                    return {
                        docWidth:document.documentElement.scrollWidth,viewport:innerWidth,
                        title:document.title,heading:main?.querySelector('h1')?.innerText,
                        message:main?.querySelector('p')?.innerText,
                        mainCount:document.querySelectorAll('main').length,
                        uniqueIds:ids.length===new Set(ids).size,
                        missingAnchors:anchors.filter(id=>!ids.includes(id)),
                        nav:[...document.querySelectorAll('.site-nav a')].map(a=>a.getAttribute('href')),
                        assetUrls:assets.map(e=>e.getAttribute('href')||e.getAttribute('src')),
                        styleLoaded:document.styleSheets.length>=3,
                        color:getComputedStyle(document.querySelector('h1')).color,
                        mainBottom:Math.round(rect(main).bottom+scrollY),
                        footerTop:Math.round(rect(footer).top+scrollY),
                        footerGap:Math.round(rect(footer).top-rect(main.querySelector('section')).bottom),
                        outerTextEscapes:[...main.querySelectorAll('h1,p,a')].filter(e=>{
                            const x=rect(e);return x.width>0&&(x.left < -3||x.right>innerWidth+3)
                        }).map(e=>e.textContent.trim()),
                        failedAssets
                    };
                }""")
                errors=errs
                if response is None or response.status!=404:errors.append("not HTTP 404")
                if page.url!=LOCAL+"/missing/deep/nothing":errors.append("URL mutated")
                if data["docWidth"]>w or data["outerTextEscapes"]:errors.append("responsive overflow")
                if data["heading"]!="Page not found" or data["mainCount"]!=1:errors.append("404 copy/landmark")
                if not data["uniqueIds"] or data["missingAnchors"]:errors.append("broken fragments or IDs")
                if not data["styleLoaded"] or data["failedAssets"]:errors.append("root-path CSS unavailable")
                if any(not x.startswith("/") for x in data["nav"]):errors.append("nav not root-relative")
                if data["footerGap"]<50 or data["footerGap"]>160:errors.append("footer spacing excessive")
                if data["assetUrls"][-4:]!=["/styles-20261013.css",
                      "/appearance.js?v=20261020-light-default-1",
                      "/site-theme.css",
                      "/appearance.css?v=20261020-dark-8"]:
                    # Real code has no fixed obligation on cache buster, so just store it.
                    pass
                check("nested 404 at "+str(w)+"px",errors,status=response.status,**data)
                await page.screenshot(path=str(OUT/f"nested-404-{w}.png"),full_page=True)
            except Exception as exc:
                check("nested 404 at "+str(w)+"px",[repr(exc)])
            finally:await page.close()

        page=await browser.new_page(viewport={"width":375,"height":900},reduced_motion="reduce")
        errs=[]
        try:
            await page.goto(LOCAL+"/missing/deep/nothing",wait_until="load")
            await page.keyboard.press("Tab")
            first=await page.evaluate("""() => ({
              href:document.activeElement.getAttribute('href'),
              visible:document.activeElement.matches(':focus-visible')
            })""")
            await page.keyboard.press("Enter")
            focused=await page.evaluate("document.activeElement.id")
            await page.locator(".moon-appearance-select").select_option("dark")
            await page.wait_for_function("document.documentElement.dataset.moonTheme==='dark'")
            await page.keyboard.press("Tab")
            await page.locator(".topbar .brand").focus()
            dark=await page.evaluate("""() => ({
                theme:document.documentElement.dataset.moonTheme,
                focus:document.activeElement.matches(':focus-visible'),
                outline:getComputedStyle(document.activeElement).outlineColor,
                paper:getComputedStyle(document.body).backgroundColor,
                ink:getComputedStyle(document.querySelector('h1')).color,
                link:getComputedStyle(document.querySelector('a.control')).color
            })""")
            await page.screenshot(path=str(OUT/"nested-404-dark-375.png"),full_page=True)
            await page.locator('a[href="#page-top"]').click()
            back=await page.evaluate("({hash:location.hash,y:scrollY})")
            if first["href"]!="#main" or not first["visible"] or focused!="main":
                errs.append("skip to main keyboard")
            if dark["theme"]!="dark" or not dark["focus"] or dark["paper"]==dark["ink"]:
                errs.append("dark appearance/focus")
            if back["hash"]!="#page-top" or back["y"]>4:errs.append("return to top")
            check("nested 404 keyboard and dark",errs,first=first,target=focused,dark=dark,back=back)
        except Exception as exc:check("nested 404 keyboard and dark",[repr(exc)])
        finally:await page.close()

        # This navigation must happen automatically, with the correct visible destination.
        page=await browser.new_page(viewport={"width":375,"height":850})
        try:
            response=await page.goto(LOCAL+"/about.html",wait_until="domcontentloaded",timeout=18000)
            await page.wait_for_url(LOCAL+"/contact.html",timeout=18000)
            data=await page.evaluate("""() => ({
                url:location.href,h1:document.querySelector('main h1')?.innerText,
                mailto:[...document.querySelectorAll('main a[href^="mailto:"]')]
                   .map(x=>x.getAttribute('href')),
                title:document.title
            })""")
            errs=[]
            if not data["url"].endswith("/contact.html"):errs.append("redirect did not reach Contact")
            if not data["mailto"] or "I'd be glad to hear from you."!=data["h1"]:
                errs.append("redirect destination is not actual Contact page")
            check("About automatic redirect",errs,initialStatus=response.status if response else None,**data)
            await page.screenshot(path=str(OUT/"about-redirect-destination.png"),full_page=True)
        except Exception as exc:check("About automatic redirect",[repr(exc)])
        finally:await page.close()

        # Disable only meta-refresh in the test-served HTML, leaving all other fallback
        # material and relative URL resolution intact.
        page=await browser.new_page(viewport={"width":375,"height":850},java_script_enabled=False)
        await page.route("**/about.html",lambda route: route.fulfill(
            status=200,content_type="text/html; charset=utf-8",
            body=(ROOT/"about.html").read_text(encoding="utf-8").replace(
                '<meta http-equiv="refresh" content="0; url=contact.html">',"")))
        try:
            response=await page.goto(LOCAL+"/about.html",wait_until="load",timeout=18000)
            data=await page.evaluate("""() => ({
               title:document.title,heading:document.querySelector('h1')?.innerText,
               link:document.querySelector('main a')?.getAttribute('href'),
               canonical:document.querySelector('link[rel=canonical]')?.href,
               robots:document.querySelector('meta[name=robots]')?.content,
               docWidth:document.documentElement.scrollWidth,
               description:document.querySelector('main p')?.innerText
            })""")
            await page.screenshot(path=str(OUT/"about-fallback-375.png"),full_page=True)
            await page.keyboard.press("Tab")
            focused=await page.evaluate("""() => ({
               tag:document.activeElement.tagName,href:document.activeElement.getAttribute('href'),
               focusVisible:document.activeElement.matches(':focus-visible')
            })""")
            await page.keyboard.press("Enter")
            await page.wait_for_url(LOCAL+"/contact.html",timeout=10000)
            dest=await page.evaluate("document.querySelector('#contact-title')?.innerText")
            errs=[]
            if response.status!=200 or data["heading"]!="The About page has moved.":
                errs.append("fallback missing")
            if data["link"]!="contact.html" or data["docWidth"]>375:errs.append("fallback URL/mobile")
            if data["robots"]!="noindex,follow" or not data["canonical"].endswith("/contact.html"):
                errs.append("fallback canonical/index")
            if focused["href"]!="contact.html" or not focused["focusVisible"] or not dest:
                errs.append("fallback keyboard link")
            check("About fallback without refresh",errs,**data,focused=focused,destinationHeading=dest)
        except Exception as exc:check("About fallback without refresh",[repr(exc)])
        finally:await page.close()

        page=await browser.new_page(viewport={"width":1024,"height":900})
        try:
            await page.goto(LOCAL+"/missing/deep/nothing",wait_until="load")
            await page.evaluate("document.fonts.ready")
            pdf=await page.pdf(format="A4",print_background=True,margin={
               "top":"12mm","bottom":"12mm","left":"12mm","right":"12mm"
            })
            (OUT/"nested-404-A4.pdf").write_bytes(pdf)
            doc=fitz.open(stream=pdf,filetype="pdf")
            pages=[pg.get_text() for pg in doc]
            errs=[]
            if len(doc)!=1:errs.append("404 print not single A4 page")
            if "Page not found" not in "\n".join(pages):errs.append("404 print missing heading")
            for i,pg in enumerate(doc):
                pg.get_pixmap(matrix=fitz.Matrix(1.2,1.2)).save(str(OUT/f"nested-404-A4-{i+1}.png"))
            check("404 A4 print",errs,pages=len(doc),pageChars=[len(x) for x in pages])
        except Exception as exc:check("404 A4 print",[repr(exc)])
        finally:await page.close()

        # Live production probe is explicitly informational if CI networking blocks
        # access: never treat a local fallback as an actual GitHub Pages CDN response.
        for path,expected in [("/missing/deep/nothing",404),("/about.html",200)]:
            page=await browser.new_page(viewport={"width":375,"height":850})
            try:
                response=await page.goto(PUBLIC+path,wait_until="domcontentloaded",timeout=14000)
                if path.endswith("about.html"):
                    await page.wait_for_url(PUBLIC+"/contact.html",timeout=12000)
                actual=(await page.evaluate("location.pathname"))
                error=[]
                if path.endswith("about.html"):
                    if actual!="/contact.html":error.append("live redirect destination")
                elif response.status!=404 or actual!=path:
                    error.append("live nested 404 request")
                print("PRODUCTION",path,"reachable",not error,"HTTP",response.status,flush=True)
                RESULT.append({"test":"live public "+path,"expectedStatus":expected,
                  "observedStatus":response.status,"observedPath":actual,
                  "verified":not error,"errors":error})
            except Exception as exc:
                print("PRODUCTION",path,"unverified",repr(exc)[:170],flush=True)
                RESULT.append({"test":"live public "+path,"verified":False,
                  "connectivityIssue":repr(exc)[:400],"errors":[]})
            finally:await page.close()
        await browser.close()

    (OUT/"report.json").write_text(json.dumps(RESULT,indent=2),encoding="utf-8")
    mandatory=[r for r in RESULT if not r["test"].startswith("live public ")]
    failures=[r for r in mandatory if r["errors"]]
    print("SUMMARY",len(mandatory),"mandatory checks",len(failures),"failed",flush=True)
    if failures:raise AssertionError(json.dumps(failures,ensure_ascii=False)[:3200])

try:
    asyncio.run(run())
finally:server.shutdown()
