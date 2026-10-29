"""Research Methods Studio visitor page, five-width and keyboard/print audit."""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright

BASE="http://127.0.0.1:8766"
OUT=Path("methods-detail-audit-output")
WIDTHS=(320,375,768,1024,1440)

async def main():
    OUT.mkdir(exist_ok=True)
    results=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch()
        for width in WIDTHS:
            page=await browser.new_page(viewport={"width":width,"height":900},reduced_motion="reduce")
            try:
                response=await page.goto(BASE+"/research-methods-studio.html",wait_until="load",timeout=25000)
                await page.evaluate("document.fonts.ready")
                await page.locator(".project-detail-figure img").evaluate(
                    "async img=>{img.loading='eager';await img.decode();}")
                data=await page.evaluate("""() => {
                    const main=document.querySelector('main'),r=e=>e.getBoundingClientRect();
                    const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);
                    const wrappers=[...document.querySelectorAll('.teaching-sequence-table-wrap')];
                    const image=document.querySelector('.project-detail-figure img');
                    return {
                        width:innerWidth,documentWidth:document.documentElement.scrollWidth,
                        h1:[...main.querySelectorAll('h1')].map(x=>x.textContent.trim()),
                        h2:main.querySelectorAll('h2').length,
                        duplicateIds:ids.filter((x,i)=>ids.indexOf(x)!==i),
                        unresolved:[...main.querySelectorAll('a[href^="#"]')]
                          .map(a=>a.hash.slice(1)).filter(id=>!ids.includes(id)),
                        escaped:[...main.querySelectorAll('p,h1,h2,h3,figure,summary')]
                          .filter(x=>r(x).width>0&&(r(x).left< -2||r(x).right>innerWidth+2))
                          .map(x=>x.textContent.trim().slice(0,45)),
                        tables:wrappers.map(w=>({
                            label:w.getAttribute('aria-label'),tabIndex:w.tabIndex,
                            width:w.clientWidth,scrollWidth:w.scrollWidth,
                            hasPriorHint:w.previousElementSibling?.classList.contains('table-scroll-hint'),
                            table:w.querySelector('table')!==null})),
                        imageDecoded:image.complete&&image.naturalWidth>0,
                        imageAlt:image.alt,
                        imageLinkLabel:image.closest('a').getAttribute('aria-label'),
                        figureCaption:document.querySelector('#methods-lab-figure-caption')?.textContent.trim(),
                        footerGap:Math.round(r(document.querySelector('.site-footer')).top-
                          r(document.querySelector('.project-return')).bottom),
                        footerEmailHeight:r(document.querySelector('.site-footer-inner p a')).height
                    };
                }""")
                violations=[]
                if not response or response.status!=200:violations.append("Page load")
                if data["documentWidth"]>width or data["escaped"]:violations.append("Horizontal overflow")
                if data["h1"]!=["Research Methods Studio"] or data["h2"]!=7:violations.append("Headings")
                if data["duplicateIds"] or data["unresolved"]:violations.append("Fragment or ID")
                if len(data["tables"])!=2 or not all(t["hasPriorHint"] and t["label"] and t["tabIndex"]==0 and t["table"] for t in data["tables"]):
                    violations.append("Table hints or keyboard regions")
                if not data["imageDecoded"] or not data["imageAlt"] or not data["imageLinkLabel"] or not data["figureCaption"]:
                    violations.append("Image/figure label")
                if abs(data["footerGap"]-100)>5 or data["footerEmailHeight"]<24:violations.append("Footer spacing/tap area")
                if width in (320,375):
                    movements=[]
                    for wrap in await page.locator(".teaching-sequence-table-wrap").all():
                        before=await wrap.evaluate("el=>({width:el.clientWidth,scrollWidth:el.scrollWidth,left:el.scrollLeft})")
                        await wrap.focus()
                        await page.keyboard.press("ArrowRight")
                        await page.wait_for_timeout(120)
                        after=await wrap.evaluate("el=>el.scrollLeft")
                        movements.append({"before":before,"after":after})
                        if before["scrollWidth"]<=before["width"] or after<=before["left"]:
                            violations.append("Table did not scroll horizontally by keyboard")
                    data["tableKeyboardPan"]=movements
                data.update({"mode":"responsive","violations":violations})
                results.append(data)
                await page.screenshot(path=str(OUT/f"methods-{width}.png"),full_page=True,animations="disabled")
                print("METHODS",width,"PASS" if not violations else violations,flush=True)
            except Exception as exc:
                results.append({"mode":"responsive","width":width,"error":str(exc)})
                print("METHODS ERROR",width,str(exc),flush=True)
            finally:
                await page.close()
        page=await browser.new_page(viewport={"width":375,"height":900},reduced_motion="reduce")
        try:
            await page.goto(BASE+"/research-methods-studio.html",wait_until="load")
            await page.keyboard.press("Tab")
            first=await page.evaluate("document.activeElement.textContent.trim()")
            await page.keyboard.press("Enter")
            skip=await page.evaluate("document.activeElement.id")
            await page.locator('.article-jumps a[href="#methods-design-review"]').click()
            fragment=await page.evaluate("location.hash")
            await page.locator(".project-technical-details summary").focus()
            await page.keyboard.press("Enter")
            expanded=await page.locator(".project-technical-details").get_attribute("open")
            preview=page.locator('[data-live-preview="methods"]')
            await preview.locator("[data-preview-open]").click()
            frame=await preview.locator("iframe").evaluate("el=>({src:new URL(el.src).pathname,title:el.title})")
            await preview.locator('[data-preview-device="phone"]').click()
            phone=await preview.locator("[data-preview-stage]").get_attribute("data-device")
            await page.keyboard.press("Escape")
            restored=await preview.locator("[data-preview-open]").evaluate("el=>el===document.activeElement")
            closed=(await preview.locator("iframe").count())==0
            await page.locator(".moon-appearance-select").select_option("dark")
            await page.wait_for_function("document.documentElement.dataset.moonTheme==='dark'")
            await page.locator(".topbar .brand").focus()
            dark=await page.evaluate("""() => ({
                outline:getComputedStyle(document.activeElement).outlineColor,
                visible:document.activeElement.matches(':focus-visible'),
                width:document.documentElement.scrollWidth
            })""")
            problems=[]
            if first!="Skip to content" or skip!="main" or fragment!="#methods-design-review" or expanded is None:
                problems.append("Keyboard anchor or disclosure")
            if not frame["title"] or frame["src"]!="/research-methods/" or phone!="phone" or not restored or not closed:
                problems.append("Preview open/Phone/Escape focus")
            if not dark["visible"] or dark["outline"]!="rgb(145, 219, 170)" or dark["width"]>375:
                problems.append("Dark focus/reflow")
            results.append({"mode":"interactions","first":first,"skip":skip,"anchor":fragment,
                            "frame":frame,"phone":phone,"focusRestored":restored,
                            "closed":closed,"dark":dark,"violations":problems})
            await page.screenshot(path=str(OUT/"methods-dark-375.png"),full_page=True,animations="disabled")
            print("METHODS INTERACTION","PASS" if not problems else problems,flush=True)
        except Exception as exc:results.append({"mode":"interactions","error":str(exc)})
        finally:await page.close()
        import fitz
        page=await browser.new_page(viewport={"width":1440,"height":900},reduced_motion="reduce")
        try:
            await page.goto(BASE+"/research-methods-studio.html",wait_until="load")
            await page.locator(".project-detail-figure img").evaluate("async img=>{img.loading='eager';await img.decode();}")
            data=await page.pdf(format="A4",print_background=True,
                margin={"top":"12mm","bottom":"12mm","left":"12mm","right":"12mm"})
            (OUT/"methods-A4.pdf").write_bytes(data)
            pdf=fitz.open(stream=data,filetype="pdf")
            texts=[p.get_text("text") for p in pdf]
            required=["Research Methods Studio","A synthetic experiment from design to analysis",
                      "Methods across research designs","The eighteen-stage research pathway",
                      "Exports, backups, and privacy","Guidance releases, validation, and recovery",
                      "A future evaluation could examine"]
            missing=[s for s in required if not any(s in t for t in texts)]
            violations=[]
            if missing:violations.append("Print content missing: "+", ".join(missing))
            if not 1<=len(pdf)<=12:violations.append("Print page count unexpected")
            for i,sheet in enumerate(pdf):
                sheet.get_pixmap(matrix=fitz.Matrix(1,1)).save(str(OUT/f"methods-A4-{i+1}.png"))
            results.append({"mode":"print-A4","pages":len(pdf),"missing":missing,
                            "violations":violations})
            print("METHODS A4","PASS" if not violations else violations,flush=True)
            pdf.close()
        except Exception as exc:results.append({"mode":"print-A4","error":str(exc)})
        finally:await page.close()
        await browser.close()
    (OUT/"report.json").write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding="utf8")
    failures=[x for x in results if x.get("violations") or x.get("error")]
    if failures:print("METHODS FAILURES",json.dumps(failures,ensure_ascii=False),flush=True)
    return 1 if failures else 0

if __name__=="__main__":raise SystemExit(asyncio.run(main()))
