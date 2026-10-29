"""Interests visitor-facing first visual QA, including added-image overlay positions."""
import asyncio, json, re
from pathlib import Path
import fitz
from playwright.async_api import async_playwright

BASE="http://127.0.0.1:8772/interests.html"
OUT=Path("interests-audit-output")
WIDTHS=(320,375,599,600,700,701,768,850,1024,1025,1140,1440)

async def main():
    OUT.mkdir(exist_ok=True)
    results=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch()
        for width in WIDTHS:
            page=await browser.new_page(viewport={"width":width,"height":900},
                                        reduced_motion="reduce")
            try:
                response=await page.goto(BASE,wait_until="domcontentloaded",timeout=30000)
                await page.evaluate("document.fonts.ready")
                await page.evaluate("""() => {
                    document.querySelectorAll('#main img').forEach(i=>i.loading='eager');
                    document.documentElement.style.scrollBehavior='auto';
                }""")
                await page.wait_for_timeout(550)
                data=await page.evaluate("""() => {
                    const main=document.querySelector('#main'),r=e=>e.getBoundingClientRect();
                    const b=e=>{const q=r(e);return {left:Math.round(q.left),right:Math.round(q.right),top:Math.round(q.top+scrollY),bottom:Math.round(q.bottom+scrollY),width:Math.round(q.width),height:Math.round(q.height)};};
                    const all=[...document.querySelectorAll('[id]')].map(e=>e.id);
                    const hashes=[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href').slice(1));
                    const photos=[...main.querySelectorAll('img[data-moon-v2-added-id]')];
                    const paragraphs=[...main.querySelectorAll('section:nth-of-type(2) .reading p')];
                    const intersection=(A,B)=>Math.max(0,Math.min(A.right,B.right)-Math.max(A.left,B.left))*
                        Math.max(0,Math.min(A.bottom,B.bottom)-Math.max(A.top,B.top));
                    const rect=e=>{let x=r(e);return {left:x.left,right:x.right,top:x.top,bottom:x.bottom};};
                    const imgState=e=>({alt:e.alt,loaded:e.complete&&e.naturalWidth>0,
                        srcType:e.currentSrc.startsWith('data:')?'embedded':(e.currentSrc?new URL(e.currentSrc).host:'unresolved'),
                        box:b(e),parent:e.parentElement?.hasAttribute('data-moon-v2-added-layer')?'added-layer':(e.parentElement?.className||e.parentElement?.tagName),
                        opacity:getComputedStyle(e).opacity,display:getComputedStyle(e).display,
                        z:getComputedStyle(e).zIndex});
                    return {
                      width:innerWidth,docWidth:document.documentElement.scrollWidth,
                      mainWidth:b(main),title:document.title,
                      headings:[...main.querySelectorAll('h1,h2,h3,h4')].map(e=>({level:+e.tagName[1],title:e.textContent.trim()})),
                      duplicatedIds:new Set(all).size!==all.length,
                      brokenHashes:hashes.filter(h=>!all.includes(h)),
                      unnamedLinks:[...document.querySelectorAll('a[href]')].filter(e=>!(e.innerText||e.getAttribute('aria-label')||'').trim()).length,
                      escaped:[...main.querySelectorAll('h1,h2,h3,h4,p,a,figcaption')].filter(e=>{
                        let x=r(e);return x.width>0&&(x.left< -3 || x.right>innerWidth+3);
                      }).map(e=>e.textContent.trim().slice(0,80)),
                      gallery:b(main.querySelector('.pungmul-gallery')),
                      photoCount:photos.length,
                      photos:photos.map(imgState),
                      photoParagraphOverlap:photos.map(img=>paragraphs.map(t=>{
                        let a=rect(img),bb=rect(t);return Math.round(intersection(a,bb));
                      })),
                      photoToPhotoOverlap:photos.length===2?Math.round(intersection(rect(photos[0]),rect(photos[1]))):0,
                      bookImages:[...main.querySelectorAll('.media-shelf img')].map(imgState),
                      mediaEntries:main.querySelectorAll('.media-entry').length,
                      sectionCount:main.querySelectorAll(':scope>section').length,
                      paragraphs:paragraphs.map(e=>({text:e.innerText.slice(0,70),box:b(e)})),
                      footerGap:Math.round(r(document.querySelector('.site-footer')).top-r(main.querySelector(':scope>section:last-of-type')).bottom),
                      imageLayer:b(main.querySelector('[data-moon-v2-added-layer]'))
                    }
                }""")
                errors=[]
                if not response or response.status!=200:errors.append("HTTP")
                if data["docWidth"]>width:errors.append("horizontal document overflow")
                if data["duplicatedIds"] or data["brokenHashes"] or data["unnamedLinks"] or data["escaped"]:
                    errors.append("anchors/names/escaped text")
                if data["headings"][:3]!=[
                    {"level":1,"title":"Interests"},{"level":2,"title":"Pungmul"},
                    {"level":2,"title":"Books and media"}]:errors.append("heading hierarchy")
                if data["photoCount"]!=2 or any(not x["loaded"] or not x["alt"] for x in data["photos"]):
                    errors.append("added photo unloaded or inaccessible")
                if data["mediaEntries"]!=5:errors.append("media card count")
                if any(x["parent"]!="pungmul-gallery" for x in data["photos"]):
                    errors.append("visitor photos not in accessible gallery")
                if data["photoToPhotoOverlap"]>0 or any(any(v>0 for v in r) for r in data["photoParagraphOverlap"]):
                    errors.append("photographs obscure each other or written paragraphs")
                if not 95<=data["footerGap"]<=105:
                    errors.append("footer separation differs from 100px")
                if any(x["box"]["left"] < -3 or x["box"]["right"]>width+3 for x in data["photos"]):
                    errors.append("photo escapes visible page")
                data["errors"]=errors
                results.append({"test":"responsive",**data})
                await page.screenshot(path=str(OUT/f"interests-{width}.png"),
                                      full_page=True,animations="disabled",timeout=30000)
                print("INTERESTS",width,"PASS" if not errors else errors,
                      "overlaps",data["photoParagraphOverlap"],flush=True)
            except Exception as e:
                results.append({"test":"responsive","width":width,"errors":[repr(e)]})
                print("INTERESTS",width,"ERROR",repr(e),flush=True)
            finally:
                await page.close()
        page=await browser.new_page(viewport={"width":375,"height":850},reduced_motion="reduce")
        try:
            await page.goto(BASE,wait_until="domcontentloaded")
            await page.keyboard.press("Tab")
            skipHref=await page.evaluate("document.activeElement.getAttribute('href')")
            await page.keyboard.press("Enter")
            focus=await page.evaluate("document.activeElement.id")
            await page.locator(".moon-appearance-select").select_option("dark")
            await page.wait_for_function("document.documentElement.dataset.moonTheme==='dark'")
            await page.locator(".topbar .brand").focus()
            dark=await page.evaluate("""() => ({
              theme:document.documentElement.dataset.moonTheme,
              focusVisible:document.activeElement.matches(':focus-visible'),
              focusColor:getComputedStyle(document.activeElement).outlineColor,
              bg:getComputedStyle(document.querySelector('.media-entry')).backgroundColor,
              ink:getComputedStyle(document.querySelector('.media-entry h4')).color,
              overflow:document.documentElement.scrollWidth>innerWidth
            })""")
            await page.screenshot(path=str(OUT/"interests-dark-375.png"),full_page=True)
            errs=[]
            if skipHref!="#main" or focus!="main":errs.append("skip navigation")
            if dark["theme"]!="dark" or not dark["focusVisible"] or dark["overflow"] or dark["bg"]==dark["ink"]:
                errs.append("dark theme/contrast/focus")
            results.append({"test":"keyboard-dark","skipHref":skipHref,"focus":focus,"dark":dark,"errors":errs})
            print("KEYBOARD DARK","PASS" if not errs else errs,flush=True)
        except Exception as e:
            results.append({"test":"keyboard-dark","errors":[repr(e)]})
            print("DARK ERROR",repr(e),flush=True)
        finally:
            await page.close()

        page=await browser.new_page(viewport={"width":1440,"height":900},reduced_motion="reduce")
        try:
            await page.goto(BASE,wait_until="load",timeout=45000)
            await page.evaluate("document.fonts.ready")
            await page.wait_for_function("""() => [...document.querySelectorAll('#main .media-shelf img')]
                .every(i=>i.complete && i.naturalWidth>0)""",timeout=16000)
            raw=await page.pdf(format="A4",print_background=True,display_header_footer=False,
                               margin={"top":"12mm","bottom":"12mm","left":"12mm","right":"12mm"})
            (OUT/"interests-A4.pdf").write_bytes(raw)
            pdf=fitz.open(stream=raw,filetype="pdf")
            texts=[re.sub(r"\s+"," ",pg.get_text()) for pg in pdf]
            edge=[]
            for i,pg in enumerate(pdf):
                edge.extend([{"page":i+1,"text":w[4]} for w in pg.get_text("words")
                             if w[0]<-1 or w[1]<-1 or w[2]>pg.rect.width+1 or w[3]>pg.rect.height+1])
                pg.get_pixmap(matrix=fitz.Matrix(.95,.95)).save(str(OUT/f"interests-A4-{i+1}.png"))
            missing=[name for name in ["Interests","Pungmul","Books and media",
                                     "The Hobbit","I'm Waiting for You","Rose",
                                     "Detective Conan","Dimension 20"]
                     if not any(name in x for x in texts)]
            pdf_images=[len(pg.get_images(full=True)) for pg in pdf]
            errs=[]
            if missing or edge:errs.append("print clipped/missing text")
            if not any("Books and media" in x and "The Hobbit" in x for x in texts):
                errs.append("Books heading orphaned on print page")
            if not any("Shows" in x and "Detective Conan" in x for x in texts):
                errs.append("Shows heading orphaned on print page")
            if sum(pdf_images[1:]) < 3:errs.append("book-cover images not embedded into printed PDF")
            results.append({"test":"print A4","pages":len(pdf),"pageChars":[len(x) for x in texts],
                            "imagesByPage":pdf_images,
                            "missing":missing,"edge":edge[:20],"errors":errs})
            print("PRINT",len(pdf),"PASS" if not errs else errs,flush=True)
        except Exception as e:
            results.append({"test":"print A4","errors":[repr(e)]})
            print("PRINT ERROR",repr(e),flush=True)
        finally:
            await page.close()
        await browser.close()
    (OUT/"report.json").write_text(json.dumps(results,indent=2),encoding="utf-8")
    failed=[r for r in results if r.get("errors")]
    print("SUMMARY",len(results),"checks",len(failed),"failed",flush=True)
    if failed:raise AssertionError(json.dumps(failed,ensure_ascii=False)[:3500])

if __name__=="__main__":
    asyncio.run(main())
