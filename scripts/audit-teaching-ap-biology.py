"""Visitor-facing AP Biology teaching case QA. Collect exact browser and A4 evidence."""
import asyncio
import json
import re
from pathlib import Path
import fitz
from playwright.async_api import async_playwright

ROOT = "http://127.0.0.1:8768"
OUT = Path("biology-audit-output")
WIDTHS = (320, 375, 768, 1024, 1440)

async def main():
    OUT.mkdir(exist_ok=True)
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for width in WIDTHS:
            page = await browser.new_page(viewport={"width": width, "height": 900},
                                          reduced_motion="reduce")
            errors = []
            try:
                response = await page.goto(ROOT + "/teaching-ap-biology.html",
                                           wait_until="load", timeout=30000)
                await page.evaluate("document.fonts.ready")
                await page.wait_for_timeout(350)
                data = await page.evaluate("""() => {
                    const main=document.querySelector('#main');
                    const rect=e=>e.getBoundingClientRect();
                    const headings=[...main.querySelectorAll('h1,h2,h3')]
                      .map(e=>({level:+e.tagName[1],text:e.textContent.trim(),
                        top:Math.round(rect(e).top+scrollY)}));
                    const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
                    const hashes=[...document.querySelectorAll('a[href^="#"]')]
                      .map(a=>a.getAttribute('href').slice(1));
                    const regions=[...main.querySelectorAll('.teaching-sequence-table-wrap')]
                      .map(e=>({width:Math.round(e.clientWidth),
                        contentWidth:Math.round(e.scrollWidth),
                        scrollable:e.scrollWidth>e.clientWidth,
                        keyboard:e.tabIndex===0,
                        label:e.getAttribute('aria-label'),
                        top:Math.round(rect(e).top+scrollY)}));
                    const img=main.querySelector('figure img');
                    const figures=[...main.querySelectorAll('figure')];
                    const escaped=[...main.querySelectorAll('h1,h2,h3,p,li,a,blockquote')]
                      .filter(e=>{let r=rect(e);return r.width>0
                       && (r.left< -3 || r.right>innerWidth+3);})
                      .map(e=>e.textContent.trim().slice(0,85));
                    const last=main.querySelector('#bio-reading');
                    return {
                      innerWidth,documentWidth:document.documentElement.scrollWidth,
                      mainCount:document.querySelectorAll('main').length,
                      title:document.title,
                      headingCount:headings.length,headings,
                      idUnique:ids.length===new Set(ids).size,
                      brokenHashes:hashes.filter(id=>!ids.includes(id)),
                      unnamedLinks:[...document.querySelectorAll('a[href]')]
                        .filter(a=>!(a.innerText||a.getAttribute('aria-label')||'').trim()).length,
                      escaped,
                      sections:[...main.querySelectorAll('section[id]')].map(e=>e.id),
                      regions,figures:figures.length,
                      image:{naturalWidth:img.naturalWidth,complete:img.complete,
                         alt:img.getAttribute('alt'),
                         displayWidth:Math.round(rect(img).width),
                         figcaption:!!img.closest('figure').querySelector('figcaption')},
                      sourceCount:main.querySelectorAll('.teaching-source-list li').length,
                      footerGap:Math.round(rect(document.querySelector('.site-footer')).top-rect(last).bottom),
                      figureBounds:figures.map(e=>({left:Math.round(rect(e).left),
                         right:Math.round(rect(e).right)}))
                    };
                }""")
                if response is None or response.status != 200:
                    errors.append("HTTP response not 200")
                if data["documentWidth"] > width:
                    errors.append("horizontal document overflow")
                if data["mainCount"] != 1 or not data["headings"] or data["headings"][0]["level"] != 1:
                    errors.append("document landmark/heading")
                if not data["idUnique"] or data["brokenHashes"] or data["unnamedLinks"]:
                    errors.append("broken anchors or link names")
                if data["escaped"]:
                    errors.append("text element escapes viewport")
                if len(data["regions"]) != 2:
                    errors.append("two table regions expected")
                elif any(not t["keyboard"] or not t["label"] for t in data["regions"]):
                    errors.append("inaccessible table region")
                if width <= 375 and any(not t["scrollable"] for t in data["regions"]):
                    errors.append("expected horizontal scroll unavailable at mobile width")
                if data["sourceCount"] != 6 or data["figures"] != 2:
                    errors.append("missing bibliography/figure")
                if not data["image"]["alt"] or not data["image"]["figcaption"]:
                    errors.append("missing image alternative text/caption")
                if data["image"]["complete"] and data["image"]["naturalWidth"] == 0:
                    errors.append("micrograph image failed to load")
                if any(b["left"] < -3 or b["right"] > width + 3 for b in data["figureBounds"]):
                    errors.append("figure outside viewport")
                data["errors"] = errors
                results.append({"test":"responsive", **data})
                await page.screenshot(path=str(OUT / ("biology-" + str(width) + ".png")),
                                      full_page=True, animations="disabled")
                print("BIOLOGY",width,"PASS" if not errors else errors,flush=True)
            except Exception as exc:
                results.append({"test":"responsive","width":width,"errors":[repr(exc)]})
                print("BIOLOGY ERROR",width,repr(exc),flush=True)
            finally:
                await page.close()

        page = await browser.new_page(viewport={"width":375,"height":850},
                                      reduced_motion="reduce")
        try:
            await page.goto(ROOT + "/teaching-ap-biology.html",wait_until="load")
            await page.evaluate("document.documentElement.style.scrollBehavior='auto'")
            await page.keyboard.press("Tab")
            first = await page.evaluate("document.activeElement.getAttribute('href')")
            await page.keyboard.press("Enter")
            skipped = await page.evaluate("document.activeElement.id")
            await page.locator('.article-jumps a[href="#bio-assessment"]').click()
            target = await page.evaluate("""() => ({hash:location.hash,
                targetTop:document.querySelector('#bio-assessment').getBoundingClientRect().top})""")
            regions = page.locator(".teaching-sequence-table-wrap")
            scroll = []
            for i in range(2):
                r=regions.nth(i)
                # Keyboard modality first; :focus-visible is not guaranteed after a mouse click.
                await page.keyboard.press("Tab")
                await r.focus()
                focus=await r.evaluate("""e=>({visible:e.matches(':focus-visible'),
                  outline:getComputedStyle(e).outlineStyle,
                  color:getComputedStyle(e).outlineColor})""")
                before=await r.evaluate("e=>e.scrollLeft")
                await page.keyboard.press("ArrowRight")
                await page.wait_for_timeout(280)
                after=await r.evaluate("e=>e.scrollLeft")
                scroll.append({"focus":focus,"before":before,"after":after})
            await page.locator('.site-footer-links a[href="#page-top"]').click()
            top=await page.evaluate("({hash:location.hash,scrollY})")
            errors=[]
            if first != "#main" or skipped != "main":errors.append("skip-link")
            if target["hash"] != "#bio-assessment" or target["targetTop"] < -4:
                errors.append("in-page jump")
            if top["hash"] != "#page-top" or top["scrollY"] > 4:
                errors.append("return to top")
            if any(x["after"] <= x["before"] or not x["focus"]["visible"]
                   or x["focus"]["outline"] == "none" for x in scroll):
                errors.append("keyboard horizontal scrolling/focus")
            results.append({"test":"keyboard", "first":first, "skipped":skipped,
                            "target":target, "scroll":scroll,"top":top,"errors":errors})
            print("KEYBOARD","PASS" if not errors else errors,flush=True)
        except Exception as exc:
            results.append({"test":"keyboard","errors":[repr(exc)]})
            print("KEYBOARD ERROR",repr(exc),flush=True)
        finally:
            await page.close()

        page = await browser.new_page(viewport={"width":375,"height":850},
                                      reduced_motion="reduce")
        try:
            await page.goto(ROOT + "/teaching-ap-biology.html",wait_until="load")
            await page.locator(".moon-appearance-select").select_option("dark")
            await page.wait_for_function("document.documentElement.dataset.moonTheme==='dark'")
            await page.locator(".topbar .brand").focus()
            data=await page.evaluate("""() => {
               const root=document.documentElement;
               const b=document.activeElement;
               const fig=document.querySelector('.teaching-bio-mechanism');
               const panel=document.querySelector('.bio-mechanism-start');
               const tbl=document.querySelector('.teaching-sequence-table');
               return {
                 theme:root.dataset.moonTheme,
                 brandOutline:getComputedStyle(b).outlineColor,
                 focusVisible:b.matches(':focus-visible'),
                 panelBg:getComputedStyle(panel).backgroundColor,
                 panelText:getComputedStyle(panel.querySelector('strong')).color,
                 figBg:getComputedStyle(fig).backgroundColor,
                 tableText:getComputedStyle(tbl.querySelector('td')).color,
                 tableBg:getComputedStyle(tbl.querySelector('td')).backgroundColor,
                 overflow:document.documentElement.scrollWidth>innerWidth
               };
            }""")
            errors=[]
            if data["theme"]!="dark" or not data["focusVisible"] or data["brandOutline"]!="rgb(145, 219, 170)":
                errors.append("dark keyboard focus")
            if data["overflow"] or data["panelBg"]==data["panelText"] or data["tableText"]==data["tableBg"]:
                errors.append("dark contrast/overflow")
            results.append({"test":"dark","details":data,"errors":errors})
            await page.screenshot(path=str(OUT/"biology-dark-375.png"),
                                  full_page=True,animations="disabled")
            print("DARK","PASS" if not errors else errors,flush=True)
        except Exception as exc:
            results.append({"test":"dark","errors":[repr(exc)]})
            print("DARK ERROR",repr(exc),flush=True)
        finally:
            await page.close()

        page = await browser.new_page(viewport={"width":1440,"height":900},
                                      reduced_motion="reduce")
        try:
            await page.goto(ROOT + "/teaching-ap-biology.html",wait_until="load")
            await page.evaluate("document.fonts.ready")
            await page.wait_for_timeout(400)
            raw = await page.pdf(format="A4",print_background=True,
                                 display_header_footer=False,
                                 margin={"top":"12mm","bottom":"12mm",
                                         "left":"12mm","right":"12mm"})
            (OUT/"biology-A4.pdf").write_bytes(raw)
            doc=fitz.open(stream=raw,filetype="pdf")
            pages=[re.sub(r"\s+"," ",p.get_text("text")) for p in doc]
            titles=["Original assessment question",
                    "Thylakoid structure and the inhibition pathway",
                    "Correction and independent reconstruction",
                    "Classification of mechanistic explanations",
                    "Proposed follow-up teaching sequence",
                    "Examining evidence and reconstructing a mechanism",
                    "Sources and study documentation"]
            missing=[t for t in titles if not any(t in x for x in pages)]
            stranded=[]
            for t in titles:
                for i,x in enumerate(pages):
                    if t in x:
                        position=x.index(t)
                        # Near page end, little text after heading indicates an orphan.
                        if len(x[position+len(t):].strip()) < 115 and i < len(pages)-1:
                            stranded.append({"heading":t,"page":i+1})
            clip=[]
            for i,pg in enumerate(doc):
                words=pg.get_text("words")
                for w in words:
                    if w[0]<-1 or w[2]>pg.rect.width+1 or w[1]<-1 or w[3]>pg.rect.height+1:
                        clip.append({"page":i+1,"word":w[4]})
                pg.get_pixmap(matrix=fitz.Matrix(1.05,1.05)).save(
                    str(OUT/("biology-A4-"+str(i+1)+".png")))
            errors=[]
            if not 2 <= len(doc) <= 14: errors.append("unexpected A4 page count")
            if missing: errors.append("section titles missing in print")
            if stranded: errors.append("heading orphan(s)")
            if clip: errors.append("text beyond paper edge")
            data={"test":"print A4","pages":len(doc),"chars":[len(s) for s in pages],
                  "missing":missing,"stranded":stranded,"clip":clip[:15],"errors":errors}
            results.append(data)
            print("PRINT",len(doc),"PASS" if not errors else errors,flush=True)
        except Exception as exc:
            results.append({"test":"print A4","errors":[repr(exc)]})
            print("PRINT ERROR",repr(exc),flush=True)
        finally:
            await page.close()
        await browser.close()
    (OUT/"report.json").write_text(json.dumps(results,indent=2),encoding="utf-8")
    failures=[x for x in results if x.get("errors")]
    print("SUMMARY",len(results),"checks",len(failures),"failed",flush=True)
    if failures:
        raise AssertionError(json.dumps(failures,ensure_ascii=False)[:3000])

if __name__=="__main__":
    asyncio.run(main())
