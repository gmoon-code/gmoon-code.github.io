"""Projects visitor audit: responsive overview and project-preview control semantics.

Uses GitHub Actions localhost checkout. This tests iframe creation, not live app
delivery on GitHub Pages, which requires external-origin verification.
"""
import asyncio
import json
from pathlib import Path

from playwright.async_api import async_playwright

OUT = Path("projects-audit-output")
BASE = "http://127.0.0.1:8766"
WIDTHS = (320, 375, 768, 1024, 1440)


async def main():
    OUT.mkdir(exist_ok=True)
    results = []
    async with async_playwright() as play:
        browser = await play.chromium.launch()
        for width in WIDTHS:
            page = await browser.new_page(viewport={"width": width, "height": 900},
                                          reduced_motion="reduce")
            try:
                response = await page.goto(BASE + "/projects.html",
                                           wait_until="load", timeout=25000)
                await page.evaluate("document.fonts.ready")
                await page.locator("main .project-interface-figure img").evaluate_all(
                    """async images => {for(const image of images){
                         image.loading='eager'; await image.decode();}}""")
                result = await page.evaluate("""() => {
                  const main=document.querySelector('main');
                  const cards=[...main.querySelectorAll('.project-showcase-item')];
                  const figures=[...main.querySelectorAll('.project-interface-figure')];
                  const rect=el=>el.getBoundingClientRect();
                  const headings=[...main.querySelectorAll('h1,h2')].map(h=>h.textContent.trim());
                  return {
                    width:innerWidth, documentWidth:document.documentElement.scrollWidth,
                    h1:main.querySelectorAll('h1').length,headings,
                    cardCount:cards.length,figureCount:figures.length,
                    imagesLoaded:figures.every(f=>{const i=f.querySelector('img');return i?.complete&&i.naturalWidth>0}),
                    figureNames:figures.map(f=>({alt:f.querySelector('img')?.alt||'',
                      linkName:f.querySelector('a')?.getAttribute('aria-label')||'',
                      caption:f.querySelector('figcaption')?.textContent.trim()||''})),
                    cardWidths:cards.map(c=>Math.round(rect(c).width)),
                    cardTop:cards.map(c=>Math.round(rect(c).top+scrollY)),
                    cardsContained:cards.every(c=>rect(c).left>=-1&&rect(c).right<=innerWidth+1),
                    bodyOverflow:[...main.querySelectorAll('h1,h2,p,a.control,figcaption')]
                      .filter(el=>rect(el).width>0&&(rect(el).left< -2||rect(el).right>innerWidth+2))
                      .map(el=>({tag:el.tagName,text:el.textContent.trim().slice(0,60)})),
                    primaryLinks:cards.map(c=>c.querySelector('.controls .primary')?.href),
                    detailLinks:cards.map(c=>c.querySelector('.controls a:not(.primary)')?.getAttribute('href')),
                    routes:cards.map(c=>({
                      type:c.querySelector('[role="list"]')?.getAttribute('aria-label')||'',
                      steps:c.querySelectorAll('[role="listitem"]').length})),
                    footerContactHeight:rect(document.querySelector('.site-footer-inner p a')).height,
                    footerGap:Math.round(rect(document.querySelector('.site-footer')).top-
                                         rect(cards[cards.length-1]).bottom),
                    title:document.title,
                    description:document.querySelector('meta[name=description]')?.content,
                    canonical:document.querySelector('link[rel=canonical]')?.href
                  };
                }""")
                problems = []
                if response is None or response.status != 200:
                    problems.append("Projects HTTP status not 200")
                if result["documentWidth"] > width:
                    problems.append("Horizontal page overflow")
                if result["h1"] != 1 or result["headings"] != [
                    "Projects", "The Story Method", "Research Methods Studio"]:
                    problems.append("Unexpected heading structure")
                if result["cardCount"] != 2 or result["figureCount"] != 2:
                    problems.append("Project card or figure count")
                if not result["imagesLoaded"] or not all(
                    f["alt"] and f["linkName"] and f["caption"]
                    for f in result["figureNames"]):
                    problems.append("Screenshot missing, undecoded, or lacks name/caption")
                if not result["cardsContained"] or result["bodyOverflow"]:
                    problems.append("Project content escapes horizontal viewport")
                if result["detailLinks"] != [
                    "story-method.html", "research-methods-studio.html"]:
                    problems.append("Detail links unexpected")
                if not all(r["type"] and r["steps"] == 4 for r in result["routes"]):
                    problems.append("Learning route list semantics missing")
                if result["footerContactHeight"] < 24:
                    problems.append("Footer contact hit target smaller than 24px")
                if not 95 <= result["footerGap"] <= 105:
                    problems.append("Project card-to-footer gap is not close to 100px")
                if not all(u and u.startswith("https://gmoon-code.github.io/")
                           for u in result["primaryLinks"]):
                    problems.append("App URLs malformed")
                result.update({"page":"projects","violations":problems})
                results.append(result)
                await page.screenshot(path=str(OUT/f"projects-{width}.png"),
                                      full_page=True, animations="disabled")
                print("PROJECTS",width,"PASS" if not problems else problems,flush=True)
            except Exception as error:
                results.append({"page":"projects","width":width,"error":str(error)})
                print("PROJECTS ERROR",width,str(error),flush=True)
            finally:
                await page.close()
        # Select the actual appearance preference and test dark card/brand focus.
        dark = await browser.new_page(viewport={"width":375,"height":900},
                                      reduced_motion="reduce")
        try:
            await dark.goto(BASE+"/projects.html",wait_until="load",timeout=25000)
            await dark.locator(".moon-appearance-select").select_option("dark")
            await dark.wait_for_function(
                "document.documentElement.dataset.moonTheme === 'dark'")
            await dark.locator(".topbar .brand").focus()
            data=await dark.evaluate("""() => {
              const brand=document.activeElement;
              const card=document.querySelector('.project-showcase-item');
              return {
                theme:document.documentElement.dataset.moonTheme,
                focusVisible:brand.matches(':focus-visible'),
                focusOutline:getComputedStyle(brand).outlineColor,
                headerBackground:getComputedStyle(document.querySelector('.topbar')).backgroundColor,
                cardBackground:getComputedStyle(card).backgroundColor,
                cardText:getComputedStyle(card.querySelector('p')).color,
                pageWidth:document.documentElement.scrollWidth
              };
            }""")
            problems=[]
            if (not data["focusVisible"] or
                data["focusOutline"]!="rgb(145, 219, 170)" or
                data["headerBackground"]!="rgb(15, 15, 15)"):
                problems.append("Dark brand focus contrast")
            if data["pageWidth"]>375:
                problems.append("Dark Projects horizontal overflow")
            if data["cardText"]==data["cardBackground"]:
                problems.append("Dark card text invisible")
            results.append({"page":"projects-dark","width":375,
                            **data,"violations":problems})
            await dark.screenshot(path=str(OUT/"projects-dark-375.png"),
                                  full_page=True,animations="disabled")
            print("PROJECTS DARK","PASS" if not problems else problems,flush=True)
        except Exception as error:
            results.append({"page":"projects-dark","error":str(error)})
        finally:
            await dark.close()

        # The separate project pages hold the controls. Confirm these actually
        # create named, locally scoped iframes and close with keyboard Escape.
        for path,preview,path_expected in (
            ("story-method.html","story","/memory-palace-u1-8/"),
            ("research-methods-studio.html","methods","/research-methods/")):
            page=await browser.new_page(viewport={"width":375,"height":900},
                                        reduced_motion="reduce")
            try:
                response=await page.goto(BASE+"/"+path,wait_until="load",
                                         timeout=25000)
                panel=page.locator(f'[data-live-preview="{preview}"]')
                button=panel.locator("[data-preview-open]")
                initiallyVisible=await button.is_visible()
                await button.click()
                frame=panel.locator("iframe")
                await frame.wait_for(state="attached",timeout=5000)
                iframe=await frame.evaluate("""el=>({
                  title:el.title,src:new URL(el.src).pathname,
                  sandbox:[...el.sandbox]
                })""")
                active=await panel.locator("[data-preview-active]").is_visible()
                focusClose=await panel.locator("[data-preview-close]").evaluate(
                    "el=>el===document.activeElement")
                await panel.locator('[data-preview-device="phone"]').click()
                phone=await panel.locator("[data-preview-stage]").evaluate(
                    "el=>el.dataset.device")
                pressed=await panel.locator('[data-preview-device="phone"]').get_attribute(
                    "aria-pressed")
                await page.keyboard.press("Escape")
                restored=await button.evaluate("el=>el===document.activeElement")
                closed=await frame.count()==0
                problems=[]
                if response is None or response.status!=200 or not initiallyVisible:
                    problems.append("Details preview not available")
                if (iframe["src"]!=path_expected or not iframe["title"] or
                    not all(p in iframe["sandbox"] for p in (
                        "allow-scripts","allow-same-origin","allow-forms"))):
                    problems.append("Preview iframe missing expected source, title or sandbox")
                if not active or not focusClose or phone!="phone" or pressed!="true":
                    problems.append("Preview opening or device switch failed")
                if not restored or not closed:
                    problems.append("Escape did not close and return focus")
                results.append({"page":path,"mode":"preview-controls",
                                "initialButton":initiallyVisible,"iframe":iframe,
                                "closeInitiallyFocused":focusClose,"phone":phone,
                                "closed":closed,"focusRestored":restored,
                                "violations":problems})
                print("PREVIEW",path,"PASS" if not problems else problems,flush=True)
            except Exception as error:
                results.append({"page":path,"mode":"preview-controls",
                                "error":str(error)})
                print("PREVIEW ERROR",path,str(error),flush=True)
            finally:
                await page.close()
        # Print is paginated, not a tall screenshot. Keep each whole card
        # (heading, explanation, screenshot, call to action) on one A4 sheet.
        import fitz
        page=await browser.new_page(viewport={"width":1440,"height":900},
                                    reduced_motion="reduce")
        try:
            response=await page.goto(BASE+"/projects.html",wait_until="load",
                                     timeout=25000)
            await page.locator(".project-interface-figure img").evaluate_all(
                """async images => {for(const image of images){
                     image.loading='eager'; await image.decode();}}""")
            pdf_data=await page.pdf(
                format="A4",print_background=True,display_header_footer=False,
                margin={"top":"12mm","bottom":"12mm",
                        "left":"12mm","right":"12mm"})
            (OUT/"projects-A4.pdf").write_bytes(pdf_data)
            pdf=fitz.open(stream=pdf_data,filetype="pdf")
            text_by_page=[p.get_text("text") for p in pdf]
            card_pairs=[("The Story Method","Open Unit 1"),
                        ("Research Methods Studio","Open the workspace")]
            split=[title for title,cta in card_pairs
                   if not any(title in text and cta in text
                              for text in text_by_page)]
            problems=[]
            if response is None or response.status!=200:
                problems.append("Projects print page did not load")
            if split:
                problems.append("A4 printed cards split across sheets: "+
                                ", ".join(split))
            if not 1<=len(pdf)<=4:
                problems.append("Unexpected Projects A4 page count")
            for i,sheet in enumerate(pdf):
                sheet.get_pixmap(matrix=fitz.Matrix(1.2,1.2)).save(
                    str(OUT/f"projects-A4-{i+1}.png"))
            results.append({"page":"projects","mode":"print-A4",
                            "pageCount":len(pdf),"splitCards":split,
                            "pageTextLength":[len(t) for t in text_by_page],
                            "violations":problems})
            print("PROJECTS A4","PASS" if not problems else problems,
                  "sheets",len(pdf),flush=True)
            pdf.close()
        except Exception as error:
            results.append({"page":"projects","mode":"print-A4",
                            "error":str(error)})
            print("PROJECTS A4 ERROR",str(error),flush=True)
        finally:
            await page.close()
        await browser.close()
    (OUT/"report.json").write_text(json.dumps(results,indent=2,ensure_ascii=False),
                                    encoding="utf-8")
    failed=[r for r in results if r.get("violations") or r.get("error")]
    if failed:
        print("Projects browser failures:",json.dumps(failed,ensure_ascii=False),flush=True)
        return 1
    print("Projects responsive and preview-control checks passed.",flush=True)
    return 0


if __name__=="__main__":
    raise SystemExit(asyncio.run(main()))
