"""Visitor-facing Pungmul page layout, source photo and A4 print audit."""
import asyncio,base64,io,json,re
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
import fitz
from playwright.async_api import async_playwright

BASE="http://127.0.0.1:8773/pungmul.html"
OUT=Path("pungmul-audit-output")
WIDTHS=[320,375,560,700,701,768,800,801,950,951,1024,1025,1140,1440]
SECTIONS=["performances","music","history","community","references"]

def source_photos():
    source=Path("pungmul.html").read_text(encoding="utf-8")
    raw=re.findall(r'<img\b[^>]*data-moon-v2-added-id="([^"]+)"[^>]*src="(data:image/[^"]+)"[^>]*alt="([^"]*)"',source)
    report=[]
    sheet=Image.new("RGB",(900,900),"white")
    painter=ImageDraw.Draw(sheet)
    for i,(id,src,alt) in enumerate(raw):
        encoded=src.partition("base64,")[2]
        im=Image.open(io.BytesIO(base64.b64decode(encoded))).convert("RGB")
        im.save(OUT/f"pungmul-source-{i+1}.jpg",quality=86)
        thumb=ImageOps.contain(im,(286,245))
        x=(i%3)*300+(300-thumb.width)//2
        y=(i//3)*370+42
        sheet.paste(thumb,(x,y))
        painter.text(((i%3)*300+8,(i//3)*370+12),f"Source {i+1}: {im.width}x{im.height}",fill="black")
        report.append({"number":i+1,"id":id,"alt":alt,"dimensions":[im.width,im.height],
                       "format":src.split(";")[0]})
    sheet.save(OUT/"pungmul-original-source-montage.jpg",quality=85)
    return {"test":"embedded source originals","photos":report,"errors":[] if len(report)==5 else ["not five photos"]}

async def main():
    OUT.mkdir(exist_ok=True)
    results=[source_photos()]
    async with async_playwright() as p:
        browser=await p.chromium.launch()
        for w in WIDTHS:
            page=await browser.new_page(viewport={"width":w,"height":900},
                                        reduced_motion="reduce")
            try:
                reply=await page.goto(BASE,wait_until="load",timeout=30000)
                await page.evaluate("document.fonts.ready")
                data=await page.evaluate("""() => {
                   const main=document.querySelector('#main');
                   const r=e=>e.getBoundingClientRect();
                   const box=e=>{let x=r(e);return {left:Math.round(x.left),right:Math.round(x.right),
                     top:Math.round(x.top+scrollY),bottom:Math.round(x.bottom+scrollY),
                     width:Math.round(x.width),height:Math.round(x.height)};};
                   const inter=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*
                     Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
                   const images=[...main.querySelectorAll('img[data-moon-v2-added-id]')];
                   const prose=[...main.querySelectorAll('.hero-copy p:not(.pungmul-eyebrow),.pungmul-prose p')];
                   const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
                   const anchors=[...document.querySelectorAll('a[href^="#"]')].map(e=>e.getAttribute('href').slice(1));
                   return {
                     width:innerWidth,docWidth:document.documentElement.scrollWidth,
                     h1:[...main.querySelectorAll('h1')].map(e=>e.innerText),
                     headings:[...main.querySelectorAll('h2')].map(e=>e.innerText),
                     sections:[...main.querySelectorAll('section[id]')].map(e=>e.id),
                     dupIds:new Set(ids).size!==ids.length,
                     brokenAnchors:anchors.filter(id=>!ids.includes(id)),
                     unnamed:[...document.querySelectorAll('a[href]')].filter(a=>!(a.innerText||a.getAttribute('aria-label')||'').trim()).length,
                     escaped:[...main.querySelectorAll('h1,h2,h3,p,li,a')].filter(e=>{
                        let x=r(e);return x.width>0&&(x.left < -3||x.right>innerWidth+3)
                     }).map(e=>e.textContent.trim().slice(0,75)),
                     images:images.map(e=>({alt:e.alt,loaded:e.complete&&e.naturalWidth>0,
                       parent:e.parentElement?.className||e.parentElement?.tagName,box:box(e),
                       natural:[e.naturalWidth,e.naturalHeight],
                       objectFit:getComputedStyle(e).objectFit,
                       clipPath:getComputedStyle(e).clipPath,
                       background:getComputedStyle(e).backgroundImage.slice(0,55)})),
                     imageImageOverlap:images.map((e,i)=>images.slice(i+1).map((f,j)=>({
                       with:i+j+2,area:Math.round(inter(r(e),r(f)))}))),
                     imageTextOverlap:images.map((e,i)=>prose.map((f,j)=>({
                        text:j,area:Math.round(inter(r(e),r(f)))})).filter(x=>x.area>100)),
                     photoGrid:box(main.querySelector('.pungmul-performance-grid')),
                     hero:box(main.querySelector('.pungmul-page-hero')),
                     footerGap:Math.round(r(document.querySelector('.site-footer')).top-
                       r(main.querySelector('#references')).bottom),
                     referenceCount:main.querySelectorAll('.pungmul-reference-list li').length
                   };
                }""")
                err=[]
                if not reply or reply.status!=200:err.append("page loading")
                if data["docWidth"]>w:err.append("page horizontal overflow")
                if data["h1"]!=["Pungmul (풍물)"] or data["sections"]!=SECTIONS:
                    err.append("headings/sections")
                if data["dupIds"] or data["brokenAnchors"] or data["unnamed"] or data["escaped"]:
                    err.append("accessibility/overrun")
                if len(data["images"])!=5 or any(not im["loaded"] or not im["alt"] for im in data["images"]):
                    err.append("photos missing/unnamed")
                if any(im["box"]["left"]<-3 or im["box"]["right"]>w+3 for im in data["images"]):
                    err.append("photo out of bounds")
                if data["referenceCount"]!=4:err.append("missing references")
                if not data["images"][0]["parent"].endswith("pungmul-page-hero") or any(
                      im["parent"]!="pungmul-performance-grid" for im in data["images"][1:]):
                    err.append("public photos not part of document flow")
                if any(im["clipPath"]!="none" for im in data["images"]):
                    err.append("obsolete circular mask still clips photos")
                if not 95<=data["footerGap"]<=105:
                    err.append("inconsistent content-to-footer separation")
                if any(item["area"]>100 for group in data["imageImageOverlap"] for item in group):
                    err.append("photos overlap")
                if any(item["area"]>100 for group in data["imageTextOverlap"] for item in group):
                    err.append("photos overlap actual prose")
                data.update({"test":"responsive","errors":err})
                results.append(data)
                await page.screenshot(path=str(OUT/f"pungmul-{w}.png"),full_page=True,
                                      animations="disabled",timeout=35000)
                print("PUNGMUL",w,"PASS" if not err else err,flush=True)
            except Exception as exc:
                results.append({"test":"responsive","width":w,"errors":[repr(exc)]})
                print("PUNGMUL",w,"ERROR",repr(exc),flush=True)
            finally:
                await page.close()
        page=await browser.new_page(viewport={"width":375,"height":850},reduced_motion="reduce")
        try:
            await page.goto(BASE,wait_until="load")
            await page.keyboard.press("Tab")
            first=await page.evaluate("document.activeElement.getAttribute('href')")
            await page.keyboard.press("Enter")
            focused=await page.evaluate("document.activeElement.id")
            await page.locator('.pungmul-jump-nav a[href="#history"]').click()
            history=await page.evaluate("({hash:location.hash,y:Math.round(document.querySelector('#history').getBoundingClientRect().top)})")
            await page.locator(".moon-appearance-select").select_option("dark")
            await page.wait_for_function("document.documentElement.dataset.moonTheme==='dark'")
            await page.keyboard.press("Tab")
            await page.locator(".topbar .brand").focus()
            dark=await page.evaluate("""() => ({theme:document.documentElement.dataset.moonTheme,
                focus:document.activeElement.matches(':focus-visible'),
                outline:getComputedStyle(document.activeElement).outlineColor,
                overflow:document.documentElement.scrollWidth>innerWidth})""")
            await page.screenshot(path=str(OUT/"pungmul-dark-375.png"),full_page=True)
            errors=[]
            if first!="#main" or focused!="main":errors.append("skip keyboard")
            if history["hash"]!="#history" or history["y"]<-5:errors.append("history navigation")
            if dark["theme"]!="dark" or not dark["focus"] or dark["overflow"]:errors.append("dark mode")
            results.append({"test":"keyboard/dark","first":first,"focused":focused,
                            "history":history,"dark":dark,"errors":errors})
            print("KEYBOARD DARK","PASS" if not errors else errors,flush=True)
        except Exception as exc:
            results.append({"test":"keyboard/dark","errors":[repr(exc)]})
        finally:await page.close()
        page=await browser.new_page(viewport={"width":1440,"height":900})
        try:
            await page.goto(BASE,wait_until="load")
            await page.evaluate("document.fonts.ready")
            data=await page.pdf(format="A4",print_background=True,
                                margin={"top":"12mm","bottom":"12mm","left":"12mm","right":"12mm"})
            (OUT/"pungmul-A4.pdf").write_bytes(data)
            pdf=fitz.open(stream=data,filetype="pdf")
            txt=[re.sub(r"\s+"," ",pg.get_text()) for pg in pdf]
            needles=[
                "I play pungmul with a queer ensemble",
                "Our ensemble gave a formal concert in 2024",
                "The instruments have different roles within the ensemble",
                "Village performance traditions have developed",
                "Park's analysis also raises questions",
                "National Folk Museum of Korea",
                "National Institute of Korean History",
                "UNESCO. (2014)"
            ]
            missing=[x for x in needles if not any(x in t for t in txt)]
            clipped=[]
            for i,pg in enumerate(pdf):
                clipped.extend([(i+1,w[4]) for w in pg.get_text("words")
                    if w[0]<-1 or w[1]<-1 or w[2]>pg.rect.width+1 or w[3]>pg.rect.height+1])
                pg.get_pixmap(matrix=fitz.Matrix(1.05,1.05)).save(str(OUT/f"pungmul-A4-{i+1}.png"))
            err=[]
            text_photo_overlap=[]
            for pi,pg in enumerate(pdf):
                word_rects=[(fitz.Rect(w[:4]),w[4]) for w in pg.get_text("words")]
                for ref in pg.get_images(full=True):
                    for image_rect in pg.get_image_rects(ref[0]):
                        for wr,word in word_rects:
                            intersect=wr & image_rect
                            if not intersect.is_empty and intersect.get_area()>2:
                                text_photo_overlap.append({"page":pi+1,"word":word,"image":ref[0]})
            if text_photo_overlap:
                err.append("printed photo intersects visible text")
            if missing or clipped:err.append("printed article content or bibliography absent/clipped")
            if not 2<=len(pdf)<=7:err.append("unexpected A4 page count")
            if len(txt)>1 and len(txt[-1])<400:err.append("nearly empty final print page")
            if len(pdf)>1 and len(pdf[0].get_images(full=True))!=1:
                err.append("performance photo fragmented onto first print sheet")
            if len(pdf)>1 and len(pdf[1].get_images(full=True))<4:
                err.append("incomplete performance gallery on second print sheet")
            results.append({"test":"print A4","pages":len(pdf),"pageCharacters":[len(x) for x in txt],
                "embeddedImages":[len(pg.get_images(full=True)) for pg in pdf],
                "missing":missing,"clipped":clipped[:15],
                "textPhotoOverlap":text_photo_overlap[:18],"errors":err})
            print("PRINT",len(pdf),"PASS" if not err else err,flush=True)
        except Exception as exc:
            results.append({"test":"print A4","errors":[repr(exc)]})
        finally:await page.close()
        await browser.close()
    (OUT/"report.json").write_text(json.dumps(results,indent=2),encoding="utf-8")
    failures=[r for r in results if r.get("errors")]
    print("SUMMARY",len(results),"checks",len(failures),"failed")
    if failures:raise AssertionError(json.dumps(failures,ensure_ascii=False)[:3500])

if __name__=="__main__":asyncio.run(main())
