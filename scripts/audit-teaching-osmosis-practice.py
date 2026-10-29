"""T5 student-facing osmosis worksheet audit: browser, calculations, printing and accessibility."""
import asyncio
import json
import re
from pathlib import Path

import fitz
from playwright.async_api import async_playwright

BASE="http://127.0.0.1:8771"
OUTPUT=Path("osmosis-audit-output")
WIDTHS=(320,375,768,1024,1440)

async def main():
    OUTPUT.mkdir(exist_ok=True)
    results=[]
    # Keep data-derived values computed independently from the claims in teacher notes.
    rows=[(0,10.0,10.8), (10,10.0,9.6), (20,10.0,8.7)]
    derived=[{"sucrose_g_per_100_ml":c,"delta_g":round(final-initial,3),
              "delta_pct":round(100*(final-initial)/initial,3)}
             for c,initial,final in rows]
    expected=[(0.8,8.0),(-0.4,-4.0),(-1.3,-13.0)]
    arithmetic_errors=[f"row {i}" for i,x in enumerate(derived)
        if abs(x["delta_g"]-expected[i][0])>1e-8
           or abs(x["delta_pct"]-expected[i][1])>1e-8]
    results.append({"test":"arithmetic","derived":derived,"errors":arithmetic_errors})
    async with async_playwright() as p:
        browser=await p.chromium.launch()
        for width in WIDTHS:
            page=await browser.new_page(viewport={"width":width,"height":900},
                                        reduced_motion="reduce")
            errors=[]
            try:
                resp=await page.goto(BASE+"/teaching-osmosis-practice.html",
                                     wait_until="load",timeout=30000)
                await page.evaluate("document.fonts.ready")
                data=await page.evaluate("""() => {
                  const main=document.querySelector('#main');
                  const r=e=>e.getBoundingClientRect();
                  const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
                  const local=[...document.querySelectorAll('a[href^="#"]')]
                    .map(e=>e.getAttribute('href').slice(1));
                  const elements=[...main.querySelectorAll('h1,h2,h3,p,li,th,td,button,a')];
                  const escaped=elements.filter(e=>{
                    const b=r(e);return b.width>0&&(b.left< -3||b.right>innerWidth+3)
                  }).map(e=>e.textContent.trim().slice(0,75));
                  const table=main.querySelector('.worksheet-data');
                  const buttons=[...main.querySelectorAll('button')];
                  const details=main.querySelector('.worksheet-teacher-notes');
                  return {
                    viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,
                    mainCount:document.querySelectorAll('main').length,
                    headings:[...main.querySelectorAll('h1,h2,h3')].map(e=>({
                      level:Number(e.tagName[1]),title:e.textContent.trim()})),
                    escaped,duplicateIds:ids.length!==new Set(ids).size,
                    unresolvedHashes:local.filter(id=>!ids.includes(id)),
                    unnamedLinks:[...document.querySelectorAll('a[href]')]
                        .filter(a=>!(a.innerText||a.getAttribute('aria-label')||'').trim()).length,
                    table:{bounds:{left:r(table).left,right:r(table).right},
                      caption:table.querySelector('caption')?.textContent.trim(),
                      rows:table.querySelectorAll('tbody tr').length,
                      headerScopes:[...table.querySelectorAll('th')].map(e=>e.getAttribute('scope'))},
                    questions:main.querySelectorAll('.worksheet-task-list>li').length,
                    answerSpaces:main.querySelectorAll('.worksheet-answer-space').length,
                    printButton:buttons.length===1?buttons[0].textContent.trim():null,
                    teacher:{tag:details?.tagName,summary:details?.querySelector('summary')?.textContent.trim(),
                      expanded:details?.open},
                    nameFieldVisibility:getComputedStyle(main.querySelector('.worksheet-print-identification')).display,
                    footerGap:Math.round(r(document.querySelector('.site-footer')).top-r(main.querySelector('.worksheet-teacher-section')).bottom),
                    robots:document.querySelector('meta[name=robots]')?.content
                  };
                }""")
                if not resp or resp.status!=200:errors.append("page response")
                if data["mainCount"]!=1 or data["documentWidth"]>width or data["escaped"]:
                    errors.append("landmark or horizontal overflow")
                if data["headings"][:4]!=[
                  {"level":1,"title":"Osmosis and changes in mass"},
                  {"level":2,"title":"Student activity"},
                  {"level":2,"title":"Data and calculations"},
                  {"level":2,"title":"Teacher notes"}]:
                    errors.append("heading hierarchy")
                if data["duplicateIds"] or data["unresolvedHashes"] or data["unnamedLinks"]:
                    errors.append("ID, anchor, link accessible name")
                if (data["table"]["rows"]!=3 or not data["table"]["caption"]
                    or data["table"]["bounds"]["left"] < -3
                    or data["table"]["bounds"]["right"]>width+3
                    or any(x not in ("col","row") for x in data["table"]["headerScopes"])):
                    errors.append("table semantics or width")
                if data["questions"]!=4 or data["answerSpaces"]!=4:errors.append("questions")
                if data["printButton"]!="Print the student activity":errors.append("print action")
                if data["teacher"]["tag"]!="DETAILS" or not data["teacher"]["summary"]:
                    errors.append("teacher disclosure")
                if data["nameFieldVisibility"]!="none":errors.append("name/date incorrectly displayed on screen")
                if not 95<=data["footerGap"]<=105:errors.append("footer gap differs from 100px")
                results.append({"test":"responsive","width":width,**data,"errors":errors})
                await page.screenshot(path=str(OUTPUT/f"osmosis-{width}.png"),
                                      full_page=True,animations="disabled")
                print("OSMOSIS",width,"PASS" if not errors else errors,flush=True)
            except Exception as e:
                results.append({"test":"responsive","width":width,"errors":[repr(e)]})
                print("OSMOSIS",width,"ERROR",repr(e),flush=True)
            finally:
                await page.close()

        page=await browser.new_page(viewport={"width":375,"height":900},
                                    reduced_motion="reduce")
        try:
            await page.goto(BASE+"/teaching-osmosis-practice.html",wait_until="load")
            await page.keyboard.press("Tab")
            first=await page.evaluate("document.activeElement.getAttribute('href')")
            await page.keyboard.press("Enter")
            skip=await page.evaluate("document.activeElement.id")
            # Verify actual button invokes native printing, without opening a print dialog in CI.
            await page.evaluate("""() => {
                window.__calls=0;
                window.__printStacks=[];
                window.__clickCount=0;
                window.print=()=>{
                  window.__calls++;
                  window.__printStacks.push(new Error("print invoked").stack);
                };
                document.querySelector('.worksheet-actions button')
                    .addEventListener('click',()=>{window.__clickCount++});
            }""")
            await page.locator('.worksheet-actions button').click()
            diagnostic=await page.evaluate("""() => ({
                calls:window.__calls,
                clickCount:window.__clickCount,
                printStacks:window.__printStacks
            })""")
            calls=diagnostic["calls"]
            teacher=page.locator("details.worksheet-teacher-notes")
            await teacher.locator("summary").click()
            expanded=await teacher.get_attribute("open")
            await page.locator('.site-footer-links a[href="#page-top"]').click()
            top=await page.evaluate("({hash:location.hash,y:scrollY})")
            errors=[]
            if first!="#main" or skip!="main":errors.append("keyboard skip")
            if calls!=1 or diagnostic["clickCount"]!=1:errors.append("print button invocation count unexpected")
            if expanded is None:errors.append("details summary does not expand")
            if top["hash"]!="#page-top" or top["y"]>4:errors.append("top navigation")
            results.append({"test":"interactions","skip":skip,"printCalls":calls,"printDiagnostic":diagnostic,
                            "teacherOpen":expanded is not None,"top":top,"errors":errors})
            print("INTERACTIONS","PASS" if not errors else errors,flush=True)
        except Exception as e:
            results.append({"test":"interactions","errors":[repr(e)]})
        finally:
            await page.close()

        page=await browser.new_page(viewport={"width":375,"height":900},
                                    reduced_motion="reduce")
        try:
            await page.goto(BASE+"/teaching-osmosis-practice.html",wait_until="load")
            await page.locator('.moon-appearance-select').select_option("dark")
            await page.wait_for_function("document.documentElement.dataset.moonTheme==='dark'")
            await page.locator(".topbar .brand").focus()
            d=await page.evaluate("""() => ({
              theme:document.documentElement.dataset.moonTheme,
              focus:document.activeElement.matches(':focus-visible'),
              focusColor:getComputedStyle(document.activeElement).outlineColor,
              tableBg:getComputedStyle(document.querySelector('.worksheet-data thead th')).backgroundColor,
              tableInk:getComputedStyle(document.querySelector('.worksheet-data thead th')).color,
              overflow:document.documentElement.scrollWidth>innerWidth
            })""")
            errs=[]
            if d["theme"]!="dark" or not d["focus"] or d["focusColor"]!="rgb(145, 219, 170)":
                errs.append("dark keyboard focus")
            if d["overflow"] or d["tableBg"]==d["tableInk"]:errs.append("dark contrast/overflow")
            results.append({"test":"dark","data":d,"errors":errs})
            await page.screenshot(path=str(OUTPUT/"osmosis-dark-375.png"),
                                  full_page=True,animations="disabled")
            print("DARK","PASS" if not errs else errs,flush=True)
        except Exception as e:
            results.append({"test":"dark","errors":[repr(e)]})
        finally:
            await page.close()

        page=await browser.new_page(viewport={"width":1440,"height":900},
                                    reduced_motion="reduce")
        try:
            await page.goto(BASE+"/teaching-osmosis-practice.html",wait_until="load")
            await page.evaluate("document.fonts.ready")
            await page.emulate_media(media="print")
            print_css=await page.evaluate("""() => {
               const shown=e=>!!e&&getComputedStyle(e).display!=='none';
               const main=document.querySelector('main');
               const answer=[...main.querySelectorAll('.worksheet-answer-space')];
               return {nameDateVisible:shown(main.querySelector('.worksheet-print-identification')),
                 teacherNotesVisible:shown(main.querySelector('.worksheet-teacher-section')),
                 controlsVisible:shown(main.querySelector('.worksheet-actions')),
                 headerVisible:shown(document.querySelector('.topbar')),
                 footerVisible:shown(document.querySelector('.site-footer')),
                 answerHeights:answer.map(e=>Math.round(e.getBoundingClientRect().height))}
            }""")
            raw=await page.pdf(format="A4",print_background=True,
                               display_header_footer=False,
                               margin={"top":"12mm","bottom":"12mm",
                                       "left":"12mm","right":"12mm"})
            (OUTPUT/"osmosis-A4.pdf").write_bytes(raw)
            doc=fitz.open(stream=raw,filetype="pdf")
            texts=[re.sub(r"\s+"," ",pg.get_text("text")) for pg in doc]
            fragments=["Osmosis and changes in mass","Student activity","Data and calculations",
                       "Describe the measurements","Propose a mechanism",
                       "Check what the table tells you","Improve the investigation"]
            missing=[x for x in fragments if not any(x in page for page in texts)]
            excluded=["Teacher notes","Open the explanation and suggested follow-up questions",
                      "Print the student activity"]
            leaked=[x for x in excluded if any(x in page for page in texts)]
            bounds=[]
            for i,pg in enumerate(doc):
                for w in pg.get_text("words"):
                    if w[0]<-1 or w[1]<-1 or w[2]>pg.rect.width+1 or w[3]>pg.rect.height+1:
                        bounds.append({"page":i+1,"word":w[4]})
                pg.get_pixmap(matrix=fitz.Matrix(1.3,1.3)).save(str(OUTPUT/f"osmosis-A4-{i+1}.png"))
            errs=[]
            if not 1<=len(doc)<=5:errs.append("unexpected A4 page count")
            if missing or leaked or bounds:errs.append("print text missing, teacher content leaked, or clipping")
            if (not print_css["nameDateVisible"] or print_css["teacherNotesVisible"] or
                print_css["controlsVisible"] or print_css["headerVisible"] or print_css["footerVisible"]):
                errs.append("print stylesheet visibility")
            if print_css["answerHeights"] != [85,140,125,110]:
                errs.append("answer space print heights")
            results.append({"test":"print A4","pages":len(doc),"pageChars":[len(t) for t in texts],
                            "missing":missing,"leaked":leaked,"bounds":bounds[:12],
                            "printCss":print_css,"errors":errs})
            print("PRINT",len(doc),"PASS" if not errs else errs,flush=True)
        except Exception as e:
            results.append({"test":"print A4","errors":[repr(e)]})
            print("PRINT ERROR",repr(e),flush=True)
        finally:
            await page.close()
        await browser.close()
    (OUTPUT/"report.json").write_text(json.dumps(results,indent=2),encoding="utf-8")
    bad=[x for x in results if x.get("errors")]
    print("SUMMARY",len(results),"checks",len(bad),"failed",flush=True)
    if bad:raise AssertionError(json.dumps(bad,ensure_ascii=False)[:5000])

if __name__=="__main__":
    asyncio.run(main())
