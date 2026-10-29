"""Stage C1: Contact reader-facing page, link, photo, breakpoint and print audit."""
import asyncio, json, re
from pathlib import Path
import fitz
from PIL import Image
from playwright.async_api import async_playwright

URL="http://127.0.0.1:8774/contact.html"
OUT=Path("contact-audit-output")
WIDTHS=[320,375,560,620,700,701,768,950,1024,1025,1100,1140,1200,1440]

async def main():
    OUT.mkdir(exist_ok=True)
    results=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch()
        for w in WIDTHS:
            page=await browser.new_page(viewport={"width":w,"height":900},reduced_motion="reduce")
            try:
                resp=await page.goto(URL,wait_until="load",timeout=30000)
                await page.evaluate("document.fonts.ready")
                result=await page.evaluate("""() => {
                    const main=document.querySelector("main"),rect=e=>e.getBoundingClientRect();
                    const box=e=>{const b=rect(e);return {left:Math.round(b.left),right:Math.round(b.right),
                       top:Math.round(b.top+scrollY),bottom:Math.round(b.bottom+scrollY),
                       width:Math.round(b.width),height:Math.round(b.height)}};
                    const overlap=(x,y)=>{
                       if(!x||!y)return 0;
                       const a=rect(x),b=rect(y);
                       return Math.round(Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*
                                  Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)));
                    };
                    const photo=main.querySelector('img[data-moon-v2-added-id]');
                    const idList=[...document.querySelectorAll('[id]')].map(x=>x.id);
                    const anchors=[...document.querySelectorAll('a[href^="#"]')].map(x=>x.getAttribute('href').slice(1));
                    const h1=main.querySelector('h1'),h2=main.querySelector('h2');
                    const paragraphs=[...main.querySelectorAll('p')];
                    const welcome=main.querySelector('.contact-welcome'),about=main.querySelector('.contact-background');
                    const email=main.querySelector('.contact-email-card');
                    const text=main.querySelector('.contact-background>div');
                    return {
                       viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,
                       title:document.title,h1:h1?.innerText,h2:h2?.innerText,
                       mainCount:document.querySelectorAll('main').length,
                       sectionCount:main.querySelectorAll(':scope > section').length,
                       duplicateIds:new Set(idList).size!==idList.length,
                       unresolved:anchors.filter(x=>!idList.includes(x)),
                       unnamedLinks:[...document.querySelectorAll('a[href]')].filter(e=>!(e.innerText||e.getAttribute('aria-label')||'').trim()).length,
                       escaped:[...main.querySelectorAll('h1,h2,p,a')].filter(e=>{const b=rect(e);return b.width>0&&(b.left < -3||b.right>innerWidth+3);}).map(e=>e.innerText.slice(0,80)),
                       mailLinks:[...main.querySelectorAll('a[href^="mailto:"]')].map(e=>({href:e.getAttribute('href'),label:e.innerText})),
                       aboutLinks:[...main.querySelectorAll('.contact-background a')].map(e=>({href:e.getAttribute('href'),label:e.innerText})),
                       appearanceStylesheet:[...document.querySelectorAll('link[rel=stylesheet]')].find(e=>e.href.includes('appearance.css'))?.getAttribute('href'),
                       photo:{loaded:photo.complete&&photo.naturalWidth>0,alt:photo.alt,
                           natural:[photo.naturalWidth,photo.naturalHeight],
                           parent:photo.parentElement.className||photo.parentElement.tagName,
                           box:box(photo),display:getComputedStyle(photo).display,
                           objectFit:getComputedStyle(photo).objectFit,
                           clipPath:getComputedStyle(photo).clipPath},
                       photoVsText:paragraphs.map((e,i)=>({index:i,overlap:overlap(photo,e)})).filter(x=>x.overlap>0),
                       photoVsHeading:[overlap(photo,h1),overlap(photo,h2)],
                       photoVsEmail:overlap(photo,email),
                       topOverlap:overlap(email,main.querySelector('.contact-welcome>div:first-child')),
                       welcome:box(welcome),about:box(about),aboutText:box(text),email:box(email),
                       footerGap:Math.round(rect(document.querySelector('.site-footer')).top-rect(about).bottom),
                       computed:{h1Width:box(h1).width,h1Height:box(h1).height,h1ScrollHeight:h1.scrollHeight,
                         introHeight:box(main.querySelector('.contact-introduction')).height,
                         introScrollHeight:main.querySelector('.contact-introduction').scrollHeight,
                         aboutParagraphHeight:box(text.querySelector('p')).height,
                         aboutParagraphScrollHeight:text.querySelector('p').scrollHeight}
                    }
                }""")
                errors=[]
                if not resp or resp.status!=200:errors.append("HTTP")
                if result["documentWidth"]>w:errors.append("horizontal page overflow")
                if result["mainCount"]!=1 or result["sectionCount"]!=2:errors.append("landmarks/sections")
                if result["h1"]!="I'd be glad to hear from you." or result["h2"]!="A little about me":
                    errors.append("wrong headings")
                if result["duplicateIds"] or result["unresolved"] or result["unnamedLinks"] or result["escaped"]:
                    errors.append("anchor/name/text overrun")
                if len(result["mailLinks"])!=2 or len(result["aboutLinks"])!=2:errors.append("links")
                if not result["photo"]["loaded"] or not result["photo"]["alt"]:errors.append("photo loading/alt")
                if result["photo"]["box"]["left"] < -3 or result["photo"]["box"]["right"]>w+3:errors.append("photo outside viewport")
                if any(x["overlap"]>30 for x in result["photoVsText"]) or any(x>30 for x in result["photoVsHeading"]):
                    errors.append("photo overlaps readable text")
                if result["photoVsEmail"]>30:errors.append("photo overlaps email card")
                if result["topOverlap"]>30:errors.append("email card overlaps greeting")
                if not 95<=result["footerGap"]<=105:errors.append("footer gap not 100px")
                result.update(test="responsive",errors=errors)
                results.append(result)
                print("CONTACT",w,"PASS" if not errors else errors,flush=True)
                await page.screenshot(path=str(OUT/f"contact-{w}.png"),full_page=True,animations="disabled")
            except Exception as e:
                results.append({"test":"responsive","width":w,"errors":[repr(e)]})
                print("CONTACT ERROR",w,repr(e),flush=True)
            finally:await page.close()

        page=await browser.new_page(viewport={"width":375,"height":850},reduced_motion="reduce")
        try:
            await page.goto(URL,wait_until="load")
            await page.keyboard.press("Tab")
            skip=await page.evaluate("document.activeElement.getAttribute('href')")
            await page.keyboard.press("Enter")
            target=await page.evaluate("document.activeElement.id")
            await page.locator(".moon-appearance-select").select_option("dark")
            await page.wait_for_function("document.documentElement.dataset.moonTheme==='dark'")
            await page.keyboard.press("Tab")
            await page.locator('.topbar .brand').focus()
            dark=await page.evaluate("""() => ({
               theme:document.documentElement.dataset.moonTheme,
               focusVisible:document.activeElement.matches(':focus-visible'),
               focusOutline:getComputedStyle(document.activeElement).outlineColor,
               cardBg:getComputedStyle(document.querySelector('.contact-email-card')).backgroundColor,
               cardInk:getComputedStyle(document.querySelector('.contact-card-heading')).color,
               overflow:document.documentElement.scrollWidth>innerWidth
            })""")
            await page.screenshot(path=str(OUT/"contact-dark-375.png"),full_page=True)
            await page.locator('a[href="#page-top"]').click()
            back=await page.evaluate("({hash:location.hash,y:scrollY})")
            errors=[]
            if skip!="#main" or target!="main":errors.append("skip link")
            if dark["theme"]!="dark" or not dark["focusVisible"] or dark["overflow"]:
                errors.append("dark mode/keyboard")
            if back["hash"]!="#page-top" or back["y"]>4:errors.append("back-to-top")
            results.append({"test":"keyboard and dark","skip":skip,"target":target,
                            "dark":dark,"back":back,"errors":errors})
            print("DARK KEYBOARD","PASS" if not errors else errors,flush=True)
        except Exception as e:results.append({"test":"keyboard and dark","errors":[repr(e)]})
        finally:await page.close()

        page=await browser.new_page(viewport={"width":1440,"height":900},reduced_motion="reduce")
        try:
            await page.goto(URL,wait_until="load")
            await page.evaluate("document.fonts.ready")
            raw=await page.pdf(format="A4",print_background=True,margin={"top":"12mm","bottom":"12mm",
                             "left":"12mm","right":"12mm"})
            (OUT/"contact-A4.pdf").write_bytes(raw)
            doc=fitz.open(stream=raw,filetype="pdf")
            pages=[re.sub(r"\s+"," ",p.get_text()) for p in doc]
            required=["I'd be glad to hear from you","The easiest way to reach me",
                      "gracem.0691@gmail.com","A little about me","I grew up in Canada",
                      "Teaching"]
            missing=[x for x in required if not any(x in pg for pg in pages)]
            wordOut=[]
            imgOverlap=[]
            for i,pg in enumerate(doc):
                for w in pg.get_text("words"):
                    if w[0]<-1 or w[1]<-1 or w[2]>pg.rect.width+1 or w[3]>pg.rect.height+1:
                        wordOut.append([i+1,w[4]])
                for im in pg.get_images(full=True):
                    for b in pg.get_image_rects(im[0]):
                        for w in pg.get_text("words"):
                            if (fitz.Rect(w[:4])&b).get_area()>2:imgOverlap.append([i+1,w[4],im[0]])
                pg.get_pixmap(matrix=fitz.Matrix(1.25,1.25)).save(str(OUT/f"contact-A4-{i+1}.png"))
            errors=[]
            if missing or wordOut or imgOverlap:errors.append("printed content missing/clipped/photo-text intersection")
            if not 1<=len(doc)<=4:errors.append("too many print pages")
            results.append({"test":"print A4","pages":len(doc),"pageChars":[len(x) for x in pages],
                "images":[len(pg.get_images(full=True)) for pg in doc],
                "missing":missing,"wordOut":wordOut[:10],"imageOverlap":imgOverlap[:15],"errors":errors})
            print("PRINT",len(doc),"PASS" if not errors else errors,flush=True)
        except Exception as e:results.append({"test":"print A4","errors":[repr(e)]})
        finally:await page.close()
        await browser.close()
    (OUT/"report.json").write_text(json.dumps(results,indent=2),encoding="utf-8")
    failures=[x for x in results if x.get("errors")]
    print("SUMMARY",len(results),"checks",len(failures),"failed",flush=True)
    if failures:raise AssertionError(json.dumps(failures,ensure_ascii=False)[:3500])

if __name__=="__main__":asyncio.run(main())
