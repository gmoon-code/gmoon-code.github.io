"""Stage R3, independent visitor check of the current ERIC-bounded scoping page."""
import asyncio,json,re
from pathlib import Path
import fitz
from playwright.async_api import async_playwright
BASE="http://127.0.0.1:8779"
URL=BASE+"/research-scoping.html"
OUT=Path("scoping-visitor-output")
WIDTHS=[320,375,480,560,620,700,701,768,900,1024,1140,1440]
SECTIONS=["evidence-routes","case-study","learner-reporting","review-method","scoping-limitations"]
PRINT_REQUIRED=["Evidence of multilingual students", "Forms of evidence in the included studies",
 "Ecological modelling and language use","Reporting language and schooling conditions",
 "Search and charting methods","Interpretation and limitations",
 "20 of 20","14 of 20","5 of 20","1 of 20","216","79","20"]
async def main():
    OUT.mkdir(exist_ok=True)
    results=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch()
        for w in WIDTHS:
            page=await browser.new_page(viewport={"width":w,"height":850},reduced_motion="reduce")
            try:
                response=await page.goto(URL,wait_until="load",timeout=20000)
                await page.evaluate("document.fonts.ready")
                data=await page.evaluate("""() => {
                    const main=document.querySelector('#main'), rect=e=>e.getBoundingClientRect();
                    const box=e=>{let b=rect(e);return {top:Math.round(b.top+scrollY),
                       bottom:Math.round(b.bottom+scrollY),left:Math.round(b.left),
                       right:Math.round(b.right),width:Math.round(b.width)}};
                    const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
                    const anchors=[...document.querySelectorAll('a[href^="#"]')]
                       .map(e=>e.getAttribute('href').slice(1));
                    const sections=[...main.querySelectorAll('section[id]')].map(e=>e.id);
                    const texts=[...main.querySelectorAll('h1,h2,h3,p,li,a,small,caption,th,td')];
                    const clipped=texts.filter(e=>{let s=getComputedStyle(e);
                        return s.overflow!=='visible'&&(e.scrollHeight>e.clientHeight+3||e.scrollWidth>e.clientWidth+3)
                    }).map(e=>e.innerText.trim().slice(0,65));
                    const escaped=texts.filter(e=>{
                        if(e.closest('.research-table-wrap'))return false;
                        let b=rect(e);return b.width>0&&(b.left < -3||b.right>innerWidth+3);
                    }).map(e=>({text:e.innerText.trim().slice(0,65),box:box(e)}));
                    const tw=main.querySelector('.research-table-wrap'),table=tw.querySelector('table');
                    const cols=[...table.querySelectorAll('thead th')].map(e=>e.innerText.trim());
                    const rows=[...table.querySelectorAll('tbody tr')].map(e=>
                        [...e.querySelectorAll('th,td')].map(x=>x.innerText.trim()));
                    const hint=main.querySelector('.table-scroll-hint');
                    const cards=[...main.querySelectorAll('.research-route-card')];
                    const flow=[...main.querySelectorAll('.research-selection-flow > div')];
                    const disclosure=main.querySelector('details.research-references');
                    const footer=document.querySelector('.site-footer');
                    return {
                      viewport:innerWidth,docWidth:document.documentElement.scrollWidth,
                      mainCount:document.querySelectorAll('main').length,
                      h1:[...main.querySelectorAll('h1')].map(e=>e.innerText),
                      h2:[...main.querySelectorAll('h2')].map(e=>e.innerText),
                      sections,uniqueIds:ids.length===new Set(ids).size,
                      brokenAnchors:anchors.filter(id=>!ids.includes(id)),
                      unnamedLinks:[...document.querySelectorAll('a[href]')].filter(
                          e=>!(e.textContent||e.getAttribute('aria-label')||'').trim()).length,
                      navCurrent:[...document.querySelectorAll('.site-nav [aria-current="page"]')].map(e=>e.innerText),
                      routeCounts:cards.map(e=>e.querySelector('.research-route-count strong')?.innerText),
                      cardCount:cards.length,
                      table:{cols,rows,headers:[...table.querySelectorAll('thead th')].map(x=>x.scope),
                        rowHeaderCount:table.querySelectorAll('tbody th[scope=row]').length,
                        caption:table.caption?.innerText,
                        wrapper:box(tw),clientWidth:tw.clientWidth,scrollWidth:tw.scrollWidth,
                        tabIndex:tw.tabIndex,overflowX:getComputedStyle(tw).overflowX,
                        hint:hint?.innerText,correctHintOrder:!!(hint.compareDocumentPosition(tw)&Node.DOCUMENT_POSITION_FOLLOWING)},
                      flow:flow.map(e=>({number:e.querySelector('strong')?.innerText,
                           text:e.innerText.slice(0,130)})),
                      references:{open:disclosure.open,count:disclosure.querySelectorAll('li').length,
                        pdfLinkCount:disclosure.querySelectorAll('li a[href^="https://"]').length},
                      escaped,clipped,figureCount:main.querySelectorAll('img').length,
                      footerGap:Math.round(rect(footer).top-rect(main).bottom),
                      sectionTailGap:Math.round(rect(footer).top-rect(main.querySelector('.research-boundary')).bottom),
                      localLinks:[...main.querySelectorAll('a[href$=".html"]')].map(a=>({label:a.innerText,href:a.getAttribute('href')}))
                    };
                }""")
                errors=[]
                if not response or response.status!=200: errors.append("scoping HTTP failure")
                if data["docWidth"]>w:errors.append("document horizontal overflow")
                if data["mainCount"]!=1 or len(data["h1"])!=1:errors.append("main/h1 landmarks")
                if data["sections"]!=SECTIONS:errors.append("scoping section structure")
                if not data["uniqueIds"] or data["brokenAnchors"] or data["unnamedLinks"]:errors.append("fragment/links/ids")
                if data["navCurrent"]!=["Research"]:errors.append("Research nav active state")
                if data["routeCounts"]!=["8","7","5"] or data["cardCount"]!=3:errors.append("wrong study-form counts")
                if data["table"]["cols"]!=["Information reported","Studies","What it helps a reader understand"]:
                    errors.append("table columns missing")
                if [x[1] for x in data["table"]["rows"]]!=["20 of 20","14 of 20","5 of 20","1 of 20"]:
                    errors.append("reported learner data altered")
                if data["table"]["rowHeaderCount"]!=4 or data["table"]["headers"]!=["col"]*3:
                    errors.append("table header semantics")
                if not data["table"]["correctHintOrder"] or data["table"]["tabIndex"]!=0:
                    errors.append("table keyboard/hint semantics")
                if w<=560 and data["table"]["scrollWidth"]<=data["table"]["clientWidth"]:
                    errors.append("expected narrow horizontal table scrolling")
                if [x["number"] for x in data["flow"]]!=["216","79","20"]:
                    errors.append("selection arithmetic")
                if data["references"]["count"]!=2 or data["references"]["pdfLinkCount"]!=2:
                    errors.append("Kane/Pierson references")
                if data["escaped"] or data["clipped"]:errors.append("text overflow/clipping")
                if not 95<=data["sectionTailGap"]<=105:
                    errors.append("footer gap differs from 100px")
                data.update({"test":"responsive","errors":errors})
                results.append(data)
                print("SCOPING",w,"PASS" if not errors else errors,"gap",data["sectionTailGap"],flush=True)
                if w in (320,375,768,1024,1440):
                    await page.screenshot(path=str(OUT/f"scoping-{w}.png"),full_page=True,animations="disabled",timeout=15000)
            except Exception as e:
                results.append({"test":"responsive","width":w,"errors":[repr(e)]})
                print("SCOPING ERROR",w,repr(e),flush=True)
            finally:await page.close()
        page=await browser.new_page(viewport={"width":375,"height":850},reduced_motion="reduce")
        try:
            await page.goto(URL,wait_until="load")
            await page.keyboard.press("Tab")
            first=await page.evaluate("""() => ({
                href:document.activeElement.getAttribute('href'),
                visible:document.activeElement.matches(':focus-visible')})""")
            await page.keyboard.press("Enter")
            target=await page.evaluate("document.activeElement.id")
            await page.locator('a[href="#learner-reporting"]').click()
            fragment=await page.evaluate("location.hash")
            wrap=page.locator(".research-table-wrap")
            await wrap.scroll_into_view_if_needed()
            await wrap.focus()
            await page.keyboard.press("ArrowRight")
            await page.wait_for_function("document.querySelector('.research-table-wrap').scrollLeft>0",timeout=4000)
            scroll=await page.evaluate("({x:document.querySelector('.research-table-wrap').scrollLeft,focused:document.activeElement.classList.contains('research-table-wrap')})")
            await page.locator("details.research-references summary").scroll_into_view_if_needed()
            await page.locator("details.research-references summary").focus()
            await page.keyboard.press("Enter")
            opened=await page.evaluate("({open:document.querySelector('.research-references').open,visible:document.querySelector('#scoping-ref-kane').getBoundingClientRect().height>0})")
            await page.locator(".moon-appearance-select").select_option("dark")
            await page.wait_for_function("document.documentElement.dataset.moonTheme==='dark'")
            dark=await page.evaluate("""() => ({
                theme:document.documentElement.dataset.moonTheme,
                bodyBg:getComputedStyle(document.body).backgroundColor,
                cardBg:getComputedStyle(document.querySelector('.research-route-card')).backgroundColor,
                cardText:getComputedStyle(document.querySelector('.research-route-card h3')).color,
                interpretationBg:getComputedStyle(document.querySelector('.research-example')).backgroundColor,
                interpretationText:getComputedStyle(document.querySelector('.research-example > p:not(.meta)')).color,
                tableCellText:getComputedStyle(document.querySelector('.research-evidence-table tbody td')).color,
                overflow:document.documentElement.scrollWidth>innerWidth
            })""")
            await page.screenshot(path=str(OUT/"scoping-dark-375.png"),full_page=True,animations="disabled",timeout=15000)
            await page.locator('a[href="#page-top"]').click()
            back=await page.evaluate("({hash:location.hash,y:scrollY})")
            errors=[]
            if first["href"]!="#main" or not first["visible"] or target!="main":errors.append("skip keyboard")
            if fragment!="#learner-reporting":errors.append("section jump")
            if not scroll["focused"] or scroll["x"]<=0:errors.append("table keyboard scroll")
            if not opened["open"] or not opened["visible"]:errors.append("references disclosure keyboard")
            if dark["theme"]!="dark" or dark["overflow"]:errors.append("dark theme")
            if back["hash"]!="#page-top" or back["y"]>4:errors.append("back-to-top")
            results.append({"test":"keyboard/table/dark","first":first,"mainTarget":target,
                            "fragment":fragment,"scroll":scroll,"opened":opened,"dark":dark,
                            "back":back,"errors":errors})
            print("SCOPING KEYBOARD DARK","PASS" if not errors else errors,flush=True)
        except Exception as e:
            results.append({"test":"keyboard/table/dark","errors":[repr(e)]})
            print("SCOPING KEYBOARD ERROR",repr(e),flush=True)
        finally:await page.close()
        page=await browser.new_page(viewport={"width":1440,"height":900},reduced_motion="reduce")
        try:
            await page.goto(URL,wait_until="load")
            await page.evaluate("document.fonts.ready")
            raw=await page.pdf(format="A4",print_background=True,margin={
              "top":"12mm","bottom":"12mm","left":"12mm","right":"12mm"})
            (OUT/"scoping-A4.pdf").write_bytes(raw)
            pdf=fitz.open(stream=raw,filetype="pdf")
            texts=[re.sub(r"\s+"," ",pg.get_text()) for pg in pdf]
            combined=" ".join(texts)
            missing=[v for v in PRINT_REQUIRED if v not in combined]
            references=[x for x in ("Kane, M. T.","Pierson, A. E.") if x in combined]
            out=[]
            headings=[]
            for i,pg in enumerate(pdf):
                for v in pg.get_text("words"):
                    if v[0]<-1 or v[1]<-1 or v[2]>pg.rect.width+1 or v[3]>pg.rect.height+1:
                        out.append((i+1,v[4]))
                pg.get_pixmap(matrix=fitz.Matrix(1,1)).save(str(OUT/f"scoping-A4-{i+1}.png"))
                headings.append([v for v in SECTIONS if v.replace("-"," ") in texts[i].lower()])
            errors=[]
            if missing or out:errors.append("print content missing/clipped")
            if len(pdf)>12:errors.append("print excessively long")
            if len(texts)>1 and len(texts[-1])<280:errors.append("near-empty last printed page")
            if len(references)!=2:errors.append("two collapsed references absent from print")
            results.append({"test":"A4 print","pages":len(pdf),"pageChars":[len(t) for t in texts],
                            "missing":missing,"references":references,"outOfBounds":out[:10],
                            "lastPageEnd":texts[-1][-400:],"errors":errors})
            print("SCOPING A4",len(pdf),"PASS" if not errors else errors,flush=True)
        except Exception as e:
            results.append({"test":"A4 print","errors":[repr(e)]})
            print("SCOPING PRINT ERROR",repr(e),flush=True)
        finally:await page.close()
        await browser.close()
    (OUT/"report.json").write_text(json.dumps(results,indent=2),encoding="utf-8")
    failed=[r for r in results if r["errors"]]
    print("SCOPING SUMMARY",len(results),"checks",len(failed),"failed",flush=True)
    if failed:raise AssertionError(json.dumps(failed,ensure_ascii=False)[:3600])
if __name__=="__main__":asyncio.run(main())
