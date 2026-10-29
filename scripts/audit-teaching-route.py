"""Teaching overview visitor-facing Chromium QA.

Checks only website presentation and semantics, not editor controls,
independently administered interventions or external application delivery.
"""
import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

BASE="http://127.0.0.1:8767"
OUT=Path("teaching-audit-output")
WIDTHS=(320,375,768,1024,1440)

async def main():
    OUT.mkdir(exist_ok=True)
    results=[]
    async with async_playwright() as play:
        browser=await play.chromium.launch()
        for width in WIDTHS:
            page=await browser.new_page(viewport={"width":width,"height":900},
                                         reduced_motion="reduce")
            try:
                response=await page.goto(BASE+"/teaching.html",wait_until="load",
                                          timeout=25000)
                await page.evaluate("document.fonts.ready")
                data=await page.evaluate("""() => {
                    const main=document.querySelector('main');
                    const rect=e=>e.getBoundingClientRect();
                    const h=[...main.querySelectorAll('h1,h2,h3')].map(e=>({
                       level:Number(e.tagName[1]),name:e.textContent.trim()}));
                    const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
                    const hashlinks=[...document.querySelectorAll('a[href^="#"]')]
                      .map(a=>a.getAttribute('href').slice(1));
                    const cases=[...main.querySelectorAll('.teaching-case-preview')];
                    const last=main.querySelector('.teaching-bibliography');
                    const footer=document.querySelector('.site-footer');
                    const escaped=[...main.querySelectorAll('h1,h2,h3,p,li,a')]
                       .filter(e=>rect(e).width>0&&
                         (rect(e).left< -2||rect(e).right>innerWidth+2));
                    const links=[...document.querySelectorAll('a[href]')];
                    return {
                        width:innerWidth,documentWidth:document.documentElement.scrollWidth,
                        mainCount:document.querySelectorAll('main').length,
                        h,caseCount:cases.length,
                        caseTitles:cases.map(e=>e.querySelector('h3')?.innerText),
                        caseLinks:cases.map(e=>e.querySelector('a')?.getAttribute('href')),
                        caseBounds:cases.map(e=>({
                            left:rect(e).left,right:rect(e).right,
                            top:rect(e).top+scrollY,bottom:rect(e).bottom+scrollY
                        })),
                        escaped:escaped.slice(0,10).map(e=>e.textContent.trim().slice(0,90)),
                        idsUnique:ids.length===new Set(ids).size,
                        unresolved:hashlinks.filter(id=>!ids.includes(id)),
                        unnamedLinks:links.filter(a=>!(
                            a.innerText||a.getAttribute('aria-label')||'').trim()).length,
                        footerGap:Math.round(rect(footer).top-rect(last).bottom),
                        footerEmailHeight:rect(document.querySelector('.site-footer-inner p a')).height,
                        references:main.querySelectorAll('.teaching-source-list li').length,
                        title:document.title,
                        canonical:document.querySelector('link[rel=canonical]')?.href
                    };
                }""")
                errors=[]
                if response is None or response.status!=200:errors.append("not 200")
                if data["documentWidth"]>width:errors.append("document overflow")
                if data["mainCount"]!=1:errors.append("main count")
                if data["h"][0]["name"]!="Teaching science" or data["h"][0]["level"]!=1:
                    errors.append("H1/title")
                if data["caseCount"]!=2 or data["caseLinks"]!=[
                    "teaching-ap-evolution.html","teaching-ap-chemistry.html"]:
                    errors.append("case links")
                if not data["idsUnique"] or data["unresolved"] or data["unnamedLinks"]:
                    errors.append("anchors/names")
                if data["escaped"]:errors.append("escaped text")
                if data["footerEmailHeight"]<24:errors.append("footer target")
                if not 95<=data["footerGap"]<=105:errors.append("footer spacing not near 100px")
                if data["references"]!=3:errors.append("reference count")
                data.update({"page":"teaching","errors":errors})
                results.append(data)
                await page.screenshot(path=str(OUT/f"teaching-{width}.png"),
                                      full_page=True,animations="disabled")
                print("TEACHING",width,"PASS" if not errors else errors,flush=True)
            except Exception as err:
                results.append({"page":"teaching","width":width,"error":str(err)})
                print("TEACHING ERROR",width,str(err),flush=True)
            finally:
                await page.close()

        # Activate genuine appearance setting and read focus colour and case readability.
        page=await browser.new_page(viewport={"width":375,"height":900})
        try:
            await page.goto(BASE+"/teaching.html",wait_until="load",timeout=25000)
            await page.locator(".moon-appearance-select").select_option("dark")
            await page.wait_for_function(
                "document.documentElement.dataset.moonTheme==='dark'")
            await page.locator(".topbar .brand").focus()
            data=await page.evaluate("""() => {
                const b=document.activeElement,c=document.querySelector('.teaching-case-preview');
                return {
                    focusVisible:b.matches(':focus-visible'),
                    brandOutline:getComputedStyle(b).outlineColor,
                    header:getComputedStyle(document.querySelector('.topbar')).backgroundColor,
                    cardBackground:getComputedStyle(c).backgroundColor,
                    cardText:getComputedStyle(c.querySelector('p')).color,
                    overflow:document.documentElement.scrollWidth>innerWidth
                };
            }""")
            errors=[]
            if (not data["focusVisible"] or
                data["brandOutline"]!="rgb(145, 219, 170)" or
                data["header"]!="rgb(15, 15, 15)"):
                errors.append("dark focus")
            if data["cardBackground"]==data["cardText"] or data["overflow"]:
                errors.append("dark cards")
            results.append({"page":"teaching-dark","errors":errors,**data})
            await page.screenshot(path=str(OUT/"teaching-dark-375.png"),
                                  full_page=True,animations="disabled")
            print("TEACHING DARK","PASS" if not errors else errors,flush=True)
        except Exception as err:
            results.append({"page":"teaching-dark","error":str(err)})
        finally:
            await page.close()

        # Test real keyboard skip link, anchor fragment and return navigation.
        page=await browser.new_page(viewport={"width":375,"height":900},
                                    reduced_motion="reduce")
        try:
            await page.goto(BASE+"/teaching.html",wait_until="load",timeout=25000)
            # Avoid sampling mid-animation after fragment navigation.
            await page.evaluate("document.documentElement.style.scrollBehavior='auto'")
            await page.keyboard.press("Tab")
            first=await page.evaluate(
                "document.activeElement.getAttribute('href')")
            await page.keyboard.press("Enter")
            skip=await page.evaluate("document.activeElement?.id")
            await page.locator(
                '.teaching-contents a[href="#teaching-planning"]').click()
            fragment=await page.evaluate("location.hash")
            await page.locator('a[href="#teaching-ref-black"]').click()
            citation=await page.evaluate("""() => ({
                hash:location.hash,
                top:document.querySelector('#teaching-ref-black').getBoundingClientRect().top
            })""")
            await page.locator(".site-footer-links a[href='#page-top']").click()
            top=await page.evaluate("({hash:location.hash,y:scrollY})")
            errors=[]
            if first!="#main" or skip!="main":errors.append("skip link")
            if fragment!="#teaching-planning":errors.append("planning fragment")
            if citation["hash"]!="#teaching-ref-black" or citation["top"]< -3:
                errors.append("reference fragment")
            if top["hash"]!="#page-top" or top["y"]>4:errors.append("back to top")
            results.append({"page":"teaching-keyboard","first":first,"skip":skip,
                "fragment":fragment,"citation":citation,"back":top,"errors":errors})
            print("TEACHING KEYBOARD","PASS" if not errors else errors,flush=True)
        except Exception as err:
            results.append({"page":"teaching-keyboard","error":str(err)})
        finally:
            await page.close()
        await browser.close()
    (OUT/"report.json").write_text(
        json.dumps(results,indent=2,ensure_ascii=False),encoding="utf8")
    bad=[r for r in results if r.get("errors") or r.get("error")]
    if bad:
        print("TEACHING AUDIT FAILURES",json.dumps(bad,ensure_ascii=False),flush=True)
        return 1
    print("TEACHING PAGE VISITOR AUDIT PASS",flush=True)
    return 0

if __name__=="__main__":
    raise SystemExit(asyncio.run(main()))
