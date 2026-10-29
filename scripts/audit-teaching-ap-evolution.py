"""T4 Evolution teaching case: real Chromium, keyboard, dark, math and A4 checks."""
import asyncio
import json
import math
import re
from pathlib import Path
import fitz
from playwright.async_api import async_playwright

URL="http://127.0.0.1:8770/teaching-ap-evolution.html"
OUT=Path("evolution-audit-output")
WIDTHS=(320,375,768,1024,1440)
EXPECTED=["variation-science","variation-evidence","variation-primary-evidence",
          "variation-sequence","variation-assessment","variation-selection-model",
          "variation-ethics","variation-participation","variation-sources"]

def numerical_check():
    p,q=.8,.2
    start=[p*p,2*p*q,q*q]
    weights=[.70,1,.20]
    weighted=[a*b for a,b in zip(start,weights)]
    total=sum(weighted)
    next_q=(weighted[1]/2+weighted[2])/total
    next_p=1-next_q
    observed=[*start,*weighted,total,next_q,next_p,
              next_p**2,2*next_p*next_q,next_q**2]
    expected=[.64,.32,.04,.448,.320,.008,.776,.2165,.7835,.6139,.3392,.0469]
    errs=[f"step {i}: {v} vs {e}" for i,(v,e) in enumerate(zip(observed,expected))
          if abs(v-e)>.000051]
    return {"test":"numerical model","values":observed,"errors":errs}

async def main():
    OUT.mkdir(exist_ok=True)
    result=[numerical_check()]
    async with async_playwright() as playwright:
        browser=await playwright.chromium.launch()
        for width in WIDTHS:
            page=await browser.new_page(viewport={"width":width,"height":900},
                                        reduced_motion="reduce")
            try:
                response=await page.goto(URL,wait_until="load",timeout=30000)
                await page.evaluate("document.fonts.ready")
                await page.wait_for_timeout(350)
                d=await page.evaluate("""() => {
                   const m=document.querySelector('#main'), r=e=>e.getBoundingClientRect();
                   const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
                   const hash=[...document.querySelectorAll('a[href^="#"]')]
                        .map(e=>e.getAttribute('href').slice(1));
                   const images=[...m.querySelectorAll('img')].map(e=>({
                     src:e.currentSrc,loaded:e.complete && e.naturalWidth>0,
                     naturalWidth:e.naturalWidth,alt:e.alt,figcaption:!!e.closest('figure')?.querySelector('figcaption'),
                     bounds:{left:r(e).left,right:r(e).right}
                   }));
                   const tables=[...m.querySelectorAll('.teaching-sequence-table-wrap')]
                      .map(e=>({client:e.clientWidth,scroll:e.scrollWidth,
                        keyboard:e.tabIndex===0,label:e.getAttribute('aria-label')}));
                   const figures=[...m.querySelectorAll('figure')].map(e=>({
                      left:r(e).left,right:r(e).right,
                      caption:e.querySelector('figcaption')?.innerText.slice(0,90)}));
                   const escaped=[...m.querySelectorAll('h1,h2,h3,p,li,a,blockquote,figcaption')]
                      .filter(e=>{const b=r(e);return b.width>0 && (b.left< -3||b.right>innerWidth+3)})
                      .map(e=>e.textContent.trim().slice(0,90));
                   return {
                     width:innerWidth,documentWidth:document.documentElement.scrollWidth,
                     h1:[...m.querySelectorAll('h1')].map(e=>e.textContent.trim()),
                     sections:[...m.querySelectorAll('section[id]')].map(e=>e.id),
                     uniqueIds:ids.length===new Set(ids).size,
                     unresolvedHashes:hash.filter(x=>!ids.includes(x)),
                     unnamedLinks:[...document.querySelectorAll('a[href]')]
                       .filter(e=>!(e.innerText||e.getAttribute('aria-label')||'').trim()).length,
                     images,tables,figures,escaped,
                     footerGap:Math.round(r(document.querySelector('.site-footer')).top-r(m.querySelector('#variation-sources')).bottom),
                     bibliographyCount:m.querySelectorAll('.teaching-source-list li').length
                   };
                }""")
                errs=[]
                if response is None or response.status!=200:errs.append("HTTP")
                if d["documentWidth"]>width or d["escaped"]:errs.append("overflow/text outside viewport")
                if d["h1"]!=["Haemoglobin S, malaria, and natural selection"]:errs.append("H1")
                if d["sections"]!=EXPECTED:errs.append("section navigation")
                if not d["uniqueIds"] or d["unresolvedHashes"] or d["unnamedLinks"]:
                    errs.append("IDs, anchors, accessible links")
                if len(d["images"])!=1 or not all(x["loaded"] and x["alt"] and x["figcaption"] for x in d["images"]):
                    errs.append("photo missing, failed to load, or inaccessible")
                if len(d["figures"])!=2 or any(f["left"]< -3 or f["right"]>width+3 or not f["caption"] for f in d["figures"]):
                    errs.append("figure caption or figure overflows")
                if len(d["tables"])!=2 or any(not t["keyboard"] or not t["label"] for t in d["tables"]):
                    errs.append("keyboard scrollable tables")
                if width<=375 and any(t["scroll"]<=t["client"] for t in d["tables"]):
                    errs.append("mobile table does not allow lateral scrolling")
                if d["bibliographyCount"]!=7:errs.append("source-list count")
                if not 95<=d["footerGap"]<=105:errs.append("footer gap differs from 100px")
                result.append({"test":"responsive","errors":errs,**d})
                await page.screenshot(path=str(OUT/f"evolution-{width}.png"),
                                      full_page=True,animations="disabled")
                print("EVOLUTION",width,"PASS" if not errs else errs,flush=True)
            except Exception as exc:
                result.append({"test":"responsive","width":width,"errors":[repr(exc)]})
                print("RESPONSIVE ERROR",width,repr(exc),flush=True)
            finally:
                await page.close()

        page=await browser.new_page(viewport={"width":375,"height":850},reduced_motion="reduce")
        try:
            await page.goto(URL,wait_until="load")
            await page.evaluate("document.documentElement.style.scrollBehavior='auto'")
            await page.keyboard.press("Tab")
            first=await page.evaluate("document.activeElement.getAttribute('href')")
            await page.keyboard.press("Enter")
            skip=await page.evaluate("document.activeElement?.id")
            await page.locator('.article-jumps a[href="#variation-selection-model"]').click()
            target=await page.evaluate("""() => ({hash:location.hash,
              top:document.querySelector('#variation-selection-model').getBoundingClientRect().top})""")
            scroll=[]
            for i in range(2):
                e=page.locator('.teaching-sequence-table-wrap').nth(i)
                await page.keyboard.press("Tab")
                await e.focus()
                focused=await e.evaluate("""e=>({visible:e.matches(':focus-visible'),
                  style:getComputedStyle(e).outlineStyle,
                  color:getComputedStyle(e).outlineColor})""")
                before=await e.evaluate("e=>e.scrollLeft")
                await page.keyboard.press("ArrowRight")
                await page.wait_for_timeout(300)
                after=await e.evaluate("e=>e.scrollLeft")
                scroll.append({"focus":focused,"before":before,"after":after})
            await page.locator('a[href="#page-top"]').last.click()
            top=await page.evaluate("({hash:location.hash,scrollY})")
            errs=[]
            if first!="#main" or skip!="main":errs.append("skip link")
            if target["hash"]!="#variation-selection-model" or target["top"]< -4:
                errs.append("section fragment")
            if top["hash"]!="#page-top" or top["scrollY"]>4:errs.append("top link")
            if any(x["after"]<=x["before"] or not x["focus"]["visible"] or x["focus"]["style"]=="none" for x in scroll):
                errs.append("focus/arrow scrolling")
            result.append({"test":"keyboard","first":first,"skip":skip,"target":target,"scroll":scroll,"top":top,"errors":errs})
            print("KEYBOARD","PASS" if not errs else errs,flush=True)
        except Exception as exc:
            result.append({"test":"keyboard","errors":[repr(exc)]})
        finally:
            await page.close()

        page=await browser.new_page(viewport={"width":375,"height":850},reduced_motion="reduce")
        try:
            await page.goto(URL,wait_until="load")
            await page.locator(".moon-appearance-select").select_option("dark")
            await page.wait_for_function("document.documentElement.dataset.moonTheme==='dark'")
            await page.locator(".topbar .brand").focus()
            d=await page.evaluate("""() => ({
              theme:document.documentElement.dataset.moonTheme,
              outline:getComputedStyle(document.activeElement).outlineColor,
              visible:document.activeElement.matches(':focus-visible'),
              ink:getComputedStyle(document.querySelector('.hbs-figure-stage strong')).color,
              bg:getComputedStyle(document.querySelector('.hbs-figure-stage')).backgroundColor,
              overflow:document.documentElement.scrollWidth>innerWidth
            })""")
            errs=[]
            if d["theme"]!="dark" or not d["visible"] or d["outline"]!="rgb(145, 219, 170)":
                errs.append("dark focus")
            if d["ink"]==d["bg"] or d["overflow"]:errs.append("dark diagram/overflow")
            result.append({"test":"dark",**d,"errors":errs})
            await page.screenshot(path=str(OUT/"evolution-dark-375.png"),
                                  full_page=True,animations="disabled")
            print("DARK","PASS" if not errs else errs,flush=True)
        except Exception as exc:
            result.append({"test":"dark","errors":[repr(exc)]})
        finally:
            await page.close()

        page=await browser.new_page(viewport={"width":1440,"height":900},reduced_motion="reduce")
        try:
            await page.goto(URL,wait_until="load")
            await page.evaluate("document.fonts.ready")
            await page.wait_for_timeout(400)
            raw=await page.pdf(format="A4",print_background=True,
                               display_header_footer=False,
                               margin={"top":"12mm","bottom":"12mm","left":"12mm","right":"12mm"})
            (OUT/"evolution-A4.pdf").write_bytes(raw)
            doc=fitz.open(stream=raw,filetype="pdf")
            pages=[re.sub(r"\s+"," ",x.get_text("text")) for x in doc]
            titles=["Molecular and clinical relationships",
                    "Evidence for genetic and evolutionary claims",
                    "Malaria outcomes in a cohort study",
                    "Proposed four-meeting sequence",
                    "Illustrative population-genetics task",
                    "Selection across one generation",
                    "Human variation and genetic interpretation",
                    "Participation and decisions about evidence",
                    "References and related resources"]
            missing=[t for t in titles if not any(t in p for p in pages)]
            orphan=[(t,i+1) for t in titles for i,p in enumerate(pages[:-1])
                    if t in p and len(p.split(t,1)[-1].strip())<125]
            clipping=[]
            for i,pg in enumerate(doc):
                clipping += [(i+1,w[4]) for w in pg.get_text("words")
                             if w[0]<-1 or w[1]<-1 or w[2]>pg.rect.width+1 or w[3]>pg.rect.height+1]
                pg.get_pixmap(matrix=fitz.Matrix(1.1,1.1)).save(str(OUT/f"evolution-A4-{i+1}.png"))
            err=[]
            if not 2<=len(doc)<=15 or missing or orphan or clipping:
                err.append("print count/missing/orphan/clipped content")
            if not any("HBB allele variation" in s and
                       "Population model" in s and
                       "Figure 2. From haemoglobin variation" in s for s in pages):
                err.append("evolutionary inference figure is split over A4 sheets")
            if not any("References and related resources" in s and
                       "Beards, G." in s and "Williams, T. N." in s for s in pages):
                err.append("bibliography split over A4 sheets")
            if not any("Proposed four-meeting sequence" in s and
                       "1 · Molecular consequences" in s for s in pages):
                err.append("proposed-sequence heading stranded")
            result.append({"test":"print A4","pages":len(doc),"missing":missing,
                           "orphan":orphan,"clip":clipping[:20],"pageCharacters":[len(p) for p in pages],
                           "headingsByPage":[[t for t in titles if t in pg] for pg in pages],"errors":err})
            print("PRINT",len(doc),"PASS" if not err else err,flush=True)
        except Exception as exc:
            result.append({"test":"print A4","errors":[repr(exc)]})
        finally:
            await page.close()
        await browser.close()
    (OUT/"report.json").write_text(json.dumps(result,indent=2),encoding="utf-8")
    failures=[x for x in result if x.get("errors")]
    print("SUMMARY",len(result),"checks",len(failures),"failed",flush=True)
    if failures:raise AssertionError(json.dumps(failures,ensure_ascii=False)[:4000])

if __name__=="__main__":
    asyncio.run(main())
