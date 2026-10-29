"""Visitor-facing AP Chemistry equilibrium case audit, including numerical and print QA."""
import asyncio
import json
import math
import re
from pathlib import Path
import fitz
from playwright.async_api import async_playwright

BASE = "http://127.0.0.1:8769"
OUT = Path("chemistry-audit-output")
WIDTHS = (320, 375, 768, 1024, 1440)
SECTIONS = ("chem-task", "chem-representations", "chem-sequence", "chem-feedback",
            "chem-assessment", "chem-disturbance-check", "chem-participation",
            "chem-reading")

def check_equilibrium_arithmetic():
    def qp(n2, h2, nh3):
        return nh3**2 / (n2*h2**3)
    cases = {
        "initial below K": (qp(1, 2, 1), .125),
        "starting compression equilibrium": (qp(1, 2, 2), .5),
        "immediately after volume halved": (qp(2, 4, 4), .125),
        "independent equilibrium task": (qp(2, 1, 1), .5),
        "immediately after expansion": (qp(.5, 1, 1), 2.0),
    }
    failed = [name for name, (actual, expected) in cases.items()
              if not math.isclose(actual, expected, rel_tol=1e-12)]
    return {"test": "scientific arithmetic",
            "cases": {k: {"actual": v[0], "expected": v[1]}
                      for k, v in cases.items()}, "errors": failed}

async def main():
    OUT.mkdir(exist_ok=True)
    results = [check_equilibrium_arithmetic()]
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for width in WIDTHS:
            page = await browser.new_page(viewport={"width": width, "height": 900},
                                          reduced_motion="reduce")
            try:
                response = await page.goto(BASE + "/teaching-ap-chemistry.html",
                                           wait_until="load", timeout=25000)
                await page.evaluate("document.fonts.ready")
                data = await page.evaluate("""() => {
                   const main=document.querySelector('#main');
                   const box=e=>e.getBoundingClientRect();
                   const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
                   const hashes=[...document.querySelectorAll('a[href^="#"]')]
                       .map(a=>a.getAttribute('href').slice(1));
                   const regions=[...main.querySelectorAll('.teaching-sequence-table-wrap')]
                     .map(e=>({client:e.clientWidth,scroll:e.scrollWidth,
                       keyboard:e.tabIndex===0,label:e.getAttribute('aria-label')}));
                   const escaped=[...main.querySelectorAll('h1,h2,h3,p,li,a,blockquote,figcaption')]
                      .filter(e=>{let b=box(e);return b.width>0
                         && (b.left < -3 || b.right > innerWidth+3);})
                      .map(e=>e.textContent.trim().slice(0,85));
                   const stages=[...main.querySelectorAll('.chem-stage')].map(e=>({
                     left:Math.round(box(e).left),right:Math.round(box(e).right),
                     height:Math.round(box(e).height)}));
                   const figure=main.querySelector('.chem-pressure-check figure');
                   return {
                     viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,
                     h1:[...main.querySelectorAll('h1')].map(e=>e.innerText),
                     sections:[...main.querySelectorAll('section[id]')].map(e=>e.id),
                     duplicateIds:ids.length!==new Set(ids).size,
                     unresolvedHashes:hashes.filter(x=>!ids.includes(x)),
                     unnamedLinks:[...document.querySelectorAll('a[href]')]
                        .filter(a=>!(a.innerText||a.getAttribute('aria-label')||'').trim()).length,
                     escaped,regions,stages,
                     figureCaption:!!figure?.querySelector('figcaption'),
                     figureBounds:figure ? {left:box(figure).left,right:box(figure).right}:null,
                     references:main.querySelectorAll('.teaching-source-list li').length,
                     footerGap:Math.round(box(document.querySelector('.site-footer')).top
                                        -box(main.querySelector('#chem-reading')).bottom),
                     title:document.title,
                     previewStatus:main.querySelector('.teaching-case-hero .meta')?.textContent.trim()
                   };
                }""")
                errors = []
                if not response or response.status != 200:errors.append("page response")
                if data["documentWidth"]>width or data["escaped"]:
                    errors.append("horizontal text/document overflow")
                if len(data["h1"])!=1 or data["h1"][0]!="Chemical equilibrium and molecular explanations":
                    errors.append("H1/title")
                if data["sections"] != list(SECTIONS):
                    errors.append("missing/wrong page sections")
                if data["duplicateIds"] or data["unresolvedHashes"] or data["unnamedLinks"]:
                    errors.append("internal links/IDs/unnamed links")
                if data["references"]!=4 or not data["figureCaption"] or len(data["stages"])!=3:
                    errors.append("citation or diagram structure")
                if not data["figureBounds"] or data["figureBounds"]["left"] < -3 or data["figureBounds"]["right"] > width + 3:
                    errors.append("figure overflow")
                if len(data["regions"])!=2 or any(not x["keyboard"] or not x["label"] for x in data["regions"]):
                    errors.append("scrollable tables missing keyboard/name")
                if width<=375 and any(x["scroll"]<=x["client"] for x in data["regions"]):
                    errors.append("mobile table does not scroll")
                data.update({"test": "responsive", "errors":errors})
                results.append(data)
                await page.screenshot(path=str(OUT/f"chemistry-{width}.png"),
                                      full_page=True, animations="disabled")
                print("CHEM",width,"PASS" if not errors else errors,flush=True)
            except Exception as exc:
                results.append({"test":"responsive","width":width,"errors":[repr(exc)]})
                print("CHEM",width,"ERROR",repr(exc),flush=True)
            finally:
                await page.close()

        page=await browser.new_page(viewport={"width":375,"height":850},
                                    reduced_motion="reduce")
        try:
            await page.goto(BASE+"/teaching-ap-chemistry.html",wait_until="load")
            await page.evaluate("document.documentElement.style.scrollBehavior='auto'")
            await page.keyboard.press("Tab")
            first=await page.evaluate("document.activeElement.getAttribute('href')")
            await page.keyboard.press("Enter")
            skipped=await page.evaluate("document.activeElement?.id")
            await page.locator('.article-jumps a[href="#chem-assessment"]').click()
            jump=await page.evaluate("""() => ({
               hash:location.hash,
               top:document.querySelector('#chem-assessment').getBoundingClientRect().top})""")
            scrolled=[]
            for i in range(2):
                region=page.locator('.teaching-sequence-table-wrap').nth(i)
                await page.keyboard.press("Tab")
                await region.focus()
                focus=await region.evaluate("""e=>({
                   visible:e.matches(':focus-visible'),
                   style:getComputedStyle(e).outlineStyle,
                   colour:getComputedStyle(e).outlineColor})""")
                before=await region.evaluate("e=>e.scrollLeft")
                await page.keyboard.press("ArrowRight")
                await page.wait_for_timeout(270)
                after=await region.evaluate("e=>e.scrollLeft")
                scrolled.append({"focus":focus,"before":before,"after":after})
            await page.locator('a[href="#page-top"]').last.click()
            end=await page.evaluate("({hash:location.hash,y:scrollY})")
            errors=[]
            if first!="#main" or skipped!="main":errors.append("skip navigation")
            if jump["hash"]!="#chem-assessment" or jump["top"]<-4:errors.append("section fragment")
            if end["hash"]!="#page-top" or end["y"]>4:errors.append("return-to-top")
            if any(x["after"]<=x["before"] or not x["focus"]["visible"]
                   or x["focus"]["style"]=="none" for x in scrolled):
                errors.append("table keyboard scrolling or focus")
            results.append({"test":"keyboard", "first":first, "skipped":skipped,
                            "jump":jump,"tables":scrolled,"end":end,"errors":errors})
            print("KEYBOARD","PASS" if not errors else errors,flush=True)
        except Exception as exc:
            results.append({"test":"keyboard","errors":[repr(exc)]})
            print("KEYBOARD ERROR",repr(exc),flush=True)
        finally:
            await page.close()

        page=await browser.new_page(viewport={"width":375,"height":850},
                                    reduced_motion="reduce")
        try:
            await page.goto(BASE+"/teaching-ap-chemistry.html",wait_until="load")
            await page.locator('.moon-appearance-select').select_option('dark')
            await page.wait_for_function("document.documentElement.dataset.moonTheme==='dark'")
            await page.locator(".topbar .brand").focus()
            d=await page.evaluate("""() => ({
               theme:document.documentElement.dataset.moonTheme,
               outline:getComputedStyle(document.activeElement).outlineColor,
               visible:document.activeElement.matches(':focus-visible'),
               panelBg:getComputedStyle(document.querySelector('.chem-equation-panel')).backgroundColor,
               panelInk:getComputedStyle(document.querySelector('.chem-equation-panel p:not(.meta)')).color,
               tableInk:getComputedStyle(document.querySelector('.teaching-sequence-table tbody td')).color,
               tableBg:getComputedStyle(document.querySelector('.teaching-sequence-table tbody td')).backgroundColor,
               overflow:document.documentElement.scrollWidth>innerWidth
            })""")
            errors=[]
            if d["theme"]!="dark" or not d["visible"] or d["outline"]!="rgb(145, 219, 170)":
                errors.append("dark theme/focus")
            if d["overflow"] or d["panelBg"]==d["panelInk"] or d["tableInk"]==d["tableBg"]:
                errors.append("dark overflow/colour")
            results.append({"test":"dark",**d,"errors":errors})
            await page.screenshot(path=str(OUT/"chemistry-dark-375.png"),
                                  full_page=True,animations="disabled")
            print("DARK","PASS" if not errors else errors,flush=True)
        except Exception as exc:
            results.append({"test":"dark","errors":[repr(exc)]})
            print("DARK ERROR",repr(exc),flush=True)
        finally:
            await page.close()

        page=await browser.new_page(viewport={"width":1440,"height":900},
                                    reduced_motion="reduce")
        try:
            await page.goto(BASE+"/teaching-ap-chemistry.html",wait_until="load")
            await page.evaluate("document.fonts.ready")
            raw=await page.pdf(format="A4",print_background=True,
                               display_header_footer=False,
                               margin={"top":"12mm","bottom":"12mm",
                                       "left":"12mm","right":"12mm"})
            (OUT/"chemistry-A4.pdf").write_bytes(raw)
            doc=fitz.open(stream=raw,filetype="pdf")
            pages=[re.sub(r"\s+"," ",pg.get_text("text")) for pg in doc]
            titles=["Reaction quotient and equilibrium direction",
                    "Macroscopic, particulate, and symbolic accounts",
                    "Proposed three-meeting sequence",
                    "Interpreting possible student responses",
                    "Independent equilibrium task",
                    "Transfer task after expansion",
                    "Assessment across representations",
                    "Sources and related scholarship"]
            missing=[t for t in titles if not any(t in x for x in pages)]
            stranded=[]
            for title in titles:
                for i,text in enumerate(pages[:-1]):
                    if title in text and len(text.split(title,1)[-1].strip())<120:
                        stranded.append({"title":title,"page":i+1})
            clipping=[]
            for i,pg in enumerate(doc):
                for word in pg.get_text("words"):
                    if word[0]<-1 or word[1]<-1 or word[2]>pg.rect.width+1 or word[3]>pg.rect.height+1:
                        clipping.append({"page":i+1,"word":word[4]})
                pg.get_pixmap(matrix=fitz.Matrix(1.05,1.05)).save(
                    str(OUT/f"chemistry-A4-{i+1}.png"))
            errors=[]
            if not 2<=len(doc)<=14:errors.append("unexpected A4 page count")
            if missing or stranded or clipping:errors.append("A4 missing/orphan/clip")
            results.append({"test":"print A4","pageCount":len(doc),"missing":missing,
                            "stranded":stranded,"clipping":clipping[:15],
                            "characters":[len(x) for x in pages],"errors":errors})
            print("PRINT",len(doc),"PASS" if not errors else errors,flush=True)
        except Exception as exc:
            results.append({"test":"print A4","errors":[repr(exc)]})
            print("PRINT ERROR",repr(exc),flush=True)
        finally:
            await page.close()
        await browser.close()
    (OUT/"report.json").write_text(json.dumps(results,indent=2),encoding="utf-8")
    failures=[r for r in results if r.get("errors")]
    print("SUMMARY",len(results),"checks",len(failures),"failed",flush=True)
    if failures:raise AssertionError(json.dumps(failures,ensure_ascii=False)[:4500])

if __name__=="__main__":
    asyncio.run(main())
